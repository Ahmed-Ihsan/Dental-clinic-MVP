from flask import Blueprint, request, jsonify
from models import Payroll, Salary, Professional, SalaryPayment
from database import db
from datetime import datetime, date
from sqlalchemy import func

payroll_bp = Blueprint("payroll", __name__)


@payroll_bp.route("/payrolls", methods=["GET"])
def get_payrolls():
    professional_id = request.args.get("professional_id")
    payroll_period = request.args.get("payroll_period")
    status = request.args.get("status")

    query = Payroll.query

    if professional_id:
        query = query.filter(Payroll.professional_id == professional_id)

    if payroll_period:
        query = query.filter(Payroll.payroll_period == payroll_period)

    if status:
        query = query.filter(Payroll.status == status)

    payrolls = query.order_by(
        Payroll.payroll_period.desc(), Payroll.created_at.desc()
    ).all()
    return jsonify([p.to_dict() for p in payrolls])


@payroll_bp.route("/payrolls/generate", methods=["POST"])
def generate_payroll():
    data = request.get_json()
    professional_ids = data.get("professional_ids", [])
    payroll_period = data.get("payroll_period", Payroll.get_payroll_period())
    preview_only = data.get("preview_only", False)  # New parameter for preview

    if not professional_ids:
        return jsonify({"error": "No professionals specified"}), 400

    generated_payrolls = []

    for professional_id in professional_ids:
        # Check if payroll already exists for this period
        existing = Payroll.query.filter(
            Payroll.professional_id == professional_id,
            Payroll.payroll_period == payroll_period,
        ).first()

        if existing:
            continue  # Skip if already exists

        # Get active salary for professional
        salary = Salary.query.filter(
            Salary.professional_id == professional_id, Salary.is_active == True
        ).first()

        if not salary:
            continue  # Skip if no active salary

        # Calculate components
        allowances = sum(
            c.amount
            for c in salary.components
            if c.component_type == "allowance" and c.effective_date <= date.today()
        )
        deductions = sum(
            c.amount
            for c in salary.components
            if c.component_type == "deduction" and c.effective_date <= date.today()
        )

        gross_salary = salary.base_salary + allowances
        net_salary = gross_salary - deductions

        # Create payroll record
        payroll = Payroll(
            payroll_period=payroll_period,
            professional_id=professional_id,
            salary_id=salary.id,
            base_salary=salary.base_salary,
            total_allowances=allowances,
            total_deductions=deductions,
            gross_salary=gross_salary,
            net_salary=net_salary,
            status="draft",
        )

        if not preview_only:
            db.session.add(payroll)
        generated_payrolls.append(payroll)

    if not preview_only:
        db.session.commit()

    return jsonify([p.to_dict() for p in generated_payrolls]), 201


@payroll_bp.route("/payrolls/<int:id>", methods=["GET"])
def get_payroll(id):
    payroll = Payroll.query.get_or_404(id)
    return jsonify(payroll.to_dict())


@payroll_bp.route("/payrolls/<int:id>", methods=["PUT"])
def update_payroll(id):
    payroll = Payroll.query.get_or_404(id)
    data = request.get_json()

    for key, value in data.items():
        if key == "processed_date" and value:
            setattr(payroll, key, datetime.fromisoformat(value))
        elif key == "payment_date" and value:
            setattr(payroll, key, datetime.fromisoformat(value))
        elif hasattr(payroll, key):
            setattr(payroll, key, value)

    db.session.commit()
    return jsonify(payroll.to_dict())


@payroll_bp.route("/payrolls/<int:id>/process", methods=["POST"])
def process_payroll(id):
    payroll = Payroll.query.get_or_404(id)

    if payroll.status != "draft":
        return jsonify({"error": "Payroll is not in draft status"}), 400

    payroll.status = "processed"
    payroll.processed_date = datetime.now()
    db.session.commit()

    return jsonify(payroll.to_dict())


@payroll_bp.route("/payrolls/<int:id>/pay", methods=["POST"])
def pay_payroll(id):
    payroll = Payroll.query.get_or_404(id)
    data = request.get_json()

    if payroll.status != "processed":
        return jsonify({"error": "Payroll must be processed before payment"}), 400

    required_fields = ["payment_method", "payment_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Create payment record
    try:
        payment = SalaryPayment(
            payroll_id=id,
            professional_id=payroll.professional_id,
            amount=payroll.net_salary,
            payment_method=data["payment_method"],
            payment_date=date.fromisoformat(data["payment_date"]),
            reference_number=data.get("reference_number"),
            bank_name=data.get("bank_name"),
            account_number=data.get("account_number"),
            status="completed",
            notes=data.get("notes"),
            processed_by=data.get("processed_by", "System"),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

    # Update payroll status
    payroll.status = "paid"
    payroll.payment_date = datetime.now()

    db.session.add(payment)
    db.session.commit()

    return jsonify({"payroll": payroll.to_dict(), "payment": payment.to_dict()}), 201


@payroll_bp.route("/payrolls/<int:id>", methods=["DELETE"])
def delete_payroll(id):
    payroll = Payroll.query.get_or_404(id)

    if payroll.status == "paid":
        return jsonify({"error": "Cannot delete paid payroll"}), 400

    db.session.delete(payroll)
    db.session.commit()
    return "", 204


# Salary Payments CRUD
@payroll_bp.route("/salary-payments", methods=["GET"])
def get_salary_payments():
    professional_id = request.args.get("professional_id")
    payroll_id = request.args.get("payroll_id")
    status = request.args.get("status")

    query = SalaryPayment.query

    if professional_id:
        query = query.filter(SalaryPayment.professional_id == professional_id)

    if payroll_id:
        query = query.filter(SalaryPayment.payroll_id == payroll_id)

    if status:
        query = query.filter(SalaryPayment.status == status)

    payments = query.order_by(SalaryPayment.payment_date.desc()).all()
    return jsonify([p.to_dict() for p in payments])


@payroll_bp.route("/salary-payments/<int:id>", methods=["GET"])
def get_salary_payment(id):
    payment = SalaryPayment.query.get_or_404(id)
    return jsonify(payment.to_dict())


# Payroll Analytics
@payroll_bp.route("/payrolls/analytics", methods=["GET"])
def get_payroll_analytics():
    period = request.args.get("period", "current_month")

    # Get current month payrolls
    current_period = Payroll.get_payroll_period()
    payrolls = Payroll.query.filter(Payroll.payroll_period == current_period).all()

    total_gross = sum(p.gross_salary for p in payrolls)
    total_net = sum(p.net_salary for p in payrolls)
    total_allowances = sum(p.total_allowances for p in payrolls)
    total_deductions = sum(p.total_deductions for p in payrolls)

    analytics = {
        "period": current_period,
        "total_payrolls": len(payrolls),
        "total_gross_salary": total_gross,
        "total_net_salary": total_net,
        "total_allowances": total_allowances,
        "total_deductions": total_deductions,
        "average_salary": total_net / len(payrolls) if payrolls else 0,
    }

    return jsonify(analytics)
