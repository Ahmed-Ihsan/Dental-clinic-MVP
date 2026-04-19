from database import db


class SalaryComponent(db.Model):
    __tablename__ = "salary_components"

    id = db.Column(db.Integer, primary_key=True)
    salary_id = db.Column(db.Integer, db.ForeignKey("salaries.id"), nullable=False)
    component_type = db.Column(
        db.String(20), nullable=False
    )  # allowance, deduction, bonus
    name = db.Column(
        db.String(100), nullable=False
    )  # e.g., "Housing Allowance", "Tax Deduction", "Performance Bonus"
    amount = db.Column(db.Float, nullable=False)
    percentage = db.Column(db.Float)  # If calculated as percentage of base salary
    is_taxable = db.Column(db.Boolean, default=True)
    is_fixed = db.Column(db.Boolean, default=True)  # Fixed amount vs variable
    description = db.Column(db.Text)
    effective_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # For temporary components
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "salary_id": self.salary_id,
            "component_type": self.component_type,
            "name": self.name,
            "amount": self.amount,
            "percentage": self.percentage,
            "is_taxable": self.is_taxable,
            "is_fixed": self.is_fixed,
            "description": self.description,
            "effective_date": str(self.effective_date),
            "end_date": str(self.end_date) if self.end_date else None,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
