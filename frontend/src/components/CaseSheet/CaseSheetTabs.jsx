const TABS = [
  { id: 'overview',      label: 'نظرة عامة',        icon: '◈' },
  { id: 'history',       label: 'التاريخ الطبي',    icon: '🩺' },
  { id: 'treatments',    label: 'العلاجات',          icon: '🦷' },
  { id: 'appointments',  label: 'المواعيد',          icon: '📅' },
  { id: 'billing',       label: 'الفواتير',          icon: '💰' },
  { id: 'dental-chart',  label: 'خريطة الأسنان',    icon: '🗺️' },
];

export default function CaseSheetTabs({ activeTab, onChange, counts = {} }) {
  return (
    <div className="cs-tabs-bar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`cs-tab ${activeTab === tab.id ? 'cs-tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
          id={`cs-tab-${tab.id}`}
        >
          <span className="cs-tab-icon">{tab.icon}</span>
          <span className="cs-tab-label">{tab.label}</span>
          {counts[tab.id] != null && (
            <span className="cs-tab-count">{counts[tab.id]}</span>
          )}
          {activeTab === tab.id && <span className="cs-tab-indicator" />}
        </button>
      ))}
    </div>
  );
}
