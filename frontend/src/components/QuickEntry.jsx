import { useState } from 'react';
import PatientForm from './PatientForm.jsx';
import AppointmentForm from './AppointmentForm.jsx';
import TreatmentForm from './TreatmentForm.jsx';

const QuickEntry = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">📝</span>
          إدخال سريع
        </h1>
        <p className="page-header-subtitle">إضافة سريعة للمرضى والمواعيد والعلاجات</p>
      </div>

      <div className="quick-entry-layout">
        <PatientForm onSave={() => setRefresh(r => r + 1)} />
        <AppointmentForm onSave={() => setRefresh(r => r + 1)} />
        <TreatmentForm onSave={() => setRefresh(r => r + 1)} />
      </div>
    </div>
  );
};

export default QuickEntry;