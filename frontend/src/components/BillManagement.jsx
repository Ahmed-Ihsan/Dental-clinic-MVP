import { useState } from 'react';
import BillForm from './BillForm.jsx';
import BillList from './BillList.jsx';

const BillManagement = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">💰</span>
          إدارة الفواتير
        </h1>
        <p className="page-header-subtitle">إنشاء وتتبع الفواتير والمدفوعات</p>
      </div>

      <div className="management-layout">
        <BillForm onSave={() => setRefresh(r => r + 1)} />
        <BillList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default BillManagement;