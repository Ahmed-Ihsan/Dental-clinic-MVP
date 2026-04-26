import { useState, useEffect } from 'react';
import api from '../services/api';
import BillForm from './BillForm.jsx';
import BillList from './BillList.jsx';

const VARIANTS = {
  primary: { border: 'var(--primary)', iconBg: 'var(--primary-light)', val: 'var(--primary)' },
  success: { border: 'var(--success)', iconBg: 'var(--success-bg)',   val: 'var(--success)' },
  warning: { border: 'var(--warning)', iconBg: 'var(--warning-bg)',   val: 'var(--warning)' },
  danger:  { border: 'var(--danger)',  iconBg: 'var(--danger-bg)',    val: 'var(--danger)'  },
};

const KpiCard = ({ icon, label, value, sub, variant = 'primary' }) => {
  const v = VARIANTS[variant];
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderTop: `2px solid ${v.border}`, borderRadius: 'var(--radius-lg)',
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: v.iconBg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, marginBottom: 8,
      }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.3px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: v.val, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
};

const fmt = (n) => Number(n || 0).toLocaleString('ar-SA') + ' IQD';

const BillManagement = () => {
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/bills').then(({ data: bills }) => {
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        todayRevenue:  bills.filter(b => (b.created_at || '').startsWith(today)).reduce((s, b) => s + (b.paid_amount || 0), 0),
        totalCollected: bills.reduce((s, b) => s + (b.paid_amount || 0), 0),
        pendingCount:  bills.filter(b => b.status === 'pending').length,
        overdueAmount: bills.filter(b => b.status === 'overdue').reduce((s, b) => s + (b.balance || 0), 0),
        overdueCount:  bills.filter(b => b.status === 'overdue').length,
        total: bills.length,
      });
    }).catch(console.error);
  }, [refresh]);

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">💰</span>
          إدارة الفواتير
        </h1>
        <p className="page-header-subtitle">إنشاء وتتبع الفواتير والمدفوعات</p>
      </div>

      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 28,
        }} className="animate-in">
          <KpiCard icon="💰" label="إيرادات اليوم"   value={fmt(stats.todayRevenue)}   sub={`${stats.total} فاتورة إجمالاً`}        variant="primary" />
          <KpiCard icon="✅" label="إجمالي المحصّل"   value={fmt(stats.totalCollected)} sub="جميع الفترات"                             variant="success" />
          <KpiCard icon="⏳" label="فواتير معلّقة"    value={stats.pendingCount}         sub="في انتظار الدفع"                          variant="warning" />
          <KpiCard icon="⚠️" label="مبالغ متأخرة"     value={fmt(stats.overdueAmount)}  sub={`${stats.overdueCount} فاتورة متأخرة`}  variant="danger"  />
        </div>
      )}

      <div className="management-layout">
        <BillForm onSave={() => setRefresh(r => r + 1)} />
        <BillList refreshTrigger={refresh} />
      </div>
    </div>
  );
};

export default BillManagement;