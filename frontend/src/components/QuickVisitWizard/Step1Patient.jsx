import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

/** Debounce helper */
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function Step1Patient({ data, onChange }) {
  /* mode: 'search' | 'new' */
  const [mode, setMode] = useState(data.patient_id ? 'search' : (data.isNew ? 'new' : 'search'));
  const [query, setQuery] = useState(data.patient_id ? `${data.first_name} ${data.last_name}` : '');
  const [results, setResults] = useState([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(
    data.patient_id ? { id: data.patient_id, first_name: data.first_name, last_name: data.last_name, phone: data.phone } : null
  );
  const wrapRef = useRef();

  /* Search API */
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setDropOpen(false); return; }
    setSearching(true);
    try {
      const res = await api.get('/patients', { params: { search: q } });
      const all = res.data || [];
      const filtered = all.filter(p =>
        `${p.first_name} ${p.last_name} ${p.phone || ''}`.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
      setDropOpen(filtered.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 280);

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setQuery(`${p.first_name} ${p.last_name}`);
    setDropOpen(false);
    onChange({
      patient_id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone || '',
      gender: p.gender || '',
      isNew: false,
    });
  };

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setSelectedPatient(null);
    onChange({ patient_id: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', isNew: false });
    debouncedSearch(v);
  };

  const handleNewField = (e) => {
    onChange({ ...data, [e.target.name]: e.target.value, patient_id: '', isNew: true });
  };

  const switchToNew = () => {
    setMode('new');
    setSelectedPatient(null);
    setQuery('');
    setDropOpen(false);
    onChange({ patient_id: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', isNew: true });
  };

  const switchToSearch = () => {
    setMode('search');
    onChange({ patient_id: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', isNew: false });
  };

  return (
    <div className="qvw-step-content">
      {/* Mode Toggle */}
      <div className="qvw-mode-toggle">
        <button
          type="button"
          className={`qvw-mode-btn ${mode === 'search' ? 'active' : ''}`}
          onClick={switchToSearch}
        >
          <span>🔍</span> بحث عن مريض موجود
        </button>
        <button
          type="button"
          className={`qvw-mode-btn ${mode === 'new' ? 'active' : ''}`}
          onClick={switchToNew}
        >
          <span>➕</span> إضافة مريض جديد
        </button>
      </div>

      {/* ─── SEARCH MODE ─── */}
      {mode === 'search' && (
        <div className="qvw-section" ref={wrapRef}>
          <div className="qvw-autocomplete-wrap">
            <div className="qvw-autocomplete-input-wrap">
              <span className="qvw-ac-icon">
                {searching ? (
                  <span className="qvw-spinner-sm" />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </span>
              <input
                id="qvw-patient-search"
                type="text"
                className="field-input qvw-ac-input"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={query}
                onChange={handleQueryChange}
                autoComplete="off"
              />
              {selectedPatient && (
                <span className="qvw-ac-check">✓</span>
              )}
            </div>
            {dropOpen && results.length > 0 && (
              <div className="qvw-ac-dropdown">
                {results.map(p => (
                  <div
                    key={p.id}
                    className="qvw-ac-result"
                    onMouseDown={() => selectPatient(p)}
                  >
                    <div className="qvw-ac-avatar">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="qvw-ac-info">
                      <div className="qvw-ac-name">{p.first_name} {p.last_name}</div>
                      {p.phone && <div className="qvw-ac-meta">📞 {p.phone}</div>}
                    </div>
                    <div className="qvw-ac-arrow">←</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPatient && (
            <div className="qvw-selected-card">
              <div className="qvw-selected-avatar">
                {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
              </div>
              <div className="qvw-selected-info">
                <div className="qvw-selected-name">{selectedPatient.first_name} {selectedPatient.last_name}</div>
                {selectedPatient.phone && <div className="qvw-selected-meta">📞 {selectedPatient.phone}</div>}
                <span className="badge badge-success" style={{ marginTop: 4, display: 'inline-flex' }}>مريض موجود ✓</span>
              </div>
            </div>
          )}

          {!selectedPatient && query && !searching && results.length === 0 && (
            <div className="qvw-no-results">
              لا توجد نتائج — <button type="button" className="qvw-link-btn" onClick={switchToNew}>إضافة مريض جديد</button>
            </div>
          )}
        </div>
      )}

      {/* ─── NEW PATIENT MODE ─── */}
      {mode === 'new' && (
        <div className="qvw-section">
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label">الاسم الأول *</label>
              <input
                name="first_name"
                value={data.first_name}
                onChange={handleNewField}
                placeholder="أدخل الاسم الأول"
                className="field-input"
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">اسم العائلة *</label>
              <input
                name="last_name"
                value={data.last_name}
                onChange={handleNewField}
                placeholder="أدخل اسم العائلة"
                className="field-input"
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">رقم الهاتف</label>
              <input
                name="phone"
                type="tel"
                value={data.phone}
                onChange={handleNewField}
                placeholder="07xxxxxxxxx"
                className="field-input"
              />
            </div>
            <div className="field-group">
              <label className="field-label">تاريخ الميلاد *</label>
              <input
                name="date_of_birth"
                type="date"
                value={data.date_of_birth}
                onChange={handleNewField}
                className="field-input"
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">الجنس</label>
              <select name="gender" value={data.gender} onChange={handleNewField} className="field-input">
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
