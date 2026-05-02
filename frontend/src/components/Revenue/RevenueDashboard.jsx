import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import ExpenseStatCard from '../Expenses/ExpenseStatCard';
import ExpenseTable from '../Expenses/ExpenseTable';
import QuickPaymentModal from './QuickPaymentModal';
import api from '../../services/api';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtCurrency = (n) => `${Number(n || 0).toLocaleString('ar-SA')} IQD`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const map = {
    paid:    { label: '✅ مدفوع',      cls: 'badge-success' },
    partial: { label: '⚡ جزئي',       cls: 'badge-warning' },
    pending: { label: '⏳ معلق',       cls: 'badge-ghost'   },
    overdue: { label: '⚠️ متأخر',      cls: 'badge-danger'  },
    unpaid:  { label: '❌ غير مدفوع',  cls: 'badge-danger'  },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-ghost' };
  return <span className={`badge ${cls}`}>{label}</span>;
};

const PaymentMethodBadge = ({ method }) => {
  const map = {
    'كاش':           { cls: 'badge-success', icon: '💵' },
    'بطاقة ائتمان': { cls: 'badge-info',    icon: '💳' },
    'تحويل بنكي':   { cls: 'badge-warning', icon: '🏦' },
  };
  const { cls, icon } = map[method] || { cls: 'badge-ghost', icon: '💰' };
  return <span className={`badge ${cls}`}>{icon} {method || '—'}</span>;
};

const patientName = (id, patients) => {
  const p = patients.find(p => String(p.id) === String(id));
  return p ? `${p.first_name} ${p.last_name}` : `م.#${id}`;
};

/* ── Tab 1: Status Summary ───────────────────────────────────────────────── */
function RevenueSummaryTab({ bills }) {
  const summary = useMemo(() => [
    { key: 'paid',    label: '✅ مدفوعة',          bills: bills.filter(b => b.status === 'paid') },
    { key: 'partial', label: '⚡ مدفوعة جزئياً',   bills: bills.filter(b => b.status === 'partial') },
    { key: 'pending', label: '⏳ معلقة',            bills: bills.filter(b => b.status === 'pending' || b.status === 'unpaid') },
    { key: 'overdue', label: '⚠️ متأخرة السداد',   bills: bills.filter(b => b.status === 'overdue') },
  ].map(row => ({
    label:       row.label,
    total:       row.bills.length,
    totalAmount: row.bills.reduce((s, b) => s + (b.total_amount || 0), 0),
    totalPaid:   row.bills.reduce((s, b) => s + (b.paid_amount  || 0), 0),
    totalDebt:   row.bills.reduce((s, b) => s + (b.balance      || 0), 0),
  })), [bills]);

  const columns = [
    { key: 'label',       label: 'التصنيف',          render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'total',       label: 'عدد الفواتير',      render: (v) => <span className="badge badge-ghost">{v}</span> },
    { key: 'totalAmount', label: 'إجمالي الفواتير',   render: (v) => fmtCurrency(v) },
    { key: 'totalPaid',   label: 'إجمالي المحصّل',    render: (v) => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'totalDebt',   label: 'إجمالي المتبقي',    render: (v) => v > 0
        ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmtCurrency(v)}</span>
        : <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span> },
  ];

  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">📊 ملخص الإيرادات حسب الحالة</h3>
        <span className="exp-tab-desc">نظرة تحليلية على توزيع الفواتير والمبالغ المحصلة لكل تصنيف</span>
      </div>
      <ExpenseTable columns={columns} rows={summary} emptyMsg="لا توجد بيانات" />
    </div>
  );
}

/* ── Tab 2: Completed Revenue ────────────────────────────────────────────── */
function CompletedRevenueTab({ bills, patients }) {
  const rows = useMemo(() =>
    bills
      .filter(b => b.status === 'paid')
      .map(b => ({ ...b, _patientName: patientName(b.patient_id, patients) }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [bills, patients]
  );

  const columns = [
    { key: 'id',              label: 'رقم الفاتورة',   render: (v) => <span className="exp-receipt-id">#{v}</span> },
    { key: 'created_at',      label: 'التاريخ',         render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{fmtDate(v)}</span> },
    { key: '_patientName',    label: 'المريض',          render: (v) => <span className="exp-patient-name">🦷 {v}</span>, sortable: false },
    { key: 'total_amount',    label: 'قيمة الفاتورة',  render: (v) => fmtCurrency(v) },
    { key: 'discount_amount', label: 'الخصم',           render: (v) => v > 0
        ? <span style={{ color: 'var(--warning)' }}>{fmtCurrency(v)}</span>
        : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'paid_amount',     label: 'المبلغ المحصّل',  render: (v) => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'status',          label: 'الحالة',          render: (v) => <StatusBadge status={v} />, sortable: false },
  ];

  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">✅ الإيرادات المكتملة</h3>
        <span className="exp-tab-desc">الفواتير المدفوعة بالكامل ومجموع المبالغ المحصلة</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد إيرادات مكتملة" />
    </div>
  );
}

/* ── Tab 3: Outstanding Debts ────────────────────────────────────────────── */
function OutstandingDebtsTab({ bills, patients }) {
  const rows = useMemo(() =>
    bills
      .filter(b => (b.balance || 0) > 0)
      .map(b => ({ ...b, _patientName: patientName(b.patient_id, patients) }))
      .sort((a, b) => (b.balance || 0) - (a.balance || 0)),
    [bills, patients]
  );

  const columns = [
    { key: 'id',           label: 'رقم الفاتورة',       render: (v) => <span className="exp-receipt-id">#{v}</span> },
    { key: 'created_at',   label: 'التاريخ',             render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{fmtDate(v)}</span> },
    { key: '_patientName', label: 'المريض',              render: (v) => <span className="exp-patient-name">🦷 {v}</span>, sortable: false },
    { key: 'total_amount', label: 'قيمة الفاتورة',      render: (v) => fmtCurrency(v) },
    { key: 'paid_amount',  label: 'المدفوع',             render: (v) => <span style={{ color: 'var(--success)' }}>{fmtCurrency(v)}</span> },
    { key: 'balance',      label: 'المتبقي',             render: (v) => <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'status',       label: 'الحالة',              render: (v) => <StatusBadge status={v} />, sortable: false },
    { key: 'due_date',     label: 'تاريخ الاستحقاق',    render: (v) => <span style={{ color: 'var(--warning)' }}>{fmtDate(v)}</span> },
  ];

  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">⚠️ مديونيات المرضى</h3>
        <span className="exp-tab-desc">الفواتير غير المسددة كلياً أو جزئياً، مرتبة تنازلياً حسب المبلغ المتبقي</span>
      </div>
      <ExpenseTable columns={columns} rows={rows} emptyMsg="لا توجد مديونيات معلقة 🎉" />
    </div>
  );
}

/* ── Tab 4: Payments Ledger ──────────────────────────────────────────────── */
function PaymentsLedgerTab({ payments }) {
  const columns = [
    { key: 'receipt_id',     label: 'رقم الإيصال',     render: (v) => <span className="exp-receipt-id">{v || '—'}</span> },
    { key: 'date',           label: 'التاريخ',           render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{fmtDate(v)}</span> },
    { key: 'patient_name',   label: 'المريض',            render: (v) => <span className="exp-patient-name">🦷 {v}</span>, sortable: false },
    { key: 'category',       label: 'الفئة',             render: (v) => <span className="badge badge-primary">{v || '—'}</span>, sortable: false },
    { key: 'treatment',      label: 'العلاج / الخدمة',  render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v || '—'}</span>, sortable: false },
    { key: 'amount_received', label: 'المبلغ المستلم',   render: (v) => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtCurrency(v)}</span> },
    { key: 'payment_method', label: 'طريقة الدفع',      render: (v) => <PaymentMethodBadge method={v} />, sortable: false },
  ];

  return (
    <div>
      <div className="exp-tab-header">
        <h3 className="exp-tab-title">📜 سجل الإيصالات والمدفوعات</h3>
        <span className="exp-tab-desc">سجل زمني كامل لجميع المعاملات المالية الواردة للعيادة</span>
      </div>
      <ExpenseTable columns={columns} rows={payments} emptyMsg="لا توجد مدفوعات مسجلة" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN REVENUE DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function RevenueDashboard() {
  const [bills,      setBills]      = useState([]);
  const [patients,   setPatients]   = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState(0);
  const [qpmOpen,    setQpmOpen]    = useState(false);

  /* ── Filters ── */
  const [search,   setSearch]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate)   params.end_date   = toDate;

      const [billsRes, patientsRes, paymentsRes] = await Promise.all([
        api.get('/bills'),
        api.get('/patients'),
        api.get('/revenue/payments', { params }),
      ]);

      setBills(billsRes.data     || []);
      setPatients(patientsRes.data || []);
      setPayments(paymentsRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fromDate, toDate]);

  const handleQpmSuccess = () => {
    toast.success('تم تسجيل الإيراد بنجاح وتحديث البيانات');
    fetchData();
  };

  /* ── Filter logic ── */
  const filtered = useMemo(() =>
    bills.filter(b => {
      const name    = patientName(b.patient_id, patients);
      const matchSearch = !search.trim() ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        String(b.id).includes(search);
      const billDate  = (b.created_at || '').substring(0, 10);
      const matchFrom = !fromDate || billDate >= fromDate;
      const matchTo   = !toDate   || billDate <= toDate;
      return matchSearch && matchFrom && matchTo;
    }),
    [bills, patients, search, fromDate, toDate]
  );

  const filteredPayments = useMemo(() =>
    payments.filter(p => {
      const matchSearch = !search.trim() ||
        (p.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.receipt_id   || '').toLowerCase().includes(search.toLowerCase());
      const matchFrom = !fromDate || p.date >= fromDate;
      const matchTo   = !toDate   || p.date <= toDate;
      return matchSearch && matchFrom && matchTo;
    }),
    [payments, search, fromDate, toDate]
  );

  /* ── KPI computations ── */
  const kpi = useMemo(() => {
    const totalPaid   = filtered.reduce((s, b) => s + (b.paid_amount   || 0), 0);
    const totalDebt   = filtered.filter(b => (b.balance || 0) > 0).reduce((s, b) => s + (b.balance || 0), 0);
    const totalAmount = filtered.reduce((s, b) => s + (b.total_amount  || 0), 0);
    const debtCount   = filtered.filter(b => (b.balance || 0) > 0).length;
    const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
    return { totalPaid, totalDebt, totalAmount, debtCount, collectionRate };
  }, [filtered]);

  /* ── Tabs config ── */
  const TABS = [
    { label: 'ملخص الإيرادات',    icon: '📊', count: null },
    { label: 'إيرادات مكتملة',    icon: '✅', count: filtered.filter(b => b.status === 'paid').length },
    { label: 'مديونيات المرضى',   icon: '⚠️', count: filtered.filter(b => (b.balance || 0) > 0).length },
    { label: 'سجل الإيصالات',     icon: '📜', count: filteredPayments.length },
  ];

  if (loading) {
    return (
      <div className="exp-loading">
        <div className="exp-loading-spinner" />
        <span>جاري تحميل بيانات الإيرادات...</span>
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
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-header-title">
          <span className="page-header-icon">💰</span>
          الإيرادات والأرباح
        </h1>
        <p className="page-header-subtitle">
          التتبع المالي الشامل للإيرادات، المدفوعات، والمديونيات
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="exp-kpi-grid animate-in animate-in-delay-1">
        <ExpenseStatCard
          label="إجمالي المحصّل"
          value={kpi.totalPaid}
          icon="✅"
          variant="success"
          sub={`${filtered.filter(b => b.status === 'paid').length} فاتورة مكتملة`}
        />
        <ExpenseStatCard
          label="إجمالي المديونيات"
          value={kpi.totalDebt}
          icon="⚠️"
          variant="danger"
          sub={`${kpi.debtCount} فاتورة غير مسددة`}
        />
        <ExpenseStatCard
          label="إجمالي الفواتير"
          value={kpi.totalAmount}
          icon="📊"
          variant="primary"
          sub={`${filtered.length} سجل في النطاق المحدد`}
        />
        <ExpenseStatCard
          label="نسبة التحصيل"
          value={kpi.collectionRate}
          icon="🎯"
          variant="accent"
          unit="%"
          sub="من إجمالي قيمة الفواتير"
        />
      </div>

      {/* ── Filter & Controls Bar ── */}
      <div className="exp-controls animate-in animate-in-delay-2">
        <div className="exp-search-wrap">
          <span className="exp-search-icon">🔍</span>
          <input
            type="text"
            className="exp-search-input"
            placeholder="بحث في الإيرادات... (المريض، رقم الفاتورة)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="exp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="exp-date-range">
          <span className="exp-date-label">من</span>
          <input
            type="date"
            className="field-input exp-date-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="exp-date-label">إلى</span>
          <input
            type="date"
            className="field-input exp-date-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {(fromDate || toDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>
              مسح
            </button>
          )}
        </div>

        <button
          className="btn btn-primary exp-add-btn"
          onClick={() => setQpmOpen(true)}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          تسجيل إيراد
        </button>
      </div>

      {/* ── Tabbed Sheets ── */}
      <div className="exp-card animate-in animate-in-delay-3">
        <div className="exp-tabs">
          {TABS.map((tab, i) => (
            <button
              key={i}
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

        <div className="exp-tab-panel">
          {activeTab === 0 && <RevenueSummaryTab    bills={filtered} />}
          {activeTab === 1 && <CompletedRevenueTab  bills={filtered} patients={patients} />}
          {activeTab === 2 && <OutstandingDebtsTab  bills={filtered} patients={patients} />}
          {activeTab === 3 && <PaymentsLedgerTab    payments={filteredPayments} />}
        </div>
      </div>

      <QuickPaymentModal
        isOpen={qpmOpen}
        onClose={() => setQpmOpen(false)}
        onSuccess={handleQpmSuccess}
      />
    </div>
  );
}