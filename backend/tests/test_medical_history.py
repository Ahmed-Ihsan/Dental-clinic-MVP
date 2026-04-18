def test_get_medical_histories(client):
    response = client.get("/api/medical_histories")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_medical_history(client):
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
        "condition": "Cavity",
        "diagnosis_date": "2023-10-01",
        "notes": "Minor cavity detected",
    }
    response = client.post("/api/medical_histories", json=data)
    assert response.status_code == 201
    medical_history = response.get_json()
    assert medical_history["condition"] == "Cavity"
    assert medical_history["notes"] == "Minor cavity detected"


def test_get_medical_history(client):
    # Create patient and medical history
    patient_data = {
        "first_name": "Get",
        "last_name": "Test",
        "date_of_birth": "1985-01-01",
        "email": "get@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    mh_data = {
        "patient_id": patient_id,
        "condition": "Gingivitis",
        "diagnosis_date": "2023-09-15",
    }
    create_response = client.post("/api/medical_histories", json=mh_data)
    mh_id = create_response.get_json()["id"]

    response = client.get(f"/api/medical_histories/{mh_id}")
    assert response.status_code == 200
    medical_history = response.get_json()
    assert medical_history["condition"] == "Gingivitis"


def test_get_medical_histories_by_patient(client):
    # Create two patients and medical histories
    patient1_data = {
        "first_name": "Patient",
        "last_name": "One",
        "date_of_birth": "1990-01-01",
        "email": "one@example.com",
    }
    patient1_response = client.post("/api/patients", json=patient1_data)
    patient1_id = patient1_response.get_json()["id"]

    patient2_data = {
        "first_name": "Patient",
        "last_name": "Two",
        "date_of_birth": "1992-01-01",
        "email": "two@example.com",
    }
    patient2_response = client.post("/api/patients", json=patient2_data)
    patient2_id = patient2_response.get_json()["id"]

    # Medical history for patient 1
    mh1_data = {
        "patient_id": patient1_id,
        "condition": "Toothache",
        "diagnosis_date": "2023-08-01",
    }
    client.post("/api/medical_histories", json=mh1_data)

    # Medical history for patient 2
    mh2_data = {
        "patient_id": patient2_id,
        "condition": "Braces",
        "diagnosis_date": "2023-07-01",
    }
    client.post("/api/medical_histories", json=mh2_data)

    # Get all
    all_response = client.get("/api/medical_histories")
    assert len(all_response.get_json()) == 2

    # Get for patient 1
    patient1_response = client.get(f"/api/medical_histories?patient_id={patient1_id}")
    histories = patient1_response.get_json()
    assert len(histories) == 1
    assert histories[0]["condition"] == "Toothache"


def test_update_medical_history(client):
    # Create patient and medical history
    patient_data = {
        "first_name": "Update",
        "last_name": "Test",
        "date_of_birth": "1985-01-01",
        "email": "update@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    mh_data = {
        "patient_id": patient_id,
        "condition": "Cavity",
        "diagnosis_date": "2023-10-02",
    }
    create_response = client.post("/api/medical_histories", json=mh_data)
    mh_id = create_response.get_json()["id"]

    update_data = {"notes": "Updated notes"}
    response = client.put(f"/api/medical_histories/{mh_id}", json=update_data)
    assert response.status_code == 200
    updated_mh = response.get_json()
    assert updated_mh["notes"] == "Updated notes"


def test_delete_medical_history(client):
    # Create patient and medical history
    patient_data = {
        "first_name": "Delete",
        "last_name": "Test",
        "date_of_birth": "1995-01-01",
        "email": "delete@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    mh_data = {
        "patient_id": patient_id,
        "condition": "Extraction",
        "diagnosis_date": "2023-10-03",
    }
    create_response = client.post("/api/medical_histories", json=mh_data)
    mh_id = create_response.get_json()["id"]

    response = client.delete(f"/api/medical_histories/{mh_id}")
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/api/medical_histories/{mh_id}")
    assert get_response.status_code == 404
