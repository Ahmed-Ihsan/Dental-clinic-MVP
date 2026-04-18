from database import db


class Treatment(db.Model):
    __tablename__ = "treatments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))
    treatment_type = db.Column(db.String(100), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    treatment_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    patient = db.relationship("Patient", backref=db.backref("treatments", lazy=True))
    appointment = db.relationship(
        "Appointment", backref=db.backref("treatments", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "appointment_id": self.appointment_id,
            "treatment_type": self.treatment_type,
            "cost": self.cost,
            "notes": self.notes,
            "treatment_date": str(self.treatment_date),
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
