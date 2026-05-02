import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../AuthContext.jsx';

import Step1Patient  from './Step1Patient.jsx';
import Step2Treatment from './Step2Treatment.jsx';
import Step3Billing  from './Step3Billing.jsx';
import Step4Review   from './Step4Review.jsx';
import SuccessToast  from './SuccessToast.jsx';

/* ─── Step Definitions ─── */
const STEPS = [
  { id: 1, icon: '👤', label: 'بيانات المريض',    subtitle: 'Patient Details' },
  { id: 2, icon: '🦷', label: 'الإجراء الطبي',    subtitle: 'Treatment' },
  { id: 3, icon: '💰', label: 'الفاتورة والدفع',  subtitle: 'Billing' },
  { id: 4, icon: '✅', label: 'المراجعة والحفظ',  subtitle: 'Review & Save' },
];

/* ─── Initial State ─── */
const INITIAL_STATE = {
  /* Patient */
  patient_id: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', isNew: false,
  /* Treatment */
  treatment_type: '', treatment_date: '', doctor_name: '', notes: '', suggested_cost: 0,
  /* Billing */
  total_amount: 0, paid_amount: 0, discount_amount: 0, direct_cost: 0, balance: 0, due_date: '', payment_method: '',
};

/* ─── Validation per step ─── */
function validateStep(step, data) {
  if (step === 1) {
    if (data.isNew) {
      if (!data.first_name.trim()) return 'الاسم الأول مطلوب';
      if (!data.last_name.trim())  return 'اسم العائلة مطلوب';
      if (!data.date_of_birth)      return 'تاريخ الميلاد مطلوب';
    } else {
      if (!data.patient_id)        return 'يرجى اختيار مريض من القائمة';
    }
  }
  if (step === 2) {
    if (!data.treatment_type)      return 'نوع العلاج مطلوب';
    if (!data.treatment_date)      return 'تاريخ العلاج مطلوب';
  }
  if (step === 3) {
    if (!data.total_amount || data.total_amount <= 0) return 'التكلفة الإجمالية مطلوبة';
  }
  return null;
}

/* ════════════════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ════════════════════════════════════════════════════ */
export default function QuickVisitWizard({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step,    setStep]    = useState(1);
  const [data,    setData]    = useState(INITIAL_STATE);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [apiLog,  setApiLog]  = useState([]);  // Show mock orchestration progress
  const [success, setSuccess] = useState(null); // { patient_id, treatment_id, bill_id }

  /* Reset on open/close */
  const handleClose = useCallback(() => {
    setStep(1);
    setData(INITIAL_STATE);
    setError('');
    setLoading(false);
    setApiLog([]);
    setSuccess(null);
    onClose();
  }, [onClose]);

  /* Patch sub-state */
  const patchPatient   = (patch) => setData(d => ({ ...d, ...patch }));
  const patchTreatment = (patch) => setData(d => ({ ...d, ...patch }));
  const patchBilling   = (patch) => setData(d => ({ ...d, ...patch }));

  /* Step navigation */
  const goNext = () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(4, s + 1));
  };

  const goBack = () => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  };

  /* ── Mock API Orchestration ── */
  const handleSubmit = async () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setApiLog([]);

    try {
      let patient_id = data.patient_id;

      /* ── Step A: Create Patient (if new) ── */
      if (data.isNew) {
        setApiLog(l => [...l, { status: 'pending', msg: 'إنشاء ملف المريض...' }]);
        const patientPayload = {
          first_name: data.first_name,
          last_name:  data.last_name,
          date_of_birth: data.date_of_birth,
          phone:      data.phone || '',
          gender:     data.gender || '',
        };
        const patientRes = await api.post('/patients', patientPayload);
        patient_id = patientRes.data?.id || patientRes.data?.patient_id;
        setApiLog(l => [...l.slice(0,-1), { status: 'done', msg: `✅ تم إنشاء المريض #${patient_id}` }]);
      }

      /* ── Step B: Create Treatment ── */
      setApiLog(l => [...l, { status: 'pending', msg: 'تسجيل الإجراء الطبي...' }]);
      const treatmentPayload = {
        patient_id,
        treatment_type: data.treatment_type,
        treatment_date: data.treatment_date,
        notes:          data.notes || '',
        cost:           data.total_amount || 0,
      };
      const treatmentRes = await api.post('/treatments', treatmentPayload);
      const treatment_id = treatmentRes.data?.id;
      setApiLog(l => [...l.slice(0,-1), { status: 'done', msg: `✅ تم تسجيل العلاج #${treatment_id}` }]);

      /* ── Step B2: Create Appointment (links bill to the doctor) ── */
      let appointment_id = null;
      if (user?.professional_id || user?.role !== 'doctor') {
        setApiLog(l => [...l, { status: 'pending', msg: 'ربط الزيارة بملف الطبيب...' }]);
        try {
          const aptPayload = {
            patient_id,
            appointment_date: data.treatment_date,
            start_time: '09:00',
            end_time:   '10:00',
            dentist_id: user?.professional_id || null,
            status: 'completed',
            notes: data.notes || '',
          };
          const aptRes = await api.post('/appointments', aptPayload);
          appointment_id = aptRes.data?.id;
          setApiLog(l => [...l.slice(0,-1), { status: 'done', msg: `✅ تم ربط الزيارة #${appointment_id}` }]);
        } catch { setApiLog(l => [...l.slice(0,-1), { status: 'done', msg: '✔️ تم تخطي ربط الموعد' }]); }
      }

      /* ── Step C: Create Bill ── */
      setApiLog(l => [...l, { status: 'pending', msg: 'إنشاء الفاتورة...' }]);
      const billPayload = {
        patient_id,
        appointment_id,
        total_amount: data.total_amount || 0,
        paid_amount:  data.paid_amount  || 0,
        discount_amount: data.discount_amount || 0,
        direct_cost: data.direct_cost || 0,
        balance:      data.balance      || 0,
        due_date:     data.due_date     || null,
        status:       data.balance <= 0 ? 'paid' : data.paid_amount > 0 ? 'partial' : 'pending',
      };
      const billRes = await api.post('/bills', billPayload);
      const bill_id = billRes.data?.id;
      setApiLog(l => [...l.slice(0,-1), { status: 'done', msg: `✅ تم إنشاء الفاتورة #${bill_id}` }]);

      /* ── Success ── */
      setSuccess({ patient_id, treatment_id, bill_id, patientName: `${data.first_name} ${data.last_name}` });
      if (onSuccess) onSuccess({ patient_id, treatment_id, bill_id });

    } catch (err) {
      console.error('[QuickVisitWizard] submit error:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'حدث خطأ أثناء الحفظ، يرجى المحاولة مجدداً';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Escape key */
  // (handled by GlobalModal already, but close if stand-alone)
  if (!isOpen) return null;

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="qvw-overlay"
        onClick={(e) => { if (e.target === e.currentTarget && !loading) handleClose(); }}
        role="presentation"
      >
        {/* Drawer Panel */}
        <div className="qvw-drawer" role="dialog" aria-modal="true" aria-label="تسجيل زيارة شاملة">

          {/* ── HEADER ── */}
          <div className="qvw-header">
            <div className="qvw-header-left">
              <div className="qvw-header-icon">🦷</div>
              <div>
                <div className="qvw-header-title">تسجيل زيارة شاملة</div>
                <div className="qvw-header-subtitle">المريض · العلاج · الفاتورة — في خطوة واحدة</div>
              </div>
            </div>
            <button className="qvw-close-btn" onClick={handleClose} disabled={loading} aria-label="إغلاق">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── STEPPER ── */}
          <div className="qvw-stepper">
            {/* Progress bar track */}
            <div className="qvw-progress-track">
              <div className="qvw-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            {STEPS.map((s) => {
              const state = s.id < step ? 'done' : s.id === step ? 'active' : 'upcoming';
              return (
                <div key={s.id} className={`qvw-step-indicator qvw-step-${state}`}>
                  <div className="qvw-step-bubble">
                    {state === 'done' ? '✓' : s.icon}
                  </div>
                  <div className="qvw-step-meta">
                    <div className="qvw-step-label">{s.label}</div>
                    <div className="qvw-step-sublabel">{s.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BODY ── */}
          <div className="qvw-body">
            <div className="qvw-step-header">
              <span className="qvw-step-num">الخطوة {step} من {STEPS.length}</span>
              <h2 className="qvw-step-title">
                {STEPS[step - 1].icon} {STEPS[step - 1].label}
              </h2>
            </div>

            {/* Animated step panels */}
            <div className="qvw-panel-wrap" key={step}>
              {step === 1 && (
                <Step1Patient
                  data={{ patient_id: data.patient_id, first_name: data.first_name, last_name: data.last_name, phone: data.phone, date_of_birth: data.date_of_birth, gender: data.gender, isNew: data.isNew }}
                  onChange={patchPatient}
                />
              )}
              {step === 2 && (
                <Step2Treatment
                  data={{ treatment_type: data.treatment_type, treatment_date: data.treatment_date, doctor_name: data.doctor_name, notes: data.notes, suggested_cost: data.suggested_cost }}
                  onChange={patchTreatment}
                />
              )}
              {step === 3 && (
                <Step3Billing
                  data={{ total_amount: data.total_amount, paid_amount: data.paid_amount, discount_amount: data.discount_amount, direct_cost: data.direct_cost, balance: data.balance, due_date: data.due_date, payment_method: data.payment_method }}
                  onChange={patchBilling}
                  suggestedCost={data.suggested_cost}
                />
              )}
              {step === 4 && <Step4Review visitData={data} />}
            </div>

            {/* API orchestration log (visible on step 4 while saving) */}
            {apiLog.length > 0 && (
              <div className="qvw-api-log">
                {apiLog.map((entry, i) => (
                  <div key={i} className={`qvw-api-entry qvw-api-${entry.status}`}>
                    {entry.status === 'pending' ? <span className="qvw-spinner-sm" /> : null}
                    <span>{entry.msg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Success screen */}
            {success && (
              <div className="qvw-step-content">
                <div className="qvw-section">
                  <div className="qvw-success-content">
                    <div className="qvw-success-icon">✅</div>
                    <h3 className="qvw-success-title">تم تسجيل الزيارة بنجاح!</h3>
                    <p className="qvw-success-msg">
                      تم حفظ بيانات المريض <strong>{success.patientName}</strong> والعلاج والفاتورة.
                    </p>
                    <div className="qvw-success-details">
                      <p>رقم المريض: {success.patient_id}</p>
                      <p>رقم العلاج: {success.treatment_id}</p>
                      <p>رقم الفاتورة: {success.bill_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="qvw-error-banner" role="alert">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ── FOOTER ACTIONS ── */}
          <div className="qvw-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={step === 1 ? handleClose : goBack}
              disabled={loading}
            >
              {step === 1 ? '✕ إلغاء' : '← رجوع'}
            </button>

            <div className="qvw-footer-center">
              {STEPS.map(s => (
                <span key={s.id} className={`qvw-dot ${s.id === step ? 'qvw-dot-active' : s.id < step ? 'qvw-dot-done' : ''}`} />
              ))}
            </div>

            {success ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleClose}
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  طباعة الفاتورة
                </button>
              </>
            ) : step < 4 ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                التالي ←
              </button>
            ) : (
              <button
                type="button"
                id="qvw-confirm-save-btn"
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="qvw-spinner-sm" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  '🚀 تأكيد وحفظ الزيارة'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <SuccessToast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}
    </>,
    document.body
  );
}
