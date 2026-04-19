from flask import Blueprint, request, jsonify
from models import PaymentInstallment, InstallmentPayment, Professional
from database import db
from datetime import datetime, date, timedelta

installment_bp = Blueprint("installment", __name__)


@installment_bp.route("/installments", methods=["GET"])
def get_installments():
    professional_id = request.args.get("professional_id")
    installment_type = request.args.get("installment_type")
    status = request.args.get("status")

    query = PaymentInstallment.query

    if professional_id:
        query = query.filter(PaymentInstallment.professional_id == professional_id)

    if installment_type:
        query = query.filter(PaymentInstallment.installment_type == installment_type)

    if status:
        query = query.filter(PaymentInstallment.status == status)

    installments = query.order_by(PaymentInstallment.created_at.desc()).all()
    return jsonify([i.to_dict() for i in installments])


@installment_bp.route("/installments", methods=["POST"])
def create_installment():
    data = request.get_json()
    required_fields = [
        "professional_id",
        "installment_type",
        "title",
        "total_amount",
        "installment_amount",
        "total_installments",
        "frequency",
        "start_date",
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Check if professional exists
    professional = Professional.query.get(data["professional_id"])
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    # Convert string values to appropriate types
    try:
        total_amount = float(data["total_amount"])
        installment_amount = float(data["installment_amount"])
        total_installments = int(data["total_installments"])
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric values provided"}), 400

    # Validate installment data
    if total_installments <= 0:
        return jsonify({"error": "Total installments must be greater than 0"}), 400

    if installment_amount <= 0:
        return jsonify({"error": "Installment amount must be greater than 0"}), 400

    calculated_total = installment_amount * total_installments
    if abs(calculated_total - total_amount) > 0.01:  # Allow small rounding differences
        return jsonify(
            {
                "error": "Total amount doesn't match installment amount × total installments"
            }
        ), 400

    try:
        start_date = date.fromisoformat(data["start_date"])

        # Create installment
        installment = PaymentInstallment(
            professional_id=data["professional_id"],
            installment_type=data["installment_type"],
            title=data["title"],
            total_amount=total_amount,
            installment_amount=installment_amount,
            total_installments=total_installments,
            remaining_amount=total_amount,
            frequency=data["frequency"],
            start_date=start_date,
            next_due_date=start_date,  # Will be calculated properly
            payment_method=data.get("payment_method", "bank_transfer"),
            bank_name=data.get("bank_name"),
            account_number=data.get("account_number"),
            reference_info=data.get("reference_info"),
            auto_process=data.get("auto_process", False),
            priority=data.get("priority", "normal"),
            description=data.get("description"),
            notes=data.get("notes"),
            created_by=data.get("created_by", "System"),
        )

        # Calculate the correct next due date
        installment.next_due_date = installment.calculate_next_due_date()

        db.session.add(installment)
        db.session.commit()

        return jsonify(installment.to_dict()), 201

    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400


@installment_bp.route("/installments/<int:id>", methods=["GET"])
def get_installment(id):
    installment = PaymentInstallment.query.get_or_404(id)
    return jsonify(installment.to_dict())


@installment_bp.route("/installments/<int:id>", methods=["PUT"])
def update_installment(id):
    installment = PaymentInstallment.query.get_or_404(id)
    data = request.get_json()

    # Prevent updates that would break the installment logic
    if installment.completed_installments > 0:
        protected_fields = [
            "total_amount",
            "installment_amount",
            "total_installments",
            "frequency",
        ]
        for field in protected_fields:
            if field in data and data[field] != getattr(installment, field):
                return jsonify(
                    {"error": f"Cannot modify {field} after payments have been made"}
                ), 400

    for key, value in data.items():
        if key in ["start_date", "next_due_date", "end_date"]:
            setattr(installment, key, date.fromisoformat(value) if value else None)
        elif hasattr(installment, key):
            setattr(installment, key, value)

    # Recalculate next due date if frequency changed
    if "frequency" in data:
        installment.next_due_date = installment.calculate_next_due_date()

    db.session.commit()
    return jsonify(installment.to_dict())


@installment_bp.route("/installments/<int:id>", methods=["DELETE"])
def delete_installment(id):
    installment = PaymentInstallment.query.get_or_404(id)

    # Prevent deletion if payments have been made
    if installment.completed_installments > 0:
        return jsonify(
            {"error": "Cannot delete installment with completed payments"}
        ), 400

    db.session.delete(installment)
    db.session.commit()
    return "", 204


# Installment Payments Management
@installment_bp.route("/installments/<int:installment_id>/payments", methods=["GET"])
def get_installment_payments(installment_id):
    installment = PaymentInstallment.query.get_or_404(installment_id)
    return jsonify([p.to_dict() for p in installment.payments])


@installment_bp.route("/installments/<int:installment_id>/payments", methods=["POST"])
def create_installment_payment(installment_id):
    installment = PaymentInstallment.query.get_or_404(installment_id)
    data = request.get_json()

    required_fields = ["amount", "payment_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    if installment.status != "active":
        return jsonify({"error": "Installment is not active"}), 400

    try:
        payment_date = date.fromisoformat(data["payment_date"])
        installment_number = installment.completed_installments + 1
        payment_amount = float(data["amount"])

        # Create payment record
        payment = InstallmentPayment(
            installment_id=installment_id,
            professional_id=installment.professional_id,
            installment_number=installment_number,
            amount=payment_amount,
            payment_date=payment_date,
            due_date=installment.next_due_date,
            payment_method=data.get("payment_method", installment.payment_method),
            reference_number=data.get("reference_number"),
            bank_name=data.get("bank_name", installment.bank_name),
            account_number=data.get("account_number", installment.account_number),
            transaction_id=data.get("transaction_id"),
            notes=data.get("notes"),
            processed_by=data.get("processed_by", "System"),
        )

        # Check if payment is overdue
        if payment_date > installment.next_due_date:
            payment.is_overdue = True
            payment.days_overdue = (payment_date - installment.next_due_date).days

        # Update installment
        installment.mark_payment_completed()

        db.session.add(payment)
        db.session.commit()

        return jsonify(
            {"payment": payment.to_dict(), "installment": installment.to_dict()}
        ), 201

    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400


@installment_bp.route("/installment-payments/<int:id>", methods=["GET"])
def get_installment_payment(id):
    payment = InstallmentPayment.query.get_or_404(id)
    return jsonify(payment.to_dict())


@installment_bp.route("/installment-payments/<int:id>", methods=["PUT"])
def update_installment_payment(id):
    payment = InstallmentPayment.query.get_or_404(id)
    data = request.get_json()

    for key, value in data.items():
        if key in ["payment_date", "due_date"]:
            setattr(payment, key, date.fromisoformat(value) if value else None)
        elif hasattr(payment, key):
            setattr(payment, key, value)

    # Recalculate overdue status
    if payment.payment_date and payment.due_date:
        if payment.payment_date > payment.due_date:
            payment.is_overdue = True
            payment.days_overdue = (payment.payment_date - payment.due_date).days
        else:
            payment.is_overdue = False
            payment.days_overdue = 0

    db.session.commit()
    return jsonify(payment.to_dict())


@installment_bp.route("/installment-payments/<int:id>", methods=["DELETE"])
def delete_installment_payment(id):
    payment = InstallmentPayment.query.get_or_404(id)

    # Get the installment to potentially revert changes
    installment = payment.installment

    # Only allow deletion of the last payment
    if installment.completed_installments != payment.installment_number:
        return jsonify({"error": "Can only delete the last payment in sequence"}), 400

    # Revert installment changes
    installment.completed_installments -= 1
    installment.remaining_amount += payment.amount
    installment.status = "active"
    installment.next_due_date = payment.due_date
    installment.end_date = None

    db.session.delete(payment)
    db.session.commit()

    return "", 204


# Analytics and Reports
@installment_bp.route("/installments/analytics", methods=["GET"])
def get_installment_analytics():
    status = request.args.get("status", "active")

    query = PaymentInstallment.query
    if status != "all":
        query = query.filter(PaymentInstallment.status == status)

    installments = query.all()

    analytics = {
        "total_installments": len(installments),
        "active_installments": len([i for i in installments if i.status == "active"]),
        "completed_installments": len(
            [i for i in installments if i.status == "completed"]
        ),
        "total_amount": sum(i.total_amount for i in installments),
        "remaining_amount": sum(i.remaining_amount for i in installments),
        "overdue_installments": len([i for i in installments if i.is_overdue()]),
        "by_type": {},
        "by_frequency": {},
    }

    # Group by type and frequency
    for installment in installments:
        analytics["by_type"][installment.installment_type] = (
            analytics["by_type"].get(installment.installment_type, 0) + 1
        )
        analytics["by_frequency"][installment.frequency] = (
            analytics["by_frequency"].get(installment.frequency, 0) + 1
        )

    return jsonify(analytics)


# Overdue installments
@installment_bp.route("/installments/overdue", methods=["GET"])
def get_overdue_installments():
    installments = PaymentInstallment.query.filter(
        PaymentInstallment.status == "active"
    ).all()

    overdue = [i.to_dict() for i in installments if i.is_overdue()]

    return jsonify({"overdue_installments": overdue, "count": len(overdue)})


# Process auto installments (for scheduled processing)
@installment_bp.route("/installments/process-auto", methods=["POST"])
def process_auto_installments():
    """Process installments marked for auto-processing (for scheduled tasks)"""
    today = date.today()

    auto_installments = PaymentInstallment.query.filter(
        PaymentInstallment.status == "active",
        PaymentInstallment.auto_process == True,
        PaymentInstallment.next_due_date <= today,
    ).all()

    processed = []
    for installment in auto_installments:
        try:
            # Create payment record
            payment = InstallmentPayment(
                installment_id=installment.id,
                professional_id=installment.professional_id,
                installment_number=installment.completed_installments + 1,
                amount=installment.installment_amount,
                payment_date=today,
                due_date=installment.next_due_date,
                payment_method=installment.payment_method,
                bank_name=installment.bank_name,
                account_number=installment.account_number,
                reference_info=installment.reference_info,
                status="completed",
                processed_by="Auto-Processor",
            )

            # Update installment
            installment.mark_payment_completed()

            db.session.add(payment)
            processed.append(installment.to_dict())

        except Exception as e:
            print(f"Error processing auto installment {installment.id}: {str(e)}")
            continue

    db.session.commit()

    return jsonify(
        {"processed_count": len(processed), "processed_installments": processed}
    )
