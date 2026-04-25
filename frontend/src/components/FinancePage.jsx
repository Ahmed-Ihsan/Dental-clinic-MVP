import { useState } from 'react';
import RevenueDashboard  from './Revenue/RevenueDashboard';
import ExpensesDashboard from './Expenses/ExpensesDashboard';

const TABS = [
  { label: 'الإيرادات والأرباح', icon: '📈' },
  { label: 'إدارة المصروفات',    icon: '💸' },
];

export default function FinancePage() {
  const [active, setActive] = useState(0);

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

      {active === 0 && <RevenueDashboard />}
      {active === 1 && <ExpensesDashboard />}
    </div>
  );
}
