import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { TREATMENT_CATEGORIES } from '../constants/treatmentCategories';

const TreatmentForm = ({ onSave }) => {
  const EMPTY = {
    patient_id: '', appointment_id: '', treatment_type: '',
    cost: '', notes: '', treatment_date: '',
  };

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ── Reference data ── */
  const [allPatients,      setAllPatients]      = useState([]);
  const [allAppointments,  setAllAppointments]  = useState([]);

  /* ── Patient typeahead ── */
  const [patientQuery,    setPatientQuery]    = useState('');
  const [patientResults,  setPatientResults]  = useState([]);
  const [showDrop,        setShowDrop]        = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const wrapRef = useRef();
  const debRef  = useRef();

  /* ── Initial fetch ── */
  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/appointments')])
      .then(([pRes, aRes]) => {
        setAllPatients(pRes.data);
        setAllAppointments(aRes.data);
      })
      .catch(console.error);
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Patient local search ── */
  const searchPatients = useCallback(q => {
    if (!q.trim()) { setPatientResults([]); setShowDrop(false); return; }
    const r = allPatients
      .filter(p => `${p.first_name} ${p.last_name} ${p.phone || ''}`.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 7);
    setPatientResults(r);
    setShowDrop(r.length > 0);
  }, [allPatients]);

  const handlePatientQuery = e => {
    const v = e.target.value;
    setPatientQuery(v);
    setSelectedPatient(null);
    setForm(f => ({ ...f, patient_id: '', appointment_id: '' }));
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchPatients(v), 180);
  };

  const selectPatient = p => {
    setSelectedPatient(p);
    setPatientQuery(`${p.first_name} ${p.last_name}`);
    setShowDrop(false);
    setForm(f => ({ ...f, patient_id: p.id, appointment_id: '' }));
  };

  /* ── Dependent appointments (filtered by selected patient) ── */
  const patientAppointments = selectedPatient
    ? allAppointments.filter(a => String(a.patient_id) === String(selectedPatient.id))
    : [];

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Submit ── */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/treatments', { ...form, cost: parseFloat(form.cost) || 0 });
      setSuccess(true);
      setForm(EMPTY);
      setSelectedPatient(null);
      setPatientQuery('');
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving treatment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">🦷</span>
          إضافة علاج جديد
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>✅ تم إضافة العلاج بنجاح!</div>
      )}

      <div className="form-grid">

        {/* ── Patient Typeahead ── */}
        <div className="field-group form-grid-full" ref={wrapRef} style={{ position: 'relative' }}>
          <label className="field-label" htmlFor="treat-patient-input">👤 المريض *</label>
          <div style={{ position: 'relative' }}>
            <input
              id="treat-patient-input"
              type="text"
              className="field-input"
              placeholder="ابحث عن مريض بالاسم أو الهاتف..."
              value={patientQuery}
              onChange={handlePatientQuery}
              onFocus={() => { if (patientResults.length > 0) setShowDrop(true); }}
              autoComplete="off"
              aria-label="بحث عن مريض"
              aria-expanded={showDrop}
              aria-autocomplete="list"
              required={!selectedPatient}
              style={selectedPatient ? { borderColor: 'var(--success)' } : {}}
            />
            {selectedPatient && (
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontWeight: 700 }}>✓</span>
            )}
          </div>
          {showDrop && (
            <div
              role="listbox"
              aria-label="نتائج البحث"
              style={{
                position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-md)', zIndex: 200, overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}>
              {patientResults.map(p => (
                <div
                  key={p.id}
                  role="option"
                  aria-selected="false"
                  onMouseDown={() => selectPatient(p)}
                  style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
                  }}>{p.first_name?.[0]}{p.last_name?.[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{p.first_name} {p.last_name}</div>
                    {p.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📞 {p.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Dependent appointment dropdown ── */}
        <div className="field-group form-grid-full">
          <label className="field-label">📅 الموعد المرتبط</label>
          <select
            name="appointment_id"
            value={form.appointment_id}
            onChange={handleChange}
            className="field-input"
            disabled={!selectedPatient}
            aria-label="اختر موعداً مرتبطاً"
          >
            <option value="">
              {selectedPatient
                ? `اختر موعداً (${patientAppointments.length} متاح)`
                : 'اختر مريضاً أولاً'}
            </option>
            {patientAppointments.map(a => (
              <option key={a.id} value={a.id}>
                {a.appointment_date} — {a.start_time} ({a.status})
              </option>
            ))}
          </select>
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">تصنيف العلاج *</label>
          <select name="treatment_type" value={form.treatment_type} onChange={handleChange}
            required className="field-input">
            <option value="">-- اختر تصنيف العلاج --</option>
            {TREATMENT_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">التكلفة *</label>
          <input name="cost" value={form.cost} onChange={handleChange}
            type="number" step="0.01" min="0" placeholder="0.00 IQD" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ العلاج *</label>
          <input name="treatment_date" value={form.treatment_date} onChange={handleChange}
            type="date" required className="field-input" />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">ملاحظات</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="أضف أي تفاصيل عن العلاج..." rows={3} className="field-input" />
        </div>

      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading || !selectedPatient}>
        {loading ? '⏳ جارٍ الحفظ...' : '🦷 إضافة العلاج'}
      </button>
    </form>
  );
};

export default TreatmentForm;