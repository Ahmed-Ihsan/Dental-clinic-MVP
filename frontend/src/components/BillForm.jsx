import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'معلق' },
  { value: 'paid',    label: 'مدفوع' },
  { value: 'overdue', label: 'متأخر' },
];

const BillForm = ({ onSave }) => {
  const EMPTY = { patient_id: '', appointment_id: '', total_amount: '', paid_amount: 0.0, due_date: '', status: 'pending' };

  const [form, setForm]               = useState(EMPTY);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  /* ── Data ── */
  const [allPatients, setAllPatients]         = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

  /* ── Patient typeahead ── */
  const [patientQuery, setPatientQuery]   = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showDrop, setShowDrop]           = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  /* ── Treatment cost hint ── */
  const [treatmentHint, setTreatmentHint]   = useState(null);
  const [loadingCost, setLoadingCost]       = useState(false);

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
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Patient search (local filter) ── */
  const searchPatients = useCallback((q) => {
    if (!q.trim()) { setPatientResults([]); setShowDrop(false); return; }
    const r = allPatients
      .filter(p => `${p.first_name} ${p.last_name} ${p.phone || ''}`.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 7);
    setPatientResults(r);
    setShowDrop(r.length > 0);
  }, [allPatients]);

  const handlePatientQuery = (e) => {
    const v = e.target.value;
    setPatientQuery(v);
    setSelectedPatient(null);
    setForm(f => ({ ...f, patient_id: '', appointment_id: '' }));
    setTreatmentHint(null);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchPatients(v), 180);
  };

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setPatientQuery(`${p.first_name} ${p.last_name}`);
    setShowDrop(false);
    setForm(f => ({ ...f, patient_id: p.id, appointment_id: '' }));
    setTreatmentHint(null);
  };

  /* ── Dependent appointments ── */
  const patientAppointments = selectedPatient
    ? allAppointments.filter(a => String(a.patient_id) === String(selectedPatient.id))
    : [];

  /* ── Auto-fill cost from treatments on appointment select ── */
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    if (name === 'appointment_id' && value) {
      setLoadingCost(true);
      setTreatmentHint(null);
      try {
        const { data: all } = await api.get('/treatments');
        const linked = all.filter(t => String(t.appointment_id) === String(value));
        if (linked.length > 0) {
          const total = linked.reduce((s, t) => s + (t.cost || 0), 0);
          setTreatmentHint({ count: linked.length, total });
          setForm(f => ({ ...f, [name]: value, total_amount: String(total) }));
        }
      } catch (err) { console.error(err); }
      finally { setLoadingCost(false); }
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const total = parseFloat(form.total_amount) || 0;
      const paid  = parseFloat(form.paid_amount)  || 0;
      await api.post('/bills', { ...form, total_amount: total, paid_amount: paid, balance: total - paid });
      setSuccess(true);
      setForm(EMPTY);
      setSelectedPatient(null);
      setPatientQuery('');
      setTreatmentHint(null);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving bill:', err);
    } finally {
      setLoading(false);
    }
  };

  const total   = parseFloat(form.total_amount) || 0;
  const paid    = parseFloat(form.paid_amount)  || 0;
  const balance = Math.max(0, total - paid);
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">💰</span>
          إنشاء فاتورة جديدة
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>✅ تم إنشاء الفاتورة بنجاح!</div>
      )}

      <div className="form-grid">

        {/* ── Patient Typeahead ── */}
        <div className="field-group form-grid-full" ref={wrapRef} style={{ position: 'relative' }}>
          <label className="field-label">👤 المريض *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="field-input"
              placeholder="ابحث عن مريض بالاسم أو الهاتف..."
              value={patientQuery}
              onChange={handlePatientQuery}
              onFocus={() => { if (patientResults.length > 0) setShowDrop(true); }}
              autoComplete="off"
              required={!selectedPatient}
              style={selectedPatient ? { borderColor: 'var(--success)' } : {}}
            />
            {selectedPatient && (
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontWeight: 700 }}>✓</span>
            )}
          </div>
          {showDrop && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-md)', zIndex: 200, overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {patientResults.map(p => (
                <div
                  key={p.id}
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

        {/* ── Dependent Appointments ── */}
        <div className="field-group form-grid-full">
          <label className="field-label">
            📅 الموعد
            {loadingCost && <span style={{ marginRight: 8, fontSize: 12, color: 'var(--text-muted)' }}>⏳ جارٍ حساب التكلفة...</span>}
          </label>
          <select
            name="appointment_id"
            value={form.appointment_id}
            onChange={handleChange}
            className="field-input"
            disabled={!selectedPatient}
          >
            <option value="">{selectedPatient ? `اختر موعد (${patientAppointments.length} متاح)` : 'اختر مريضاً أولاً'}</option>
            {patientAppointments.map(a => (
              <option key={a.id} value={a.id}>
                {a.appointment_date} — {a.start_time} ({a.status})
              </option>
            ))}
          </select>
          {treatmentHint && (
            <div style={{
              marginTop: 6, padding: '7px 12px', background: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--primary)', fontWeight: 600,
            }}>
              🔩 تم حساب {treatmentHint.count} علاج بإجمالي {Number(treatmentHint.total).toLocaleString('ar-SA')} IQD — يمكنك تعديل المبلغ
            </div>
          )}
        </div>

        {/* ── Amounts ── */}
        <div className="field-group">
          <label className="field-label">💵 المبلغ الإجمالي *</label>
          <input name="total_amount" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
            type="number" step="0.01" min="0" placeholder="0.00" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">💳 المبلغ المدفوع</label>
          <input name="paid_amount" value={form.paid_amount} onChange={handleChange}
            type="number" step="0.01" min="0" placeholder="0.00" className="field-input" />
        </div>

        {/* ── Live Balance ── */}
        {total > 0 && (
          <div className="field-group form-grid-full">
            <label className="field-label">الرصيد المحسوب</label>
            <div style={{
              padding: '10px 14px', background: 'var(--bg-elevated)',
              border: `1px solid ${balance > 0 ? 'rgba(251,191,36,.3)' : 'rgba(52,211,153,.3)'}`,
              borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>المتبقي</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: balance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {balance.toLocaleString('ar-SA')} IQD
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${paidPct}%`, background: paidPct === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 999, transition: 'width .3s' }} />
              </div>
            </div>
          </div>
        )}

        <div className="field-group">
          <label className="field-label">📆 تاريخ الاستحقاق</label>
          <input name="due_date" value={form.due_date} onChange={handleChange} type="date" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">حالة الدفع</label>
          <select name="status" value={form.status} onChange={handleChange} className="field-input">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading || !selectedPatient}>
        {loading ? '⏳ جارٍ الحفظ...' : '💰 إنشاء الفاتورة'}
      </button>
    </form>
  );
};

export default BillForm;