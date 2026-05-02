import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCaseSheetData } from './useCaseSheetData';
import PatientHeader        from './PatientHeader';
import CaseSheetTabs        from './CaseSheetTabs';
import CaseSheetSkeleton    from './CaseSheetSkeleton';
import OverviewTab          from './OverviewTab';
import MedicalHistoryTab    from './MedicalHistoryTab';
import TreatmentsTab        from './TreatmentsTab';
import AppointmentsTab      from './AppointmentsTab';
import BillingTab           from './BillingTab';
import DentalChartTab       from './DentalChartTab';
import '../../styles/casesheet.css';

export default function PatientCaseSheet() {
  const { patientId } = useParams();
  const navigate      = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    patient, medicalHistory, treatments, appointments, bills,
    loading, error,
    addMedicalHistory, addTreatment, addAppointment, addBill,
    deleteTreatment, deleteMedicalHistory, updatePatientField,
  } = useCaseSheetData(patientId);

  const tabCounts = {
    history:      medicalHistory.length,
    treatments:   treatments.length,
    appointments: appointments.length,
    billing:      bills.length,
  };

  if (loading) return (
    <div className="cs-page">
      <CaseSheetSkeleton />
    </div>
  );

  if (error) return (
    <div className="cs-page">
      <div className="cs-error-state">
        <div className="cs-empty-icon">⚠️</div>
        <div className="cs-empty-title">خطأ في تحميل البيانات</div>
        <div className="cs-empty-sub">{error}</div>
        <button className="cs-btn-primary" onClick={() => navigate('/patients')}>
          ← العودة إلى قائمة المرضى
        </button>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="cs-page">
      <div className="cs-error-state">
        <div className="cs-empty-icon">👤</div>
        <div className="cs-empty-title">المريض غير موجود</div>
        <button className="cs-btn-primary" onClick={() => navigate('/patients')}>
          ← العودة إلى قائمة المرضى
        </button>
      </div>
    </div>
  );

  return (
    <div className="cs-page">
      {/* Sticky Header */}
      <PatientHeader
        patient={patient}
        medicalHistory={medicalHistory}
        onBack={() => navigate('/patients')}
      />

      {/* Main Workspace */}
      <div className="cs-workspace">
        <CaseSheetTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
        />

        <div className="cs-tab-content">
          {activeTab === 'overview' && (
            <OverviewTab
              patient={patient}
              treatments={treatments}
              appointments={appointments}
              bills={bills}
            />
          )}

          {activeTab === 'history' && (
            <MedicalHistoryTab
              medicalHistory={medicalHistory}
              onAdd={addMedicalHistory}
              onDelete={deleteMedicalHistory}
            />
          )}

          {activeTab === 'treatments' && (
            <TreatmentsTab
              treatments={treatments}
              onAdd={addTreatment}
              onDelete={deleteTreatment}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsTab
              appointments={appointments}
              onAdd={addAppointment}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab bills={bills} onAdd={addBill} />
          )}

          {activeTab === 'dental-chart' && (
            <DentalChartTab
              patientId={patientId}
              initialTeethState={patient.dental_chart || {}}
              onSaved={(teeth) => updatePatientField({ dental_chart: teeth })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
