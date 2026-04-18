import { useState } from 'react';
import DataList from './DataList.jsx';
import PatientDetailModal from './PatientDetailModal.jsx';

const genderOptions = [
  { value: '', label: 'جميع الأجناس' },
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' }
];

const genderRender = g => {
  if (g === 'male') return <span className="badge badge-info">ذكر</span>;
  if (g === 'female') return <span className="badge" style={{ background: 'rgba(244,114,182,0.12)', color: '#F472B6' }}>أنثى</span>;
  return <span className="badge badge-ghost">غير محدد</span>;
};

const nameRender = (name, patient) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 'var(--radius-full)',
      background: 'var(--primary-light)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 14, flexShrink: 0
    }}>
      {patient.gender === 'female' ? '👩' : '👨'}
    </div>
    <strong className="patient-name">{patient.first_name} {patient.last_name}</strong>
  </div>
);

const PatientList = ({ refreshTrigger }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filters = [
    { name: 'search', type: 'text', placeholder: '🔍 بحث بالاسم أو البريد', style: { minWidth: 220 } },
    { name: 'gender', type: 'select', options: genderOptions, defaultValue: '', placeholder: 'جميع الأجناس' },
    { name: 'date_from', type: 'date', placeholder: 'من تاريخ الميلاد' },
    { name: 'date_to', type: 'date', placeholder: 'إلى تاريخ الميلاد' }
  ];

  const columns = [
    { key: 'name', label: 'الاسم', render: nameRender },
    { key: 'date_of_birth', label: 'تاريخ الميلاد' },
    { key: 'gender', label: 'الجنس', render: genderRender },
    { key: 'phone', label: 'الهاتف' },
    { key: 'email', label: 'البريد الإلكتروني' }
  ];

  const actions = [
    { key: 'view', label: '👁 عرض', variant: 'ghost', onClick: setSelectedPatient },
    { key: 'delete', label: '🗑 حذف', variant: 'danger', onClick: item => {
      if (window.confirm('هل أنت متأكد من حذف هذا المريض؟')) {
        // delete handled in DataList
      }
    }}
  ];

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <DataList
        endpoint="/patients"
        title="قائمة المرضى"
        icon="👤"
        filters={filters}
        columns={columns}
        actions={actions}
        refreshTrigger={refreshTrigger + refreshKey}
      />
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdate={handleRefresh}
        />
      )}
    </>
  );
};

export default PatientList;