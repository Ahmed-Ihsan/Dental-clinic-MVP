import pytest
from models import Patient, Appointment, Treatment
from database import db


def test_patient_to_dict():
    patient = Patient(
        first_name="John",
        last_name="Doe",
        date_of_birth="1990-01-01",
        email="john@example.com",
    )
    result = patient.to_dict()
    assert result["first_name"] == "John"
    assert result["last_name"] == "Doe"
    assert result["email"] == "john@example.com"
    assert "id" in result
    assert "created_at" in result


def test_appointment_to_dict():
    appointment = Appointment(
        patient_id=1,
        appointment_date="2023-10-01",
        start_time="10:00",
        end_time="11:00",
        status="scheduled",
    )
    result = appointment.to_dict()
    assert result["patient_id"] == 1
    assert result["status"] == "scheduled"
    assert "start_time" in result
    assert "end_time" in result


def test_treatment_to_dict():
    treatment = Treatment(
        patient_id=1, treatment_type="Cleaning", cost=100.0, treatment_date="2023-10-01"
    )
    result = treatment.to_dict()
    assert result["treatment_type"] == "Cleaning"
    assert result["cost"] == 100.0
    assert "treatment_date" in result


def test_patient_appointments_relationship():
    # This would require database setup, but for unit test, we can test the relationship exists
    patient = Patient(
        first_name="Test", last_name="Patient", date_of_birth="1990-01-01"
    )
    assert hasattr(patient, "appointments")


def test_patient_treatments_relationship():
    patient = Patient(
        first_name="Test", last_name="Patient", date_of_birth="1990-01-01"
    )
    assert hasattr(patient, "treatments")


def test_appointment_patient_relationship():
    appointment = Appointment(
        patient_id=1,
        appointment_date="2023-10-01",
        start_time="10:00",
        end_time="11:00",
    )
    assert hasattr(appointment, "patient")


def test_treatment_patient_relationship():
    treatment = Treatment(
        patient_id=1, treatment_type="Test", cost=50.0, treatment_date="2023-10-01"
    )
    assert hasattr(treatment, "patient")
