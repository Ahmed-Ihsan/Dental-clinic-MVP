import { useMemo } from 'react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('ar-EG')} IQD`;
}

function StatusBadge({ status }) {
  const map = {
    scheduled: { label: 'مجدول', cls: 'cs-badge-info' },
    completed:  { label: 'مكتمل', cls: 'cs-badge-success' },
    cancelled:  { label: 'ملغي',  cls: 'cs-badge-danger' },
    'no-show':  { label: 'غائب',  cls: 'cs-badge-warning' },
    pending:    { label: 'معلق',  cls: 'cs-badge-warning' },
    paid:       { label: 'مدفوع', cls: 'cs-badge-success' },
    unpaid:     { label: 'غير مدفوع', cls: 'cs-badge-danger' },
    partial:    { label: 'جزئي', cls: 'cs-badge-warning' },
  };
  const cfg = map[status] || { label: status, cls: 'cs-badge-muted' };
  return <span className={`cs-badge ${cfg.cls}`}>{cfg.label}</span>;
}

export default function OverviewTab({ patient, treatments, appointments, bills }) {
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return [...(appointments || [])]
      .filter(a => new Date(a.appointment_date) >= now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];
  }, [appointments]);

  const lastTreatment = useMemo(() => {
    return [...(treatments || [])]
      .sort((a, b) => new Date(b.treatment_date) - new Date(a.treatment_date))[0];
  }, [treatments]);

  const billingsSummary = useMemo(() => {
    const total = bills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const paid  = bills.reduce((s, b) => s + Number(b.paid_amount  || 0), 0);
    return { total, paid, balance: total - paid };
  }, [bills]);

  return (
    <div className="cs-overview">
      {/* Summary KPIs */}
      <div className="cs-overview-kpis">
        <div className="cs-kpi-card cs-kpi-teal">
          <div className="cs-kpi-icon">📅</div>
          <div className="cs-kpi-body">
            <div className="cs-kpi-label">القادم الأقرب</div>
            <div className="cs-kpi-value">
              {nextAppointment ? formatDate(nextAppointment.appointment_date) : 'لا يوجد'}
            </div>
            {nextAppointment && (
              <div className="cs-kpi-sub">{nextAppointment.start_time} — {nextAppointment.end_time}</div>
            )}
          </div>
        </div>

        <div className="cs-kpi-card cs-kpi-rose">
          <div className="cs-kpi-icon">💳</div>
          <div className="cs-kpi-body">
            <div className="cs-kpi-label">الرصيد المستحق</div>
            <div className="cs-kpi-value cs-kpi-value-danger">{formatCurrency(billingsSummary.balance)}</div>
            <div className="cs-kpi-sub">من إجمالي {formatCurrency(billingsSummary.total)}</div>
          </div>
        </div>

        <div className="cs-kpi-card cs-kpi-emerald">
          <div className="cs-kpi-icon">✅</div>
          <div className="cs-kpi-body">
            <div className="cs-kpi-label">إجمالي المدفوع</div>
            <div className="cs-kpi-value cs-kpi-value-success">{formatCurrency(billingsSummary.paid)}</div>
            <div className="cs-kpi-sub">{bills.length} فاتورة</div>
          </div>
        </div>

        <div className="cs-kpi-card cs-kpi-violet">
          <div className="cs-kpi-icon">🦷</div>
          <div className="cs-kpi-body">
            <div className="cs-kpi-label">آخر علاج</div>
            <div className="cs-kpi-value">
              {lastTreatment ? lastTreatment.treatment_type : 'لا يوجد'}
            </div>
            {lastTreatment && (
              <div className="cs-kpi-sub">{formatDate(lastTreatment.treatment_date)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Two columns: recent appointments + recent bills */}
      <div className="cs-overview-cols">
        <div className="cs-overview-col-card">
          <div className="cs-col-card-header">
            <span className="cs-col-card-title">📅 آخر المواعيد</span>
          </div>
          <div className="cs-col-card-body">
            {appointments.length === 0 ? (
              <div className="cs-empty-state">لا توجد مواعيد مسجلة</div>
            ) : (
              appointments.slice(0, 4).map(a => (
                <div key={a.id} className="cs-overview-row">
                  <div className="cs-overview-row-left">
                    <div className="cs-overview-row-title">{formatDate(a.appointment_date)}</div>
                    <div className="cs-overview-row-sub">{a.start_time} — {a.end_time}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cs-overview-col-card">
          <div className="cs-col-card-header">
            <span className="cs-col-card-title">💰 آخر الفواتير</span>
          </div>
          <div className="cs-col-card-body">
            {bills.length === 0 ? (
              <div className="cs-empty-state">لا توجد فواتير مسجلة</div>
            ) : (
              bills.slice(0, 4).map(b => (
                <div key={b.id} className="cs-overview-row">
                  <div className="cs-overview-row-left">
                    <div className="cs-overview-row-title">{formatCurrency(b.total_amount)}</div>
                    <div className="cs-overview-row-sub">استحقاق: {formatDate(b.due_date)}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
