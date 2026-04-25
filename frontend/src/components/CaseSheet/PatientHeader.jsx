import { useMemo } from 'react';

function calculateAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

// Conditions that trigger a red medical alert
const ALERT_KEYWORDS = [
  'allergy', 'allergic', 'diabetes', 'diabetic', 'hypertension',
  'heart', 'asthma', 'bleeding', 'anticoagulant', 'epilepsy', 'seizure',
  'penicillin', 'latex', 'hepatitis', 'hiv', 'aids', 'pregnancy', 'pregnant',
  'حساسية', 'سكري', 'ضغط', 'قلب', 'ربو', 'نزيف', 'حمل',
];

function extractAlerts(medicalHistory) {
  const alerts = [];
  for (const record of medicalHistory) {
    const text = (record.condition || '').toLowerCase();
    const isAlert = ALERT_KEYWORDS.some(kw => text.includes(kw));
    if (isAlert) {
      alerts.push(record.condition);
    }
  }
  return [...new Set(alerts)];
}

export default function PatientHeader({ patient, medicalHistory, onBack }) {
  const age = calculateAge(patient?.date_of_birth);
  const initials = getInitials(patient?.first_name, patient?.last_name);
  const alerts = useMemo(() => extractAlerts(medicalHistory), [medicalHistory]);

  const genderLabel = patient?.gender === 'male' ? '♂ ذكر' : patient?.gender === 'female' ? '♀ أنثى' : '—';

  return (
    <div className="cs-patient-header">
      <div className="cs-header-inner">
        {/* Back button */}
        <button className="cs-back-btn" onClick={onBack} title="رجوع">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Avatar */}
        <div className="cs-avatar">
          <span className="cs-avatar-initials">{initials}</span>
          <div className="cs-avatar-ring" />
        </div>

        {/* Patient Info */}
        <div className="cs-header-info">
          <div className="cs-header-name-row">
            <h1 className="cs-patient-name">
              {patient?.first_name} {patient?.last_name}
            </h1>
            <span className="cs-gender-badge">{genderLabel}</span>
          </div>
          <div className="cs-header-meta">
            <span className="cs-meta-chip">
              <span className="cs-meta-icon">🎂</span>
              {age} سنة
            </span>
            {patient?.phone && (
              <span className="cs-meta-chip">
                <span className="cs-meta-icon">📞</span>
                {patient.phone}
              </span>
            )}
            {patient?.emergency_contact && (
              <span className="cs-meta-chip cs-meta-emergency">
                <span className="cs-meta-icon">🚨</span>
                {patient.emergency_contact}
              </span>
            )}
            {patient?.date_of_birth && (
              <span className="cs-meta-chip">
                <span className="cs-meta-icon">📋</span>
                ID: {patient.id}
              </span>
            )}
          </div>
        </div>

        {/* Medical Alerts */}
        {alerts.length > 0 && (
          <div className="cs-alerts-section">
            <div className="cs-alerts-label">
              <span className="cs-alerts-pulse" />
              تنبيهات طبية
            </div>
            <div className="cs-alerts-badges">
              {alerts.map((alert, i) => (
                <span key={i} className="cs-alert-badge">
                  ⚠️ {alert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
