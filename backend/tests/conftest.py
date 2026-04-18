import pytest
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from database import db


@pytest.fixture
def client():
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "test_secret"

    db.init_app(app)
    migrate = Migrate(app, db)
    CORS(app)
    login_manager = LoginManager()
    login_manager.init_app(app)

    from models import (
        Patient,
        Appointment,
        MedicalHistory,
        Treatment,
        Insurance,
        Bill,
        Communication,
        Professional,
    )
    from routes.patient_routes import patient_bp
    from routes.appointment_routes import appointment_bp
    from routes.treatment_routes import treatment_bp
    from routes.medical_history_routes import medical_history_bp
    from routes.professional_routes import professional_bp

    app.register_blueprint(patient_bp, url_prefix="/api")
    app.register_blueprint(appointment_bp, url_prefix="/api")
    app.register_blueprint(treatment_bp, url_prefix="/api")
    app.register_blueprint(medical_history_bp, url_prefix="/api")
    app.register_blueprint(professional_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.drop_all()
