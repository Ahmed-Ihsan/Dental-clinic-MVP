import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import api from './services/api';
import Dashboard from './components/Dashboard.jsx';
import SearchPage from './components/SearchPage.jsx';
import PatientManagement from './components/PatientManagement.jsx';
import AppointmentManagement from './components/AppointmentManagement.jsx';
import TreatmentManagement from './components/TreatmentManagement.jsx';
import ProfessionalManagement from './components/ProfessionalManagement.jsx';
import MedicalHistoryManagement from './components/MedicalHistoryManagement.jsx';
import BillManagement from './components/BillManagement.jsx';
import SalaryManagement from './components/SalaryManagement.jsx';
import QuickEntry from './components/QuickEntry.jsx';
import Login from './components/Login.jsx';
import './index.css';

const navItems = [
  { path: '/',              label: 'لوحة التحكم',       icon: '◈',  title: 'لوحة التحكم' },
  { path: '/search',        label: 'البحث العام',       icon: '🔍', title: 'البحث العام' },
  { path: '/quick-entry',   label: 'إدخال سريع',       icon: '📝', title: 'إدخال سريع' },
  { path: '/patients',      label: 'إدارة المرضى',      icon: '👤', title: 'إدارة المرضى' },
  { path: '/appointments',  label: 'إدارة المواعيد',    icon: '📅', title: 'إدارة المواعيد' },
  { path: '/treatments',    label: 'إدارة العلاجات',    icon: '🦷', title: 'إدارة العلاجات' },
  { path: '/bills',         label: 'إدارة الفواتير',    icon: '💰', title: 'إدارة الفواتير' },
  { path: '/salaries',      label: 'إدارة الرواتب',     icon: '💵', title: 'إدارة الرواتب' },
  { path: '/medical-histories', label: 'التاريخ الطبي', icon: '🩺', title: 'إدارة التاريخ الطبي' },
  { path: '/professionals', label: 'إدارة المتخصصين',  icon: '👨‍⚕️', title: 'إدارة المتخصصين' },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    }
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🦷</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">DentalCare</span>
            <span className="sidebar-logo-subtitle">نظام إدارة العيادة</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">القائمة الرئيسية</div>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-avatar">👨‍⚕️</div>
          <div className="sidebar-footer-text">
            <small>مدير النظام</small>
            <span>عيادة الأسنان</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10 }}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = navItems.find(n => n.path === location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="top-bar">
      <span className="top-bar-title">{current?.title || 'DentalCare'}</span>
      <div className="top-bar-actions">
        <form onSubmit={handleSearchSubmit} style={{ marginRight: '16px' }}>
          <input
            type="text"
            placeholder="البحث في جميع البيانات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#E2E8F0',
              fontSize: '14px',
              width: '250px',
              outline: 'none'
            }}
          />
        </form>
        <span className="top-bar-badge">النظام نشط</span>
      </div>
    </header>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {isAuthenticated ? (
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            <TopBar />
            <div className="page-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/quick-entry" element={<QuickEntry />} />
                <Route path="/patients" element={<PatientManagement />} />
                <Route path="/appointments" element={<AppointmentManagement />} />
                <Route path="/treatments" element={<TreatmentManagement />} />
                <Route path="/bills" element={<BillManagement />} />
                <Route path="/salaries" element={<SalaryManagement />} />
                <Route path="/medical-histories" element={<MedicalHistoryManagement />} />
                <Route path="/professionals" element={<ProfessionalManagement />} />
              </Routes>
            </div>
          </main>
        </div>
      ) : (
        <Login />
      )}
    </Router>
  );
}

export default App;
