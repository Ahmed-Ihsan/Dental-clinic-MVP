from flask import Blueprint, request, jsonify
from models import Treatment
from database import db
from datetime import datetime, date

treatment_bp = Blueprint("treatment", __name__)


@treatment_bp.route("/treatments", methods=["GET"])
def get_treatments():
    treatments = Treatment.query.all()
    return jsonify([t.to_dict() for t in treatments])


@treatment_bp.route("/treatments", methods=["POST"])
def create_treatment():
    data = request.get_json()
    required_fields = ["patient_id", "treatment_type", "cost", "treatment_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    try:
        treatment = Treatment(
            patient_id=data["patient_id"],
            appointment_id=data.get("appointment_id"),
            treatment_type=data["treatment_type"],
            cost=data["cost"],
            notes=data.get("notes"),
            treatment_date=date.fromisoformat(data["treatment_date"]),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
    db.session.add(treatment)
    db.session.commit()
    return jsonify(treatment.to_dict()), 201


@treatment_bp.route("/treatments/<int:id>", methods=["GET"])
def get_treatment(id):
    treatment = Treatment.query.get_or_404(id)
    return jsonify(treatment.to_dict())


@treatment_bp.route("/treatments/<int:id>", methods=["PUT"])
def update_treatment(id):
    treatment = Treatment.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if key == "treatment_date" and value:
            setattr(treatment, key, date.fromisoformat(value))
        elif key in ["created_at", "updated_at"] and value:
            setattr(treatment, key, datetime.strptime(value, "%Y-%m-%d %H:%M:%S"))
        elif hasattr(treatment, key):
            setattr(treatment, key, value)
    db.session.commit()
    return jsonify(treatment.to_dict())


@treatment_bp.route("/treatments/<int:id>", methods=["DELETE"])
def delete_treatment(id):
    treatment = Treatment.query.get_or_404(id)
    db.session.delete(treatment)
    db.session.commit()
    return "", 204
