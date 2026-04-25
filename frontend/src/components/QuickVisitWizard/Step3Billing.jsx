import { useEffect } from 'react';

export default function Step3Billing({ data, onChange, suggestedCost }) {
  /* Auto-fill total_amount from suggested cost if field is still empty */
  useEffect(() => {
    if (!data.total_amount && suggestedCost > 0) {
      onChange({ ...data, total_amount: suggestedCost });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedCost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...data, [name]: parseFloat(value) || 0 };
    /* Auto-calculate balance: total - discount - paid */
    const total = name === 'total_amount' ? (parseFloat(value) || 0) : (updated.total_amount || 0);
    const discount = name === 'discount_amount' ? (parseFloat(value) || 0) : (updated.discount_amount || 0);
    const paid  = name === 'paid_amount'  ? (parseFloat(value) || 0) : (updated.paid_amount  || 0);
    updated.balance = Math.max(0, total - discount - paid);
    onChange(updated);
  };

  const balanceColor = data.balance > 0 ? 'var(--warning)' : 'var(--success)';

  const status =
    data.balance <= 0      ? 'paid'
    : data.paid_amount > 0 ? 'partial'
    : 'pending';

  const statusLabel = { paid: '✅ مدفوع بالكامل', partial: '⚠️ مدفوع جزئياً', pending: '🔴 غير مدفوع' }[status];
  const statusClass = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger' }[status];

  return (
    <div className="qvw-step-content">
      <div className="qvw-section">
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label">التكلفة الإجمالية *</label>
            <div className="qvw-amount-wrap">
              <input
                name="total_amount"
                value={data.total_amount || ''}
                onChange={handleChange}
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                className="field-input"
                required
              />
              <span className="qvw-currency">د.ع</span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">المبلغ المدفوع الآن</label>
            <div className="qvw-amount-wrap">
              <input
                name="paid_amount"
                value={data.paid_amount || ''}
                onChange={handleChange}
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                className="field-input"
              />
              <span className="qvw-currency">د.ع</span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">الخصم الممنوح للمريض</label>
            <div className="qvw-amount-wrap">
              <input
                name="discount_amount"
                value={data.discount_amount || ''}
                onChange={handleChange}
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                className="field-input"
              />
              <span className="qvw-currency">د.ع</span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">التكلفة المباشرة/رسوم المعمل</label>
            <div className="qvw-amount-wrap">
              <input
                name="direct_cost"
                value={data.direct_cost || ''}
                onChange={handleChange}
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                className="field-input"
              />
              <span className="qvw-currency">د.ع</span>
            </div>
          </div>

          <div className="field-group form-grid-full">
            <label className="field-label">الرصيد / المتبقي (محسوب تلقائياً)</label>
            <div className="qvw-balance-display" style={{ '--bal-color': balanceColor }}>
              <span className="qvw-balance-value">
                {(data.balance || 0).toLocaleString()} د.ع
              </span>
              <span className={`badge ${statusClass}`}>{statusLabel}</span>
            </div>
          </div>

          {/* Visual payment breakdown bar */}
          {(data.total_amount || 0) > 0 && (
            <div className="field-group form-grid-full">
              <div className="qvw-pay-bar-wrap">
                <div
                  className="qvw-pay-bar-fill"
                  style={{ width: `${Math.min(100, ((data.paid_amount || 0) / (data.total_amount - (data.discount_amount || 0))) * 100)}%` }}
                />
              </div>
              <div className="qvw-pay-bar-labels">
                <span>مدفوع: {((data.paid_amount || 0) / (data.total_amount - (data.discount_amount || 0)) * 100).toFixed(0)}%</span>
                <span>متبقي: {(100 - Math.min(100, (data.paid_amount || 0) / (data.total_amount - (data.discount_amount || 0)) * 100)).toFixed(0)}%</span>
              </div>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">تاريخ الاستحقاق</label>
            <input
              name="due_date"
              value={data.due_date || ''}
              onChange={(e) => onChange({ ...data, due_date: e.target.value })}
              type="date"
              className="field-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">طريقة الدفع</label>
            <select
              name="payment_method"
              value={data.payment_method || ''}
              onChange={(e) => onChange({ ...data, payment_method: e.target.value })}
              className="field-input"
            >
              <option value="">اختر طريقة الدفع</option>
              <option value="cash">نقداً</option>
              <option value="card">بطاقة ائتمان</option>
              <option value="transfer">تحويل بنكي</option>
              <option value="installments">أقساط</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
