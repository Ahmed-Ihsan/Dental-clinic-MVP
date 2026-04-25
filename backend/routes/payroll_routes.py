import json
from flask import Blueprint, request, jsonify
from models import Payroll, Salary, Professional, SalaryPayment, Treatment, Appointment, Expense
from database import db
from datetime import datetime, date
from sqlalchemy import func, extract

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
    preview_only = data.get("preview_only", False)

    if not professional_ids:
        return jsonify({"error": "No professionals specified"}), 400

    try:
        year, month = [int(x) for x in payroll_period.split("-")]
    except (ValueError, AttributeError):
        return jsonify({"error": "Invalid payroll_period format. Use YYYY-MM"}), 400

    generated_payrolls = []
    today = date.today()

    for professional_id in professional_ids:
        # Skip if payroll already exists for this period
        existing = Payroll.query.filter(
            Payroll.professional_id == professional_id,
            Payroll.payroll_period == payroll_period,
        ).first()
        if existing:
            continue

        # Get active salary for professional
        salary = Salary.query.filter(
            Salary.professional_id == professional_id,
            Salary.is_active == True,
        ).first()
        if not salary:
            continue

        # ── Salary-component allowances & deductions ──────────────────────────
        component_allowances = sum(
            c.amount for c in salary.components
            if c.component_type == "allowance" and c.effective_date <= today
        )
        component_deductions = sum(
            c.amount for c in salary.components
            if c.component_type == "deduction" and c.effective_date <= today
        )

        # ── Commission: sum treatment costs for this doctor in the period ──────
        treatment_revenue = (
            db.session.query(func.sum(Treatment.cost))
            .join(Appointment, Treatment.appointment_id == Appointment.id)
            .filter(
                Appointment.dentist_id == professional_id,
                extract("year",  Treatment.treatment_date) == year,
                extract("month", Treatment.treatment_date) == month,
            )
            .scalar() or 0.0
        )
        commission_amount = round(
            treatment_revenue * ((salary.commission_percentage or 0.0) / 100.0), 2
        )

        # ── Doctor debt deductions (unpaid advances / clinic debts) ───────────
        debt_expenses = Expense.query.filter(
            Expense.doctor_id == professional_id,
            Expense.category == "doctor",
            Expense.status == "debt",
        ).all()
        debt_total   = sum(e.amount for e in debt_expenses)
        expense_ids  = [e.id for e in debt_expenses]

        # ── Final figures ─────────────────────────────────────────────────────
        gross_salary     = salary.base_salary + component_allowances + commission_amount
        total_deductions = component_deductions + debt_total
        net_salary       = max(0.0, gross_salary - total_deductions)

        payroll = Payroll(
            payroll_period=payroll_period,
            professional_id=professional_id,
            salary_id=salary.id,
            base_salary=salary.base_salary,
            total_allowances=component_allowances,
            total_commission=commission_amount,
            total_deductions=total_deductions,
            debt_deductions=debt_total,
            deducted_expense_ids=json.dumps(expense_ids),
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

    try:
        payment_date_obj = date.fromisoformat(data["payment_date"])
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

    pro = payroll.professional

    try:
        # ── 1. SalaryPayment record ───────────────────────────────────────────
        payment = SalaryPayment(
            payroll_id=id,
            professional_id=payroll.professional_id,
            amount=payroll.net_salary,
            payment_method=data["payment_method"],
            payment_date=payment_date_obj,
            reference_number=data.get("reference_number"),
            bank_name=data.get("bank_name"),
            account_number=data.get("account_number"),
            status="completed",
            notes=data.get("notes"),
            processed_by=data.get("processed_by", "System"),
        )
        db.session.add(payment)

        # ── 2. Mark deducted debt expenses as settled ─────────────────────────
        expense_ids = json.loads(payroll.deducted_expense_ids or "[]")
        if expense_ids:
            debt_records = Expense.query.filter(Expense.id.in_(expense_ids)).all()
            for exp in debt_records:
                exp.status      = "paid"
                exp.paid_amount = exp.amount
                exp.balance     = 0.0

        # ── 3. Cash-flow expense (syncs payroll cost into clinic expenses) ─────
        cash_expense = Expense(
            category="payroll",
            description=(
                f"راتب وعمولة - {pro.first_name} {pro.last_name}"
                f" - {payroll.payroll_period}"
            ),
            amount=payroll.net_salary,
            paid_amount=payroll.net_salary,
            balance=0.0,
            doctor_id=payroll.professional_id,
            payment_method=data["payment_method"],
            status="paid",
            date=payment_date_obj,
        )
        db.session.add(cash_expense)

        # ── 4. Finalise payroll ───────────────────────────────────────────────
        payroll.status       = "paid"
        payroll.payment_date = datetime.now()

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Payment transaction failed: {str(e)}"}), 500

    return jsonify({"payroll": payroll.to_dict(), "payment": payment.to_dict()}), 201


@payroll_bp.route("/payrolls/<int:id>", methods=["DELETE"])
def delete_payroll(id):
    payroll = Payroll.query.get_or_404(id)

    if payroll.status == "paid":
        return jsonify({"error": "Cannot delete paid payroll"}), 400

    db.session.delete(payroll)
    db.session.commit()
    return "", 204


# ── Payslip ──────────────────────────────────────────────────────────────────


@payroll_bp.route("/payrolls/<int:id>/payslip", methods=["GET"])
def get_payslip(id):
    """Detailed payslip breakdown for PDF generation or printable view."""
    payroll = Payroll.query.get_or_404(id)
    salary  = payroll.salary
    pro     = payroll.professional

    # ── Re-query treatment data for the period ────────────────────────────────
    try:
        year, month = [int(x) for x in payroll.payroll_period.split("-")]
    except (ValueError, AttributeError):
        year = month = None

    treatments = []
    treatment_revenue = 0.0
    if year and month:
        treatments = (
            Treatment.query
            .join(Appointment, Treatment.appointment_id == Appointment.id)
            .filter(
                Appointment.dentist_id == payroll.professional_id,
                extract("year",  Treatment.treatment_date) == year,
                extract("month", Treatment.treatment_date) == month,
            )
            .all()
        )
        treatment_revenue = sum(t.cost for t in treatments)

    # ── Salary component breakdown ────────────────────────────────────────────
    today = date.today()
    allowance_components  = [
        c for c in salary.components
        if c.component_type == "allowance" and c.effective_date <= today
    ]
    deduction_components  = [
        c for c in salary.components
        if c.component_type == "deduction" and c.effective_date <= today
    ]

    # ── Deducted debt expenses ────────────────────────────────────────────────
    expense_ids      = json.loads(payroll.deducted_expense_ids or "[]")
    deducted_expenses = (
        Expense.query.filter(Expense.id.in_(expense_ids)).all()
        if expense_ids else []
    )

    return jsonify({
        "payroll_id":   payroll.id,
        "period":       payroll.payroll_period,
        "generated_at": str(payroll.created_at),
        "professional": {
            "id":        pro.id,
            "name":      f"{pro.first_name} {pro.last_name}",
            "specialty": pro.specialty,
        },
        "earnings": {
            "base_salary": payroll.base_salary,
            "allowances":  [{"name": c.name, "amount": c.amount} for c in allowance_components],
            "total_allowances": payroll.total_allowances,
            "commission": {
                "rate_percentage":  salary.commission_percentage or 0.0,
                "treatment_count":  len(treatments),
                "treatment_revenue": treatment_revenue,
                "commission_amount": payroll.total_commission or 0.0,
            },
            "gross_salary": payroll.gross_salary,
        },
        "deductions": {
            "salary_components": [
                {"name": c.name, "amount": c.amount} for c in deduction_components
            ],
            "debt_repayments": [
                {"id": e.id, "description": e.description, "amount": e.amount}
                for e in deducted_expenses
            ],
            "debt_total":      payroll.debt_deductions or 0.0,
            "total_deductions": payroll.total_deductions,
        },
        "summary": {
            "net_salary":   payroll.net_salary,
            "status":       payroll.status,
            "payment_date": str(payroll.payment_date) if payroll.payment_date else None,
        },
    })


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
