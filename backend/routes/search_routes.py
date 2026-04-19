from flask import Blueprint, request, jsonify
from models import Patient, Appointment, Treatment, MedicalHistory, Bill, Professional
from database import db

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
def global_search():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify(
            {
                "patients": [],
                "appointments": [],
                "treatments": [],
                "medical_histories": [],
                "bills": [],
                "professionals": [],
            }
        )

    # Search patients
    patients = (
        Patient.query.filter(
            (Patient.first_name.contains(query))
            | (Patient.last_name.contains(query))
            | (Patient.email.contains(query))
            | (Patient.phone.contains(query))
        )
        .limit(10)
        .all()
    )

    # Search appointments
    appointments = (
        Appointment.query.filter(
            (Appointment.status.contains(query)) | (Appointment.notes.contains(query))
        )
        .limit(10)
        .all()
    )

    # Search treatments
    treatments = (
        Treatment.query.filter(
            (Treatment.treatment_type.contains(query))
            | (Treatment.notes.contains(query))
        )
        .limit(10)
        .all()
    )

    # Search medical histories
    medical_histories = (
        MedicalHistory.query.filter(
            (MedicalHistory.condition.contains(query))
            | (MedicalHistory.notes.contains(query))
        )
        .limit(10)
        .all()
    )

    # Search bills
    bills = Bill.query.filter((Bill.status.contains(query))).limit(10).all()

    # Search professionals
    professionals = (
        Professional.query.filter(
            (Professional.first_name.contains(query))
            | (Professional.last_name.contains(query))
            | (Professional.email.contains(query))
            | (Professional.phone.contains(query))
            | (Professional.specialty.contains(query))
            | (Professional.license_number.contains(query))
        )
        .limit(10)
        .all()
    )

    # Convert to dict and add entity type for frontend
    result = {
        "patients": [{"type": "patient", **p.to_dict()} for p in patients],
        "appointments": [{"type": "appointment", **a.to_dict()} for a in appointments],
        "treatments": [{"type": "treatment", **t.to_dict()} for t in treatments],
        "medical_histories": [
            {"type": "medical_history", **mh.to_dict()} for mh in medical_histories
        ],
        "bills": [{"type": "bill", **b.to_dict()} for b in bills],
        "professionals": [
            {"type": "professional", **p.to_dict()} for p in professionals
        ],
    }

    return jsonify(result)
