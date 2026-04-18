from flask import Blueprint, request, jsonify
from models import Patient
from database import db
from datetime import datetime, date

patient_bp = Blueprint("patient", __name__)


@patient_bp.route("/patients", methods=["GET"])
def get_patients():
    search = request.args.get("search", "")
    gender = request.args.get("gender", "")
    date_from = request.args.get("date_from", "")
    date_to = request.args.get("date_to", "")

    query = Patient.query

    if search:
        query = query.filter(
            (Patient.first_name.contains(search))
            | (Patient.last_name.contains(search))
            | (Patient.email.contains(search))
        )

    if gender:
        query = query.filter(Patient.gender == gender)

    if date_from:
        query = query.filter(Patient.date_of_birth >= date_from)

    if date_to:
        query = query.filter(Patient.date_of_birth <= date_to)

    patients = query.all()
    return jsonify([p.to_dict() for p in patients])


@patient_bp.route("/patients", methods=["POST"])
def create_patient():
    data = request.get_json()
    required_fields = ["first_name", "last_name", "date_of_birth"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    try:
        patient = Patient(
            first_name=data["first_name"],
            last_name=data["last_name"],
            date_of_birth=date.fromisoformat(data["date_of_birth"]),
            gender=data.get("gender"),
            address=data.get("address"),
            phone=data.get("phone"),
            email=data.get("email"),
            emergency_contact=data.get("emergency_contact"),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.to_dict()), 201


@patient_bp.route("/patients/<int:id>", methods=["GET"])
def get_patient(id):
    patient = Patient.query.get_or_404(id)
    return jsonify(patient.to_dict())


@patient_bp.route("/patients/<int:id>", methods=["PUT"])
def update_patient(id):
    patient = Patient.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if key == "date_of_birth" and value:
            setattr(patient, key, date.fromisoformat(value))
        elif key in ["created_at", "updated_at"] and value:
            setattr(patient, key, datetime.strptime(value, "%Y-%m-%d %H:%M:%S"))
        elif hasattr(patient, key):
            setattr(patient, key, value)
    db.session.commit()
    return jsonify(patient.to_dict())


@patient_bp.route("/patients/<int:id>", methods=["DELETE"])
def delete_patient(id):
    patient = Patient.query.get_or_404(id)
    db.session.delete(patient)
    db.session.commit()
    return "", 204
