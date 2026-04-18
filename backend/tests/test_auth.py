import pytest
from app import app, db
from models import User
from flask_login import LoginManager


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["LOGIN_DISABLED"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_register(client):
    response = client.post(
        "/api/register", json={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "User created"
    user = User.query.filter_by(username="testuser").first()
    assert user is not None
    assert user.check_password("testpass")


def test_login(client):
    # Register first
    client.post("/api/register", json={"username": "testuser", "password": "testpass"})

    response = client.post(
        "/api/login", json={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Logged in successfully"


def test_login_invalid(client):
    response = client.post(
        "/api/login", json={"username": "invalid", "password": "invalid"}
    )
    assert response.status_code == 401
    data = response.get_json()
    assert data["message"] == "Invalid credentials"


def test_logout(client):
    # Register and login first
    client.post("/api/register", json={"username": "testuser", "password": "testpass"})
    client.post("/api/login", json={"username": "testuser", "password": "testpass"})

    response = client.post("/api/logout")
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Logged out successfully"
