from database import db


class PaymentInstallment(db.Model):
    __tablename__ = "payment_installments"

    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(
        db.Integer, db.ForeignKey("professionals.id"), nullable=False
    )
    installment_type = db.Column(
        db.String(20), nullable=False
    )  # loan_repayment, salary_installment, bonus_schedule, deduction_schedule
    title = db.Column(db.String(100), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    installment_amount = db.Column(db.Float, nullable=False)
    total_installments = db.Column(db.Integer, nullable=False)
    completed_installments = db.Column(db.Integer, default=0)
    remaining_amount = db.Column(db.Float, nullable=False)

    # Schedule settings
    frequency = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    start_date = db.Column(db.Date, nullable=False)
    next_due_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)

    # Payment details
    payment_method = db.Column(
        db.String(20), nullable=False
    )  # bank_transfer, cash, check
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(50))
    reference_info = db.Column(db.String(200))  # Additional payment reference

    # Status and tracking
    status = db.Column(
        db.String(20), default="active"
    )  # active, completed, paused, cancelled
    auto_process = db.Column(
        db.Boolean, default=False
    )  # Automatically process installments
    priority = db.Column(db.String(20), default="normal")  # high, normal, low

    # Description and notes
    description = db.Column(db.Text)
    notes = db.Column(db.Text)

    # Audit fields
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships
    professional = db.relationship(
        "Professional", backref=db.backref("payment_installments", lazy=True)
    )
    payments = db.relationship(
        "InstallmentPayment",
        backref="payment_installment",
        lazy=True,
        cascade="all, delete-orphan",
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
            "installment_type": self.installment_type,
            "title": self.title,
            "total_amount": self.total_amount,
            "installment_amount": self.installment_amount,
            "total_installments": self.total_installments,
            "completed_installments": self.completed_installments,
            "remaining_amount": self.remaining_amount,
            "frequency": self.frequency,
            "start_date": str(self.start_date),
            "next_due_date": str(self.next_due_date),
            "end_date": str(self.end_date) if self.end_date else None,
            "payment_method": self.payment_method,
            "bank_name": self.bank_name,
            "account_number": self.account_number,
            "reference_info": self.reference_info,
            "status": self.status,
            "auto_process": self.auto_process,
            "priority": self.priority,
            "description": self.description,
            "notes": self.notes,
            "created_by": self.created_by,
            "progress_percentage": (
                self.completed_installments / self.total_installments * 100
            )
            if self.total_installments > 0
            else 0,
            "remaining_installments": self.total_installments
            - self.completed_installments,
            "created_at": str(self.created_at),
            "updated_at": str(self.updated_at),
        }

    def calculate_next_due_date(self, from_date=None):
        """Calculate the next due date based on frequency"""
        base_date = from_date or self.next_due_date or self.start_date

        if self.frequency == "daily":
            # Next business day (skip weekends)
            next_date = base_date
            while True:
                next_date = next_date.replace(day=next_date.day + 1)
                if next_date.weekday() < 5:  # Monday to Friday
                    break
        elif self.frequency == "weekly":
            # Next week same day
            next_date = base_date.replace(day=base_date.day + 7)
        elif self.frequency == "monthly":
            # Next month same day, handle month overflow
            try:
                if base_date.month == 12:
                    next_date = base_date.replace(year=base_date.year + 1, month=1)
                else:
                    next_date = base_date.replace(month=base_date.month + 1)
            except ValueError:
                # Handle months with fewer days (e.g., Jan 31 -> Feb 28/29)
                if base_date.month == 12:
                    next_date = base_date.replace(
                        year=base_date.year + 1, month=1, day=28
                    )
                else:
                    next_month = base_date.replace(month=base_date.month + 1, day=1)
                    last_day = (
                        next_month.replace(month=next_month.month + 1, day=1)
                        - datetime.timedelta(days=1)
                    ).day
                    next_date = base_date.replace(
                        month=base_date.month + 1, day=min(base_date.day, last_day)
                    )
        else:
            next_date = base_date

        return next_date

    def is_overdue(self):
        """Check if the installment is overdue"""
        from datetime import date

        return self.status == "active" and self.next_due_date < date.today()

    def mark_payment_completed(self):
        """Mark a payment as completed and update next due date"""
        self.completed_installments += 1
        self.remaining_amount -= self.installment_amount

        if self.completed_installments >= self.total_installments:
            self.status = "completed"
            self.next_due_date = None
            self.end_date = datetime.date.today()
        else:
            self.next_due_date = self.calculate_next_due_date()

    @staticmethod
    def get_installment_type_label(installment_type):
        """Get Arabic label for installment type"""
        labels = {
            "loan_repayment": "سداد قرض",
            "salary_installment": "دفعة راتب",
            "bonus_schedule": "جدولة مكافأة",
            "deduction_schedule": "جدولة خصم",
            "advance_repayment": "سداد سلفة",
        }
        return labels.get(installment_type, installment_type)

    @staticmethod
    def get_frequency_label(frequency):
        """Get Arabic label for frequency"""
        labels = {"daily": "يومي", "weekly": "أسبوعي", "monthly": "شهري"}
        return labels.get(frequency, frequency)
