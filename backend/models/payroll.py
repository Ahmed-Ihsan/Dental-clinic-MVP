from database import db
from datetime import datetime


class Payroll(db.Model):
    __tablename__ = "payrolls"

    id = db.Column(db.Integer, primary_key=True)
    payroll_period = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM
    professional_id = db.Column(
        db.Integer, db.ForeignKey("professionals.id"), nullable=False
    )
    salary_id = db.Column(db.Integer, db.ForeignKey("salaries.id"), nullable=False)

    # Salary breakdown
    base_salary = db.Column(db.Float, nullable=False)
    total_allowances = db.Column(db.Float, default=0.0)
    total_deductions = db.Column(db.Float, default=0.0)
    gross_salary = db.Column(db.Float, nullable=False)
    net_salary = db.Column(db.Float, nullable=False)

    # Payroll details
    working_days = db.Column(db.Integer, default=30)
    actual_days_worked = db.Column(db.Integer, default=30)
    overtime_hours = db.Column(db.Float, default=0.0)
    overtime_rate = db.Column(db.Float, default=0.0)
    overtime_amount = db.Column(db.Float, default=0.0)

    # Tax calculations
    tax_amount = db.Column(db.Float, default=0.0)
    social_insurance = db.Column(db.Float, default=0.0)

    # Status and processing
    status = db.Column(
        db.String(20), default="draft"
    )  # draft, processed, paid, cancelled
    processed_date = db.Column(db.DateTime)
    payment_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    professional = db.relationship(
        "Professional", backref=db.backref("payrolls", lazy=True)
    )
    salary = db.relationship("Salary", backref=db.backref("payrolls", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "payroll_period": self.payroll_period,
            "professional_id": self.professional_id,
            "professional": {
                "id": self.professional.id,
                "first_name": self.professional.first_name,
                "last_name": self.professional.last_name,
                "specialty": self.professional.specialty,
            }
            if self.professional
            else None,
            "salary_id": self.salary_id,
            "base_salary": self.base_salary,
            "total_allowances": self.total_allowances,
            "total_deductions": self.total_deductions,
            "gross_salary": self.gross_salary,
            "net_salary": self.net_salary,
            "working_days": self.working_days,
            "actual_days_worked": self.actual_days_worked,
            "overtime_hours": self.overtime_hours,
            "overtime_rate": self.overtime_rate,
            "overtime_amount": self.overtime_amount,
            "tax_amount": self.tax_amount,
            "social_insurance": self.social_insurance,
            "status": self.status,
            "processed_date": str(self.processed_date) if self.processed_date else None,
            "payment_date": str(self.payment_date) if self.payment_date else None,
            "notes": self.notes,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }

    @staticmethod
    def get_payroll_period(year=None, month=None):
        """Generate payroll period string in YYYY-MM format"""
        if year and month:
            return f"{year:04d}-{month:02d}"
        now = datetime.now()
        return f"{now.year:04d}-{now.month:02d}"
