import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';

const PaymentInstallmentForm = ({ onSave, editInstallment = null }) => {
  const [formData, setFormData] = useState({
    professional_id: '',
    installment_type: 'loan_repayment',
    title: '',
    total_amount: '',
    installment_amount: '',
    total_installments: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    bank_name: '',
    account_number: '',
    reference_info: '',
    auto_process: false,
    priority: 'normal',
    description: '',
    notes: ''
  });
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculatedFields, setCalculatedFields] = useState({
    total_from_installments: 0,
    difference: 0
  });

  useEffect(() => {
    fetchProfessionals();
    if (editInstallment) {
      setFormData({
        professional_id: editInstallment.professional_id,
        installment_type: editInstallment.installment_type,
        title: editInstallment.title,
        total_amount: editInstallment.total_amount,
        installment_amount: editInstallment.installment_amount,
        total_installments: editInstallment.total_installments,
        frequency: editInstallment.frequency,
        start_date: editInstallment.start_date,
        payment_method: editInstallment.payment_method,
        bank_name: editInstallment.bank_name || '',
        account_number: editInstallment.account_number || '',
        reference_info: editInstallment.reference_info || '',
        auto_process: editInstallment.auto_process,
        priority: editInstallment.priority,
        description: editInstallment.description || '',
        notes: editInstallment.notes || ''
      });
    }
  }, [editInstallment]);

  useEffect(() => {
    // Calculate totals when relevant fields change
    const installmentAmount = parseFloat(formData.installment_amount) || 0;
    const totalInstallments = parseInt(formData.total_installments) || 0;
    const totalAmount = parseFloat(formData.total_amount) || 0;

    const totalFromInstallments = installmentAmount * totalInstallments;
    const difference = totalAmount - totalFromInstallments;

    setCalculatedFields({
      total_from_installments: totalFromInstallments,
      difference: difference
    });
  }, [formData.installment_amount, formData.total_installments, formData.total_amount]);

  const fetchProfessionals = async () => {
    try {
      const response = await salaryAPI.getSalaries({ is_active: 'true' });
      // Get unique professionals
      const uniqueProfessionals = [];
      const seen = new Set();

      response.data.forEach(salary => {
        if (!seen.has(salary.professional.id)) {
          seen.add(salary.professional.id);
          uniqueProfessionals.push(salary.professional);
        }
      });

      setProfessionals(uniqueProfessionals);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCalculateInstallments = () => {
    const totalAmount = parseFloat(formData.total_amount) || 0;
    const totalInstallments = parseInt(formData.total_installments) || 0;

    if (totalInstallments > 0) {
      const installmentAmount = totalAmount / totalInstallments;
      setFormData({
        ...formData,
        installment_amount: installmentAmount.toFixed(2)
      });
    }
  };

  const handleCalculateTotalInstallments = () => {
    const totalAmount = parseFloat(formData.total_amount) || 0;
    const installmentAmount = parseFloat(formData.installment_amount) || 0;

    if (installmentAmount > 0) {
      const totalInstallments = Math.ceil(totalAmount / installmentAmount);
      setFormData({
        ...formData,
        total_installments: totalInstallments.toString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.professional_id) {
      alert('يرجى اختيار الموظف');
      return;
    }

    if (Math.abs(calculatedFields.difference) > 0.01) {
      alert('المبلغ الإجمالي لا يتطابق مع مجموع الدفعات. يرجى التأكد من البيانات.');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        created_by: 'Admin' // In a real app, this would come from user context
      };

      if (editInstallment) {
        await salaryAPI.updateInstallment(editInstallment.id, submitData);
      } else {
        await salaryAPI.createInstallment(submitData);
      }

      onSave();
      if (!editInstallment) {
        setFormData({
          professional_id: '',
          installment_type: 'loan_repayment',
          title: '',
          total_amount: '',
          installment_amount: '',
          total_installments: '',
          frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          bank_name: '',
          account_number: '',
          reference_info: '',
          auto_process: false,
          priority: 'normal',
          description: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving installment:', error);
      alert('حدث خطأ في حفظ الدفعة');
    } finally {
      setLoading(false);
    }
  };

  const installmentTypeOptions = [
    { value: 'loan_repayment', label: 'سداد قرض' },
    { value: 'salary_installment', label: 'دفعة راتب' },
    { value: 'bonus_schedule', label: 'جدولة مكافأة' },
    { value: 'deduction_schedule', label: 'جدولة خصم' },
    { value: 'advance_repayment', label: 'سداد سلفة' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' }
  ];

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'cash', label: 'نقدي' },
    { value: 'check', label: 'شيك' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'منخفض' },
    { value: 'normal', label: 'عادي' },
    { value: 'high', label: 'عالي' }
  ];

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">📅</span>
          {editInstallment ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field-group">
          <label className="field-label">الموظف *</label>
          <select
            name="professional_id"
            value={formData.professional_id}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            <option value="">اختر الموظف</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.first_name} {prof.last_name} - {prof.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">نوع الدفعة *</label>
          <select
            name="installment_type"
            value={formData.installment_type}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            {installmentTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">عنوان الدفعة *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-input"
            placeholder="مثال: قرض شهري، دفعة راتب إضافية"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">المبلغ الإجمالي *</label>
          <input
            type="number"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleInputChange}
            className="form-input"
            placeholder="المبلغ الكلي"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">مبلغ الدفعة الواحدة *</label>
          <input
            type="number"
            name="installment_amount"
            value={formData.installment_amount}
            onChange={handleInputChange}
            className="form-input"
            placeholder="مبلغ كل دفعة"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">عدد الدفعات *</label>
          <input
            type="number"
            name="total_installments"
            value={formData.total_installments}
            onChange={handleInputChange}
            className="form-input"
            placeholder="إجمالي عدد الدفعات"
            min="1"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">التكرار *</label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ البداية *</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">طريقة الدفع *</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            {paymentMethodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">الأولوية</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="form-input"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formData.payment_method === 'bank_transfer' && (
          <>
            <div className="field-group">
              <label className="field-label">اسم البنك</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="اسم البنك"
              />
            </div>

            <div className="field-group">
              <label className="field-label">رقم الحساب</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                className="form-input"
                placeholder="رقم الحساب البنكي"
              />
            </div>
          </>
        )}

        {formData.payment_method === 'check' && (
          <div className="field-group">
            <label className="field-label">معلومات المرجع</label>
            <input
              type="text"
              name="reference_info"
              value={formData.reference_info}
              onChange={handleInputChange}
              className="form-input"
              placeholder="رقم الشيك أو معلومات إضافية"
            />
          </div>
        )}

        <div className="field-group form-grid-full">
          <label className="field-label">
            <input
              type="checkbox"
              name="auto_process"
              checked={formData.auto_process}
              onChange={handleInputChange}
              style={{ marginLeft: '8px' }}
            />
            معالجة تلقائية
          </label>
          <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
            تفعيل المعالجة التلقائية للدفعات عند حلول موعد الاستحقاق
          </small>
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">الوصف</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-input"
            rows="2"
            placeholder="وصف تفصيلي للدفعة"
          />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">ملاحظات</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="form-input"
            rows="2"
            placeholder="أي ملاحظات إضافية"
          />
        </div>

        {/* Calculation Summary */}
        <div className="field-group form-grid-full">
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>ملخص الحسابات</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>المبلغ الإجمالي:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>
                  {parseFloat(formData.total_amount || 0).toLocaleString()} ريال
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>مبلغ الدفعة:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {parseFloat(formData.installment_amount || 0).toLocaleString()} ريال
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>عدد الدفعات:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formData.total_installments || 0}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>المجموع المحسوب:</span>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: calculatedFields.difference === 0 ? 'var(--success)' :
                         calculatedFields.difference > 0 ? 'var(--danger)' : 'var(--warning)'
                }}>
                  {calculatedFields.total_from_installments.toLocaleString()} ريال
                  {calculatedFields.difference !== 0 && (
                    <small style={{ display: 'block', fontSize: '12px' }}>
                      {calculatedFields.difference > 0 ? 'زيادة' : 'نقص'}:
                      {Math.abs(calculatedFields.difference).toLocaleString()} ريال
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleCalculateInstallments}
                className="btn btn-secondary btn-sm"
              >
                حساب مبلغ الدفعة
              </button>
              <button
                type="button"
                onClick={handleCalculateTotalInstallments}
                className="btn btn-secondary btn-sm"
              >
                حساب عدد الدفعات
              </button>
            </div>
          </div>
        </div>

        <div className="field-group form-grid-full">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || calculatedFields.difference > 0.01}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'جاري الحفظ...' : (editInstallment ? 'تحديث الدفعة' : 'حفظ الدفعة')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentInstallmentForm;