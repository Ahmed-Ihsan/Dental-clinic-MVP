import { useState, useEffect, useMemo } from 'react';
import ExpenseStatCard   from './ExpenseStatCard';
import ExpenseTable      from './ExpenseTable';
import AddExpenseModal   from './AddExpenseModal';
import api from '../../services/api';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmtCurrency = (n) => `${Number(n || 0).toLocaleString('ar-SA')} ر.س`;
const fmtDate     = (d) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const doctorName = (id, professionals) => {
  const d = professionals.find(p => String(p.id) === String(id));
  return d ? `${d.first_name} ${d.last_name}` : `د.#${id}`;
};
const patientName = (id, patients) => {
  const p = patients.find(p => String(p.id) === String(id));
  return p ? `${p.first_name} ${p.last_name}` : `م.#${id}`;
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
    {status === 'paid' ? '✅ مدفوع' : '⚠️ دين'}
  </span>
);

const CategoryBadge = ({ category }) => {
  const map = {
    clinic:  { label: 'عيادة',    cls: 'badge-info'    },
    doctor:  { label: 'طبيب',     cls: 'badge-warning' },
    patient: { label: 'مريض',     cls: 'badge-primary' },
    lab:     { label: 'مختبر',    cls: 'badge-ghost'   },
  };
  const { label, cls } = map[category] || { label: category, cls: 'badge-ghost' };
  return <span className={`badge ${cls}`}>{label}</span>;
};

/* ── Tab 1: Category Summary ────────────────────────────────────────────── */
function CategorySummaryTab({ expenses }) {
  const summary = useMemo(() => {
    const cats = ['clinic', 'doctor', 'patient', 'lab'];
    return cats.map(cat => {
      const rows = expenses.filter(e => e.category === cat);
      const paid = rows.filter(e => e.status === 'paid');
      return {
        category: cat,
        total: rows.length,
        paidCount: paid.length,
        totalPaid: rows.reduce((s, e) => s + (e.paid_amount || 0), 0),
        totalDebt: rows.reduce((s, e) => s + (e.balance || 0), 0),
      };
    });
  }, [expenses]);

  const categoryLabel = { clinic: '🏥 مصاريف العيادة', doctor: '👨‍⚕️ مصاريف الأطباء', patient: '🦷 مصاريف المريض', lab: '🔬 المختبرات الخارجية' };

  const columns = [
    { key: 'category',  label: 'الفئة',              render: (v)  => <span style={{ fontWeight: 600 }}>{categoryLabel[v]}</span> },
    { key: 'total',     label: 'إجمالي السجلات',     render: (v)  => <span className="badge badge-ghost">{v}</span> },
    { key: 'paidCount', label: 'المدفوعات',          render: (v, r) => <span className="badge badge-success">{v} / {r.total}</span> },
    { key: 'totalPaid', label: 'إجمالي المدفوع',     render: (v)  => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'totalDebt', label: 'إجمالي الديون المتبقية', render: (v) => v > 0
        ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmtCurrency(v)}</span>
        : <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span> },
  ];

  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">📊 ملخص المصروفات حسب الفئة</h3>
        <span className="exp-tab-desc">نظرة تحليلية عالية المستوى على توزيع المصروفات والديون</span>
      </div>
      <ExpenseTable columns={columns} rows={summary} emptyMsg="لا توجد بيانات" />
    </div>
  );
}

/* ── Tab 2: Clinic Operating Expenses ──────────────────────────────────── */
function ClinicExpensesTab({ expenses }) {
  const rows = expenses.filter(e => e.category === 'clinic');
  const columns = [
    { key: 'date',        label: 'التاريخ',     render: v  => fmtDate(v) },
    { key: 'description', label: 'البيان / الوصف', sortable: false },
    { key: 'amount',      label: 'المبلغ',      render: v  => fmtCurrency(v) },
    { key: 'paid_amount', label: 'المدفوع',     render: v  => <span style={{ color: 'var(--success)' }}>{fmtCurrency(v)}</span> },
    { key: 'balance',     label: 'المتبقي',     render: v  => v > 0
        ? <span style={{ color: 'var(--danger)' }}>{fmtCurrency(v)}</span>
        : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status',      label: 'الحالة',      render: v  => <StatusBadge status={v} />, sortable: false },
  ];
  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">🏥 مصاريف تشغيل العيادة</h3>
        <span className="exp-tab-desc">الإيجار، الكهرباء، المواد الأساسية والصيانة</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد مصاريف تشغيلية" />
    </div>
  );
}

/* ── Tab 3: Doctor Expenses ─────────────────────────────────────────────── */
function DoctorExpensesTab({ expenses, professionals }) {
  const rows = expenses
    .filter(e => e.category === 'doctor')
    .map(e => ({ ...e, _doctorName: doctorName(e.doctor_id, professionals) }));

  const columns = [
    { key: 'date',         label: 'التاريخ',    render: v  => fmtDate(v) },
    { key: '_doctorName',  label: 'الطبيب',     render: v  => <span className="exp-doc-name">👨‍⚕️ {v}</span> },
    { key: 'description',  label: 'المادة / البند', sortable: false },
    { key: 'amount',       label: 'التكلفة',    render: v  => fmtCurrency(v) },
    { key: 'paid_amount',  label: 'المدفوع',    render: v  => <span style={{ color: 'var(--success)' }}>{fmtCurrency(v)}</span> },
    { key: 'balance',      label: 'الدين',      render: v  => v > 0
        ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmtCurrency(v)}</span>
        : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status',       label: 'الحالة',     render: v  => <StatusBadge status={v} />, sortable: false },
  ];
  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">👨‍⚕️ مصاريف الأطباء</h3>
        <span className="exp-tab-desc">تتبع التكاليف المرتبطة بأطباء محددين (مواد، أدوات، طلبات خاصة)</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد مصاريف مرتبطة بأطباء" />
    </div>
  );
}

/* ── Tab 4: Patient-Specific Expenses ───────────────────────────────────── */
function PatientExpensesTab({ expenses, patients }) {
  const rows = expenses
    .filter(e => e.category === 'patient')
    .map(e => ({
      ...e,
      _patientName: patientName(e.patient_id, patients),
      margin_impact: e.balance > 0
        ? `↓ ${fmtCurrency(e.balance)}`
        : '✔ لا تأثير',
    }));

  const columns = [
    { key: 'date',          label: 'التاريخ',      render: v  => fmtDate(v) },
    { key: '_patientName',  label: 'المريض',       render: v  => <span className="exp-patient-name">🦷 {v}</span> },
    { key: 'description',   label: 'المختبر / الخدمة', sortable: false },
    { key: 'amount',        label: 'التكلفة',      render: v  => fmtCurrency(v) },
    { key: 'margin_impact', label: 'أثر على الهامش', sortable: false,
      render: (v, r) => (
        <span style={{ color: r.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
          {v}
        </span>
      ),
    },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} />, sortable: false },
  ];
  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">🦷 مصاريف متعلقة بالمريض</h3>
        <span className="exp-tab-desc">التكاليف الخارجية المتكبدة لصالح مرضى محددين (أشعة، مختبرات، تحاليل)</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد مصاريف مرتبطة بمرضى" />
    </div>
  );
}

/* ── Tab 5: Paid Expenses Log ────────────────────────────────────────────── */
function PaidExpensesLogTab({ expenses }) {
  const rows = expenses
    .filter(e => e.status === 'paid')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const columns = [
    { key: 'receipt_id',     label: 'رقم الإيصال',  render: v  => <span className="exp-receipt-id">{v || '—'}</span> },
    { key: 'date',           label: 'التاريخ',       render: v  => fmtDate(v) },
    { key: 'description',    label: 'البيان',        sortable: false },
    { key: 'category',       label: 'الفئة',         render: v  => <CategoryBadge category={v} />, sortable: false },
    { key: 'paid_amount',    label: 'المبلغ المدفوع', render: v  => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'payment_method', label: 'طريقة الدفع',  render: v  => v || '—', sortable: false },
  ];
  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">📜 سجل المدفوعات</h3>
        <span className="exp-tab-desc">سجل زمني كامل لجميع المعاملات المالية المكتملة</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد مدفوعات مسجلة" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPENSES DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function ExpensesDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  /* ── Filters ── */
  const [search,   setSearch]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  /* Fetch real data from API */
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate) params.end_date = toDate;
      
      const [expensesRes, professionalsRes, patientsRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/professionals'),
        api.get('/patients'),
      ]);
      
      setExpenses(expensesRes.data);
      setProfessionals(professionalsRes.data);
      setPatients(patientsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses data:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search.trim() ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.id || '').toLowerCase().includes(search.toLowerCase());
      const matchFrom = !fromDate || e.date >= fromDate;
      const matchTo   = !toDate   || e.date <= toDate;
      return matchSearch && matchFrom && matchTo;
    });
  }, [expenses, search, fromDate, toDate]);

  /* ── KPI computations ── */
  const kpi = useMemo(() => {
    const totalPaid    = filtered.reduce((s, e) => s + (e.paid_amount || 0), 0);
    const totalDebt    = filtered.reduce((s, e) => s + (e.balance || 0), 0);
    const totalCost    = filtered.reduce((s, e) => s + (e.amount || 0), 0);
    const debtCount    = filtered.filter(e => e.balance > 0).length;
    return { totalPaid, totalDebt, totalCost, debtCount };
  }, [filtered]);

  /* ── Add expense handler ── */
  const handleAddExpense = async (newExp) => {
    try {
      const response = await api.post('/expenses', newExp);
      setExpenses(prev => [response.data, ...prev]);
      return true;
    } catch (err) {
      console.error('Error creating expense:', err);
      alert('فشل في إضافة المصروف');
      return false;
    }
  };

  /* ── Tabs config ── */
  const TABS = [
    { label: 'ملخص الفئات',       icon: '📊', count: null },
    { label: 'مصاريف العيادة',    icon: '🏥', count: filtered.filter(e => e.category === 'clinic').length },
    { label: 'مصاريف الأطباء',    icon: '👨‍⚕️', count: filtered.filter(e => e.category === 'doctor').length },
    { label: 'مصاريف المرضى',     icon: '🦷', count: filtered.filter(e => e.category === 'patient').length },
    { label: 'سجل المدفوعات',     icon: '📜', count: filtered.filter(e => e.status === 'paid').length },
  ];

  if (loading) {
    return (
      <div className="exp-loading">
        <div className="exp-loading-spinner"></div>
        <span>جاري تحميل بيانات المصروفات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exp-loading">
        <span style={{ color: 'var(--danger)', marginBottom: 16 }}>⚠️ {error}</span>
        <button className="btn btn-primary" onClick={fetchData}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="exp-page animate-in">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-header-title">
          <span className="page-header-icon">💸</span>
          إدارة المصروفات
        </h1>
        <p className="page-header-subtitle">
          التتبع المالي الشامل لمصاريف العيادة، الأطباء، والمرضى
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="exp-kpi-grid animate-in animate-in-delay-1">
        <ExpenseStatCard
          label="إجمالي المدفوعات"
          value={kpi.totalPaid}
          icon="✅"
          variant="success"
          sub={`${filtered.filter(e => e.status === 'paid').length} معاملة مكتملة`}
        />
        <ExpenseStatCard
          label="إجمالي الديون المتبقية"
          value={kpi.totalDebt}
          icon="⚠️"
          variant="danger"
          sub={`${kpi.debtCount} سجل غير مسدد`}
        />
        <ExpenseStatCard
          label="إجمالي التكاليف التشغيلية"
          value={kpi.totalCost}
          icon="📊"
          variant="primary"
          sub={`${filtered.length} سجل في النطاق المحدد`}
        />
        <ExpenseStatCard
          label="نسبة الإنجاز"
          value={kpi.totalCost > 0 ? Math.round((kpi.totalPaid / kpi.totalCost) * 100) : 0}
          icon="🎯"
          variant="accent"
          unit="%"
          sub="من إجمالي المصروفات"
        />
      </div>

      {/* ── Filter & Controls Bar ────────────────────────────────────────── */}
      <div className="exp-controls animate-in animate-in-delay-2">
        {/* Search */}
        <div className="exp-search-wrap">
          <span className="exp-search-icon">🔍</span>
          <input
            id="exp-global-search"
            type="text"
            className="exp-search-input"
            placeholder="بحث في المصروفات... (الوصف، الرقم)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="exp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Date Range */}
        <div className="exp-date-range">
          <span className="exp-date-label">من</span>
          <input
            id="exp-from-date"
            type="date"
            className="field-input exp-date-input"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <span className="exp-date-label">إلى</span>
          <input
            id="exp-to-date"
            type="date"
            className="field-input exp-date-input"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          {(fromDate || toDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>
              مسح
            </button>
          )}
        </div>

        {/* Add Expense CTA */}
        <button
          id="exp-add-btn"
          className="btn btn-primary exp-add-btn"
          onClick={() => setModalOpen(true)}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          إضافة مصروف
        </button>
      </div>

      {/* ── Tabbed Sheets ────────────────────────────────────────────────── */}
      <div className="exp-card animate-in animate-in-delay-3">
        {/* Tab bar */}
        <div className="exp-tabs">
          {TABS.map((tab, i) => (
            <button
              key={i}
              id={`exp-tab-${i}`}
              className={`exp-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <span>{tab.icon}</span>
              <span className="exp-tab-label">{tab.label}</span>
              {tab.count !== null && (
                <span className="exp-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="exp-tab-panel">
          {activeTab === 0 && <CategorySummaryTab expenses={filtered} />}
          {activeTab === 1 && <ClinicExpensesTab   expenses={filtered} />}
          {activeTab === 2 && <DoctorExpensesTab   expenses={filtered} professionals={professionals} />}
          {activeTab === 3 && <PatientExpensesTab  expenses={filtered} patients={patients} />}
          {activeTab === 4 && <PaidExpensesLogTab  expenses={filtered} />}
        </div>
      </div>

      {/* ── Add Expense Modal ─────────────────────────────────────────────── */}
      <AddExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddExpense}
        professionals={professionals}
        patients={patients}
      />
    </div>
  );
}
