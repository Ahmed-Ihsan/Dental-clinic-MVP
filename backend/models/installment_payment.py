from database import db


class InstallmentPayment(db.Model):
    __tablename__ = "installment_payments"

    id = db.Column(db.Integer, primary_key=True)
    installment_id = db.Column(
        db.Integer, db.ForeignKey("payment_installments.id"), nullable=False
    )
    professional_id = db.Column(
        db.Integer, db.ForeignKey("professionals.id"), nullable=False
    )

    # Payment details
    installment_number = db.Column(
        db.Integer, nullable=False
    )  # Which installment this is (1, 2, 3...)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)

    # Payment method and reference
    payment_method = db.Column(db.String(20), nullable=False)
    reference_number = db.Column(db.String(100))
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))

    # Status and tracking
    status = db.Column(
        db.String(20), default="completed"
    )  # pending, completed, failed, cancelled
    is_overdue = db.Column(db.Boolean, default=False)
    days_overdue = db.Column(db.Integer, default=0)

    # Notes and audit
    notes = db.Column(db.Text)
    processed_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    # Note: installment relationship is handled by backref from PaymentInstallment model
    professional = db.relationship(
        "Professional", backref=db.backref("installment_payments", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "installment_id": self.installment_id,
            "professional_id": self.professional_id,
            "professional": {
                "id": self.professional.id,
                "first_name": self.professional.first_name,
                "last_name": self.professional.last_name,
                "specialty": self.professional.specialty,
            }
            if self.professional
            else None,
            "installment_number": self.installment_number,
            "amount": self.amount,
            "payment_date": str(self.payment_date),
            "due_date": str(self.due_date),
            "payment_method": self.payment_method,
            "reference_number": self.reference_number,
            "bank_name": self.bank_name,
            "account_number": self.account_number,
            "transaction_id": self.transaction_id,
            "status": self.status,
            "is_overdue": self.is_overdue,
            "days_overdue": self.days_overdue,
            "notes": self.notes,
            "processed_by": self.processed_by,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }
