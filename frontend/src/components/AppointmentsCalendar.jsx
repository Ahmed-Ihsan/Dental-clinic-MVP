import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Plus, X, Clock, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AppointmentDetailModal from './AppointmentDetailModal.jsx';
import { useAuth } from '../AuthContext.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const STATUS_CONFIG = {
  scheduled: { label: 'مجدول',  bg: '#FEF3C7', color: '#B45309', border: '#FCD34D', dot: '#F59E0B' },
  confirmed:  { label: 'مؤكد',   bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD', dot: '#3B82F6' },
  completed:  { label: 'مكتمل',  bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  cancelled:  { label: 'ملغي',   bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', dot: '#EF4444' },
};

const MAX_CHIPS = 3; // max chips visible per cell before "+N more"

// ─── Utilities ────────────────────────────────────────────────────────────────

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Build a 6-row × 7-col grid (42 cells) for a given year/month.
// Week starts on Sunday (getDay() = 0).
function buildGrid(year, month) {
  const firstDow    = new Date(year, month, 1).getDay();       // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();      // days in prev month
  const cells       = [];

  // Padding from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day: d, month: pm, year: py, current: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, current: true });
  }

  // Padding from next month (fill to 42 cells = 6 rows)
  const nm = month === 11 ? 0  : month + 1;
  const ny = month === 11 ? year + 1 : year;
  let d = 1;
  while (cells.length < 42) {
    cells.push({ day: d++, month: nm, year: ny, current: false });
  }

  return cells;
}

// ─── AppointmentChip ──────────────────────────────────────────────────────────

function AppointmentChip({ apt, onClick }) {
  const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
  return (
    <button
      type="button"
      className="cal-chip"
      style={{ '--chip-bg': cfg.bg, '--chip-color': cfg.color, '--chip-border': cfg.border }}
      onClick={e => { e.stopPropagation(); onClick(apt); }}
      title={`${apt.patientName} — ${apt.start_time}`}
    >
      <Clock size={9} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span className="cal-chip-time">{apt.start_time}</span>
      <span className="cal-chip-sep">·</span>
      <span className="cal-chip-name">{apt.patientName}</span>
    </button>
  );
}

// ─── DayCell ──────────────────────────────────────────────────────────────────

function DayCell({ cell, byDate, today, onChipClick, onCellClick, onMoreClick }) {
  const key     = dateKey(cell.year, cell.month, cell.day);
  const isToday = key === today;
  const apts    = byDate[key] || [];

  return (
    <div
      className={[
        'cal-cell',
        !cell.current   ? 'cal-cell--out'   : '',
        isToday         ? 'cal-cell--today' : '',
        apts.length > 0 ? 'cal-cell--has-events' : '',
      ].join(' ')}
      onClick={() => cell.current && onCellClick(key)}
    >
      <div className="cal-cell-top">
        <span className={`cal-day-num${isToday ? ' cal-day-num--today' : ''}`}>
          {cell.day}
        </span>
        {cell.current && apts.length > 0 && (
          <span className="cal-day-badge">{apts.length}</span>
        )}
      </div>

      <div className="cal-chips">
        {apts.slice(0, MAX_CHIPS).map(apt => (
          <AppointmentChip key={apt.id} apt={apt} onClick={onChipClick} />
        ))}
        {apts.length > MAX_CHIPS && (
          <button
            type="button"
            className="cal-chip-more"
            onClick={e => { e.stopPropagation(); onMoreClick(key); }}
          >
            <Plus size={10} /> {apts.length - MAX_CHIPS} أكثر
          </button>
        )}
      </div>

      {/* Hover hint for empty cells */}
      {cell.current && apts.length === 0 && (
        <div className="cal-cell-add-hint">
          <Plus size={14} />
        </div>
      )}
    </div>
  );
}

// ─── DayListModal ──────────────────────────────────────────────────────

function DayListModal({ date, appointments, onClose, onAddNew, onSelectApt }) {
  const [y, m, d] = date.split('-');
  const displayDate = `${d} ${MONTHS_AR[parseInt(m, 10) - 1]} ${y}`;

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal-box cal-daylist-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cal-modal-header">
          <div className="cal-modal-title">
            <div className="cal-modal-icon"><Calendar size={16} /></div>
            <div>
              <div className="cal-modal-heading">{displayDate}</div>
              <div className="cal-modal-subheading">
                {appointments.length > 0 ? `${appointments.length} موعد مسجّل` : 'لا توجد مواعيد'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAddNew}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}
            >
              <Plus size={14} /> موعد جديد
            </button>
            <button className="cal-modal-close" onClick={onClose} type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="cal-daylist-body">
          {appointments.length === 0 ? (
            <div className="cal-daylist-empty">
              <Calendar size={34} style={{ opacity: 0.25, marginBottom: 10 }} />
              <p>لا توجد مواعيد في هذا اليوم</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>اضغط على "موعد جديد" لإضافة أول موعد</p>
            </div>
          ) : (
            <div className="cal-daylist-items">
              {appointments.map(apt => {
                const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                return (
                  <button
                    key={apt.id}
                    type="button"
                    className="cal-daylist-item"
                    onClick={() => onSelectApt(apt)}
                    style={{ '--item-dot': cfg.dot }}
                  >
                    <div className="cal-daylist-time">
                      <Clock size={12} />
                      <span>{apt.start_time}</span>
                      {apt.end_time && (
                        <><span className="cal-daylist-sep">—</span><span>{apt.end_time}</span></>
                      )}
                    </div>
                    <div className="cal-daylist-info">
                      <div className="cal-daylist-patient">
                        <User size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                        <span>{apt.patientName}</span>
                      </div>
                      {apt.doctorName && apt.doctorName !== 'غير محدد' && (
                        <div className="cal-daylist-doctor">
                          <Stethoscope size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                          <span>{apt.doctorName}</span>
                        </div>
                      )}
                      {apt.notes && (
                        <div className="cal-daylist-notes">{apt.notes}</div>
                      )}
                    </div>
                    <div
                      className="cal-daylist-badge"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NewAppointmentModal ──────────────────────────────────────────────────────

function NewAppointmentModal({ date, patients, professionals, onClose, onSave, user }) {
  const isDoctor  = user?.role === 'doctor';
  const myProfIds = user?.professional_ids ?? [];
  const [form, setForm] = useState({
    patient_id: '', appointment_date: date,
    start_time: '', end_time: '',
    dentist_id: isDoctor && myProfIds.length === 1 ? myProfIds[0] : '',
    status: 'scheduled', notes: '',
  });
  const [loading, setLoading] = useState(false);

  /* ── Patient typeahead (filters the already-fetched patients prop) ── */
  const [patientQuery,    setPatientQuery]    = useState('');
  const [patientResults,  setPatientResults]  = useState([]);
  const [showDrop,        setShowDrop]        = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const wrapRef = useRef();
  const debRef  = useRef();

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const searchPatients = q => {
    if (!q.trim()) { setPatientResults([]); setShowDrop(false); return; }
    const r = patients
      .filter(p => `${p.first_name} ${p.last_name} ${p.phone || ''}`.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 7);
    setPatientResults(r);
    setShowDrop(r.length > 0);
  };

  const handlePatientQuery = e => {
    const v = e.target.value;
    setPatientQuery(v);
    setSelectedPatient(null);
    setForm(f => ({ ...f, patient_id: '' }));
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchPatients(v), 180);
  };

  const selectPatient = p => {
    setSelectedPatient(p);
    setPatientQuery(`${p.first_name} ${p.last_name}`);
    setShowDrop(false);
    setForm(f => ({ ...f, patient_id: p.id }));
  };

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.patient_id) { toast.error('يرجى اختيار مريض'); return; }
    if (!form.start_time)  { toast.error('يرجى تحديد وقت البداية'); return; }
    setLoading(true);
    try {
      await api.post('/appointments', form);
      toast.success('تم إضافة الموعد بنجاح');
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ في حفظ الموعد');
    } finally {
      setLoading(false);
    }
  };

  const [y, m, d] = date.split('-');
  const displayDate = `${d} ${MONTHS_AR[parseInt(m, 10) - 1]} ${y}`;

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cal-modal-header">
          <div className="cal-modal-title">
            <div className="cal-modal-icon"><Calendar size={16} /></div>
            <div>
              <div className="cal-modal-heading">موعد جديد</div>
              <div className="cal-modal-subheading">{displayDate}</div>
            </div>
          </div>
          <button className="cal-modal-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="cal-modal-body">
          <div className="cal-form-grid">

            {/* ── Patient Typeahead (full width) ── */}
            <div className="field-group cal-form-full" ref={wrapRef} style={{ position: 'relative' }}>
              <label className="field-label" htmlFor="cal-patient-input">
                <User size={12} style={{ display: 'inline', marginLeft: 4 }} />
                المريض *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="cal-patient-input"
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
                    borderRadius: 'var(--radius-md)', zIndex: 300, overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                  }}>
                  {patientResults.map(p => (
                    <div
                      key={p.id}
                      role="option"
                      aria-selected="false"
                      onMouseDown={() => selectPatient(p)}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
                      }}>{p.first_name?.[0]}{p.last_name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                        {p.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📞 {p.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor */}
            <div className="field-group">
              <label className="field-label">
                <Stethoscope size={12} style={{ display: 'inline', marginLeft: 4 }} />
                الطبيب
              </label>
              {isDoctor && myProfIds.length === 1 ? (
                <div className="field-input" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔒 {professionals.find(p => p.id === myProfIds[0]) ? `${professionals.find(p => p.id === myProfIds[0]).first_name} ${professionals.find(p => p.id === myProfIds[0]).last_name}` : 'طبيبك المعيّن'}
                </div>
              ) : (
                <select name="dentist_id" value={form.dentist_id} onChange={change} className="field-input">
                  <option value="">اختر طبيباً...</option>
                  {(isDoctor ? professionals.filter(p => myProfIds.includes(p.id)) : professionals).map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Start time */}
            <div className="field-group">
              <label className="field-label">وقت البداية *</label>
              <input type="time" name="start_time" value={form.start_time}
                onChange={change} className="field-input" required />
            </div>

            {/* End time */}
            <div className="field-group">
              <label className="field-label">وقت النهاية</label>
              <input type="time" name="end_time" value={form.end_time}
                onChange={change} className="field-input" />
            </div>

            {/* Status */}
            <div className="field-group">
              <label className="field-label">الحالة</label>
              <select name="status" value={form.status} onChange={change} className="field-input">
                <option value="scheduled">مجدول</option>
                <option value="confirmed">مؤكد</option>
              </select>
            </div>

            {/* Notes (full width) */}
            <div className="field-group cal-form-full">
              <label className="field-label">ملاحظات</label>
              <textarea name="notes" value={form.notes} onChange={change}
                rows={2} className="field-input"
                placeholder="ملاحظات اختيارية..." />
            </div>

          </div>

          <div className="cal-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || !selectedPatient}>
              {loading ? 'جاري الحفظ...' : 'إضافة الموعد'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AppointmentsCalendar (Main) ──────────────────────────────────────────────

export default function AppointmentsCalendar() {
  const { user } = useAuth();
  const today = localToday();
  const now   = new Date();

  const [viewDate,    setViewDate]    = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [appointments, setAppointments] = useState([]);
  const [patients,    setPatients]    = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedApt,    setSelectedApt]    = useState(null);  // detail modal
  const [newAptDate,     setNewAptDate]     = useState(null);  // create modal
  const [selectedDayList, setSelectedDayList] = useState(null); // day list modal
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh,     setRefresh]     = useState(0);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptRes, patRes, proRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/professionals'),
      ]);
      setAppointments(aptRes.data);
      setPatients(patRes.data);
      setProfessionals(proRes.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      toast.error('حدث خطأ في تحميل بيانات التقويم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refresh]);

  // ── Lookup maps ──────────────────────────────────────────────────────────────

  const patientMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p.id] = `${p.first_name} ${p.last_name}`; });
    return m;
  }, [patients]);

  const professionalMap = useMemo(() => {
    const m = {};
    professionals.forEach(p => { m[p.id] = `${p.first_name} ${p.last_name}`; });
    return m;
  }, [professionals]);

  // ── Enriched appointments (names resolved) ───────────────────────────────────

  const enriched = useMemo(() =>
    appointments.map(a => ({
      ...a,
      patientName: patientMap[a.patient_id]  || `مريض #${a.patient_id}`,
      doctorName:  professionalMap[a.dentist_id] || (a.dentist_id ? `طبيب #${a.dentist_id}` : 'غير محدد'),
    })),
    [appointments, patientMap, professionalMap]
  );

  // ── Group by date (O(1) per cell lookup) ─────────────────────────────────────

  const byDate = useMemo(() => {
    const map = {};
    enriched.forEach(apt => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return;
      const key = apt.appointment_date;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    // Sort each day by start_time
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    );
    return map;
  }, [enriched, statusFilter]);

  // ── Cell click: show day list if appointments exist, else open new modal directly
  const handleCellClick = useCallback((key) => {
    const dayApts = byDate[key] || [];
    if (dayApts.length > 0) {
      setSelectedDayList(key);
    } else {
      setNewAptDate(key);
    }
  }, [byDate]);

  // ── Calendar grid ─────────────────────────────────────────────────────────────

  const cells = useMemo(() => buildGrid(viewDate.year, viewDate.month), [viewDate]);

  // ── KPIs for this month ───────────────────────────────────────────────────────

  const monthPrefix = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}`;
  const monthApts   = useMemo(() =>
    enriched.filter(a =>
      a.appointment_date?.startsWith(monthPrefix) &&
      (statusFilter === 'all' || a.status === statusFilter)
    ),
    [enriched, monthPrefix, statusFilter]
  );

  const kpi = useMemo(() => {
    const count = (s) => monthApts.filter(a => a.status === s).length;
    return {
      total:     monthApts.length,
      scheduled: count('scheduled'),
      confirmed: count('confirmed'),
      completed: count('completed'),
      cancelled: count('cancelled'),
    };
  }, [monthApts]);

  // ── Navigation ────────────────────────────────────────────────────────────────

  const prevMonth = () => setViewDate(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
  );
  const nextMonth = () => setViewDate(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
  );
  const goToday = () => {
    const n = new Date();
    setViewDate({ year: n.getFullYear(), month: n.getMonth() });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="cal-loading">
        <div className="cal-spinner" />
        <span>جاري تحميل التقويم...</span>
      </div>
    );
  }

  return (
    <div className="cal-page" dir="rtl">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="page-header animate-in">
        <div>
          <h1 className="page-header-title">
            <Calendar size={22} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }} />
            إدارة المواعيد
          </h1>
          <p className="page-header-subtitle">تقويم شهري تفاعلي — اضغط على أي يوم لعرض مواعيده وإضافة جديد</p>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="cal-kpi-strip animate-in">
        {[
          { label: 'إجمالي الشهر',  value: kpi.total,     color: 'var(--primary)'  },
          { label: 'مجدول',         value: kpi.scheduled,  color: '#F59E0B'         },
          { label: 'مؤكد',          value: kpi.confirmed,  color: '#3B82F6'         },
          { label: 'مكتمل',         value: kpi.completed,  color: '#10B981'         },
          { label: 'ملغي',          value: kpi.cancelled,  color: '#EF4444'         },
        ].map(k => (
          <div key={k.label} className="cal-kpi-card">
            <span className="cal-kpi-val" style={{ color: k.color }}>{k.value}</span>
            <span className="cal-kpi-lbl">{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── Calendar Card ──────────────────────────────────────────────────── */}
      <div className="cal-card animate-in animate-in-delay-1">

        {/* Toolbar */}
        <div className="cal-toolbar">
          {/* Navigation */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth} title="الشهر السابق">
              <ChevronRight size={17} />
            </button>
            <div className="cal-month-label">
              <span className="cal-month-name">{MONTHS_AR[viewDate.month]}</span>
              <span className="cal-year-name">{viewDate.year}</span>
            </div>
            <button className="cal-nav-btn" onClick={nextMonth} title="الشهر التالي">
              <ChevronLeft size={17} />
            </button>
            <button className="cal-today-btn" onClick={goToday}>اليوم</button>
          </div>

          {/* Filter + Legend */}
          <div className="cal-toolbar-end">
            <div className="cal-legend">
              {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                <div key={k} className="cal-legend-item">
                  <span className="cal-legend-dot" style={{ background: cfg.dot }} />
                  <span>{cfg.label}</span>
                </div>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="cal-filter"
            >
              <option value="all">جميع الحالات</option>
              <option value="scheduled">مجدول</option>
              <option value="confirmed">مؤكد</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="cal-header-row">
          {DAYS_AR.map(day => (
            <div key={day} className="cal-header-cell">{day}</div>
          ))}
        </div>

        {/* Grid body */}
        <div className="cal-grid">
          {cells.map((cell, i) => (
            <DayCell
              key={i}
              cell={cell}
              byDate={byDate}
              today={today}
              onChipClick={setSelectedApt}
              onCellClick={handleCellClick}
              onMoreClick={key => setSelectedDayList(key)}
            />
          ))}
        </div>
      </div>

      {/* ── Day List Modal ────────────────────────────────────────────── */}
      {selectedDayList && (
        <DayListModal
          date={selectedDayList}
          appointments={byDate[selectedDayList] || []}
          onClose={() => setSelectedDayList(null)}
          onAddNew={() => { setSelectedDayList(null); setNewAptDate(selectedDayList); }}
          onSelectApt={apt => { setSelectedDayList(null); setSelectedApt(apt); }}
        />
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {selectedApt && (
        <AppointmentDetailModal
          appointment={selectedApt}
          onClose={() => setSelectedApt(null)}
          onUpdate={() => { setSelectedApt(null); setRefresh(r => r + 1); }}
        />
      )}

      {/* ── New Appointment Modal ─────────────────────────────────────────────── */}
      {newAptDate && (
        <NewAppointmentModal
          date={newAptDate}
          patients={patients}
          professionals={professionals}
          onClose={() => setNewAptDate(null)}
          onSave={() => setRefresh(r => r + 1)}
          user={user}
        />
      )}
    </div>
  );
}
