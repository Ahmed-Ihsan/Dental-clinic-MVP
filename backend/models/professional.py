from database import db


class Professional(db.Model):
    __tablename__ = "professionals"

    id             = db.Column(db.Integer, primary_key=True)
    first_name     = db.Column(db.String(50), nullable=False)
    last_name      = db.Column(db.String(50), nullable=False)
    specialty      = db.Column(db.String(100))
    phone          = db.Column(db.String(20))
    email          = db.Column(db.String(100))
    license_number = db.Column(db.String(50))
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at     = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at     = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    user = db.relationship("User", backref=db.backref("professionals_list", uselist=True))

    def to_dict(self):
        return {
            "id":             self.id,
            "first_name":     self.first_name,
            "last_name":      self.last_name,
            "specialty":      self.specialty,
            "phone":          self.phone,
            "email":          self.email,
            "license_number": self.license_number,
            "user_id":        self.user_id,
            "created_at":     str(self.created_at),
            "updated_at":     str(self.updated_at),
        }
