import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';

const PaymentInstallmentList = ({ refreshTrigger }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ professional: '', type: '', status: '' });
  const [processingPayment, setProcessingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchInstallments();
  }, [refreshTrigger]);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const response = await salaryAPI.getInstallments();
      setInstallments(response.data);
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async (installmentId) => {
    const installment = installments.find(i => i.id === installmentId);
    if (!installment) return;

    setPaymentData({
      amount: installment.installment_amount.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: installment.payment_method,
      reference_number: '',
      notes: `دفعة رقم ${installment.completed_installments + 1} من ${installment.total_installments}`
    });
    setProcessingPayment(installmentId);
  };

  const handleConfirmPayment = async () => {
    if (!processingPayment || !paymentData.amount || !paymentData.payment_date) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await salaryAPI.createInstallmentPayment(processingPayment, paymentData);
      fetchInstallments();
      setProcessingPayment(null);
      setPaymentData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: ''
      });
      alert('تم تسجيل الدفعة بنجاح');
    } catch (error) {
      console.error('Error making payment:', error);
      alert('حدث خطأ في تسجيل الدفعة');
    }
  };

  const handleDeleteInstallment = async (installmentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن حذف الدفعات التي تم دفع جزء منها.')) {
      try {
        await salaryAPI.deleteInstallment(installmentId);
        fetchInstallments();
      } catch (error) {
        console.error('Error deleting installment:', error);
        alert('لا يمكن حذف هذه الدفعة');
      }
    }
  };

  const getStatusBadge = (status, isOverdue = false) => {
    if (isOverdue) return 'badge-danger';

    const badges = {
      active: 'badge-success',
      completed: 'badge-primary',
      paused: 'badge-warning',
      cancelled: 'badge-secondary'
    };
    return badges[status] || 'badge-ghost';
  };

  const getStatusText = (status, isOverdue = false) => {
    if (isOverdue) return 'متأخر';

    const texts = {
      active: 'نشط',
      completed: 'مكتمل',
      paused: 'متوقف',
      cancelled: 'ملغي'
    };
    return texts[status] || status;
  };

  const getInstallmentTypeText = (type) => {
    const types = {
      loan_repayment: 'سداد قرض',
      salary_installment: 'دفعة راتب',
      bonus_schedule: 'جدولة مكافأة',
      deduction_schedule: 'جدولة خصم',
      advance_repayment: 'سداد سلفة'
    };
    return types[type] || type;
  };

  const getFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري'
    };
    return frequencies[frequency] || frequency;
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      bank_transfer: 'تحويل بنكي',
      cash: 'نقدي',
      check: 'شيك'
    };
    return methods[method] || method;
  };

  const filteredInstallments = installments.filter(installment => {
    const matchesProfessional = !filter.professional ||
      `${installment.professional.first_name} ${installment.professional.last_name}`
        .toLowerCase()
        .includes(filter.professional.toLowerCase());

    const matchesType = !filter.type || installment.installment_type === filter.type;
    const matchesStatus = !filter.status || installment.status === filter.status;

    return matchesProfessional && matchesType && matchesStatus;
  });

  // Get unique professionals for filter
  const professionals = [...new Set(
    installments.map(i => `${i.professional.first_name} ${i.professional.last_name}`)
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
          <span>📅</span>
          الدفعات المجدولة
          <span className="badge badge-primary">{filteredInstallments.length}</span>
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
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الأنواع</option>
            <option value="loan_repayment">سداد قرض</option>
            <option value="salary_installment">دفعة راتب</option>
            <option value="bonus_schedule">جدولة مكافأة</option>
            <option value="deduction_schedule">جدولة خصم</option>
            <option value="advance_repayment">سداد سلفة</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="paused">متوقف</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {filteredInstallments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">لا توجد دفعات مجدولة</div>
          <div className="empty-state-subtext">
            {filter.professional || filter.type || filter.status ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ بإضافة دفعة مجدولة جديدة'}
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
                {filteredInstallments.filter(i => i.status === 'active').length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                دفعات نشطة
              </div>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>
                {filteredInstallments.filter(i => i.status === 'active' && new Date(i.next_due_date) < new Date()).length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                دفعات متأخرة
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
                {filteredInstallments.reduce((sum, i) => sum + i.remaining_amount, 0).toLocaleString()} ريال
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                المبلغ المتبقي الكلي
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
                {new Set(filteredInstallments.map(i => i.professional.id)).size}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                موظف لديه دفعات
              </div>
            </div>
          </div>

          {/* Installments Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الموظف</th>
                <th>نوع الدفعة</th>
                <th>المبلغ المتبقي</th>
                <th>التقدم</th>
                <th>التكرار</th>
                <th>الموعد القادم</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstallments.map((installment, index) => {
                const isOverdue = installment.status === 'active' && new Date(installment.next_due_date) < new Date();
                const progressPercentage = installment.progress_percentage;

                return (
                  <tr key={installment.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {installment.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {getInstallmentTypeText(installment.installment_type)}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {installment.professional.first_name} {installment.professional.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {installment.professional.specialty}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                        {installment.remaining_amount.toLocaleString()} ريال
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        من {installment.total_amount.toLocaleString()} ريال
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {installment.completed_installments} / {installment.total_installments}
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--bg-card)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: progressPercentage === 100 ? 'var(--success)' : 'var(--primary)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {progressPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        {getFrequencyText(installment.frequency)}
                      </span>
                    </td>
                    <td>
                      <div style={{
                        fontSize: 14,
                        color: isOverdue ? 'var(--danger)' : 'var(--text-primary)',
                        fontWeight: isOverdue ? 600 : 400
                      }}>
                        {new Date(installment.next_due_date).toLocaleDateString('ar-SA')}
                      </div>
                      {isOverdue && (
                        <div style={{ fontSize: 12, color: 'var(--danger)' }}>
                          متأخر
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(installment.status, isOverdue)}`}>
                        {getStatusText(installment.status, isOverdue)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {installment.status === 'active' && (
                          <button
                            onClick={() => handleMakePayment(installment.id)}
                            className="btn btn-success btn-sm"
                            title="تسجيل دفعة"
                          >
                            💰
                          </button>
                        )}

                        {installment.completed_installments === 0 && (
                          <button
                            onClick={() => handleDeleteInstallment(installment.id)}
                            className="btn btn-danger btn-sm"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Payment Modal */}
      {processingPayment && (
        <div className="modal-overlay" onClick={() => setProcessingPayment(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
                تسجيل دفعة
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="field-group">
                  <label className="field-label">مبلغ الدفعة *</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">تاريخ الدفع *</label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">طريقة الدفع</label>
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
                  <label className="field-label">رقم المرجع</label>
                  <input
                    type="text"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                    className="form-input"
                    placeholder="رقم الإيصال أو المعاملة"
                  />
                </div>

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
                  onClick={handleConfirmPayment}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                >
                  تأكيد الدفع
                </button>
                <button
                  onClick={() => setProcessingPayment(null)}
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

export default PaymentInstallmentList;