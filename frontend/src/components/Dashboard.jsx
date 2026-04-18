import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ patients: 0, appointments: 0, treatments: 0, professionals: 0 });
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pR, aR, tR, prR] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments'),
          api.get('/treatments'),
          api.get('/professionals'),
        ]);
        const patients = pR.data;
        const appointments = aR.data;
        setStats({
          patients: patients.length,
          appointments: appointments.length,
          treatments: tR.data.length,
          professionals: prR.data.length,
        });
        setRecentPatients(patients.slice(-5).reverse());
        setRecentAppointments(appointments.slice(-5).reverse());

        // Calculate next 7 days
        const now = new Date();
        const next7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(now.getDate() + i);
          return date.toISOString().split('T')[0];
        });

        // Count appointments per day
        const dayCounts = {};
        appointments.forEach(a => {
          if (a.appointment_date && next7Days.includes(a.appointment_date)) {
            dayCounts[a.appointment_date] = (dayCounts[a.appointment_date] || 0) + 1;
          }
        });

        // Update chartData
        setChartData(next7Days.map(date => ({
          name: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' }),
          appointments: dayCounts[date] || 0
        })));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchData();
  }, []);



  const pieData = [
    { name: 'المرضى',      value: Math.max(1, stats.patients),      color: '#2DD4BF' },
    { name: 'المواعيد',    value: Math.max(1, stats.appointments),  color: '#818CF8' },
    { name: 'العلاجات',    value: Math.max(1, stats.treatments),    color: '#FBBF24' },
    { name: 'المتخصصين',   value: Math.max(1, stats.professionals), color: '#34D399' },
  ];

  const statCards = [
    { label: 'إجمالي المرضى',      value: stats.patients,      icon: '👤', variant: 'primary', desc: 'مريض مسجل' },
    { label: 'إجمالي المواعيد',    value: stats.appointments,  icon: '📅', variant: 'accent',  desc: 'موعد محدد' },
    { label: 'إجمالي العلاجات',    value: stats.treatments,    icon: '🦷', variant: 'warning', desc: 'علاج منجز'  },
    { label: 'إجمالي المتخصصين',   value: stats.professionals, icon: '👨‍⚕️', variant: 'success', desc: 'طبيب متخصص' },
  ];

  const quickActions = [
    { to: '/patients',      label: 'إضافة مريض',     icon: '👤', cls: 'qa-teal'   },
    { to: '/appointments',  label: 'جدولة موعد',     icon: '📅', cls: 'qa-green'  },
    { to: '/treatments',    label: 'إضافة علاج',     icon: '🦷', cls: 'qa-amber'  },
    { to: '/professionals', label: 'إضافة متخصص',   icon: '👨‍⚕️', cls: 'qa-violet' },
  ];

  const getStatusText = (s) => {
    const map = { scheduled: 'مجدول', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' };
    return map[s] || s;
  };

  const getStatusBadge = (s) => {
    const map = { scheduled: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
    return map[s] || 'badge-ghost';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#1C2438', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '12px 16px', direction: 'rtl'
        }}>
          <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">◈</span>
          لوحة التحكم
        </h1>
        <p className="page-header-subtitle">نظرة عامة على عيادة الأسنان</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid animate-in animate-in-delay-1">
        {quickActions.map(qa => (
          <Link key={qa.to} to={qa.to} className={`quick-action-card ${qa.cls}`}>
            <div className="quick-action-icon">{qa.icon}</div>
            <span className="quick-action-label">{qa.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid animate-in animate-in-delay-2">
        {statCards.map(card => (
          <div key={card.label} className={`stat-card ${card.variant}`}>
            <div className="stat-card-header">
              <span className="stat-card-label">{card.label}</span>
              <div className="stat-card-icon">{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-change">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid animate-in animate-in-delay-3">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">📊 المواعيد في الـ7 أيام القادمة</h3>
          </div>
          <div className="content-card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appointments" fill="#2DD4BF" name="المواعيد" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">🎯 توزيع البيانات</h3>
          </div>
          <div className="content-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-grid animate-in animate-in-delay-4">
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">👤 المرضى الأخيرون</h3>
            <Link to="/patients" className="btn btn-ghost btn-sm">عرض الكل</Link>
          </div>
          <div className="content-card-body" style={{ padding: '0 24px' }}>
            {recentPatients.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">👤</div>
                <div className="empty-state-text">لا توجد مرضى مسجلون مؤخراً</div>
              </div>
            ) : (
              recentPatients.map(p => (
                <div key={p.id} className="recent-item">
                  <div>
                    <div className="recent-name">{p.first_name} {p.last_name}</div>
                    <div className="recent-meta">{p.phone || 'لا يوجد هاتف'}</div>
                  </div>
                  <span className="badge badge-primary">
                    {p.created_at ? p.created_at.split('T')[0] : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">📅 المواعيد الأخيرة</h3>
            <Link to="/appointments" className="btn btn-ghost btn-sm">عرض الكل</Link>
          </div>
          <div className="content-card-body" style={{ padding: '0 24px' }}>
            {recentAppointments.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">لا توجد مواعيد مجدولة مؤخراً</div>
              </div>
            ) : (
              recentAppointments.map(a => (
                <div key={a.id} className="recent-item">
                  <div>
                    <div className="recent-name">مريض #{a.patient_id}</div>
                    <div className="recent-meta">{a.appointment_date} — {a.start_time}</div>
                  </div>
                  <span className={`badge ${getStatusBadge(a.status)}`}>
                    {getStatusText(a.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;