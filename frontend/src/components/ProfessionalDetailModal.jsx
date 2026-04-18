import { useState } from 'react';
import api from '../services/api';

const ProfessionalDetailModal = ({ professional, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...professional });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await api.put(`/professionals/${professional.id}`, formData);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating professional:', err);
    }
  };

  if (!professional) return null;

  const getInitials = (first, last) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">
            <span style={{ fontSize: 20 }}>👨‍⚕️</span>
            {isEditing ? 'تعديل بيانات المتخصص' : 'تفاصيل المتخصص'}
          </h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            <div className="modal-edit-grid">
              {[
                { name: 'first_name',     label: 'الاسم الأول',       type: 'text' },
                { name: 'last_name',      label: 'اسم العائلة',       type: 'text' },
                { name: 'specialty',      label: 'التخصص',             type: 'text' },
                { name: 'license_number', label: 'رقم الترخيص',       type: 'text' },
                { name: 'phone',          label: 'رقم الهاتف',        type: 'text' },
                { name: 'email',          label: 'البريد الإلكتروني', type: 'email' },
              ].map(f => (
                <div className="field-group" key={f.name}>
                  <label className="field-label">{f.label}</label>
                  <input
                    name={f.name} type={f.type}
                    value={formData[f.name] || ''}
                    onChange={handleChange}
                    className="field-input"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Profile Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
                padding: '20px', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-primary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0
                }}>
                  {getInitials(professional.first_name, professional.last_name)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    د. {professional.first_name} {professional.last_name}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {professional.specialty ? (
                      <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {professional.specialty}
                      </span>
                    ) : (
                      <span className="badge badge-ghost">تخصص غير محدد</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">رقم الهاتف</div>
                  <div className="detail-value" dir="ltr" style={{ textAlign: 'right' }}>
                    {professional.phone || '—'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">رقم الترخيص</div>
                  <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {professional.license_number || '—'}
                  </div>
                </div>
                <div className="detail-item detail-item-full">
                  <div className="detail-label">البريد الإلكتروني</div>
                  <div className="detail-value">{professional.email || '—'}</div>
                </div>
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
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">✏️ تعديل</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetailModal;