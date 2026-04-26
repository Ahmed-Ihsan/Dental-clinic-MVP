import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Calendar, Bell, Zap, ChevronLeft,
} from 'lucide-react';
import ExpenseStatCard from './Expenses/ExpenseStatCard';
import api from '../services/api';

// ── Utilities ────────────────────────────────────────────────────────────────

const toDateStr = (d) => {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

const fmtCurrency = (n) => `${Number(n||0).toLocaleString('ar-SA')} IQD`;

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const display = h > 12 ? h - 12 : h || 12;
  return `${display}:${String(m).padStart(2,'0')} ${h >= 12 ? 'م' : 'ص'}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'صباح الخير',  icon: '☀️' };
  if (h >= 12 && h < 17) return { text: 'مساء الخير',  icon: '🌤️' };
  if (h >= 17 && h < 21) return { text: 'مساء النور',  icon: '🌆' };
  return                         { text: 'مرحباً بك',  icon: '🌙' };
};

const STATUS = {
  scheduled: { label: 'مجدول', cls: 'db-s--scheduled' },
  confirmed:  { label: 'مؤكد',  cls: 'db-s--confirmed' },
  completed:  { label: 'مكتمل', cls: 'db-s--completed' },
  cancelled:  { label: 'ملغي',  cls: 'db-s--cancelled' },
};

const PALETTE = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
const avatarBg = (id) => PALETTE[(id || 0) % PALETTE.length];
const initials  = (n) => (n||'').trim().split(/\s+/).map(w => w[0]||'').slice(0,2).join('').toUpperCase();

// ── Chart Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <div className="db-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="db-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span><span>{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [raw, setRaw]       = useState({ appointments:[], patients:[], bills:[], expenses:[], professionals:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [apptR, patR, billR, expR, proR] = await Promise.all([
          api.get('/appointments'),
          api.get('/patients'),
          api.get('/bills'),
          api.get('/expenses'),
          api.get('/professionals'),
        ]);
        setRaw({
          appointments:  apptR.data || [],
          patients:      patR.data  || [],
          bills:         billR.data || [],
          expenses:      expR.data  || [],
          professionals: proR.data  || [],
        });
      } catch (e) { console.error('Dashboard:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const today    = toDateStr(new Date());
  const tomorrow = toDateStr(new Date(Date.now() + 86400000));

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const { bills, patients } = raw;
    const currentMonth = today.substring(0, 7);
    return {
      todayRev:    bills.filter(b => b.created_at?.substring(0,10) === today).reduce((s,b) => s+(b.paid_amount||0), 0),
      monthRev:    bills.filter(b => b.created_at?.substring(0,7)  === currentMonth).reduce((s,b) => s+(b.paid_amount||0), 0),
      outstanding: bills.filter(b => (b.balance||0) > 0).reduce((s,b) => s+(b.balance||0), 0),
      patients:    patients.length,
    };
  }, [raw, today]);

  // ── Today's Schedule ───────────────────────────────────────────────────────
  const schedule = useMemo(() => {
    const { appointments, patients, professionals } = raw;
    return appointments
      .filter(a => a.appointment_date === today)
      .sort((a, b) => (a.start_time||'').localeCompare(b.start_time||''))
      .map(a => {
        const pat = patients.find(p => String(p.id) === String(a.patient_id));
        const doc = professionals.find(d => String(d.id) === String(a.dentist_id));
        return {
          ...a,
          patientName: pat ? `${pat.first_name} ${pat.last_name}` : `مريض #${a.patient_id}`,
          doctorName:  doc ? `د. ${doc.first_name} ${doc.last_name}` : '',
        };
      });
  }, [raw, today]);

  // ── Smart Alerts ──────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const { bills, appointments, expenses } = raw;
    const list = [];
    const overdue = bills.filter(b => (b.balance||0) > 0);
    if (overdue.length) list.push({ id:'ov', type:'warning', icon:'⚠️', text:`${overdue.length} فاتورة تحتوي على مبالغ غير مسددة`, to:'/bills', action:'عرض الفواتير' });
    const tmrw = appointments.filter(a => a.appointment_date === tomorrow);
    if (tmrw.length)   list.push({ id:'tm', type:'info',    icon:'⏰', text:`${tmrw.length} موعد غداً يحتاج إلى تأكيد`,               to:'/appointments', action:'عرض المواعيد' });
    const debts = expenses.filter(e => e.category === 'doctor' && e.status === 'debt');
    if (debts.length)  list.push({ id:'db', type:'danger',  icon:'💸', text:`${debts.length} سلفة دكتور معلقة لم تُحسم من الرواتب`, to:'/finance',     action:'المصروفات' });
    if (!list.length)  list.push({ id:'ok', type:'success', icon:'✅', text:'كل شيء على ما يرام، لا تنبيهات اليوم!',                  to:null,            action:null });
    return list;
  }, [raw, tomorrow]);

  // ── 7-Day Revenue vs Expenses Trend ───────────────────────────────────────
  const trend = useMemo(() => {
    const { bills, expenses } = raw;
    return Array.from({ length: 7 }, (_, i) => {
      const d  = new Date(Date.now() - (6 - i) * 86400000);
      const ds = toDateStr(d);
      return {
        name:        d.toLocaleDateString('ar-SA', { weekday:'short', day:'numeric' }),
        'الإيرادات': Math.round(bills.filter(b => b.created_at?.substring(0,10) === ds).reduce((s,b) => s+(b.paid_amount||0), 0)),
        'المصروفات': Math.round(expenses.filter(e => e.date === ds).reduce((s,e) => s+(e.amount||0), 0)),
      };
    });
  }, [raw]);

  const { text: greetTxt, icon: greetIcon } = getGreeting();

  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner" />
      <span>جاري تحميل لوحة التحكم…</span>
    </div>
  );

  return (
    <div className="db-page" dir="rtl">

      {/* ── Greeting Banner ── */}
      <div className="db-greeting animate-in">
        <div className="db-greeting-left">
          <span className="db-greeting-icon">{greetIcon}</span>
          <div>
            <h1 className="db-greeting-title">{greetTxt}، إليك ملخص العيادة اليوم</h1>
            <p className="db-greeting-date">
              {new Date().toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
        </div>
        <Link to="/appointments" className="db-greeting-btn">
          <Calendar size={15} /> عرض الجدول الكامل
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="db-kpi-grid animate-in">
        <ExpenseStatCard label="إيرادات اليوم"   value={kpi.todayRev}    icon="💰" variant="success" sub="المبالغ المحصلة اليوم" />
        <ExpenseStatCard label="إيرادات الشهر"   value={kpi.monthRev}    icon="📈" variant="primary" sub="الإيرادات الشهرية الإجمالية" />
        <ExpenseStatCard label="مديونيات معلقة"  value={kpi.outstanding} icon="⚠️" variant="danger"  sub="فواتير غير مسددة" />
        <ExpenseStatCard label="المرضى النشطون"  value={kpi.patients}    icon="👥" variant="accent"  unit="" sub="إجمالي المسجلين" />
      </div>

      {/* ── Middle Row: Schedule + Alerts ── */}
      <div className="db-mid-grid animate-in">

        {/* Today's Schedule */}
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title"><Calendar size={15} /> جدول اليوم</div>
            <span className="db-card-badge">{schedule.length} موعد</span>
          </div>
          <div className="db-timeline">
            {schedule.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-emoji">🎉</div>
                <div className="db-empty-title">لا مواعيد اليوم!</div>
                <div className="db-empty-sub">استمتع بيومك 🌿</div>
              </div>
            ) : schedule.map((a, i) => {
              const s = STATUS[a.status] || { label: a.status, cls: 'db-s--ghost' };
              return (
                <div key={a.id} className="db-tl-row">
                  <div className="db-tl-aside">
                    <span className="db-tl-time">{fmtTime(a.start_time)}</span>
                    <div className={`db-tl-dot ${s.cls}`} />
                    {i < schedule.length - 1 && <div className="db-tl-line" />}
                  </div>
                  <div className="db-tl-body">
                    <div className="db-tl-avatar" style={{ background: avatarBg(a.patient_id) }}>
                      {initials(a.patientName)}
                    </div>
                    <div className="db-tl-info">
                      <div className="db-tl-name">{a.patientName}</div>
                      {a.doctorName && <div className="db-tl-doc">{a.doctorName}</div>}
                    </div>
                    <span className={`db-status-badge ${s.cls}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/appointments" className="db-card-footer-link">
            عرض الجدول الكامل <ChevronLeft size={14} />
          </Link>
        </div>

        {/* Alerts + Quick Actions column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Smart Alerts */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title"><Bell size={15} /> تنبيهات ذكية</div>
            </div>
            <div className="db-alerts">
              {alerts.map(a => (
                <div key={a.id} className={`db-alert db-alert--${a.type}`}>
                  <span className="db-alert-icon">{a.icon}</span>
                  <div className="db-alert-content">
                    <span className="db-alert-text">{a.text}</span>
                    {a.to && <Link to={a.to} className="db-alert-link">{a.action} ←</Link>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-title"><Zap size={15} /> إجراءات سريعة</div>
            </div>
            <div className="db-quick-grid">
              {[
                { to:'/patients',     icon:'👤', lbl:'مريض جديد',  v:'blue'  },
                { to:'/appointments', icon:'📅', lbl:'موعد جديد',  v:'teal'  },
                { to:'/bills',        icon:'💰', lbl:'فاتورة',      v:'green' },
                { to:'/finance',      icon:'�', lbl:'المالية',      v:'amber' },
                { to:'/staff',        icon:'👥', lbl:'الفريق',       v:'violet'},
              ].map(q => (
                <Link key={q.to} to={q.to} className={`db-quick db-quick--${q.v}`}>
                  <span className="db-quick-icon">{q.icon}</span>
                  <span className="db-quick-lbl">{q.lbl}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Revenue vs Expenses Trend Chart ── */}
      <div className="db-card db-chart-card animate-in">
        <div className="db-card-header">
          <div className="db-card-title"><TrendingUp size={15} /> الإيرادات مقابل المصروفات — آخر 7 أيام</div>
        </div>
        <div className="db-chart-body">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ top:10, right:16, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="name" tick={{ fill:'#94A3B8', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#94A3B8', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span style={{ color:'#94A3B8', fontSize:12 }}>{v}</span>} />
              <Area type="monotone" dataKey="الإيرادات" stroke="#10B981" strokeWidth={2.5} fill="url(#gRev)" dot={{ r:4, fill:'#10B981', strokeWidth:0 }} activeDot={{ r:6 }} />
              <Area type="monotone" dataKey="المصروفات" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gExp)" dot={{ r:4, fill:'#F59E0B', strokeWidth:0 }} activeDot={{ r:6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;