import { useState } from 'react';
import GlobalModal from './GlobalModal';
import PatientForm from './PatientForm.jsx';
import AppointmentForm from './AppointmentForm.jsx';
import TreatmentForm from './TreatmentForm.jsx';

/**
 * QuickEntryModal — global floating modal triggered from the TopBar.
 * Wraps the existing PatientForm / AppointmentForm / TreatmentForm
 * inside a tabbed interface without altering their internal logic.
 */
const TABS = [
  { key: 'patient',     label: 'مريض جديد',    icon: '👤' },
  { key: 'appointment', label: 'موعد جديد',    icon: '📅' },
  { key: 'treatment',   label: 'علاج جديد',    icon: '🦷' },
];

export default function QuickEntryModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('patient');
  const [refresh,   setRefresh]   = useState(0);

  const handleSave = () => {
    setRefresh(r => r + 1);
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      title="إدخال سريع"
      icon="📝"
      size="lg"
    >
      {/* Tab Strip */}
      <div className="qe-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`qe-tab ${activeTab === tab.key ? 'qe-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            id={`quick-entry-tab-${tab.key}`}
          >
            <span className="qe-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content — existing forms, zero logic changes */}
      <div className="qe-content">
        {activeTab === 'patient'     && <PatientForm     onSave={handleSave} />}
        {activeTab === 'appointment' && <AppointmentForm onSave={handleSave} />}
        {activeTab === 'treatment'   && <TreatmentForm   onSave={handleSave} />}
      </div>
    </GlobalModal>
  );
}
