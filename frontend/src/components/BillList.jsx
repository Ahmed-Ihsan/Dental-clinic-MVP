import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import DataList from './DataList.jsx';
import BillDetailModal from './BillDetailModal.jsx';

const STATUS_OPTIONS = [
  { value: 'all',     label: 'جميع الحالات' },
  { value: 'pending', label: 'معلق' },
  { value: 'paid',    label: 'مدفوع' },
  { value: 'overdue', label: 'متأخر' },
];

const statusRender = s => {
  const map    = { pending: 'معلق', paid: 'مدفوع', overdue: 'متأخر', partial: 'جزئي', unpaid: 'غير مدفوع' };
  const badges = { pending: 'badge-warning', paid: 'badge-info', overdue: 'badge-danger', partial: 'badge-ghost', unpaid: 'badge-ghost' };
  return <span className={`badge ${badges[s] || 'badge-ghost'}`}>{map[s] || s}</span>;
};

const amountRender = (amt) => Number(amt || 0).toLocaleString('ar-SA') + ' IQD';

const BillList = ({ refreshTrigger }) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  /* ── Patient name resolution ── */
  const [patientMap, setPatientMap] = useState({});
  useEffect(() => {
    api.get('/patients').then(({ data }) => {
      const m = {};
      data.forEach(p => { m[p.id] = `${p.first_name} ${p.last_name}`; });
      setPatientMap(m);
    }).catch(console.error);
  }, []);

  /* ── Search + date filter state ── */
  const [search,   setSearch]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  /* ── Column definitions ── */
  const columns = useMemo(() => [
    {
      key: 'patient_id', label: 'المريض',
      render: (id) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          🦷 {patientMap[id] || `مريض #${id}`}
        </span>
      ),
    },
    { key: 'total_amount', label: 'الإجمالي',  render: amountRender },
    { key: 'paid_amount',  label: 'المدفوع',   render: amountRender },
    {
      key: 'balance', label: 'المتبقي',
      render: (v, item) => (
        <span style={{ fontWeight: 700, color: item.status === 'overdue' ? 'var(--danger)' : v > 0 ? 'var(--warning)' : 'var(--success)' }}>
          {amountRender(v)}
        </span>
      ),
    },
    {
      key: 'due_date', label: 'الاستحقاق',
      render: (d, item) => d
        ? <span style={{ color: item.status === 'overdue' ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13 }}>
            {item.status === 'overdue' ? '⚠️ ' : ''}{d}
          </span>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'status', label: 'الحالة', render: statusRender },
  ], [patientMap]);

  /* ── Client-side filter (search + date range) ── */
  const clientSideFilter = useMemo(() => (data) => data.filter(b => {
    const name = (patientMap[b.patient_id] || '').toLowerCase();
    const id   = `bill-${b.id}`;
    const matchSearch = !search.trim() ||
      name.includes(search.toLowerCase()) ||
      id.includes(search.toLowerCase());
    const dateRef  = b.due_date || (b.created_at || '').slice(0, 10);
    const matchFrom = !fromDate || dateRef >= fromDate;
    const matchTo   = !toDate   || dateRef <= toDate;
    return matchSearch && matchFrom && matchTo;
  }), [patientMap, search, fromDate, toDate]);

  /* ── Overdue row highlight ── */
  const rowStyle = (item) => item.status === 'overdue'
    ? { background: 'rgba(248,113,113,0.06)', borderLeft: '3px solid var(--danger)' }
    : undefined;

  const actions = [
    { key: 'view',   label: '👁 عرض',  variant: 'ghost',  onClick: setSelectedBill },
    { key: 'delete', label: '🗑 حذف',  variant: 'danger' },
  ];

  const hasFilters = search || fromDate || toDate;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* ── Search + Date Range Bar ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center',
        padding: '12px 16px', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            className="field-input"
            placeholder="بحث بالاسم أو رقم الفاتورة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingRight: 34 }}
          />
        </div>

        <input type="date" className="field-input" style={{ width: 148 }} value={fromDate} onChange={e => setFromDate(e.target.value)} title="من تاريخ" />
        <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>إلى</span>
        <input type="date" className="field-input" style={{ width: 148 }} value={toDate}   onChange={e => setToDate(e.target.value)}   title="إلى تاريخ" />

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); }}>
            ✕ مسح
          </button>
        )}
      </div>

      <DataList
        endpoint="/bills"
        title="قائمة الفواتير"
        icon="💰"
        filters={[{ name: 'status', type: 'select', options: STATUS_OPTIONS, defaultValue: 'all', placeholder: 'جميع الحالات' }]}
        columns={columns}
        actions={actions}
        refreshTrigger={refreshTrigger + refreshKey}
        rowStyle={rowStyle}
        clientSideFilter={clientSideFilter}
      />

      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onUpdate={() => { setRefreshKey(k => k + 1); setSelectedBill(null); }}
        />
      )}
    </div>
  );
};

export default BillList;