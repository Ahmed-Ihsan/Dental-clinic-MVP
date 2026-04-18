import { useState } from 'react';
import MedicalHistoryForm from './MedicalHistoryForm.jsx';
import MedicalHistoryList from './MedicalHistoryList.jsx';

const MedicalHistoryManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          إدارة التاريخ الطبي
        </h1>
        <p className="page-header-subtitle">إدارة السجلات الطبية الإلكترونية للمرضى</p>
      </div>

      <div className="management-layout">
        <MedicalHistoryForm onSave={() => setRefresh(r => r + 1)} />
        <MedicalHistoryList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default MedicalHistoryManagement;