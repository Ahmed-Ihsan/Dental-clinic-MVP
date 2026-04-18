import pytest
from app import app, db


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_create_bill(client):
    # Create patient and appointment first via API
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "email": "john@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    appointment_data = {
        "patient_id": patient_id,
        "appointment_date": "2026-04-15",
        "start_time": "10:00",
        "end_time": "11:00",
        "status": "scheduled",
    }
    appointment_response = client.post("/api/appointments", json=appointment_data)
    appointment_id = appointment_response.get_json()["id"]

    response = client.post(
        "/api/bills",
        json={
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "total_amount": 100.0,
            "paid_amount": 50.0,
            "balance": 50.0,
            "due_date": "2026-04-20",
            "status": "pending",
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["total_amount"] == 100.0
    assert data["status"] == "pending"


def test_get_bills(client):
    # Create data via API
    patient_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1985-05-05",
        "email": "jane@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    bill_data = {
        "patient_id": patient_id,
        "total_amount": 200.0,
        "paid_amount": 0.0,
        "balance": 200.0,
        "status": "unpaid",
    }
    client.post("/api/bills", json=bill_data)

    response = client.get("/api/bills")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["total_amount"] == 200.0


def test_get_bills_filtered(client):
    # Create data via API
    patient_data = {
        "first_name": "Bob",
        "last_name": "Brown",
        "date_of_birth": "1975-03-03",
        "email": "bob@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    bill_data1 = {
        "patient_id": patient_id,
        "total_amount": 150.0,
        "paid_amount": 150.0,
        "balance": 0.0,
        "status": "paid",
    }
    bill_data2 = {
        "patient_id": patient_id,
        "total_amount": 250.0,
        "paid_amount": 0.0,
        "balance": 250.0,
        "status": "pending",
    }
    client.post("/api/bills", json=bill_data1)
    client.post("/api/bills", json=bill_data2)

    response = client.get("/api/bills?status=paid")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["status"] == "paid"


def test_update_bill(client):
    # Create data via API
    patient_data = {
        "first_name": "Alice",
        "last_name": "Green",
        "date_of_birth": "1995-07-07",
        "email": "alice@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    bill_data = {
        "patient_id": patient_id,
        "total_amount": 300.0,
        "paid_amount": 0.0,
        "balance": 300.0,
        "status": "pending",
    }
    bill_response = client.post("/api/bills", json=bill_data)
    bill_id = bill_response.get_json()["id"]

    response = client.put(
        f"/api/bills/{bill_id}",
        json={"status": "paid", "paid_amount": 300.0, "balance": 0.0},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "paid"
    assert data["balance"] == 0.0


def test_delete_bill(client):
    # Create data via API
    patient_data = {
        "first_name": "Charlie",
        "last_name": "White",
        "date_of_birth": "1980-09-09",
        "email": "charlie@example.com",
    }
    patient_response = client.post("/api/patients", json=patient_data)
    patient_id = patient_response.get_json()["id"]

    bill_data = {
        "patient_id": patient_id,
        "total_amount": 400.0,
        "paid_amount": 0.0,
        "balance": 400.0,
        "status": "overdue",
    }
    bill_response = client.post("/api/bills", json=bill_data)
    bill_id = bill_response.get_json()["id"]

    response = client.delete(f"/api/bills/{bill_id}")
    assert response.status_code == 204

    # Check deletion
    response = client.get("/api/bills")
    assert len(response.get_json()) == 0
