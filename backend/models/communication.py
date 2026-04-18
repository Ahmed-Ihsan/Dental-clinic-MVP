from database import db


class Communication(db.Model):
    __tablename__ = "communications"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    date_sent = db.Column(db.DateTime, default=db.func.current_timestamp())
    status = db.Column(db.String(20), default="sent")
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    patient = db.relationship(
        "Patient", backref=db.backref("communications", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "type": self.type,
            "subject": self.subject,
            "message": self.message,
            "date_sent": str(self.date_sent),
            "status": self.status,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
