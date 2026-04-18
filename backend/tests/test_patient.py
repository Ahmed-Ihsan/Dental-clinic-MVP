def test_get_patients(client):
    response = client.get("/api/patients")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_patient(client):
    data = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "email": "john@example.com",
    }
    response = client.post("/api/patients", json=data)
    assert response.status_code == 201
    patient = response.get_json()
    assert patient["first_name"] == "John"
    assert patient["last_name"] == "Doe"


def test_get_patient(client):
    data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1985-05-05",
        "email": "jane@example.com",
    }
    post_response = client.post("/api/patients", json=data)
    patient_id = post_response.get_json()["id"]
    response = client.get(f"/api/patients/{patient_id}")
    assert response.status_code == 200
    patient = response.get_json()
    assert patient["first_name"] == "Jane"


def test_search_patients(client):
    data1 = {
        "first_name": "Alice",
        "last_name": "Wonder",
        "date_of_birth": "1995-01-01",
        "email": "alice@example.com",
    }
    data2 = {
        "first_name": "Bob",
        "last_name": "Builder",
        "date_of_birth": "1992-01-01",
        "email": "bob@example.com",
    }
    client.post("/api/patients", json=data1)
    client.post("/api/patients", json=data2)
    response = client.get("/api/patients?search=Alice")
    assert response.status_code == 200
    patients = response.get_json()
    assert len(patients) == 1
    assert patients[0]["first_name"] == "Alice"


def test_create_patient_missing_required_field(client):
    data = {
        "first_name": "John",
        # Missing last_name and date_of_birth
        "email": "john@example.com",
    }
    response = client.post("/api/patients", json=data)
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_get_nonexistent_patient(client):
    response = client.get("/api/patients/999")
    assert response.status_code == 404


def test_update_nonexistent_patient(client):
    data = {"first_name": "Updated"}
    response = client.put("/api/patients/999", json=data)
    assert response.status_code == 404


def test_delete_nonexistent_patient(client):
    response = client.delete("/api/patients/999")
    assert response.status_code == 404
