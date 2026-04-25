import { useMemo, useState } from 'react';
import FormModal from './FormModal';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('ar-EG')} ر.س`;
}

const STATUS_MAP = {
  paid:    { label: 'مدفوع',      cls: 'cs-badge-success' },
  unpaid:  { label: 'غير مدفوع', cls: 'cs-badge-danger' },
  partial: { label: 'جزئي',      cls: 'cs-badge-warning' },
};

const BILL_FIELDS = [
  { name: 'total_amount', label: 'الإجمالي (ر.س)',     type: 'number', required: true,  placeholder: '0.00' },
  { name: 'paid_amount',  label: 'المدفوع (ر.س)',      type: 'number', required: false, placeholder: '0.00', defaultValue: '0' },
  { name: 'due_date',     label: 'تاريخ الاستحقاق',    type: 'date',   required: true  },
  {
    name: 'status', label: 'الحالة', type: 'select', required: false,
    options: [
      { value: 'unpaid',  label: 'غير مدفوع' },
      { value: 'partial', label: 'جزئي' },
      { value: 'paid',    label: 'مدفوع' },
    ],
  },
];

export default function BillingTab({ bills, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const summary = useMemo(() => {
    const total   = bills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const paid    = bills.reduce((s, b) => s + Number(b.paid_amount  || 0), 0);
    const balance = total - paid;
    return { total, paid, balance };
  }, [bills]);

  const paidPct = summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0;

  const handleAdd = async (data) => {
    if (!onAdd) return;
    setSaving(true);
    try {
      await onAdd({ ...data, status: data.status || 'unpaid' });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cs-billing-tab">
      {/* Summary Cards */}
      <div className="cs-billing-summary">
        <div className="cs-billing-summary-card cs-billing-total">
          <div className="cs-billing-sc-label">إجمالي الفواتير</div>
          <div className="cs-billing-sc-value">{formatCurrency(summary.total)}</div>
          <div className="cs-billing-sc-count">{bills.length} فاتورة</div>
        </div>
        <div className="cs-billing-summary-card cs-billing-paid">
          <div className="cs-billing-sc-label">إجمالي المدفوع</div>
          <div className="cs-billing-sc-value cs-val-success">{formatCurrency(summary.paid)}</div>
          <div className="cs-billing-progress">
            <div className="cs-progress-bar">
              <div className="cs-progress-fill cs-progress-success" style={{ width: `${paidPct}%` }} />
            </div>
            <span>{paidPct}%</span>
          </div>
        </div>
        <div className="cs-billing-summary-card cs-billing-balance">
          <div className="cs-billing-sc-label">الرصيد المستحق</div>
          <div className={`cs-billing-sc-value ${summary.balance > 0 ? 'cs-val-danger' : 'cs-val-success'}`}>
            {formatCurrency(summary.balance)}
          </div>
          {summary.balance === 0 && <div className="cs-billing-paid-tag">✅ تم السداد الكامل</div>}
        </div>
      </div>

      {/* Toolbar */}
      {onAdd && (
        <div className="cs-tab-toolbar" style={{ marginBottom: '16px' }}>
          <div className="cs-tab-toolbar-info">
            <span className="cs-toolbar-count">{bills.length}</span> فاتورة
          </div>
          <button
            className="cs-btn-primary"
            onClick={() => setShowModal(true)}
            id="add-bill-btn"
          >
            + إضافة فاتورة
          </button>
        </div>
      )}

      {/* Bills Table */}
      {bills.length === 0 ? (
        <div className="cs-empty-full">
          <div className="cs-empty-icon">💰</div>
          <div className="cs-empty-title">لا توجد فواتير</div>
          <div className="cs-empty-sub">لم يتم إنشاء أي فاتورة لهذا المريض بعد</div>
          {onAdd && (
            <button className="cs-btn-primary" onClick={() => setShowModal(true)}>
              + إضافة فاتورة
            </button>
          )}
        </div>
      ) : (
        <div className="cs-data-table-wrap">
          <table className="cs-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>الرصيد</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {[...bills]
                .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
                .map((b, idx) => {
                  const cfg = STATUS_MAP[b.status] || { label: b.status, cls: 'cs-badge-muted' };
                  const bal = Number(b.total_amount || 0) - Number(b.paid_amount || 0);
                  return (
                    <tr key={b.id} className="cs-table-row" style={{ animationDelay: `${idx * 40}ms` }}>
                      <td className="cs-table-id">#{b.id}</td>
                      <td>{formatCurrency(b.total_amount)}</td>
                      <td className="cs-table-cost cs-val-success">{formatCurrency(b.paid_amount)}</td>
                      <td className={bal > 0 ? 'cs-val-danger' : 'cs-val-success'}>{formatCurrency(bal)}</td>
                      <td className="cs-table-date">{formatDate(b.due_date)}</td>
                      <td><span className={`cs-badge ${cfg.cls}`}>{cfg.label}</span></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <FormModal
          title="إضافة فاتورة جديدة"
          icon="💰"
          fields={BILL_FIELDS}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
