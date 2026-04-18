def test_get_appointments(client):
    response = client.get("/api/appointments")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_appointment(client):
    # First create a patient
    patient_data = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1990-01-01",
        "email": "test@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    data = {
        "patient_id": patient_id,
        "appointment_date": "2023-10-01",
        "start_time": "10:00",
        "end_time": "11:00",
        "status": "scheduled",
    }
    response = client.post("/api/appointments", json=data)
    assert response.status_code == 201
    appointment = response.get_json()
    assert appointment["patient_id"] == patient_id


def test_get_nonexistent_appointment(client):
    response = client.get("/api/appointments/999")
    assert response.status_code == 404


def test_update_appointment(client):
    # Create patient and appointment
    patient_data = {
        "first_name": "Update",
        "last_name": "Appt",
        "date_of_birth": "1985-01-01",
        "email": "updateappt@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    appt_data = {
        "patient_id": patient_id,
        "appointment_date": "2023-10-02",
        "start_time": "14:00",
        "end_time": "15:00",
    }
    appt_response = client.post("/api/appointments", json=appt_data)
    appt_id = appt_response.get_json()["id"]

    update_data = {"status": "completed", "notes": "Appointment completed"}
    response = client.put(f"/api/appointments/{appt_id}", json=update_data)
    assert response.status_code == 200
    updated_appt = response.get_json()
    assert updated_appt["status"] == "completed"
    assert updated_appt["notes"] == "Appointment completed"
