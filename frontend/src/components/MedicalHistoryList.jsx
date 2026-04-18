import { useState, useEffect } from 'react';
import DataList from './DataList.jsx';
import MedicalHistoryDetailModal from './MedicalHistoryDetailModal.jsx';

const MedicalHistoryList = ({ refreshTrigger }) => {
  const [patients, setPatients] = useState([]);
  const [selectedMH, setSelectedMH] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const filters = [
    {
      name: 'patient_id',
      type: 'select',
      options: patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` })),
      defaultValue: '',
      placeholder: 'جميع المرضى'
    }
  ];

  const columns = [
    {
      key: 'patient_id',
      label: 'المريض',
      render: id => {
        const p = patients.find(p => p.id === id);
        return p ? `${p.first_name} ${p.last_name}` : `مريض #${id}`;
      }
    },
    { key: 'condition', label: 'التشخيص' },
    { key: 'diagnosis_date', label: 'تاريخ التشخيص' },
    { key: 'notes', label: 'التفاصيل', render: n => n || '—' }
  ];

  const actions = [
    { key: 'view', label: '👁 عرض', variant: 'ghost', onClick: setSelectedMH },
    { key: 'delete', label: '🗑 حذف', variant: 'danger' }
  ];

  return (
    <>
      <DataList
        endpoint="/medical_histories"
        title="قائمة التاريخ الطبي"
        icon="📋"
        filters={filters}
        columns={columns}
        actions={actions}
        refreshTrigger={refreshTrigger + refreshKey}
      />
      {selectedMH && (
        <MedicalHistoryDetailModal
          medicalHistory={selectedMH}
          onClose={() => setSelectedMH(null)}
          onUpdate={handleRefresh}
        />
      )}
    </>
  );
};

export default MedicalHistoryList;