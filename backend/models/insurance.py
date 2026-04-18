from database import db


class Insurance(db.Model):
    __tablename__ = "insurance"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    provider = db.Column(db.String(100), nullable=False)
    policy_number = db.Column(db.String(50), nullable=False)
    coverage_details = db.Column(db.Text)
    expiry_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    patient = db.relationship("Patient", backref=db.backref("insurances", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "provider": self.provider,
            "policy_number": self.policy_number,
            "coverage_details": self.coverage_details,
            "expiry_date": str(self.expiry_date) if self.expiry_date else None,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
