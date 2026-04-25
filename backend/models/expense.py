from database import db
from datetime import datetime


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # clinic, doctor, patient, lab
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    paid_amount = db.Column(db.Float, default=0.0)
    balance = db.Column(db.Float, default=0.0)
    
    # Optional foreign keys
    doctor_id = db.Column(db.Integer, db.ForeignKey("professionals.id"), nullable=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=True)
    
    # Payment details
    payment_method = db.Column(db.String(50), nullable=True)  # cash, card, transfer
    receipt_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default="debt")  # paid, debt
    date = db.Column(db.Date, nullable=False)
    
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    doctor = db.relationship("Professional", backref=db.backref("expenses", lazy=True))
    patient = db.relationship("Patient", backref=db.backref("expenses", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "description": self.description,
            "amount": self.amount,
            "paid_amount": self.paid_amount,
            "balance": self.balance,
            "doctor_id": self.doctor_id,
            "patient_id": self.patient_id,
            "payment_method": self.payment_method,
            "receipt_id": self.receipt_id,
            "status": self.status,
            "date": str(self.date) if self.date else None,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
