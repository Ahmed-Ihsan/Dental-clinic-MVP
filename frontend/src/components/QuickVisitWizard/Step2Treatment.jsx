const TREATMENT_TYPES = [
  { label: 'تنظيف أسنان',        cost: 50000 },
  { label: 'حشو عادي',            cost: 75000 },
  { label: 'حشو ضوئي (كومبوزيت)', cost: 120000 },
  { label: 'خلع سن',              cost: 40000 },
  { label: 'خلع ضرس العقل',       cost: 150000 },
  { label: 'جذر عصب (RCT)',       cost: 250000 },
  { label: 'تركيب تاج (كراون)',    cost: 350000 },
  { label: 'جسر ثابت',            cost: 500000 },
  { label: 'تقويم أسنان',          cost: 2000000 },
  { label: 'تبييض أسنان',          cost: 200000 },
  { label: 'زراعة سن',            cost: 750000 },
  { label: 'أطقم أسنان',          cost: 400000 },
  { label: 'علاج تقويمي',          cost: 180000 },
  { label: 'فحص ومتابعة',         cost: 25000 },
  { label: 'إجراء آخر',            cost: 0 },
];

export default function Step2Treatment({ data, onChange }) {
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let extra = {};
    if (name === 'treatment_type') {
      const found = TREATMENT_TYPES.find(t => t.label === value);
      if (found && found.cost > 0) extra = { suggested_cost: found.cost };
    }
    onChange({ ...data, [name]: value, ...extra });
  };

  return (
    <div className="qvw-step-content">
      <div className="qvw-section">
        <div className="form-grid">
          <div className="field-group form-grid-full">
            <label className="field-label">نوع الإجراء / العلاج *</label>
            <select
              name="treatment_type"
              value={data.treatment_type}
              onChange={handleChange}
              className="field-input"
              required
            >
              <option value="">اختر نوع العلاج</option>
              {TREATMENT_TYPES.map(t => (
                <option key={t.label} value={t.label}>
                  {t.label}{t.cost > 0 ? ` — ${t.cost.toLocaleString()} د.ع` : ''}
                </option>
              ))}
            </select>
          </div>

          {data.suggested_cost > 0 && (
            <div className="field-group form-grid-full">
              <div className="qvw-suggested-cost-banner">
                <span>💡</span>
                <span>التكلفة المقترحة: <strong>{data.suggested_cost.toLocaleString()} د.ع</strong> — سيتم تطبيقها على الفاتورة في الخطوة التالية</span>
              </div>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">تاريخ العلاج *</label>
            <input
              name="treatment_date"
              value={data.treatment_date || today}
              onChange={handleChange}
              type="date"
              className="field-input"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">الطبيب المعالج</label>
            <input
              name="doctor_name"
              value={data.doctor_name || ''}
              onChange={handleChange}
              placeholder="اسم الطبيب (اختياري)"
              className="field-input"
            />
          </div>

          <div className="field-group form-grid-full">
            <label className="field-label">ملاحظات الطبيب</label>
            <textarea
              name="notes"
              value={data.notes}
              onChange={handleChange}
              placeholder="أدخل أي ملاحظات سريرية إضافية..."
              rows={4}
              className="field-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
