import DetailModal from './DetailModal.jsx';

const statusOptions = [
  { value: 'pending', label: 'معلق' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'overdue', label: 'متأخر' }
];

const statusRender = s => {
  const map = { pending: 'معلق', paid: 'مدفوع', overdue: 'متأخر' };
  const badges = { pending: 'badge-warning', paid: 'badge-info', overdue: 'badge-danger' };
  return <span className={`badge ${badges[s] || 'badge-ghost'}`}>{map[s] || s}</span>;
};

const fields = [
  { name: 'patient_id', label: 'معرف المريض', type: 'text', showInView: true },
  { name: 'appointment_id', label: 'معرف الموعد', type: 'text', showInView: true, render: id => id ? `#${id}` : '—' },
  { name: 'total_amount', label: 'المبلغ الإجمالي', type: 'number', step: '0.01', showInView: true, render: amt => `${amt?.toFixed(2)} IQD` },
  { name: 'paid_amount', label: 'المبلغ المدفوع', type: 'number', step: '0.01', showInView: true, render: amt => `${amt?.toFixed(2)} IQD` },
  { name: 'balance', label: 'المبلغ المتبقي', type: 'number', step: '0.01', showInView: true, render: amt => `${amt?.toFixed(2)} IQD` },
  { name: 'due_date', label: 'تاريخ الاستحقاق', type: 'date', showInView: true },
  { name: 'status', label: 'حالة الدفع', type: 'select', options: statusOptions, showInView: true, render: statusRender }
];

const BillDetailModal = ({ bill, onClose, onUpdate }) => (
  <DetailModal
    entity={bill}
    fields={fields}
    title="الفاتورة"
    icon="💰"
    endpoint="/bills"
    onClose={onClose}
    onUpdate={onUpdate}
  />
);

export default BillDetailModal;