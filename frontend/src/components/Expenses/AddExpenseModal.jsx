import { useState, useEffect } from 'react';

/** Add / Edit Expense Modal */
export default function AddExpenseModal({ isOpen, onClose, onSave, professionals = [], patients = [] }) {
  const blank = {
    amount: '', paid_amount: '', category: 'clinic',
    status: 'paid', description: '', date: new Date().toISOString().split('T')[0],
    doctor_id: '', patient_id: '', payment_method: '',
  };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  /* Reset form when modal opens */
  useEffect(() => {
    if (isOpen) { setForm(blank); setErrors({}); }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = 'أدخل مبلغاً صحيحاً';
    if (!form.description.trim()) e.description = 'الوصف مطلوب';
    if (!form.date) e.date = 'التاريخ مطلوب';
    if (form.category === 'doctor' && !form.doctor_id) e.doctor_id = 'اختر الطبيب';
    if (form.category === 'patient' && !form.patient_id) e.patient_id = 'اختر المريض';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const paidAmt = form.status === 'paid'
      ? Number(form.amount)
      : Number(form.paid_amount) || 0;

    const expenseData = {
      ...form,
      amount: Number(form.amount),
      paid_amount: paidAmt,
    };
    
    const success = await onSave(expenseData);
    if (success) {
      onClose();
    }
  };

  const needsDoctor  = form.category === 'doctor';
  const needsPatient = form.category === 'patient';

  return (
    <div className="exp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="exp-modal">
        {/* Header */}
        <div className="exp-modal-header">
          <div className="exp-modal-title">
            <span className="exp-modal-icon">💸</span>
            <span>إضافة مصروف جديد</span>
          </div>
          <button className="exp-modal-close" onClick={onClose} aria-label="close">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="exp-modal-body">
          {/* Row 1 */}
          <div className="exp-form-grid">
            {/* Amount */}
            <div className="field-group">
              <label className="field-label">المبلغ الإجمالي (ر.س)</label>
              <input
                id="exp-amount"
                type="number" min="0" step="0.01"
                className={`field-input ${errors.amount ? 'field-input-error' : ''}`}
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </div>

            {/* Date */}
            <div className="field-group">
              <label className="field-label">التاريخ</label>
              <input
                id="exp-date"
                type="date"
                className={`field-input ${errors.date ? 'field-input-error' : ''}`}
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            {/* Category */}
            <div className="field-group">
              <label className="field-label">الفئة</label>
              <select
                id="exp-category"
                className="field-input"
                value={form.category}
                onChange={e => { set('category', e.target.value); set('doctor_id', ''); set('patient_id', ''); }}
              >
                <option value="clinic">🏥 مصاريف العيادة</option>
                <option value="doctor">👨‍⚕️ مصاريف الأطباء</option>
                <option value="patient">🦷 مصاريف المريض</option>
                <option value="lab">🔬 مختبر خارجي</option>
              </select>
            </div>

            {/* Status */}
            <div className="field-group">
              <label className="field-label">حالة الدفع</label>
              <select
                id="exp-status"
                className="field-input"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="paid">✅ مدفوع</option>
                <option value="debt">⚠️ دين / غير مدفوع</option>
              </select>
            </div>

            {/* Partial payment (only if debt) */}
            {form.status === 'debt' && (
              <div className="field-group">
                <label className="field-label">المبلغ المدفوع جزئياً (اختياري)</label>
                <input
                  id="exp-paid-amount"
                  type="number" min="0" step="0.01"
                  className="field-input"
                  placeholder="0.00"
                  value={form.paid_amount}
                  onChange={e => set('paid_amount', e.target.value)}
                />
              </div>
            )}

            {/* Payment Method (only if paid) */}
            {form.status === 'paid' && (
              <div className="field-group">
                <label className="field-label">طريقة الدفع</label>
                <select
                  id="exp-payment-method"
                  className="field-input"
                  value={form.payment_method}
                  onChange={e => set('payment_method', e.target.value)}
                >
                  <option value="">— اختر —</option>
                  <option value="كاش">نقداً</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                  <option value="شيك">شيك</option>
                </select>
              </div>
            )}

            {/* Doctor lookup */}
            {needsDoctor && (
              <div className="field-group">
                <label className="field-label">الطبيب</label>
                <select
                  id="exp-doctor"
                  className={`field-input ${errors.doctor_id ? 'field-input-error' : ''}`}
                  value={form.doctor_id}
                  onChange={e => set('doctor_id', e.target.value)}
                >
                  <option value="">— اختر الطبيب —</option>
                  {professionals.map(d => (
                    <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                  ))}
                </select>
                {errors.doctor_id && <span className="field-error">{errors.doctor_id}</span>}
              </div>
            )}

            {/* Patient lookup */}
            {needsPatient && (
              <div className="field-group">
                <label className="field-label">المريض</label>
                <select
                  id="exp-patient"
                  className={`field-input ${errors.patient_id ? 'field-input-error' : ''}`}
                  value={form.patient_id}
                  onChange={e => set('patient_id', e.target.value)}
                >
                  <option value="">— اختر المريض —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
                {errors.patient_id && <span className="field-error">{errors.patient_id}</span>}
              </div>
            )}
          </div>

          {/* Description (full width) */}
          <div className="field-group" style={{ marginTop: 14 }}>
            <label className="field-label">الوصف / البيان</label>
            <textarea
              id="exp-description"
              className={`field-input ${errors.description ? 'field-input-error' : ''}`}
              placeholder="أدخل وصفاً تفصيلياً للمصروف..."
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Footer */}
          <div className="exp-modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary">
              <span>💾</span> حفظ المصروف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
