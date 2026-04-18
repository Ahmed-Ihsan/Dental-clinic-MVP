from database import db


class MedicalHistory(db.Model):
    __tablename__ = "medical_history"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    condition = db.Column(db.String(200), nullable=False)
    diagnosis_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    patient = db.relationship(
        "Patient", backref=db.backref("medical_histories", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "condition": self.condition,
            "diagnosis_date": str(self.diagnosis_date),
            "notes": self.notes,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
