from database import db


class SalaryPayment(db.Model):
    __tablename__ = "salary_payments"

    id = db.Column(db.Integer, primary_key=True)
    payroll_id = db.Column(db.Integer, db.ForeignKey("payrolls.id"), nullable=False)
    professional_id = db.Column(
        db.Integer, db.ForeignKey("professionals.id"), nullable=False
    )

    # Payment details
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(
        db.String(20), nullable=False
    )  # bank_transfer, cash, check
    payment_date = db.Column(db.Date, nullable=False)
    reference_number = db.Column(db.String(100))  # Bank reference, check number, etc.
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(50))

    # Status and tracking
    status = db.Column(
        db.String(20), default="completed"
    )  # pending, completed, failed, cancelled
    transaction_id = db.Column(db.String(100))  # External payment system reference
    notes = db.Column(db.Text)

    # Audit fields
    processed_by = db.Column(db.String(100))  # User who processed the payment
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    payroll = db.relationship("Payroll", backref=db.backref("payments", lazy=True))
    professional = db.relationship(
        "Professional", backref=db.backref("salary_payments", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "payroll_id": self.payroll_id,
            "professional_id": self.professional_id,
            "professional": {
                "id": self.professional.id,
                "first_name": self.professional.first_name,
                "last_name": self.professional.last_name,
                "specialty": self.professional.specialty,
            }
            if self.professional
            else None,
            "amount": self.amount,
            "payment_method": self.payment_method,
            "payment_date": str(self.payment_date),
            "reference_number": self.reference_number,
            "bank_name": self.bank_name,
            "account_number": self.account_number,
            "status": self.status,
            "transaction_id": self.transaction_id,
            "notes": self.notes,
            "processed_by": self.processed_by,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
