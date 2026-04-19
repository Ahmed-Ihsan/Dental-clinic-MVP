import { useState } from 'react';
import SalaryForm from './SalaryForm.jsx';
import SalaryList from './SalaryList.jsx';
import PayrollProcessing from './PayrollProcessing.jsx';
import PayrollList from './PayrollList.jsx';
import SalaryPaymentList from './SalaryPaymentList.jsx';
import PaymentInstallmentForm from './PaymentInstallmentForm.jsx';
import PaymentInstallmentList from './PaymentInstallmentList.jsx';

const SalaryManagement = () => {
  const [activeTab, setActiveTab] = useState('salaries');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingSalary, setEditingSalary] = useState(null);

  const tabs = [
    { key: 'salaries', label: 'إدارة الرواتب', icon: '💰', description: 'إعداد وتعديل رواتب الموظفين' },
    { key: 'payroll', label: 'معالجة الرواتب', icon: '⚙️', description: 'إنشاء ومعالجة الرواتب الشهرية' },
    { key: 'records', label: 'سجل الرواتب', icon: '📊', description: 'عرض وإدارة سجلات الرواتب' },
    { key: 'payments', label: 'دفعات الرواتب', icon: '💵', description: 'تتبع دفعات ومعاملات الرواتب' },
    { key: 'installments', label: 'الدفعات المجدولة', icon: '📅', description: 'إدارة الدفعات الشهرية والقروض' }
  ];

  const handleRefresh = () => {
    setRefreshTrigger(r => r + 1);
  };

  const handleEditSalary = (salary) => {
    setEditingSalary(salary);
    setActiveTab('salaries'); // Switch to salaries tab if not already there
  };

  const handleSaveComplete = () => {
    setEditingSalary(null);
    handleRefresh();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'salaries':
        return (
          <div className="management-layout">
            <SalaryForm
              onSave={handleSaveComplete}
              editSalary={editingSalary}
            />
            <SalaryList
              refreshTrigger={refreshTrigger}
              onEditSalary={handleEditSalary}
            />
          </div>
        );

      case 'payroll':
        return (
          <div>
            <PayrollProcessing onPayrollGenerated={handleRefresh} />
          </div>
        );

      case 'records':
        return (
          <div>
            <PayrollList refreshTrigger={refreshTrigger} />
          </div>
        );

      case 'payments':
        return (
          <div>
            <SalaryPaymentList refreshTrigger={refreshTrigger} />
          </div>
        );

      case 'installments':
        return (
          <div className="management-layout">
            <PaymentInstallmentForm onSave={handleRefresh} />
            <PaymentInstallmentList refreshTrigger={refreshTrigger} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">💰</span>
          إدارة الرواتب والمرتبات
        </h1>
        <p className="page-header-subtitle">نظام شامل لإدارة رواتب الموظفين والمتخصصين</p>
      </div>

      {/* Tab Navigation */}
      <div className="animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 12px',
                minHeight: '80px'
              }}
            >
              <span className="tab-icon" style={{ fontSize: '20px' }}>{tab.icon}</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in animate-in-delay-2">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SalaryManagement;