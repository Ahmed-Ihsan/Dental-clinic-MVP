import DetailModal from './DetailModal.jsx';

const genderOptions = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' }
];

const genderLabel = g => g === 'male' ? 'ذكر' : g === 'female' ? 'أنثى' : 'غير محدد';

const fields = [
  { name: 'first_name', label: 'الاسم الأول', type: 'text', placeholder: 'الاسم الأول', showInView: false },
  { name: 'last_name', label: 'اسم العائلة', type: 'text', placeholder: 'اسم العائلة', showInView: false },
  { name: 'date_of_birth', label: 'تاريخ الميلاد', type: 'date', showInView: true },
  { name: 'gender', label: 'الجنس', type: 'select', options: genderOptions, showInView: true, render: genderLabel },
  { name: 'phone', label: 'رقم الهاتف', type: 'text', placeholder: '05xxxxxxxx', showInView: true },
  { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@email.com', showInView: true },
  { name: 'address', label: 'العنوان', type: 'text', placeholder: 'العنوان', full: true, showInView: true },
  { name: 'emergency_contact', label: 'جهة اتصال طوارئ', type: 'text', placeholder: 'الاسم ورقم الهاتف', full: true, showInView: true }
];

const PatientDetailModal = ({ patient, onClose, onUpdate }) => (
  <DetailModal
    entity={patient}
    fields={fields}
    title="المريض"
    icon="👤"
    endpoint="/patients"
    onClose={onClose}
    onUpdate={onUpdate}
  />
);

export default PatientDetailModal;