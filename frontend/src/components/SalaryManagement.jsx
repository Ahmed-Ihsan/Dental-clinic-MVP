import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign, Users, Clock, CheckCircle, Banknote,
  X, Wallet, Plus, Edit3, Loader2,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import ExpenseStatCard from './Expenses/ExpenseStatCard';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Utilities ─────────────────────────────────────────────────────────────────

const fmtCurrency = (n) => `${Number(n || 0).toLocaleString('ar-SA')} IQD`;

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MONTHS_AR = ['يناير','فبراير','مارس','إبريل','مايو','يونيو',
                   'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const periodLabel = (p) => {
  if (!p) return '';
  const [y, m] = p.split('-');
  return `${MONTHS_AR[parseInt(m, 10) - 1]} ${y}`;
};

const AVATAR_PALETTE = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
const avatarColor = (id) => AVATAR_PALETTE[(id || 0) % AVATAR_PALETTE.length];
const initials    = (fn, ln) => `${(fn || '')[0] || ''}${(ln || '')[0] || ''}`.toUpperCase();

// ── SetSalaryModal ─────────────────────────────────────────────────────────────

function SetSalaryModal({ professional, existingSalary, onClose, onSave }) {
  const [form, setForm] = useState({
    base_salary:           existingSalary?.base_salary           || '',
    commission_percentage: existingSalary?.commission_percentage ?? 0,
    effective_date:        localToday(),
    notes:                 existingSalary?.notes                 || '',
  });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.base_salary || Number(form.base_salary) <= 0) {
      toast.error('يرجى إدخال راتب أساسي صحيح');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        professional_id:       professional.id,
        base_salary:           Number(form.base_salary),
        commission_percentage: Number(form.commission_percentage) || 0,
        effective_date:        form.effective_date,
        notes:                 form.notes,
        currency:              'SAR',
        salary_type:           'monthly',
      };
      if (existingSalary) {
        await api.put(`/salaries/${existingSalary.id}`, payload);
        toast.success('تم تحديث الراتب بنجاح');
      } else {
        await api.post('/salaries', payload);
        toast.success('تم تعيين الراتب بنجاح');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'حدث خطأ في حفظ الراتب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-header">
          <div className="sp-modal-title">
            <div className="sp-modal-icon" style={{ background: avatarColor(professional.id) }}>
              <DollarSign size={16} />
            </div>
            <div>
              <div className="sp-modal-heading">
                {existingSalary ? 'تعديل الراتب' : 'تعيين راتب جديد'}
              </div>
              <div className="sp-modal-sub">{professional.first_name} {professional.last_name}</div>
            </div>
          </div>
          <button className="sp-modal-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="sp-modal-body">
          <div className="field-group">
            <label className="field-label">الراتب الأساسي (IQD) *</label>
            <input
              type="number" name="base_salary" value={form.base_salary}
              onChange={change} className="field-input"
              placeholder="مثال: 5000" min="1" step="0.01" required
            />
          </div>
          <div className="field-group">
            <label className="field-label">نسبة العمولة من الإيرادات (%)</label>
            <input
              type="number" name="commission_percentage" value={form.commission_percentage}
              onChange={change} className="field-input"
              placeholder="مثال: 10 (10% من إيرادات العلاجات)" min="0" max="100" step="0.1"
            />
          </div>
          <div className="field-group">
            <label className="field-label">تاريخ السريان *</label>
            <input
              type="date" name="effective_date" value={form.effective_date}
              onChange={change} className="field-input" required
            />
          </div>
          <div className="field-group">
            <label className="field-label">ملاحظات</label>
            <textarea
              name="notes" value={form.notes} onChange={change}
              className="field-input" rows={2} placeholder="ملاحظات اختيارية..."
            />
          </div>
          <div className="sp-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : existingSalary ? 'تحديث الراتب' : 'تعيين الراتب'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── StaffRow ───────────────────────────────────────────────────────────────────

function StaffRow({ staff, onPay, onSetSalary, payingId }) {
  const { id, first_name, last_name, specialty, salary, payroll } = staff;
  const isPaying = payingId === id;
  const isPaid   = payroll?.status === 'paid';
  const hasSalary = !!salary;

  return (
    <tr className={`sp-row${isPaid ? ' sp-row--paid' : ''}${!hasSalary ? ' sp-row--nosalary' : ''}`}>

      {/* Employee */}
      <td>
        <div className="sp-staff-cell">
          <div className="sp-avatar" style={{ background: avatarColor(id) }}>
            {initials(first_name, last_name)}
          </div>
          <div className="sp-name-block">
            <span className="sp-name">{first_name} {last_name}</span>
            <span className="sp-specialty">{specialty || '—'}</span>
          </div>
        </div>
      </td>

      {/* Base */}
      <td>
        {hasSalary
          ? <span className="sp-amount">{fmtCurrency(salary.base_salary)}</span>
          : <span className="sp-muted">—</span>}
      </td>

      {/* Additions */}
      <td>
        {hasSalary && (salary.total_allowances || 0) > 0
          ? <span className="sp-amount sp-amount--add">+{fmtCurrency(salary.total_allowances)}</span>
          : <span className="sp-muted">—</span>}
      </td>

      {/* Deductions */}
      <td>
        {hasSalary && (salary.total_deductions || 0) > 0
          ? <span className="sp-amount sp-amount--ded">−{fmtCurrency(salary.total_deductions)}</span>
          : <span className="sp-muted">—</span>}
      </td>

      {/* Net */}
      <td>
        {hasSalary
          ? <span className="sp-amount sp-amount--net">{fmtCurrency(salary.net_salary)}</span>
          : <span className="sp-muted">—</span>}
      </td>

      {/* Status */}
      <td>
        {!hasSalary && <span className="sp-badge sp-badge--ghost">غير محدد</span>}
        {hasSalary && isPaid  && <span className="sp-badge sp-badge--paid"><CheckCircle size={11} /> مدفوع</span>}
        {hasSalary && !isPaid && <span className="sp-badge sp-badge--pending"><Clock size={11} /> معلق</span>}
      </td>

      {/* Action */}
      <td>
        <div className="sp-action-cell">
          {!hasSalary && (
            <button className="sp-btn sp-btn--set" onClick={() => onSetSalary(staff)}>
              <Plus size={13} /> تعيين راتب
            </button>
          )}
          {hasSalary && isPaid && (
            <button className="sp-btn sp-btn--edit" onClick={() => onSetSalary(staff)}>
              <Edit3 size={13} /> تعديل
            </button>
          )}
          {hasSalary && !isPaid && (
            <button className="sp-btn sp-btn--pay" onClick={() => onPay(staff)} disabled={isPaying}>
              {isPaying
                ? <><Loader2 size={13} className="sp-spin" /> معالجة...</>
                : <><Banknote size={13} /> دفع الآن</>}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── RecentPayouts ──────────────────────────────────────────────────────────────

function RecentPayouts({ payments, profMap }) {
  if (payments.length === 0) {
    return (
      <div className="sp-log-empty">
        <Wallet size={28} strokeWidth={1.2} />
        <span>لا توجد دفعات حديثة</span>
      </div>
    );
  }
  return (
    <div className="sp-log-list">
      {payments.map((p) => (
        <div key={p.id} className="sp-log-item">
          <div className="sp-log-dot" />
          <div className="sp-log-body">
            <div className="sp-log-name">{profMap[p.professional_id] || `#${p.professional_id}`}</div>
            <div className="sp-log-meta">
              <span className="sp-log-amount">{fmtCurrency(p.amount)}</span>
              <span className="sp-log-sep">·</span>
              <span>{p.payment_date ? p.payment_date.substring(0, 10) : '—'}</span>
            </div>
          </div>
          <CheckCircle size={14} className="sp-log-check" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const SalaryManagement = () => {
  const [period, setPeriod] = useState(currentPeriod());

  const prevMonth = () => {
    const [y, m] = period.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [y, m] = period.split('-').map(Number);
    const d = new Date(y, m, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const [professionals,  setProfessionals]  = useState([]);
  const [salaries,       setSalaries]       = useState([]);
  const [payrolls,       setPayrolls]       = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [payingId,       setPayingId]       = useState(null);
  const [salaryModal,    setSalaryModal]    = useState(null);
  const [refresh,        setRefresh]        = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prosRes, salRes, payrollRes, paymentsRes] = await Promise.all([
        api.get('/professionals'),
        api.get('/salaries', { params: { is_active: true } }),
        api.get('/payrolls',  { params: { payroll_period: period } }),
        api.get('/salary-payments'),
      ]);
      setProfessionals(prosRes.data);
      setSalaries(salRes.data);
      setPayrolls(payrollRes.data);
      setRecentPayments(paymentsRes.data.slice(0, 12));
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ في تحميل بيانات الرواتب');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData, refresh]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const staffData = useMemo(() =>
    professionals.map((pro) => ({
      ...pro,
      salary:  salaries.find((s) => s.professional_id === pro.id) || null,
      payroll: payrolls.find((p) => p.professional_id === pro.id) || null,
    })),
    [professionals, salaries, payrolls]
  );

  const profMap = useMemo(() => {
    const m = {};
    professionals.forEach((p) => { m[p.id] = `${p.first_name} ${p.last_name}`; });
    return m;
  }, [professionals]);

  const kpi = useMemo(() => {
    const paid    = staffData.filter((s) => s.payroll?.status === 'paid');
    const pending = staffData.filter((s) => s.salary && s.payroll?.status !== 'paid');
    return {
      totalPaid:    paid.reduce((sum, s)    => sum + (s.payroll?.net_salary  || 0), 0),
      totalPending: pending.reduce((sum, s) => sum + (s.salary?.net_salary   || 0), 0),
      staffCount:   professionals.length,
      paidCount:    paid.length,
      pendingCount: pending.length,
    };
  }, [staffData, professionals]);

  // ── Pay Now ────────────────────────────────────────────────────────────────

  const handlePayNow = async (staff) => {
    if (!staff.salary) return;
    setPayingId(staff.id);
    try {
      let payroll = staff.payroll;

      if (!payroll) {
        const genRes = await api.post('/payrolls/generate', {
          professional_ids: [staff.id],
          payroll_period:   period,
        });
        payroll = genRes.data[0];
        if (!payroll) {
          const fetchRes = await api.get('/payrolls', {
            params: { professional_id: staff.id, payroll_period: period },
          });
          payroll = fetchRes.data[0];
        }
        if (!payroll) { toast.error('لا يوجد راتب نشط لهذا الموظف'); return; }
      }

      if (payroll.status === 'paid') {
        toast.error('تم دفع هذا الراتب مسبقاً');
        setRefresh((r) => r + 1);
        return;
      }

      if (payroll.status === 'draft') {
        const procRes = await api.post(`/payrolls/${payroll.id}/process`);
        payroll = procRes.data;
      }

      await api.post(`/payrolls/${payroll.id}/pay`, {
        payment_method: 'cash',
        payment_date:   localToday(),
      });

      toast.success(`تم دفع راتب ${staff.first_name} ${staff.last_name} بنجاح`);
      setRefresh((r) => r + 1);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'حدث خطأ في معالجة الدفعة');
    } finally {
      setPayingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-spinner" />
        <span>جاري تحميل بيانات الرواتب...</span>
      </div>
    );
  }

  return (
    <div className="sp-page" dir="rtl">

      {/* Page Header */}
      <div className="page-header animate-in">
        <div>
          <h1 className="page-header-title">
            <DollarSign size={20} style={{ display:'inline', marginLeft:8, verticalAlign:'middle', color:'var(--primary)' }} />
            الرواتب والمدفوعات
          </h1>
          <p className="page-header-subtitle">كشف الرواتب الشهري</p>
        </div>
        <div className="sp-period-nav">
          <button className="sp-nav-btn" onClick={prevMonth} title="الشهر السابق">
            <ChevronRight size={16} />
          </button>
          <span className="sp-period-label">
            {periodLabel(period)}
            {period === currentPeriod() && <span className="sp-period-current">الشهر الحالي</span>}
          </span>
          <button
            className="sp-nav-btn"
            onClick={nextMonth}
            disabled={period >= currentPeriod()}
            title="الشهر التالي"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="sp-kpi-grid animate-in">
        <ExpenseStatCard label="إجمالي المدفوع هذا الشهر" value={kpi.totalPaid}    icon="💵" variant="primary" sub={`${kpi.paidCount} دفعة مكتملة`} />
        <ExpenseStatCard label="مدفوعات معلقة"            value={kpi.totalPending} icon="⏳" variant="warning" sub={`${kpi.pendingCount} موظف لم يُدفع بعد`} />
        <ExpenseStatCard label="إجمالي الموظفين"          value={kpi.staffCount}   icon="👥" variant="success" unit="" sub={`${staffData.filter(s => s.salary).length} لديهم رواتب محددة`} />
        <ExpenseStatCard label="إجمالي الخصومات"          value={staffData.reduce((sum, s) => sum + (s.salary?.total_deductions || 0), 0)} icon="📉" variant="danger" sub="مجموع الاستقطاعات" />
      </div>

      {/* Content Layout */}
      <div className="sp-layout animate-in animate-in-delay-1">

        {/* Staff Payroll Table */}
        <div className="sp-table-card">
          <div className="sp-card-header">
            <div className="sp-card-title">
              <Users size={15} />
              كشف الرواتب — {periodLabel(period)}
            </div>
            <span className="sp-card-meta">{staffData.length} موظف</span>
          </div>

          {staffData.length === 0 ? (
            <div className="sp-empty">
              <Users size={40} strokeWidth={1.2} />
              <span>لا يوجد موظفون مسجلون بعد</span>
            </div>
          ) : (
            <div className="sp-table-scroll">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>الراتب الأساسي</th>
                    <th>الإضافات</th>
                    <th>الخصومات</th>
                    <th>صافي المستحق</th>
                    <th>الحالة</th>
                    <th style={{ textAlign: 'center' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff) => (
                    <StaffRow
                      key={staff.id}
                      staff={staff}
                      onPay={handlePayNow}
                      onSetSalary={(s) => setSalaryModal({ professional: s, salary: s.salary })}
                      payingId={payingId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payouts Log */}
        <div className="sp-log-card">
          <div className="sp-card-header">
            <div className="sp-card-title"><Wallet size={15} /> آخر الدفعات</div>
          </div>
          <RecentPayouts payments={recentPayments} profMap={profMap} />
        </div>
      </div>

      {/* Set / Edit Salary Modal */}
      {salaryModal && (
        <SetSalaryModal
          professional={salaryModal.professional}
          existingSalary={salaryModal.salary}
          onClose={() => setSalaryModal(null)}
          onSave={() => { setSalaryModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
};

export default SalaryManagement;