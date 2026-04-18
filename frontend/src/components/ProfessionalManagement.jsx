import { useState } from 'react';
import ProfessionalForm from './ProfessionalForm.jsx';
import ProfessionalList from './ProfessionalList.jsx';

const ProfessionalManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">👨‍⚕️</span>
          إدارة المتخصصين
        </h1>
        <p className="page-header-subtitle">تسجيل وإدارة الكوادر الطبية المتخصصة</p>
      </div>

      <div className="management-layout">
        <ProfessionalForm onSave={() => setRefresh(r => r + 1)} />
        <ProfessionalList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default ProfessionalManagement;