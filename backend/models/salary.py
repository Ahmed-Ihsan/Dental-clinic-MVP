from database import db


class Salary(db.Model):
    __tablename__ = "salaries"

    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(
        db.Integer, db.ForeignKey("professionals.id"), nullable=False
    )
    base_salary = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default="SAR")  # SAR for Saudi Riyal
    salary_type = db.Column(db.String(20), default="monthly")  # monthly, hourly, daily
    effective_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # Null for current salary
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    professional = db.relationship(
        "Professional", backref=db.backref("salaries", lazy=True)
    )
    components = db.relationship(
        "SalaryComponent", backref="salary", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "professional_id": self.professional_id,
            "professional": {
                "id": self.professional.id,
                "first_name": self.professional.first_name,
                "last_name": self.professional.last_name,
                "specialty": self.professional.specialty,
            }
            if self.professional
            else None,
            "base_salary": self.base_salary,
            "currency": self.currency,
            "salary_type": self.salary_type,
            "effective_date": str(self.effective_date),
            "end_date": str(self.end_date) if self.end_date else None,
            "is_active": self.is_active,
            "notes": self.notes,
            "total_allowances": sum(
                c.amount for c in self.components if c.component_type == "allowance"
            ),
            "total_deductions": sum(
                c.amount for c in self.components if c.component_type == "deduction"
            ),
            "net_salary": self.calculate_net_salary(),
            "components": [c.to_dict() for c in self.components],
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }

    def calculate_net_salary(self):
        """Calculate total net salary including all components"""
        allowances = sum(
            c.amount for c in self.components if c.component_type == "allowance"
        )
        deductions = sum(
            c.amount for c in self.components if c.component_type == "deduction"
        )
        return self.base_salary + allowances - deductions
