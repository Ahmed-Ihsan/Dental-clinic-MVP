def test_get_treatments(client):
    response = client.get("/api/treatments")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_treatment(client):
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
        "treatment_type": "Cleaning",
        "cost": 100.0,
        "treatment_date": "2023-10-01",
        "notes": "Regular cleaning",
    }
    response = client.post("/api/treatments", json=data)
    assert response.status_code == 201
    treatment = response.get_json()
    assert treatment["treatment_type"] == "Cleaning"
    assert treatment["cost"] == 100.0


def test_update_treatment(client):
    # Create patient and treatment first
    patient_data = {
        "first_name": "Update",
        "last_name": "Test",
        "date_of_birth": "1985-01-01",
        "email": "update@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    treatment_data = {
        "patient_id": patient_id,
        "treatment_type": "Filling",
        "cost": 200.0,
        "treatment_date": "2023-10-02",
    }
    treatment_response = client.post("/api/treatments", json=treatment_data)
    treatment_id = treatment_response.get_json()["id"]

    update_data = {"cost": 250.0, "notes": "Updated cost"}
    response = client.put(f"/api/treatments/{treatment_id}", json=update_data)
    assert response.status_code == 200
    updated_treatment = response.get_json()
    assert updated_treatment["cost"] == 250.0
    assert updated_treatment["notes"] == "Updated cost"


def test_delete_treatment(client):
    # Create patient and treatment
    patient_data = {
        "first_name": "Delete",
        "last_name": "Test",
        "date_of_birth": "1995-01-01",
        "email": "delete@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    treatment_data = {
        "patient_id": patient_id,
        "treatment_type": "Extraction",
        "cost": 150.0,
        "treatment_date": "2023-10-03",
    }
    treatment_response = client.post("/api/treatments", json=treatment_data)
    treatment_id = treatment_response.get_json()["id"]

    response = client.delete(f"/api/treatments/{treatment_id}")
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/api/treatments/{treatment_id}")
    assert get_response.status_code == 404
