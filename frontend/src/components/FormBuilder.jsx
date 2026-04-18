import { useState } from 'react';
import api from '../services/api';

const FormBuilder = ({
  fields,
  endpoint,
  title,
  icon,
  initialData = {},
  onSave,
  successMessage = 'تم الحفظ بنجاح!'
}) => {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(endpoint, form);
      setSuccess(true);
      setForm(initialData);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">{icon}</span>
          {title}
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ {successMessage}
        </div>
      )}

      <div className="form-grid">
        {fields.map(f => (
          <div className={`field-group ${f.full ? 'form-grid-full' : ''}`} key={f.name}>
            <label className="field-label">{f.label} {f.required && '*'}</label>
            {f.type === 'select' ? (
              <select name={f.name} value={form[f.name] || ''} onChange={handleChange}
                required={f.required} className="field-input">
                <option value="">{f.placeholder}</option>
                {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name] || ''} onChange={handleChange}
                placeholder={f.placeholder} rows={f.rows || 3} required={f.required} className="field-input" />
            ) : (
              <input name={f.name} type={f.type || 'text'} value={form[f.name] || ''} onChange={handleChange}
                placeholder={f.placeholder} required={f.required} className="field-input" />
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : `${icon} حفظ`}
      </button>
    </form>
  );
};

export default FormBuilder;