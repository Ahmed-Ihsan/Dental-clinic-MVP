from flask import Blueprint, jsonify, request
from sqlalchemy import func
from models import Treatment, Bill, Patient, Appointment
from database import db
from datetime import datetime, timedelta, date, time

revenue_bp = Blueprint("revenue", __name__)


def calc_trend(current, previous):
    if previous == 0:
        return "+0%", True
    pct = ((current - previous) / previous) * 100
    return f"{'+' if pct >= 0 else ''}{pct:.1f}%", pct >= 0


def _eff_date():
    """Effective date expression: treatment date if linked, else Bill.created_at date."""
    return func.coalesce(Treatment.treatment_date, func.date(Bill.created_at))


def _apply_date_filter(query, start_date, end_date_filter):
    eff = _eff_date()
    if start_date:
        query = query.filter(eff >= start_date)
    if end_date_filter:
        query = query.filter(eff < end_date_filter)
    return query


@revenue_bp.route("/api/revenue/quick-payment", methods=["POST"])
def quick_payment():
    data = request.get_json()

    patient_id     = data.get("patient_id")
    treatment_type = (data.get("treatment_type") or "").strip()
    total_cost     = float(data.get("total_cost")  or 0)
    paid_amount    = float(data.get("paid_amount") or 0)

    if not patient_id:
        return jsonify({"error": "معرّف المريض مطلوب"}), 400
    if not treatment_type:
        return jsonify({"error": "فئة العلاج مطلوبة"}), 400
    if total_cost <= 0:
        return jsonify({"error": "التكلفة الإجمالية يجب أن تكون أكبر من صفر"}), 400
    if paid_amount < 0 or paid_amount > total_cost:
        return jsonify({"error": "المبلغ المدفوع غير صالح"}), 400

    if not Patient.query.get(patient_id):
        return jsonify({"error": "المريض غير موجود"}), 404

    today = date.today()

    # 1 ── Create a completed appointment (the shared link between Treatment & Bill)
    appt = Appointment(
        patient_id=patient_id,
        appointment_date=today,
        start_time=time(9, 0),
        end_time=time(9, 30),
        status="completed",
        notes="إيراد سريع",
    )
    db.session.add(appt)
    db.session.flush()          # get appt.id before commit

    # 2 ── Create treatment with the correct category → drives revenue categorisation
    treatment = Treatment(
        patient_id=patient_id,
        appointment_id=appt.id,
        treatment_type=treatment_type,
        cost=total_cost,
        treatment_date=today,
        notes="إيراد سريع",
    )
    db.session.add(treatment)

    # 3 ── Create bill linked to the same appointment_id
    balance = max(0.0, total_cost - paid_amount)
    if paid_amount <= 0:
        status = "unpaid"
    elif balance <= 0:
        status = "paid"
    else:
        status = "partial"

    bill = Bill(
        patient_id=patient_id,
        appointment_id=appt.id,
        total_amount=total_cost,
        paid_amount=paid_amount,
        discount_amount=0.0,
        direct_cost=total_cost,
        balance=balance,
        status=status,
    )
    db.session.add(bill)
    db.session.commit()

    return jsonify({
        "appointment_id": appt.id,
        "treatment_id":   treatment.id,
        "bill_id":        bill.id,
        "message":        "تم تسجيل الإيراد بنجاح",
    }), 201


@revenue_bp.route("/api/revenue/summary", methods=["GET"])
def get_revenue_summary():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    end_date_filter = None
    if end_date:
        end_date_filter = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)).date().isoformat()

    prev_start = prev_end = None
    if start_date and end_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        delta = end_dt - start_dt
        prev_start = (start_dt - delta).date().isoformat()
        prev_end = (start_dt - timedelta(days=1)).date().isoformat()

    # LEFT JOIN: all Bills appear regardless of whether they have a linked Treatment
    def base_q():
        return db.session.query(
            Bill.paid_amount,
            Bill.balance,
            Bill.direct_cost,
        ).outerjoin(Treatment, Treatment.appointment_id == Bill.appointment_id)

    rows = _apply_date_filter(base_q(), start_date, end_date_filter).all()

    prev_agg = _apply_date_filter(
        db.session.query(
            func.sum(Bill.paid_amount).label("total_paid"),
            func.sum(Bill.balance).label("total_balance"),
            func.sum(Bill.direct_cost).label("total_cost"),
        ).outerjoin(Treatment, Treatment.appointment_id == Bill.appointment_id),
        prev_start, prev_end
    ).first()

    prev_paid    = prev_agg.total_paid    or 0
    prev_balance = prev_agg.total_balance or 0
    prev_cost    = prev_agg.total_cost    or 0
    prev_net     = prev_paid - prev_cost

    total_paid        = sum((r.paid_amount  or 0) for r in rows)
    total_balance     = sum((r.balance      or 0) for r in rows)
    total_direct_cost = sum((r.direct_cost  or 0) for r in rows)
    total_revenue     = total_paid + total_balance
    total_net         = total_paid - total_direct_cost

    trend_paid,    trend_paid_up    = calc_trend(total_paid,    prev_paid)
    trend_balance, trend_balance_up = calc_trend(total_balance, prev_balance)
    trend_net,     trend_net_up     = calc_trend(total_net,     prev_net)

    margin      = (total_net / total_revenue * 100)           if total_revenue > 0                  else 0
    prev_margin = (prev_net  / (prev_paid + prev_balance) * 100) if (prev_paid + prev_balance) > 0 else 0
    trend_margin, trend_margin_up = calc_trend(margin, prev_margin)

    return jsonify({
        "total_revenue": total_revenue,
        "total_paid": total_paid,
        "total_balance": total_balance,
        "total_direct_cost": total_direct_cost,
        "total_net_profit": total_net,
        "profit_margin_percent": round(margin, 1),
        "cases_count": len(rows),
        "trends": {
            "paid":       {"value": trend_paid,    "up": trend_paid_up},
            "balance":    {"value": trend_balance, "up": trend_balance_up},
            "net_profit": {"value": trend_net,     "up": trend_net_up},
            "margin":     {"value": trend_margin,  "up": trend_margin_up},
        }
    })


@revenue_bp.route("/api/revenue/categories", methods=["GET"])
def get_revenue_categories():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    end_date_filter = None
    if end_date:
        end_date_filter = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)).date().isoformat()

    prev_start = prev_end = None
    if start_date and end_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt   = datetime.strptime(end_date,   "%Y-%m-%d")
        delta    = end_dt - start_dt
        prev_start = (start_dt - delta).date().isoformat()
        prev_end   = (start_dt - timedelta(days=1)).date().isoformat()

    # Group by treatment_type; bills with no treatment fall into 'خدمات أخرى'
    type_col = func.coalesce(Treatment.treatment_type, "خدمات أخرى")

    query = db.session.query(
        type_col.label("treatment_type"),
        func.count(Bill.id).label("cases_count"),
        func.sum(Bill.paid_amount).label("total_paid"),
        func.sum(Bill.balance).label("total_balance"),
        func.sum(Bill.direct_cost).label("direct_cost"),
    ).outerjoin(
        Treatment, Treatment.appointment_id == Bill.appointment_id
    )

    query = _apply_date_filter(query, start_date, end_date_filter)
    query = query.group_by(type_col)
    results = query.all()

    icon_map = {
        "تقويم الأسنان": "🦷",
        "زراعة الأسنان": "🔩",
        "علاج العصب": "🩺",
        "تبييض الأسنان": "✨",
        "تركيبات وتيجان": "👑",
        "طب الأسنان العام": "🏥",
        "جراحة الأسنان": "🔪",
        "طب أسنان الأطفال": "🧒",
        "خدمات أخرى": "📋",
    }

    categories = []
    for result in results:
        category_name = result.treatment_type
        total_paid    = result.total_paid    or 0
        total_balance = result.total_balance or 0
        direct_cost   = result.direct_cost   or 0
        net_profit    = total_paid - direct_cost
        margin        = (net_profit / (total_paid + total_balance) * 100) if (total_paid + total_balance) > 0 else 0

        prev_q = db.session.query(
            func.sum(Bill.paid_amount).label("prev_paid"),
            func.sum(Bill.direct_cost).label("prev_cost"),
        ).outerjoin(
            Treatment, Treatment.appointment_id == Bill.appointment_id
        ).filter(
            func.coalesce(Treatment.treatment_type, "خدمات أخرى") == category_name
        )
        prev_q   = _apply_date_filter(prev_q, prev_start, prev_end)
        prev_row = prev_q.first()
        prev_net = (prev_row.prev_paid or 0) - (prev_row.prev_cost or 0)

        trend_str, trend_up = calc_trend(net_profit, prev_net)

        categories.append({
            "category_id":            f"CAT-{len(categories) + 1}",
            "category_name":          category_name,
            "category_icon":          icon_map.get(category_name, "🦷"),
            "cases_count":            result.cases_count,
            "total_payments":         total_paid,
            "total_debts":            total_balance,
            "direct_cost":            direct_cost,
            "profit_margin_percent":  round(margin, 1),
            "net_profit":             net_profit,
            "trend":                  trend_str,
            "trend_up":               trend_up,
        })

    return jsonify(categories)


@revenue_bp.route("/api/revenue/payments", methods=["GET"])
def get_revenue_payments():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    end_date_filter = None
    if end_date:
        end_date_filter = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)).date().isoformat()

    # Base: all Bills, joined to Patient (required) and Treatment (optional)
    query = db.session.query(Bill, Patient, Treatment).join(
        Patient, Bill.patient_id == Patient.id
    ).outerjoin(
        Treatment, Treatment.appointment_id == Bill.appointment_id
    )

    query = _apply_date_filter(query, start_date, end_date_filter)
    query = query.order_by(Bill.created_at.desc())
    results = query.all()

    # De-duplicate: when one bill has multiple treatments, take the first match only
    seen_bill_ids = set()
    payments = []
    for bill, patient, treatment in results:
        if bill.id in seen_bill_ids:
            continue
        seen_bill_ids.add(bill.id)

        patient_name = f"{patient.first_name} {patient.last_name}"
        date = (
            treatment.treatment_date.isoformat()
            if treatment and treatment.treatment_date
            else (bill.created_at.date().isoformat() if bill.created_at else "—")
        )
        category        = treatment.treatment_type if treatment else "خدمات أخرى"
        treatment_desc  = treatment.treatment_type if treatment else "فاتورة عيادة"
        amount_received = bill.paid_amount or 0   # actual amount paid, not 0 for partial

        payments.append({
            "receipt_id":      f"BILL-{bill.id}",
            "date":            date,
            "patient_name":    patient_name,
            "category":        category,
            "treatment":       treatment_desc,
            "amount_received": amount_received,
            "payment_method":  "كاش",
        })

    return jsonify(payments)