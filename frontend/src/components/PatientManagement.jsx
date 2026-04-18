import { useState } from 'react';
import PatientForm from './PatientForm.jsx';
import PatientList from './PatientList.jsx';

const PatientManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">👤</span>
          إدارة المرضى
        </h1>
        <p className="page-header-subtitle">تسجيل وإدارة بيانات المرضى</p>
      </div>

      <div className="management-layout">
        <PatientForm onSave={() => setRefresh(r => r + 1)} />
        <PatientList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default PatientManagement;