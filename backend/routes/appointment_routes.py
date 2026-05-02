from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import Appointment, Professional
from database import db
from datetime import datetime, date, time

appointment_bp = Blueprint("appointment", __name__)


@appointment_bp.route("/appointments", methods=["GET"])
def get_appointments():
    status     = request.args.get("status", "")
    date_from  = request.args.get("date_from", "")
    date_to    = request.args.get("date_to", "")
    patient_id = request.args.get("patient_id", "")

    query = Appointment.query

    # ── Role-based filter ──────────────────────────────────────────
    if current_user.is_authenticated and current_user.role == 'doctor':
        prof_ids = [p.id for p in Professional.query.filter_by(user_id=current_user.id).all()]
        if prof_ids:
            query = query.filter(Appointment.dentist_id.in_(prof_ids))
        else:
            return jsonify([])   # doctor has no linked professional yet

    # ── Standard filters ───────────────────────────────────────────
    if status and status != "all":
        query = query.filter(Appointment.status == status)

    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)

    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    if patient_id:
        query = query.filter(Appointment.patient_id == int(patient_id))

    appointments = query.all()
    return jsonify([a.to_dict() for a in appointments])


@appointment_bp.route("/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json()
    required_fields = ["patient_id", "appointment_date", "start_time", "end_time"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    # Auto-assign / validate dentist for doctor role
    dentist_id = data.get("dentist_id")
    if current_user.is_authenticated and current_user.role == 'doctor':
        prof_ids = [p.id for p in Professional.query.filter_by(user_id=current_user.id).all()]
        if prof_ids:
            # Allow doctor to pick among their own profiles; default to first
            dentist_id = int(dentist_id) if dentist_id and int(dentist_id) in prof_ids else prof_ids[0]

    try:
        appointment = Appointment(
            patient_id=data["patient_id"],
            appointment_date=date.fromisoformat(data["appointment_date"]),
            start_time=time.fromisoformat(data["start_time"]),
            end_time=time.fromisoformat(data["end_time"]),
            dentist_id=dentist_id,
            status=data.get("status", "scheduled"),
            notes=data.get("notes"),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date/time format: {str(e)}"}), 400
    db.session.add(appointment)
    db.session.commit()
    return jsonify(appointment.to_dict()), 201


@appointment_bp.route("/appointments/<int:id>", methods=["GET"])
def get_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    return jsonify(appointment.to_dict())


@appointment_bp.route("/appointments/<int:id>", methods=["PUT"])
def update_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if key == "appointment_date" and value:
            setattr(appointment, key, date.fromisoformat(value))
        elif key in ["start_time", "end_time"] and value:
            setattr(appointment, key, time.fromisoformat(value))
        elif key in ["created_at", "updated_at"] and value:
            setattr(appointment, key, datetime.strptime(value, "%Y-%m-%d %H:%M:%S"))
        elif hasattr(appointment, key):
            setattr(appointment, key, value)
    db.session.commit()
    return jsonify(appointment.to_dict())


@appointment_bp.route("/appointments/<int:id>", methods=["DELETE"])
def delete_appointment(id):
    appointment = Appointment.query.get_or_404(id)
    db.session.delete(appointment)
    db.session.commit()
    return "", 204
