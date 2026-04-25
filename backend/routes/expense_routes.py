from flask import Blueprint, request, jsonify
from datetime import date
from models import Expense, Professional, Patient
from database import db

expense_bp = Blueprint("expense", __name__)


@expense_bp.route("/api/expenses", methods=["GET"])
def get_expenses():
    """Get all expenses with optional filtering."""
    category = request.args.get("category")
    status = request.args.get("status")
    doctor_id = request.args.get("doctor_id")
    patient_id = request.args.get("patient_id")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    query = Expense.query
    
    if category:
        query = query.filter(Expense.category == category)
    if status:
        query = query.filter(Expense.status == status)
    if doctor_id:
        query = query.filter(Expense.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Expense.patient_id == patient_id)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    # Order by date descending (newest first)
    query = query.order_by(Expense.date.desc())
    
    expenses = query.all()
    return jsonify([expense.to_dict() for expense in expenses])


@expense_bp.route("/api/expenses/<int:id>", methods=["GET"])
def get_expense(id):
    """Get a single expense by ID."""
    expense = Expense.query.get_or_404(id)
    return jsonify(expense.to_dict())


@expense_bp.route("/api/expenses", methods=["POST"])
def create_expense():
    """Create a new expense."""
    data = request.get_json()
    
    # Calculate balance
    amount = float(data.get("amount", 0))
    paid_amount = float(data.get("paid_amount", 0))
    balance = max(0, amount - paid_amount)
    
    # Determine status
    status = "paid" if balance <= 0 else "debt"
    
    # Parse date
    expense_date = date.fromisoformat(data["date"]) if data.get("date") else date.today()
    
    new_expense = Expense(
        category=data["category"],
        description=data["description"],
        amount=amount,
        paid_amount=paid_amount,
        balance=balance,
        doctor_id=data.get("doctor_id"),
        patient_id=data.get("patient_id"),
        payment_method=data.get("payment_method"),
        receipt_id=data.get("receipt_id"),
        status=status,
        date=expense_date,
    )
    
    db.session.add(new_expense)
    db.session.commit()
    
    return jsonify(new_expense.to_dict()), 201


@expense_bp.route("/api/expenses/<int:id>", methods=["PUT"])
def update_expense(id):
    """Update an existing expense."""
    expense = Expense.query.get_or_404(id)
    data = request.get_json()
    
    # Update fields
    if "category" in data:
        expense.category = data["category"]
    if "description" in data:
        expense.description = data["description"]
    if "amount" in data:
        expense.amount = float(data["amount"])
    if "paid_amount" in data:
        expense.paid_amount = float(data["paid_amount"])
    if "doctor_id" in data:
        expense.doctor_id = data["doctor_id"]
    if "patient_id" in data:
        expense.patient_id = data["patient_id"]
    if "payment_method" in data:
        expense.payment_method = data["payment_method"]
    if "receipt_id" in data:
        expense.receipt_id = data["receipt_id"]
    if "date" in data:
        expense.date = date.fromisoformat(data["date"])
    if "status" in data:
        expense.status = data["status"]
    
    # Recalculate balance
    expense.balance = max(0, expense.amount - expense.paid_amount)
    
    # Auto-update status based on balance
    if expense.balance <= 0:
        expense.status = "paid"
    elif expense.paid_amount > 0:
        expense.status = "partial"
    else:
        expense.status = "debt"
    
    db.session.commit()
    return jsonify(expense.to_dict())


@expense_bp.route("/api/expenses/<int:id>", methods=["DELETE"])
def delete_expense(id):
    """Delete an expense."""
    expense = Expense.query.get_or_404(id)
    db.session.delete(expense)
    db.session.commit()
    return "", 204


@expense_bp.route("/api/expenses/summary", methods=["GET"])
def get_expenses_summary():
    """Get summary statistics for expenses dashboard."""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    query = Expense.query
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    expenses = query.all()
    
    # Calculate totals
    total_cost = sum(e.amount for e in expenses)
    total_paid = sum(e.paid_amount for e in expenses)
    total_debt = sum(e.balance for e in expenses)
    
    # Count by category
    categories = {}
    for e in expenses:
        if e.category not in categories:
            categories[e.category] = {"count": 0, "paid": 0, "debt": 0}
        categories[e.category]["count"] += 1
        categories[e.category]["paid"] += e.paid_amount
        categories[e.category]["debt"] += e.balance
    
    return jsonify({
        "total_expenses": len(expenses),
        "total_cost": total_cost,
        "total_paid": total_paid,
        "total_debt": total_debt,
        "completion_rate": round((total_paid / total_cost * 100), 1) if total_cost > 0 else 0,
        "by_category": categories,
    })
