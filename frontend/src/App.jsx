import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import api from './services/api';

import Dashboard            from './components/Dashboard.jsx';
import PatientManagement    from './components/PatientManagement.jsx';
import AppointmentManagement from './components/AppointmentManagement.jsx';
import BillManagement       from './components/BillManagement.jsx';
import PatientCaseSheet     from './components/CaseSheet/PatientCaseSheet.jsx';
import FinancePage          from './components/FinancePage.jsx';
import StaffPage            from './components/StaffPage.jsx';
import UserManagement       from './components/UserManagement.jsx';
import Login                from './components/Login.jsx';
import SettingsPage         from './components/SettingsPage.jsx';
import QuickEntryModal      from './components/QuickEntryModal.jsx';
import QuickVisitWizard    from './components/QuickVisitWizard/QuickVisitWizard.jsx';
import './components/QuickVisitWizard/QuickVisitWizard.css';

import './index.css';

const ALL_ROLES = ['admin', 'doctor', 'secretary'];

/* ─── Sidebar nav items with per-role visibility ─── */
const navItems = [
  { path: '/',             label: 'لوحة التحكم',       icon: '◈',   title: 'لوحة التحكم',       roles: ALL_ROLES },
  { path: '/patients',     label: 'إدارة المرضى',      icon: '👤',  title: 'إدارة المرضى',      roles: ALL_ROLES },
  { path: '/appointments', label: 'إدارة المواعيد',     icon: '📅',  title: 'إدارة المواعيد',     roles: ALL_ROLES },
  { path: '/bills',        label: 'المحاسبة',            icon: '💰',  title: 'المحاسبة',            roles: ALL_ROLES },
  { path: '/finance',      label: 'المالية',             icon: '💹',  title: 'المالية',             roles: ['admin'] },
  { path: '/staff',        label: 'إدارة الفريق',        icon: '👥',  title: 'إدارة الفريق',        roles: ['admin'] },
  { path: '/admin/users',  label: 'إدارة المستخدمين',   icon: '🔑',  title: 'إدارة المستخدمين',   roles: ['admin'] },
  { path: '/settings',     label: 'الإعدادات والنسخ',    icon: '⚙️',  title: 'الإعدادات',           roles: ['admin'] },
];

const ROLE_LABELS = { admin: 'مدير النظام', doctor: 'طبيب', secretary: 'سكرتير' };
const ROLE_ICONS  = { admin: '👑',          doctor: '👨‍⚕️',   secretary: '📋' };

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════════════════════════ */
function Sidebar() {
  const location        = useLocation();
  const navigate        = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try { await api.post('/logout'); }
    catch (err) { console.error('Logout failed:', err); }
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

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
        {visibleItems.map(item => (
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
          <div className="sidebar-footer-avatar">{ROLE_ICONS[user?.role] || '�'}</div>
          <div className="sidebar-footer-text">
            <small>{ROLE_LABELS[user?.role] || '...'}</small>
            <span>{user?.username || 'مستخدم'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 10 }}
        >
          🚪 تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TYPEAHEAD SEARCH
   ══════════════════════════════════════════════════════════════════════════ */
function TypeaheadSearch() {
  const navigate        = useNavigate();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef   = useRef();
  const debouncer = useRef();

  /* Fetch patients matching query */
  const fetchPatients = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { search: q } });
      const all = res.data || [];
      // Filter client-side as fallback if backend doesn't support search param
      const filtered = all.filter(p =>
        `${p.first_name} ${p.last_name} ${p.phone || ''}`.toLowerCase()
          .includes(q.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
      setOpen(filtered.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Debounce input changes */
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => fetchPatients(val), 260);
  };

  /* Keyboard navigation */
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectPatient(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const selectPatient = (patient) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/patients/${patient.id}/case-sheet`);
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tb-search-wrap" ref={wrapRef}>
      <div className="tb-search-input-wrap">
        <span className="tb-search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          id="patient-search-input"
          type="text"
          className="tb-search-input"
          placeholder="البحث عن مريض..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          autoComplete="off"
        />
        {loading && <span className="tb-search-spinner" />}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="tb-search-dropdown" role="listbox">
          {results.map((patient, idx) => (
            <div
              key={patient.id}
              role="option"
              aria-selected={idx === activeIdx}
              className={`tb-search-result ${idx === activeIdx ? 'tb-search-result-active' : ''}`}
              onMouseDown={() => selectPatient(patient)}
            >
              <div className="tb-result-avatar">
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div className="tb-result-info">
                <div className="tb-result-name">
                  {patient.first_name} {patient.last_name}
                </div>
                {patient.phone && (
                  <div className="tb-result-meta">📞 {patient.phone}</div>
                )}
              </div>
              <div className="tb-result-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TOP BAR
   ══════════════════════════════════════════════════════════════════════════ */
function TopBar({ onQuickEntry, onQuickVisit }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const current  = navItems.find(n => n.path === location.pathname);

  const isCaseSheet = location.pathname.includes('/case-sheet');
  const pageTitle   = isCaseSheet ? 'ملف المريض' : (current?.title || 'DentalCare');

  return (
    <header className="top-bar">
      <span className="top-bar-title">{pageTitle}</span>

      <div className="top-bar-actions">
        {/* Typeahead Search */}
        <TypeaheadSearch />

        {/* Quick Visit Wizard button */}
        <button
          id="quick-visit-btn"
          className="tb-quick-btn tb-quick-visit"
          onClick={onQuickVisit}
          title="تسجيل زيارة شاملة"
        >
          <span className="tb-quick-plus">🦷</span>
          <span className="tb-quick-label">زيارة سريعة</span>
        </button>

        {/* Quick Entry FAB-style button */}
        <button
          id="quick-entry-btn"
          className="tb-quick-btn"
          onClick={onQuickEntry}
          title="إدخال سريع"
        >
          <span className="tb-quick-plus">＋</span>
          <span className="tb-quick-label">إدخال سريع</span>
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'تبديل إلى الوضع الفاتح' : 'تبديل إلى الوضع الداكن'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <span className="top-bar-badge">النظام نشط</span>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT APP
   ══════════════════════════════════════════════════════════════════════════ */
function AppShell() {
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [quickVisitOpen, setQuickVisitOpen] = useState(false);

  return (
    <div className="app-shell">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-hover)',
            borderRadius: '12px',
            fontFamily: 'Cairo, Tajawal, sans-serif',
            fontSize: '14px',
            direction: 'rtl',
            boxShadow: 'var(--shadow-lg)',
          },
          success: { iconTheme: { primary: '#34D399', secondary: 'transparent' } },
          error:   { iconTheme: { primary: '#F87171', secondary: 'transparent' } },
        }}
      />
      <Sidebar />
      <main className="main-content">
        <TopBar
          onQuickEntry={() => setQuickEntryOpen(true)}
          onQuickVisit={() => setQuickVisitOpen(true)}
        />
        <div className="page-content">
          <Routes>
            <Route path="/"                                  element={<Dashboard />} />
            <Route path="/patients"                          element={<PatientManagement />} />
            <Route path="/patients/:patientId/case-sheet"    element={<PatientCaseSheet />} />
            <Route path="/appointments"                      element={<AppointmentManagement />} />
            <Route path="/bills"                             element={<BillManagement />} />
            <Route path="/finance"                           element={<FinancePage />} />
            <Route path="/staff"                             element={<StaffPage />} />
            <Route path="/admin/users"                       element={<UserManagement />} />
            <Route path="/settings"                          element={<SettingsPage />} />
            {/* Legacy redirects — keep old bookmarks working */}
            <Route path="/revenue"       element={<Navigate to="/finance" replace />} />
            <Route path="/expenses"      element={<Navigate to="/finance" replace />} />
            <Route path="/salaries"      element={<Navigate to="/staff"   replace />} />
            <Route path="/professionals" element={<Navigate to="/staff"   replace />} />
          </Routes>
        </div>
      </main>

      {/* Global Quick-Entry Modal — portal at App level, page-agnostic */}
      <QuickEntryModal
        isOpen={quickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
      />

      {/* Unified Quick Visit Wizard — 4-step drawer */}
      <QuickVisitWizard
        isOpen={quickVisitOpen}
        onClose={() => setQuickVisitOpen(false)}
        onSuccess={() => { /* optionally trigger a data refresh here */ }}
      />
    </div>
  );
}

function App() {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    api.get('/me')
      .then(res => login({ username: res.data.username, role: res.data.role, professional_ids: res.data.professional_ids ?? [] }))
      .catch(() => {});
  }, [login]);

  return (
    <Router>
      {isAuthenticated ? <AppShell /> : <Login />}
    </Router>
  );
}

export default App;
