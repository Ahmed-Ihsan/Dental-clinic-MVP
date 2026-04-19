import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';

const PayrollList = ({ refreshTrigger }) => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ period: '', status: '' });
  const [processingPayroll, setProcessingPayroll] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    bank_name: '',
    account_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayrolls();
  }, [refreshTrigger]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await salaryAPI.getPayrolls();
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async (payrollId) => {
    try {
      await salaryAPI.processPayroll(payrollId);
      fetchPayrolls();
      alert('تم معالجة الراتب بنجاح');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('حدث خطأ في معالجة الراتب');
    }
  };

  const handlePayPayroll = async (payrollId) => {
    if (!paymentData.payment_method || !paymentData.payment_date) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await salaryAPI.payPayroll(payrollId, paymentData);
      fetchPayrolls();
      setProcessingPayroll(null);
      setPaymentData({
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        bank_name: '',
        account_number: '',
        notes: ''
      });
      alert('تم دفع الراتب بنجاح');
    } catch (error) {
      console.error('Error paying payroll:', error);
      alert('حدث خطأ في دفع الراتب');
    }
  };

  const handleDeletePayroll = async (payrollId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الراتب؟ لا يمكن حذف الرواتب المدفوعة.')) {
      try {
        await salaryAPI.deletePayroll(payrollId);
        fetchPayrolls();
      } catch (error) {
        console.error('Error deleting payroll:', error);
        alert('لا يمكن حذف هذا الراتب');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-warning',
      processed: 'badge-info',
      paid: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-ghost';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: 'مسودة',
      processed: 'معالج',
      paid: 'مدفوع',
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

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesPeriod = !filter.period || payroll.payroll_period.includes(filter.period);
    const matchesStatus = !filter.status || payroll.status === filter.status;
    return matchesPeriod && matchesStatus;
  });

  // Get unique periods for filter
  const periods = [...new Set(payrolls.map(p => p.payroll_period))].sort().reverse();

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">جاري تحميل بيانات الرواتب...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          <span>📊</span>
          سجل الرواتب
          <span className="badge badge-primary">{filteredPayrolls.length}</span>
        </h3>

        <div className="filter-bar">
          <select
            value={filter.period}
            onChange={(e) => setFilter({ ...filter, period: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الفترات</option>
            {periods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="processed">معالج</option>
            <option value="paid">مدفوع</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {filteredPayrolls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">لا توجد رواتب مسجلة</div>
          <div className="empty-state-subtext">
            {filter.period || filter.status ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ بمعالجة الرواتب الشهرية'}
          </div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الفترة</th>
              <th>الموظف</th>
              <th>صافي الراتب</th>
              <th>تاريخ المعالجة</th>
              <th>تاريخ الدفع</th>
              <th>طريقة الدفع</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrolls.map((payroll, index) => (
              <tr key={payroll.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {index + 1}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {payroll.payroll_period}
                  </div>
                </td>
                <td>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {payroll.professional.first_name} {payroll.professional.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {payroll.professional.specialty}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {payroll.net_salary.toLocaleString()} ريال
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    إجمالي: {payroll.gross_salary.toLocaleString()} ريال
                  </div>
                </td>
                <td>
                  {payroll.processed_date ? (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {new Date(payroll.processed_date).toLocaleDateString('ar-SA')}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {payroll.payment_date ? (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {new Date(payroll.payment_date).toLocaleDateString('ar-SA')}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {payroll.payments && payroll.payments.length > 0 ? (
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {getPaymentMethodText(payroll.payments[0].payment_method)}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(payroll.status)}`}>
                    {getStatusText(payroll.status)}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {payroll.status === 'draft' && (
                      <button
                        onClick={() => handleProcessPayroll(payroll.id)}
                        className="btn btn-info btn-sm"
                        title="معالجة الراتب"
                      >
                        ⚙️
                      </button>
                    )}

                    {payroll.status === 'processed' && (
                      <button
                        onClick={() => setProcessingPayroll(payroll.id)}
                        className="btn btn-success btn-sm"
                        title="دفع الراتب"
                      >
                        💰
                      </button>
                    )}

                    {(payroll.status === 'draft' || payroll.status === 'processed') && (
                      <button
                        onClick={() => handleDeletePayroll(payroll.id)}
                        className="btn btn-danger btn-sm"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Payment Modal */}
      {processingPayroll && (
        <div className="modal-overlay" onClick={() => setProcessingPayroll(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
                دفع الراتب
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="field-group">
                  <label className="field-label">طريقة الدفع *</label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    className="form-input"
                  >
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="cash">نقدي</option>
                    <option value="check">شيك</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">تاريخ الدفع *</label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    className="form-input"
                  />
                </div>

                {paymentData.payment_method === 'bank_transfer' && (
                  <>
                    <div className="field-group">
                      <label className="field-label">اسم البنك</label>
                      <input
                        type="text"
                        value={paymentData.bank_name}
                        onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                        className="form-input"
                        placeholder="اسم البنك"
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label">رقم الحساب</label>
                      <input
                        type="text"
                        value={paymentData.account_number}
                        onChange={(e) => setPaymentData({ ...paymentData, account_number: e.target.value })}
                        className="form-input"
                        placeholder="رقم الحساب البنكي"
                      />
                    </div>
                  </>
                )}

                {paymentData.payment_method === 'check' && (
                  <div className="field-group">
                    <label className="field-label">رقم الشيك</label>
                    <input
                      type="text"
                      value={paymentData.reference_number}
                      onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                      className="form-input"
                      placeholder="رقم الشيك"
                    />
                  </div>
                )}

                <div className="field-group">
                  <label className="field-label">ملاحظات</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="form-input"
                    rows="3"
                    placeholder="أي ملاحظات إضافية"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => handlePayPayroll(processingPayroll)}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                >
                  تأكيد الدفع
                </button>
                <button
                  onClick={() => setProcessingPayroll(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollList;