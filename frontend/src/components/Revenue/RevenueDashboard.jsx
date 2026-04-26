import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import RevenueStatCard from './RevenueStatCard';
import RevenueTable from './RevenueTable';
import QuickPaymentModal from './QuickPaymentModal';
import api from '../../services/api';

const fmtCurrency = (n) => `${Number(n || 0).toLocaleString('ar-SA')} IQD`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

const PaymentMethodBadge = ({ method }) => {
  const map = {
    'كاش': { cls: 'badge-success', icon: '💵' },
    'بطاقة ائتمان': { cls: 'badge-info', icon: '💳' },
    'تحويل بنكي': { cls: 'badge-warning', icon: '🏦' },
  };
  const { cls, icon } = map[method] || { cls: 'badge-ghost', icon: '💰' };
  return <span className={`badge ${cls}`}>{icon} {method}</span>;
};

const ProfitBar = ({ pct }) => (
  <div className="rev-profit-bar-wrap">
    <div
      className="rev-profit-bar-fill"
      style={{
        width: `${Math.min(pct, 100)}%`,
        background:
          pct >= 70
            ? 'var(--success)'
            : pct >= 50
            ? 'var(--warning)'
            : 'var(--danger)',
      }}
    />
    <span className="rev-profit-bar-label">{pct}%</span>
  </div>
);

function RevenueProfitabilityTab({ categories }) {
  const columns = [
    {
      key: 'category_name',
      label: 'فئة العلاج',
      render: (v, row) => (
        <div className="rev-cat-cell">
          <span className="rev-cat-icon">{row.category_icon}</span>
          <span className="rev-cat-name">{v}</span>
        </div>
      ),
    },
    {
      key: 'cases_count',
      label: 'عدد الحالات',
      render: (v) => <span className="badge badge-ghost">{v} حالة</span>,
    },
    {
      key: 'total_payments',
      label: 'المدفوعات المستلمة',
      render: (v) => (
        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
          {fmtCurrency(v)}
        </span>
      ),
    },
    {
      key: 'total_debts',
      label: 'المديونيات',
      render: (v) =>
        v > 0 ? (
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
            {fmtCurrency(v)}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span>
        ),
    },
    {
      key: 'profit_margin_percent',
      label: 'هامش الربح %',
      render: (v) => <ProfitBar pct={v} />,
    },
    {
      key: 'net_profit',
      label: 'صافي الربح',
      // FIX: Dynamically calculate profit based on payments and margin %
      render: (v, row) => {
        const actualProfit = row.total_payments * (row.profit_margin_percent / 100);
        return <span className="rev-net-profit">{fmtCurrency(actualProfit)}</span>;
      },
    },
    {
      key: 'trend',
      label: 'الاتجاه',
      sortable: false,
      render: (v, row) => (
        <span className={`rev-trend-badge ${row.trend_up ? 'trend-up' : 'trend-down'}`}>
          {row.trend_up ? '↑' : '↓'} {v}
        </span>
      ),
    },
  ];
  // FIX: Removed the redundant `<div className="rev-tab-header">`
  return (
    <div>
      <RevenueTable
        columns={columns}
        rows={categories}
        emptyMsg="لا توجد بيانات إيرادات"
        perPage={8}
      />
    </div>
  );
}

function PaymentsLedgerTab({ payments }) {
  const columns = [
    {
      key: 'receipt_id',
      label: 'رقم الإيصال',
      render: (v) => <span className="rev-receipt-id">{v}</span>,
    },
    {
      key: 'date',
      label: 'التاريخ',
      render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{fmtDate(v)}</span>,
    },
    {
      key: 'patient_name',
      label: 'اسم المريض',
      sortable: false,
      render: (v) => <span className="rev-patient-name">🦷 {v}</span>,
    },
    {
      key: 'category',
      label: 'الفئة',
      sortable: false,
      render: (v) => <span className="badge badge-primary">{v}</span>,
    },
    {
      key: 'treatment',
      label: 'العلاج / الخدمة',
      sortable: false,
      render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v}</span>,
    },
    {
      key: 'amount_received',
      label: 'المبلغ المستلم',
      render: (v) => (
        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
          {fmtCurrency(v)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: 'طريقة الدفع',
      sortable: false,
      render: (v) => <PaymentMethodBadge method={v} />,
    },
  ];

  return (
    <div>
      <div className="rev-tab-header">
        <h3 className="rev-tab-title">📜 سجل المدفوعات المستلمة</h3>
        <span className="rev-tab-desc">
          سجل زمني تفصيلي لجميع المبالغ النقدية الداخلة للعيادة
        </span>
      </div>
      <RevenueTable
        columns={columns}
        rows={payments}
        emptyMsg="لا توجد مدفوعات مسجلة"
        perPage={10}
      />
    </div>
  );
}

function exportToCSV(data, filename, columns) {
  const headers = columns.map(c =>
    typeof c.label === 'string' ? c.label : c.key
  ).join(',');

  const rows = data.map(row =>
    columns.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function RevenueDashboard() {
  const [categories, setCategories] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [qpmOpen, setQpmOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.start_date = fromDate;
      if (toDate) params.end_date = toDate;

      const [summaryRes, categoriesRes, paymentsRes] = await Promise.all([
        api.get('/revenue/summary', { params }),
        api.get('/revenue/categories', { params }),
        api.get('/revenue/payments', { params }),
      ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQpmSuccess = useCallback(() => {
    toast.success('تم تسجيل الإيراد بنجاح وتحديث البيانات');
    fetchData();
  }, [fetchData]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        !search.trim() ||
        c.category_name.toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const matchSearch =
          !search.trim() ||
          p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
          (p.receipt_id || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.treatment || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(search.toLowerCase());
        const matchFrom = !fromDate || p.date >= fromDate;
        const matchTo = !toDate || p.date <= toDate;
        return matchSearch && matchFrom && matchTo;
      }),
    [payments, search, fromDate, toDate]
  );

  const kpi = useMemo(() => {
    if (!summary) {
      return {
        totalCases: 0,
        totalPayments: 0,
        totalDebts: 0,
        totalNetProfit: 0,
        overallMargin: 0,
        trendPayments: { value: '+0%', up: true },
        trendDebts: { value: '-0%', up: false },
        trendMargin: { value: '+0%', up: true },
        trendNet: { value: '+0%', up: true },
      };
    }
    // FIX: Calculate the actual total net profit using total paid and the overall margin
    const calculatedTotalNetProfit = summary.total_paid * ((summary.profit_margin_percent || 0) / 100);
    return {
      totalCases: summary.cases_count || 0,
      totalPayments: summary.total_paid || 0,
      totalDebts: summary.total_balance || 0,
      totalNetProfit: calculatedTotalNetProfit, // Use the fixed calculation here
      overallMargin: summary.profit_margin_percent || 0,
      trendPayments: summary.trends?.paid || { value: '+0%', up: true },
      trendDebts: summary.trends?.balance || { value: '-0%', up: false },
      trendMargin: summary.trends?.margin || { value: '+0%', up: true },
      trendNet: summary.trends?.net_profit || { value: '+0%', up: true },
    };
  }, [summary]);

  const handleExport = () => {
    if (activeTab === 0) {
      const cols = [
        { key: 'category_name', label: 'فئة العلاج' },
        { key: 'cases_count', label: 'عدد الحالات' },
        { key: 'total_payments', label: 'المدفوعات' },
        { key: 'total_debts', label: 'المديونيات' },
        { key: 'profit_margin_percent', label: 'هامش الربح %' },
        { key: 'net_profit', label: 'صافي الربح' },
        { key: 'trend', label: 'الاتجاه' },
      ];
      exportToCSV(filteredCategories, `revenue-categories-${toDate || 'all'}.csv`, cols);
    } else {
      const cols = [
        { key: 'receipt_id', label: 'رقم الإيصال' },
        { key: 'date', label: 'التاريخ' },
        { key: 'patient_name', label: 'اسم المريض' },
        { key: 'category', label: 'الفئة' },
        { key: 'treatment', label: 'العلاج' },
        { key: 'amount_received', label: 'المبلغ المستلم' },
        { key: 'payment_method', label: 'طريقة الدفع' },
      ];
      exportToCSV(filteredPayments, `payments-${toDate || 'all'}.csv`, cols);
    }
  };

  const TABS = [
    { label: 'تحليل الإيرادات والأرباح', icon: '📊', count: filteredCategories.length },
    { label: 'سجل المدفوعات', icon: '📜', count: filteredPayments.length },
  ];

  if (loading) {
    return (
      <div className="rev-loading">
        <div className="rev-loading-spinner" />
        <span>جاري تحميل بيانات الإيرادات...</span>
      </div>
    );
  }

  return (
    <div className="rev-page animate-in">
      <div className="page-header">
        <h1 className="page-header-title">
          <span className="page-header-icon">💰</span>
          الإيرادات والأرباح
        </h1>
        <p className="page-header-subtitle">
          لوحة التحليل المالي الشامل للإيرادات، المدفوعات، والمديونيات
        </p>
      </div>

      <div className="rev-kpi-grid animate-in animate-in-delay-1">
        <RevenueStatCard
          label="إجمالي الحالات"
          value={kpi.totalCases}
          icon="🦷"
          variant="primary"
          unit="حالة"
          sub={`${filteredCategories.length} فئة علاجية`}
        />
        <RevenueStatCard
          label="إجمالي المدفوعات"
          value={kpi.totalPayments}
          icon="✅"
          variant="success"
          sub={`${filteredPayments.length} معاملة`}
          trend={kpi.trendPayments.value}
          trendUp={kpi.trendPayments.up}
        />
        <RevenueStatCard
          label="إجمالي المديونيات"
          value={kpi.totalDebts}
          icon="⚠️"
          variant="danger"
          sub="مستحقة من المرضى"
          trend={kpi.trendDebts.value}
          trendUp={kpi.trendDebts.up}
        />
        <RevenueStatCard
          label="هامش الربح الإجمالي"
          value={kpi.overallMargin}
          icon="📈"
          variant="accent"
          unit="%"
          sub="متوسط مرجح لجميع الفئات"
          trend={kpi.trendMargin.value}
          trendUp={kpi.trendMargin.up}
        />
        <RevenueStatCard
          label="صافي الربح الإجمالي"
          value={kpi.totalNetProfit}
          icon="💎"
          variant="warning"
          sub="بعد خصم التكاليف التشغيلية"
          trend={kpi.trendNet.value}
          trendUp={kpi.trendNet.up}
        />
      </div>

      <div className="rev-controls animate-in animate-in-delay-2">
        <div className="rev-search-wrap">
          <span className="rev-search-icon">🔍</span>
          <input
            id="rev-global-search"
            type="text"
            className="rev-search-input"
            placeholder="بحث في الإيرادات... (المريض، الفئة، رقم الإيصال)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="rev-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="rev-date-range">
          <span className="rev-date-label">من</span>
          <input
            id="rev-from-date"
            type="date"
            className="field-input rev-date-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="rev-date-label">إلى</span>
          <input
            id="rev-to-date"
            type="date"
            className="field-input rev-date-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          {(fromDate || toDate) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFromDate(''); setToDate(''); }}
            >
              مسح
            </button>
          )}
        </div>

        <button
          id="rev-export-btn"
          className="btn btn-ghost rev-export-btn"
          title="تصدير التقرير"
          onClick={handleExport}
        >
          <span>📤</span>
          <span>تصدير</span>
        </button>

        <button
          id="rev-quick-payment-btn"
          className="btn btn-primary"
          onClick={() => setQpmOpen(true)}
          style={{ gap: 6, whiteSpace: 'nowrap' }}
        >
          <span>➕</span>
          <span>تسجيل إيراد سريع</span>
        </button>
      </div>

      <div className="rev-card animate-in animate-in-delay-3">
        <div className="rev-tabs">
          {TABS.map((tab, i) => (
            <button
              key={i}
              id={`rev-tab-${i}`}
              className={`rev-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <span>{tab.icon}</span>
              <span className="rev-tab-label">{tab.label}</span>
              {tab.count !== null && (
                <span className="rev-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="rev-tab-panel">
          {activeTab === 0 && (
            <RevenueProfitabilityTab categories={filteredCategories} />
          )}
          {activeTab === 1 && (
            <PaymentsLedgerTab payments={filteredPayments} />
          )}
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