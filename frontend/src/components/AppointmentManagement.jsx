import { useState } from 'react';
import AppointmentForm from './AppointmentForm.jsx';
import AppointmentList from './AppointmentList.jsx';

const AppointmentManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">📅</span>
          إدارة المواعيد
        </h1>
        <p className="page-header-subtitle">جدولة ومتابعة مواعيد المرضى</p>
      </div>

      <div className="management-layout">
        <AppointmentForm onSave={() => setRefresh(r => r + 1)} />
        <AppointmentList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default AppointmentManagement;