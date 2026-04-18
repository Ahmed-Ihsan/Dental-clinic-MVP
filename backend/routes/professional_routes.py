from flask import Blueprint, request, jsonify
from models import Professional
from database import db
from datetime import datetime

professional_bp = Blueprint("professional", __name__)


@professional_bp.route("/professionals", methods=["GET"])
def get_professionals():
    search = request.args.get("search", "")
    if search:
        professionals = Professional.query.filter(
            (Professional.first_name.contains(search))
            | (Professional.last_name.contains(search))
            | (Professional.specialty.contains(search))
            | (Professional.email.contains(search))
        ).all()
    else:
        professionals = Professional.query.all()
    return jsonify([p.to_dict() for p in professionals])


@professional_bp.route("/professionals", methods=["POST"])
def create_professional():
    data = request.get_json()
    required_fields = ["first_name", "last_name"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    professional = Professional(
        first_name=data["first_name"],
        last_name=data["last_name"],
        specialty=data.get("specialty"),
        phone=data.get("phone"),
        email=data.get("email"),
        license_number=data.get("license_number"),
    )
    db.session.add(professional)
    db.session.commit()
    return jsonify(professional.to_dict()), 201


@professional_bp.route("/professionals/<int:id>", methods=["GET"])
def get_professional(id):
    professional = Professional.query.get_or_404(id)
    return jsonify(professional.to_dict())


@professional_bp.route("/professionals/<int:id>", methods=["PUT"])
def update_professional(id):
    professional = Professional.query.get_or_404(id)
    data = request.get_json()
    for key, value in data.items():
        if key in ["created_at", "updated_at"] and value:
            setattr(professional, key, datetime.strptime(value, "%Y-%m-%d %H:%M:%S"))
        elif hasattr(professional, key):
            setattr(professional, key, value)
    db.session.commit()
    return jsonify(professional.to_dict())


@professional_bp.route("/professionals/<int:id>", methods=["DELETE"])
def delete_professional(id):
    professional = Professional.query.get_or_404(id)
    db.session.delete(professional)
    db.session.commit()
    return "", 204
