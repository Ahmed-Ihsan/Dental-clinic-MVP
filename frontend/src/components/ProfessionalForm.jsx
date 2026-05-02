import { useState } from 'react';
import api from '../services/api';

const ProfessionalForm = ({ onSave }) => {
  const empty = { first_name: '', last_name: '', specialty: '', phone: '', email: '', license_number: '' };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/professionals', form);
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving professional:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">👨‍⚕️</span>
          إضافة متخصص جديد
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ تم إضافة المتخصص بنجاح!
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label">الاسم الأول *</label>
          <input name="first_name" value={form.first_name} onChange={handleChange}
            placeholder="الاسم الأول" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">اسم العائلة *</label>
          <input name="last_name" value={form.last_name} onChange={handleChange}
            placeholder="اسم العائلة" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">التخصص</label>
          <input name="specialty" value={form.specialty} onChange={handleChange}
            placeholder="مثال: طب الأسنان، تقويم..." className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">رقم الترخيص</label>
          <input name="license_number" value={form.license_number} onChange={handleChange}
            placeholder="رقم ترخيص مزاولة المهنة" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">رقم الهاتف</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            type="tel" placeholder="05xxxxxxxx" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">البريد الإلكتروني</label>
          <input name="email" value={form.email} onChange={handleChange}
            type="email" placeholder="example@email.com" className="field-input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : '👨‍⚕️ إضافة المتخصص'}
      </button>
    </form>
  );
};

export default ProfessionalForm;