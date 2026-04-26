import { useState } from 'react';
import FormModal from './FormModal';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(n) {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('ar-EG')} IQD`;
}

const TREATMENT_FIELDS = [
  { name: 'treatment_type',  label: 'نوع العلاج',     type: 'text',     required: true,  placeholder: 'مثال: حشو، تاج، تنظيف...' },
  { name: 'cost',            label: 'التكلفة (IQD)', type: 'number',   required: true,  placeholder: '0.00' },
  { name: 'treatment_date',  label: 'تاريخ العلاج',   type: 'date',     required: true },
  { name: 'notes',           label: 'ملاحظات',        type: 'textarea', required: false, placeholder: 'تفاصيل إضافية...' },
];

export default function TreatmentsTab({ treatments, onAdd, onDelete }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await onAdd(data);
      setShowDrawer(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا العلاج؟')) return;
    setDeleting(id);
    try { await onDelete(id); }
    finally { setDeleting(null); }
  };

  const totalCost = treatments.reduce((s, t) => s + Number(t.cost || 0), 0);

  return (
    <div className="cs-treatments-tab">
      <div className="cs-tab-toolbar">
        <div className="cs-tab-toolbar-info">
          <span className="cs-toolbar-count">{treatments.length}</span> علاج ·
          <span className="cs-toolbar-cost"> إجمالي {formatCurrency(totalCost)}</span>
        </div>
        <button
          className="cs-btn-primary"
          onClick={() => setShowDrawer(true)}
          id="add-treatment-btn"
        >
          + إضافة علاج
        </button>
      </div>

      {treatments.length === 0 ? (
        <div className="cs-empty-full">
          <div className="cs-empty-icon">🦷</div>
          <div className="cs-empty-title">لا توجد علاجات مسجلة</div>
          <div className="cs-empty-sub">أضف أول علاج لهذا المريض</div>
          <button className="cs-btn-primary" onClick={() => setShowDrawer(true)}>+ إضافة علاج</button>
        </div>
      ) : (
        <div className="cs-data-table-wrap">
          <table className="cs-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع العلاج</th>
                <th>التكلفة</th>
                <th>التاريخ</th>
                <th>الملاحظات</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...treatments]
                .sort((a, b) => new Date(b.treatment_date) - new Date(a.treatment_date))
                .map((t, idx) => (
                  <tr key={t.id} className="cs-table-row" style={{ animationDelay: `${idx * 40}ms` }}>
                    <td className="cs-table-id">#{t.id}</td>
                    <td>
                      <span className="cs-treatment-type-badge">{t.treatment_type}</span>
                    </td>
                    <td className="cs-table-cost">{formatCurrency(t.cost)}</td>
                    <td className="cs-table-date">{formatDate(t.treatment_date)}</td>
                    <td className="cs-table-notes">{t.notes || <span className="cs-no-notes">—</span>}</td>
                    <td>
                      <button
                        className="cs-icon-btn cs-icon-btn-danger"
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        title="حذف"
                      >
                        {deleting === t.id ? '⟳' : '🗑'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showDrawer && (
        <FormModal
          title="إضافة علاج جديد"
          icon="🦷"
          fields={TREATMENT_FIELDS}
          onSubmit={handleAdd}
          onClose={() => setShowDrawer(false)}
          saving={saving}
          isDrawer
        />
      )}
    </div>
  );
}
