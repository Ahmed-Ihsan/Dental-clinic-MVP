import { useState, useEffect, useRef } from 'react';

export default function FormModal({ title, icon, fields, onSubmit, onClose, saving, isDrawer = false }) {
  const [formData, setFormData] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.name] = f.defaultValue ?? ''; });
    return init;
  });
  const [errors, setErrors] = useState({});
  const overlayRef = useRef();
  const firstInputRef = useRef();

  // Focus first input on open
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    fields.forEach(f => {
      if (f.required && !String(formData[f.name] || '').trim()) {
        errs[f.name] = 'هذا الحقل مطلوب';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      className={`cs-modal-overlay ${isDrawer ? 'cs-drawer-overlay' : ''}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={`cs-modal ${isDrawer ? 'cs-drawer' : ''}`} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="cs-modal-header">
          <div className="cs-modal-title">
            <span className="cs-modal-icon">{icon}</span>
            {title}
          </div>
          <button className="cs-modal-close" onClick={onClose} aria-label="إغلاق">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="cs-modal-form" noValidate>
          <div className="cs-modal-body">
            {fields.map((field, idx) => (
              <div key={field.name} className="cs-field-group">
                <label className="cs-field-label">
                  {field.label}
                  {field.required && <span className="cs-field-required">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    ref={idx === 0 ? firstInputRef : null}
                    id={`form-${field.name}`}
                    className={`cs-field-input cs-textarea ${errors[field.name] ? 'cs-field-error' : ''}`}
                    value={formData[field.name]}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ''}
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    ref={idx === 0 ? firstInputRef : null}
                    id={`form-${field.name}`}
                    className={`cs-field-input cs-select ${errors[field.name] ? 'cs-field-error' : ''}`}
                    value={formData[field.name]}
                    onChange={e => handleChange(field.name, e.target.value)}
                  >
                    <option value="">-- اختر --</option>
                    {(field.options || []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    ref={idx === 0 ? firstInputRef : null}
                    id={`form-${field.name}`}
                    type={field.type || 'text'}
                    className={`cs-field-input ${errors[field.name] ? 'cs-field-error' : ''}`}
                    value={formData[field.name]}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                  />
                )}

                {errors[field.name] && (
                  <span className="cs-field-error-msg">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="cs-modal-footer">
            <button type="button" className="cs-btn-ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="submit" className="cs-btn-primary" disabled={saving} id="modal-submit-btn">
              {saving ? (
                <span className="cs-spinner" />
              ) : (
                '💾 حفظ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
