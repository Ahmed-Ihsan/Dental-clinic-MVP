from database import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

VALID_ROLES = ['admin', 'doctor', 'secretary']


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id           = db.Column(db.Integer, primary_key=True)
    username     = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role         = db.Column(db.String(20), nullable=False, default='doctor')
    created_at   = db.Column(db.DateTime, default=db.func.current_timestamp())

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id':         self.id,
            'username':   self.username,
            'role':       self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
