import { useState } from 'react';
import api from '../services/api';

const DetailModal = ({ entity, fields, title, icon, endpoint, onClose, onUpdate, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...entity });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await api.put(`${endpoint}/${entity.id}`, formData);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating:', err);
    }
  };

  if (!entity) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">
            <span style={{ fontSize: 20 }}>{icon}</span>
            {isEditing ? `تعديل ${title}` : `تفاصيل ${title}`}
          </h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            <div className="modal-edit-grid">
              {fields.map(f => (
                <div className={`field-group ${f.full ? 'full' : ''}`} key={f.name}>
                  <label className="field-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select name={f.name} value={formData[f.name] || ''} onChange={handleChange} className="field-input">
                      <option value="">{f.placeholder || 'اختر'}</option>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea name={f.name} value={formData[f.name] || ''} onChange={handleChange}
                      placeholder={f.placeholder} rows={f.rows || 3} className="field-input" />
                  ) : (
                    <input name={f.name} type={f.type || 'text'} value={formData[f.name] || ''} onChange={handleChange}
                      placeholder={f.placeholder} className="field-input" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
                padding: '16px 20px', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {title} #{entity.id}
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                {fields.filter(f => f.showInView).map(f => (
                  <div className={`detail-item ${f.full ? 'detail-item-full' : ''}`} key={f.name}>
                    <div className="detail-label">{f.label}</div>
                    <div className="detail-value">{f.render ? f.render(entity[f.name]) : (entity[f.name] || '—')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleSave} className="btn btn-success">💾 حفظ التعديلات</button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn btn-ghost">إغلاق</button>
              {!readOnly && <button onClick={() => setIsEditing(true)} className="btn btn-primary">✏️ تعديل</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;