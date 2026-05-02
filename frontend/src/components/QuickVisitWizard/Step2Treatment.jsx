import { TREATMENT_CATEGORIES } from '../../constants/treatmentCategories';

export default function Step2Treatment({ data, onChange }) {
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="qvw-step-content">
      <div className="qvw-section">
        <div className="form-grid">
          <div className="field-group form-grid-full">
            <label className="field-label">تصنيف العلاج *</label>
            <select
              name="treatment_type"
              value={data.treatment_type}
              onChange={handleChange}
              className="field-input"
              required
            >
              <option value="">-- اختر تصنيف العلاج --</option>
              {TREATMENT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

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
