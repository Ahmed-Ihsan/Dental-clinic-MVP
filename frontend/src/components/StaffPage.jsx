import { useState } from 'react';
import ProfessionalManagement  from './ProfessionalManagement';
import SalaryManagement        from './SalaryManagement';
import PaymentInstallmentForm  from './PaymentInstallmentForm';
import PaymentInstallmentList  from './PaymentInstallmentList';

const TABS = [
  { label: 'الفريق الطبي',        icon: '👨‍⚕️' },
  { label: 'الرواتب والمدفوعات',  icon: '💵' },
  { label: 'الأقساط والسلف',      icon: '📋' },
];

export default function StaffPage() {
  const [active,  setActive]  = useState(0);
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="merge-tabs-bar">
        {TABS.map((t, i) => (
          <button
            key={i}
            className={`merge-tab ${active === i ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {active === 0 && <ProfessionalManagement />}
      {active === 1 && <SalaryManagement />}
      {active === 2 && (
        <div className="management-layout">
          <PaymentInstallmentForm onSave={() => setRefresh(r => r + 1)} />
          <PaymentInstallmentList refreshTrigger={refresh} />
        </div>
      )}
    </div>
  );
}
