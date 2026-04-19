from flask import Blueprint, request, jsonify
from models import Salary, SalaryComponent, Professional
from database import db
from datetime import datetime, date

salary_bp = Blueprint("salary", __name__)


@salary_bp.route("/salaries", methods=["GET"])
def get_salaries():
    professional_id = request.args.get("professional_id")
    is_active = request.args.get("is_active")

    query = Salary.query

    if professional_id:
        query = query.filter(Salary.professional_id == professional_id)

    if is_active is not None:
        query = query.filter(Salary.is_active == (is_active.lower() == "true"))

    salaries = query.all()
    return jsonify([s.to_dict() for s in salaries])


@salary_bp.route("/salaries", methods=["POST"])
def create_salary():
    data = request.get_json()
    required_fields = ["professional_id", "base_salary", "effective_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Check if professional exists
    professional = Professional.query.get(data["professional_id"])
    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    # Check if there's already an active salary for this professional
    existing_active = Salary.query.filter(
        Salary.professional_id == data["professional_id"], Salary.is_active == True
    ).first()

    if existing_active:
        # End the existing salary
        existing_active.end_date = date.fromisoformat(data["effective_date"])
        existing_active.is_active = False

    try:
        salary = Salary(
            professional_id=data["professional_id"],
            base_salary=data["base_salary"],
            currency=data.get("currency", "SAR"),
            salary_type=data.get("salary_type", "monthly"),
            effective_date=date.fromisoformat(data["effective_date"]),
            end_date=date.fromisoformat(data["end_date"])
            if data.get("end_date")
            else None,
            is_active=data.get("is_active", True),
            notes=data.get("notes"),
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

    db.session.add(salary)
    db.session.commit()
    return jsonify(salary.to_dict()), 201


@salary_bp.route("/salaries/<int:id>", methods=["GET"])
def get_salary(id):
    salary = Salary.query.get_or_404(id)
    return jsonify(salary.to_dict())


@salary_bp.route("/salaries/<int:id>", methods=["PUT"])
def update_salary(id):
    salary = Salary.query.get_or_404(id)
    data = request.get_json()

    # Prevent updating professional_id if there are components
    if "professional_id" in data and data["professional_id"] != salary.professional_id:
        if salary.components:
            return jsonify(
                {"error": "Cannot change professional when salary has components"}
            ), 400

    for key, value in data.items():
        if key == "effective_date" and value:
            setattr(salary, key, date.fromisoformat(value))
        elif key == "end_date":
            setattr(salary, key, date.fromisoformat(value) if value else None)
        elif hasattr(salary, key):
            setattr(salary, key, value)

    db.session.commit()
    return jsonify(salary.to_dict())


@salary_bp.route("/salaries/<int:id>", methods=["DELETE"])
def delete_salary(id):
    salary = Salary.query.get_or_404(id)

    # Check if salary has payroll records
    if salary.payrolls:
        return jsonify({"error": "Cannot delete salary with payroll records"}), 400

    db.session.delete(salary)
    db.session.commit()
    return "", 204


# Salary Components CRUD
@salary_bp.route("/salaries/<int:salary_id>/components", methods=["GET"])
def get_salary_components(salary_id):
    salary = Salary.query.get_or_404(salary_id)
    return jsonify([c.to_dict() for c in salary.components])


@salary_bp.route("/salaries/<int:salary_id>/components", methods=["POST"])
def create_salary_component(salary_id):
    salary = Salary.query.get_or_404(salary_id)
    data = request.get_json()

    required_fields = ["component_type", "name", "amount", "effective_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    if data["component_type"] not in ["allowance", "deduction", "bonus"]:
        return jsonify({"error": "Invalid component type"}), 400

    try:
        component = SalaryComponent(
            salary_id=salary_id,
            component_type=data["component_type"],
            name=data["name"],
            amount=data["amount"],
            percentage=data.get("percentage"),
            is_taxable=data.get("is_taxable", True),
            is_fixed=data.get("is_fixed", True),
            description=data.get("description"),
            effective_date=date.fromisoformat(data["effective_date"]),
            end_date=date.fromisoformat(data["end_date"])
            if data.get("end_date")
            else None,
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

    db.session.add(component)
    db.session.commit()
    return jsonify(component.to_dict()), 201


@salary_bp.route("/salary-components/<int:id>", methods=["PUT"])
def update_salary_component(id):
    component = SalaryComponent.query.get_or_404(id)
    data = request.get_json()

    for key, value in data.items():
        if key in ["effective_date", "end_date"]:
            setattr(component, key, date.fromisoformat(value) if value else None)
        elif hasattr(component, key):
            setattr(component, key, value)

    db.session.commit()
    return jsonify(component.to_dict())


@salary_bp.route("/salary-components/<int:id>", methods=["DELETE"])
def delete_salary_component(id):
    component = SalaryComponent.query.get_or_404(id)
    db.session.delete(component)
    db.session.commit()
    return "", 204
