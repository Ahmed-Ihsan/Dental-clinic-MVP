import { useState } from 'react';
import TreatmentForm from './TreatmentForm.jsx';
import TreatmentList from './TreatmentList.jsx';

const TreatmentManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">🦷</span>
          إدارة العلاجات
        </h1>
        <p className="page-header-subtitle">تسجيل وإدارة علاجات المرضى</p>
      </div>

      <div className="management-layout">
        <TreatmentForm onSave={() => setRefresh(r => r + 1)} />
        <TreatmentList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default TreatmentManagement;