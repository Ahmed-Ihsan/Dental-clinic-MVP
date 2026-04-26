import { useState, useEffect, useCallback, useRef } from 'react';
import GlobalModal from '../GlobalModal';
import api from '../../services/api';

const CATEGORIES = [
  { value: 'تقويم الأسنان',    icon: '🦷' },
  { value: 'زراعة الأسنان',    icon: '🔩' },
  { value: 'علاج العصب',       icon: '🩺' },
  { value: 'تبييض الأسنان',    icon: '✨' },
  { value: 'تركيبات وتيجان',   icon: '👑' },
  { value: 'طب الأسنان العام',  icon: '🏥' },
  { value: 'جراحة الأسنان',    icon: '🔪' },
  { value: 'طب أسنان الأطفال', icon: '🧒' },
  { value: 'خدمات أخرى',       icon: '📋' },
];

const STATUS_CFG = {
  paid:    { bg: 'var(--success-bg)', color: 'var(--success)', label: '✅ مدفوع بالكامل' },
  partial: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: '⚠️ مدفوع جزئياً' },
  unpaid:  { bg: 'var(--danger-bg)',  color: 'var(--danger)',  label: '🔴 غير مدفوع' },
};

export default function QuickPaymentModal({ isOpen, onClose, onSuccess }) {
  const [patient,   setPatient]   = useState(null);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);

  const [category,  setCategory]  = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [paid,      setPaid]      = useState('');

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const debRef  = useRef();
  const wrapRef = useRef();

  /* ── Reset on close ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      setPatient(null); setQuery(''); setResults([]); setShowDrop(false);
      setCategory(''); setTotalCost(''); setPaid('');
      setSaving(false); setError('');
    }
  }, [isOpen]);

  /* ── Patient search ────────────────────────────────────────────────────── */
  const searchPatients = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      const res = await api.get('/patients', { params: { search: q } });
      const filtered = (res.data || [])
        .filter(p =>
          `${p.first_name} ${p.last_name} ${p.phone || ''}`
            .toLowerCase().includes(q.toLowerCase())
        )
        .slice(0, 6);
      setResults(filtered);
      setShowDrop(filtered.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setPatient(null);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchPatients(v), 280);
  };

  const selectPatient = (p) => {
    setPatient(p);
    setQuery(`${p.first_name} ${p.last_name}`);
    setShowDrop(false);
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Derived values ────────────────────────────────────────────────────── */
  const total   = parseFloat(totalCost) || 0;
  const paidNum = parseFloat(paid) || 0;
  const balance = Math.max(0, total - paidNum);
  const paidPct = total > 0 ? Math.min(100, Math.round((paidNum / total) * 100)) : 0;

  const billStatus =
    total > 0 && balance <= 0 ? 'paid'
    : paidNum > 0              ? 'partial'
    :                            'unpaid';

  const sc = STATUS_CFG[billStatus];

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient)        { setError('يرجى اختيار مريض من القائمة');                  return; }
    if (!category)       { setError('يرجى اختيار فئة العلاج');                       return; }
    if (total <= 0)      { setError('التكلفة الإجمالية يجب أن تكون أكبر من صفر');  return; }
    if (paidNum > total) { setError('المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي'); return; }

    setError('');
    setSaving(true);
    try {
      await api.post('/revenue/quick-payment', {
        patient_id:     patient.id,
        treatment_type: category,
        total_cost:     total,
        paid_amount:    paidNum,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error || 'حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} title="تسجيل إيراد سريع" icon="💰" size="md">
      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            color: 'var(--danger)', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── 1. Patient typeahead ── */}
        <div className="field-group" ref={wrapRef} style={{ position: 'relative' }}>
          <label className="field-label">👤 المريض *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="field-input"
              placeholder="ابحث عن مريض بالاسم أو رقم الهاتف..."
              value={query}
              onChange={handleQueryChange}
              onFocus={() => { if (results.length > 0) setShowDrop(true); }}
              autoComplete="off"
              style={patient ? { borderColor: 'var(--success)' } : {}}
            />
            {searching && (
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 12,
              }}>⏳</span>
            )}
            {patient && !searching && (
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--success)', fontSize: 14, fontWeight: 700,
              }}>✓</span>
            )}
          </div>

          {/* Dropdown results */}
          {showDrop && results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-md)',
              zIndex: 10001,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}>
              {results.map((p) => (
                <div
                  key={p.id}
                  onMouseDown={() => selectPatient(p)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid var(--border)',
                    background: 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
                  }}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                      {p.first_name} {p.last_name}
                    </div>
                    {p.phone && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📞 {p.phone}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. Treatment category ── */}
        <div className="field-group">
          <label className="field-label">🦷 فئة العلاج *</label>
          <select
            className="field-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">-- اختر فئة العلاج --</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.value}</option>
            ))}
          </select>
        </div>

        {/* ── 3. Amounts ── */}
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label">💵 التكلفة الإجمالية *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="field-input"
                placeholder="0"
                min="0"
                step="500"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none', userSelect: 'none',
              }}>IQD</span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">💳 المبلغ المدفوع</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="field-input"
                placeholder="0"
                min="0"
                step="500"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none', userSelect: 'none',
              }}>IQD</span>
            </div>
          </div>
        </div>

        {/* ── 4. Balance display + progress bar ── */}
        {total > 0 && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${sc.color}33`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>الرصيد المتبقي</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: sc.color }}>
                  {balance.toLocaleString('ar-SA')} IQD
                </span>
                <span style={{
                  background: sc.bg, color: sc.color,
                  borderRadius: 'var(--radius-sm)', padding: '2px 8px',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {sc.label}
                </span>
              </div>
            </div>

            <div>
              <div style={{
                height: 6, background: 'var(--bg-surface)',
                borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${paidPct}%`,
                  background: sc.color,
                  borderRadius: 999,
                  transition: 'width 0.35s ease',
                }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
              }}>
                <span>مدفوع: {paidPct}%</span>
                <span>من {total.toLocaleString('ar-SA')} IQD</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Actions ── */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1 }}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !patient || !category || total <= 0}
            style={{ flex: 2 }}
          >
            {saving ? '⏳ جارٍ الحفظ...' : '✅ تسجيل الإيراد'}
          </button>
        </div>

      </form>
    </GlobalModal>
  );
}
