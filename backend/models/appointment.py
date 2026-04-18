from database import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    dentist_id = db.Column(db.Integer)
    status = db.Column(db.String(20), default="scheduled")
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    patient = db.relationship("Patient", backref=db.backref("appointments", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "appointment_date": str(self.appointment_date),
            "start_time": str(self.start_time),
            "end_time": str(self.end_time),
            "dentist_id": self.dentist_id,
            "status": self.status,
            "notes": self.notes,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
