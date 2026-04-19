import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';

const SalaryPaymentList = ({ refreshTrigger }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ professional: '', method: '', status: '' });

  useEffect(() => {
    fetchPayments();
  }, [refreshTrigger]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await salaryAPI.getSalaryPayments();
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      cancelled: 'badge-secondary'
    };
    return badges[status] || 'badge-ghost';
  };

  const getStatusText = (status) => {
    const texts = {
      completed: 'مكتمل',
      pending: 'في الانتظار',
      failed: 'فاشل',
      cancelled: 'ملغي'
    };
    return texts[status] || status;
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      bank_transfer: 'تحويل بنكي',
      cash: 'نقدي',
      check: 'شيك'
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      bank_transfer: '🏦',
      cash: '💵',
      check: '📋'
    };
    return icons[method] || '💰';
  };

  const filteredPayments = payments.filter(payment => {
    const matchesProfessional = !filter.professional ||
      `${payment.professional.first_name} ${payment.professional.last_name}`
        .toLowerCase()
        .includes(filter.professional.toLowerCase());

    const matchesMethod = !filter.method || payment.payment_method === filter.method;
    const matchesStatus = !filter.status || payment.status === filter.status;

    return matchesProfessional && matchesMethod && matchesStatus;
  });

  // Get unique professionals for filter
  const professionals = [...new Set(
    payments.map(p => `${p.professional.first_name} ${p.professional.last_name}`)
  )].sort();

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">جاري تحميل بيانات الدفعات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          <span>💰</span>
          دفعات الرواتب
          <span className="badge badge-primary">{filteredPayments.length}</span>
        </h3>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="البحث بالموظف"
            value={filter.professional}
            onChange={(e) => setFilter({ ...filter, professional: e.target.value })}
            className="filter-input"
          />

          <select
            value={filter.method}
            onChange={(e) => setFilter({ ...filter, method: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع طرق الدفع</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="cash">نقدي</option>
            <option value="check">شيك</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الحالات</option>
            <option value="completed">مكتمل</option>
            <option value="pending">في الانتظار</option>
            <option value="failed">فاشل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">لا توجد دفعات مسجلة</div>
          <div className="empty-state-subtext">
            {filter.professional || filter.method || filter.status ? 'لا توجد نتائج مطابقة للبحث' : 'ستظهر الدفعات هنا بعد معالجة ودفع الرواتب'}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>
                {filteredPayments.filter(p => p.status === 'completed').length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                دفعات مكتملة
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>
                {filteredPayments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString()} ريال
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                إجمالي المدفوعات
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--info)' }}>
                {new Set(filteredPayments.map(p => p.professional.id)).size}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                موظف حصل على دفعة
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>تاريخ الدفع</th>
                <th>الموظف</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>رقم المرجع</th>
                <th>معالج بواسطة</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {index + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(payment.created_at).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {payment.professional.first_name} {payment.professional.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {payment.professional.specialty}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                      {payment.amount.toLocaleString()} ريال
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {getPaymentMethodIcon(payment.payment_method)}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        {getPaymentMethodText(payment.payment_method)}
                      </span>
                    </div>
                  </td>
                  <td>
                    {payment.reference_number ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-secondary)' }}>
                        {payment.reference_number}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {payment.processed_by || 'النظام'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 14,
                      color: 'var(--text-secondary)'
                    }}>
                      {payment.notes || '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default SalaryPaymentList;