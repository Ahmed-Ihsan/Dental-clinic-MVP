from flask import Blueprint, request, jsonify
from models import MedicalHistory
from database import db
from datetime import datetime, date

medical_history_bp = Blueprint("medical_history", __name__)


@medical_history_bp.route("/medical_histories", methods=["GET"])
def get_medical_histories():
    patient_id = request.args.get("patient_id", "")
    query = MedicalHistory.query
    if patient_id:
        query = query.filter(MedicalHistory.patient_id == int(patient_id))
    medical_histories = query.all()
    return jsonify([mh.to_dict() for mh in medical_histories])


@medical_history_bp.route("/medical_histories", methods=["POST"])
def create_medical_history():
    data = request.get_json()
    required_fields = ["patient_id", "condition", "diagnosis_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    try:
        medical_history = MedicalHistory(
            patient_id=data["patient_id"],
            condition=data["condition"],
            diagnosis_date=date.fromisoformat(data["diagnosis_date"]),
            notes=data.get("notes"),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
    db.session.add(medical_history)
    db.session.commit()
    return jsonify(medical_history.to_dict()), 201


@medical_history_bp.route("/medical_histories/<int:id>", methods=["GET"])
def get_medical_history(id):
    medical_history = MedicalHistory.query.get_or_404(id)
    return jsonify(medical_history.to_dict())


@medical_history_bp.route("/medical_histories/<int:id>", methods=["PUT"])
def update_medical_history(id):
    medical_history = MedicalHistory.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if key == "diagnosis_date" and value:
            setattr(medical_history, key, date.fromisoformat(value))
        elif key in ["created_at", "updated_at"] and value:
            setattr(medical_history, key, datetime.strptime(value, "%Y-%m-%d %H:%M:%S"))
        elif hasattr(medical_history, key):
            setattr(medical_history, key, value)
    db.session.commit()
    return jsonify(medical_history.to_dict())


@medical_history_bp.route("/medical_histories/<int:id>", methods=["DELETE"])
def delete_medical_history(id):
    medical_history = MedicalHistory.query.get_or_404(id)
    db.session.delete(medical_history)
    db.session.commit()
    return "", 204
