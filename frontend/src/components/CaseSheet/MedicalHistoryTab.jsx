import { useState } from 'react';
import FormModal from './FormModal';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

const HISTORY_FIELDS = [
  { name: 'condition',       label: 'الحالة / التشخيص',  type: 'text',     required: true,  placeholder: 'مثال: حساسية من البنسلين، سكري...' },
  { name: 'diagnosis_date',  label: 'تاريخ التشخيص',    type: 'date',     required: true },
  { name: 'notes',           label: 'ملاحظات الطبيب',   type: 'textarea', required: false, placeholder: 'ملاحظات إضافية...' },
];

export default function MedicalHistoryTab({ medicalHistory, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (formData) => {
    setSaving(true);
    try {
      await onAdd(formData);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا السجل؟')) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="cs-history-tab">
      <div className="cs-tab-toolbar">
        <div className="cs-tab-toolbar-info">
          <span className="cs-toolbar-count">{medicalHistory.length}</span> سجل طبي
        </div>
        <button
          className="cs-btn-primary"
          onClick={() => setShowModal(true)}
          id="add-medical-history-btn"
        >
          + إضافة سجل طبي
        </button>
      </div>

      {medicalHistory.length === 0 ? (
        <div className="cs-empty-full">
          <div className="cs-empty-icon">🩺</div>
          <div className="cs-empty-title">لا يوجد تاريخ طبي</div>
          <div className="cs-empty-sub">أضف السجل الطبي الأول للمريض</div>
          <button className="cs-btn-primary" onClick={() => setShowModal(true)}>+ إضافة سجل</button>
        </div>
      ) : (
        <div className="cs-timeline">
          {[...medicalHistory]
            .sort((a, b) => new Date(b.diagnosis_date) - new Date(a.diagnosis_date))
            .map((record, idx) => (
              <div key={record.id} className="cs-timeline-item" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="cs-timeline-dot" />
                <div className="cs-timeline-line" />
                <div className="cs-timeline-card">
                  <div className="cs-timeline-card-header">
                    <div className="cs-timeline-condition">{record.condition}</div>
                    <div className="cs-timeline-actions">
                      <span className="cs-timeline-date">📅 {formatDate(record.diagnosis_date)}</span>
                      <button
                        className="cs-icon-btn cs-icon-btn-danger"
                        onClick={() => handleDelete(record.id)}
                        disabled={deleting === record.id}
                        title="حذف"
                      >
                        {deleting === record.id ? '⟳' : '🗑'}
                      </button>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="cs-timeline-notes">
                      <span className="cs-notes-label">ملاحظات:</span> {record.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <FormModal
          title="إضافة سجل طبي جديد"
          icon="🩺"
          fields={HISTORY_FIELDS}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
