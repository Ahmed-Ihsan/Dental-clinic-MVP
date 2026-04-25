import { useState } from 'react';
import FormModal from './FormModal';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

const STATUS_MAP = {
  scheduled: { label: 'مجدول',  cls: 'cs-badge-info',    dot: '#60A5FA' },
  completed:  { label: 'مكتمل', cls: 'cs-badge-success', dot: '#34D399' },
  cancelled:  { label: 'ملغي',  cls: 'cs-badge-danger',  dot: '#F87171' },
  'no-show':  { label: 'غائب',  cls: 'cs-badge-warning', dot: '#FBBF24' },
};

const APPT_FIELDS = [
  { name: 'appointment_date', label: 'تاريخ الموعد', type: 'date',   required: true },
  { name: 'start_time',       label: 'وقت البداية', type: 'time',   required: true },
  { name: 'end_time',         label: 'وقت النهاية', type: 'time',   required: true },
  {
    name: 'status', label: 'الحالة', type: 'select', required: false,
    options: [
      { value: 'scheduled', label: 'مجدول' },
      { value: 'completed', label: 'مكتمل' },
      { value: 'cancelled', label: 'ملغي' },
      { value: 'no-show',   label: 'غائب' },
    ],
  },
  { name: 'notes', label: 'ملاحظات', type: 'textarea', required: false, placeholder: 'تفاصيل إضافية...' },
];

export default function AppointmentsTab({ appointments, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await onAdd({ ...data, status: data.status || 'scheduled' });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const upcoming = [...appointments]
    .filter(a => new Date(a.appointment_date) >= now && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  const past = [...appointments]
    .filter(a => new Date(a.appointment_date) < now || a.status === 'cancelled')
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  return (
    <div className="cs-appointments-tab">
      <div className="cs-tab-toolbar">
        <div className="cs-tab-toolbar-info">
          <span className="cs-toolbar-count">{appointments.length}</span> موعد
        </div>
        <button className="cs-btn-primary" onClick={() => setShowModal(true)} id="add-appointment-btn">
          + إضافة موعد
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="cs-empty-full">
          <div className="cs-empty-icon">📅</div>
          <div className="cs-empty-title">لا توجد مواعيد</div>
          <div className="cs-empty-sub">حدد موعداً جديداً لهذا المريض</div>
          <button className="cs-btn-primary" onClick={() => setShowModal(true)}>+ إضافة موعد</button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="cs-appt-section">
              <div className="cs-appt-section-label">
                <span className="cs-appt-section-dot cs-dot-info" />
                المواعيد القادمة ({upcoming.length})
              </div>
              <div className="cs-appt-list">
                {upcoming.map((a, i) => <AppointmentCard key={a.id} appt={a} idx={i} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="cs-appt-section">
              <div className="cs-appt-section-label">
                <span className="cs-appt-section-dot cs-dot-muted" />
                المواعيد السابقة ({past.length})
              </div>
              <div className="cs-appt-list">
                {past.map((a, i) => <AppointmentCard key={a.id} appt={a} idx={i} past />)}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <FormModal
          title="إضافة موعد جديد"
          icon="📅"
          fields={APPT_FIELDS}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}

function AppointmentCard({ appt, idx, past }) {
  const cfg = STATUS_MAP[appt.status] || { label: appt.status, cls: 'cs-badge-muted', dot: '#64748B' };
  return (
    <div
      className={`cs-appt-card ${past ? 'cs-appt-past' : 'cs-appt-upcoming'}`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="cs-appt-date-col">
        <div className="cs-appt-day">{new Date(appt.appointment_date).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' })}</div>
        <div className="cs-appt-year">{new Date(appt.appointment_date).getFullYear()}</div>
      </div>
      <div className="cs-appt-divider" style={{ background: cfg.dot }} />
      <div className="cs-appt-info">
        <div className="cs-appt-time">{appt.start_time} — {appt.end_time}</div>
        {appt.notes && <div className="cs-appt-notes">{appt.notes}</div>}
      </div>
      <div className="cs-appt-status">
        <span className={`cs-badge ${cfg.cls}`}>{cfg.label}</span>
      </div>
    </div>
  );
}
