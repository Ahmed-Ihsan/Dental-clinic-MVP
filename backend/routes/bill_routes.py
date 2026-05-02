from flask import Blueprint, request, jsonify
from flask_login import current_user
from datetime import datetime, date
from sqlalchemy import select
from models import Bill, Appointment, Professional
from database import db

bill_bp = Blueprint("bill", __name__)


@bill_bp.route("/bills", methods=["GET"])
def get_bills():
    status_filter = request.args.get("status")
    query = Bill.query

    # ── Role-based filter ──────────────────────────────────────────
    if current_user.is_authenticated and current_user.role == 'doctor':
        prof_ids = [p.id for p in Professional.query.filter_by(user_id=current_user.id).all()]
        if not prof_ids:
            return jsonify([])   # no linked professional → no bills
        apt_ids = db.session.execute(
            select(Appointment.id).where(Appointment.dentist_id.in_(prof_ids))
        ).scalars().all()
        query = query.filter(Bill.appointment_id.in_(apt_ids))

    # ── Standard filter ────────────────────────────────────────────
    if status_filter:
        query = query.filter(Bill.status == status_filter)

    bills = query.all()
    return jsonify([bill.to_dict() for bill in bills])


@bill_bp.route("/bills", methods=["POST"])
def create_bill():
    data = request.get_json()
    due_date = None
    if data.get("due_date"):
        due_date = date.fromisoformat(data["due_date"])
    total_amount    = float(data["total_amount"])
    paid_amount     = float(data.get("paid_amount", 0.0))
    discount_amount = float(data.get("discount_amount", 0.0))
    balance         = data.get("balance")
    if balance is None:
        balance = total_amount - paid_amount - discount_amount

    new_bill = Bill(
        patient_id=data["patient_id"],
        appointment_id=data.get("appointment_id"),
        total_amount=total_amount,
        paid_amount=paid_amount,
        discount_amount=discount_amount,
        direct_cost=float(data.get("direct_cost", 0.0)),
        balance=balance,
        due_date=due_date,
        status=data.get("status", "pending"),
    )
    db.session.add(new_bill)
    db.session.commit()
    return jsonify(new_bill.to_dict()), 201


@bill_bp.route("/bills/<int:id>", methods=["GET"])
def get_bill(id):
    bill = Bill.query.get_or_404(id)
    return jsonify(bill.to_dict())


@bill_bp.route("/bills/<int:id>", methods=["PUT"])
def update_bill(id):
    bill = Bill.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if hasattr(bill, key):
            if key == "due_date" and value:
                value = date.fromisoformat(value)
            elif key in ["created_at", "updated_at"] and value:
                value = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            setattr(bill, key, value)
    db.session.commit()
    return jsonify(bill.to_dict())


@bill_bp.route("/bills/<int:id>", methods=["DELETE"])
def delete_bill(id):
    bill = Bill.query.get_or_404(id)
    db.session.delete(bill)
    db.session.commit()
    return "", 204
