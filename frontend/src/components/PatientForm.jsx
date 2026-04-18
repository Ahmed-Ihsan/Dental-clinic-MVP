import { useState } from 'react';
import api from '../services/api';

const PatientForm = ({ onSave }) => {
  const empty = {
    first_name: '', last_name: '', date_of_birth: '',
    gender: '', address: '', phone: '', email: '', emergency_contact: ''
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients', form);
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving patient:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">👤</span>
          إضافة مريض جديد
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ تم إضافة المريض بنجاح!
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label">الاسم الأول *</label>
          <input name="first_name" value={form.first_name} onChange={handleChange}
            placeholder="أدخل الاسم الأول" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">اسم العائلة *</label>
          <input name="last_name" value={form.last_name} onChange={handleChange}
            placeholder="أدخل اسم العائلة" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ الميلاد *</label>
          <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
            type="date" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">الجنس</label>
          <select name="gender" value={form.gender} onChange={handleChange} className="field-input">
            <option value="">اختر الجنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">العنوان</label>
          <input name="address" value={form.address} onChange={handleChange}
            placeholder="أدخل العنوان" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">رقم الهاتف</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            placeholder="05xxxxxxxx" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">البريد الإلكتروني</label>
          <input name="email" value={form.email} onChange={handleChange}
            type="email" placeholder="example@email.com" className="field-input" />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">جهة اتصال طوارئ</label>
          <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
            placeholder="اسم الشخص ورقم هاتفه" className="field-input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : '✅ إضافة المريض'}
      </button>
    </form>
  );
};

export default PatientForm;