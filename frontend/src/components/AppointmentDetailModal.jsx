import DetailModal from './DetailModal.jsx';

const statusOptions = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' }
];

const statusRender = s => {
  const texts = { scheduled: 'مجدول', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' };
  const badges = { scheduled: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
  return <span className={`badge ${badges[s] || 'badge-ghost'}`}>{texts[s] || s}</span>;
};

const timeRender = (start, end) => `${start} — ${end}`;

const fields = [
  { name: 'patient_id', label: 'معرف المريض', type: 'text', placeholder: 'رقم معرف المريض', showInView: true, render: id => `#${id}` },
  { name: 'appointment_date', label: 'تاريخ الموعد', type: 'date', showInView: true },
  { name: 'start_time', label: 'وقت البداية', type: 'time', showInView: false },
  { name: 'end_time', label: 'وقت النهاية', type: 'time', showInView: false },
  { name: 'dentist_id', label: 'معرف الطبيب', type: 'text', placeholder: 'رقم معرف الطبيب', showInView: true, render: id => id ? `#${id}` : '—' },
  { name: 'status', label: 'الحالة', type: 'select', options: statusOptions, showInView: true, render: statusRender },
  { name: 'notes', label: 'ملاحظات', type: 'textarea', placeholder: 'أضف ملاحظات...', rows: 3, full: true, showInView: true }
];

const AppointmentDetailModal = ({ appointment, onClose, onUpdate }) => (
  <DetailModal
    entity={appointment}
    fields={fields}
    title="الموعد"
    icon="📅"
    endpoint="/appointments"
    onClose={onClose}
    onUpdate={onUpdate}
  />
);

export default AppointmentDetailModal;