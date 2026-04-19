from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
from database import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dental.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"  # Change in production
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

db.init_app(app)
migrate = Migrate(app, db)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
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
    User,
    Salary,
    SalaryComponent,
    Payroll,
    SalaryPayment,
    PaymentInstallment,
    InstallmentPayment,
)

with app.app_context():
    db.create_all()
from routes.patient_routes import patient_bp
from routes.appointment_routes import appointment_bp
from routes.treatment_routes import treatment_bp
from routes.professional_routes import professional_bp
from routes.medical_history_routes import medical_history_bp
from routes.bill_routes import bill_bp
from routes.auth_routes import auth_bp
from routes.search_routes import search_bp
from routes.salary_routes import salary_bp
from routes.payroll_routes import payroll_bp
from routes.installment_routes import installment_bp

app.register_blueprint(patient_bp, url_prefix="/api")
app.register_blueprint(appointment_bp, url_prefix="/api")
app.register_blueprint(treatment_bp, url_prefix="/api")
app.register_blueprint(professional_bp, url_prefix="/api")
app.register_blueprint(medical_history_bp, url_prefix="/api")
app.register_blueprint(bill_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(search_bp, url_prefix="/api")
app.register_blueprint(salary_bp, url_prefix="/api")
app.register_blueprint(payroll_bp, url_prefix="/api")
app.register_blueprint(installment_bp, url_prefix="/api")


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route("/api/me")
@login_required
def me():
    from flask_login import current_user

    return jsonify({"username": current_user.username})


@app.route("/")
def hello():
    return "Hello, Dental App!"


if __name__ == "__main__":
    app.run(debug=True)
