import { useState } from 'react';
import api from '../services/api';

const TreatmentDetailModal = ({ treatment, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...treatment });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await api.put(`/treatments/${treatment.id}`, formData);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating treatment:', err);
    }
  };

  if (!treatment) return null;

  const formatCost = (c) => {
    const n = parseFloat(c);
    return isNaN(n) ? '—' : `${n.toLocaleString('ar-SA')} IQD`;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">
            <span style={{ fontSize: 20 }}>🦷</span>
            {isEditing ? 'تعديل العلاج' : 'تفاصيل العلاج'}
          </h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            <div className="modal-edit-grid">
              <div className="field-group">
                <label className="field-label">معرف المريض</label>
                <input name="patient_id" value={formData.patient_id || ''} onChange={handleChange} className="field-input" />
              </div>
              <div className="field-group">
                <label className="field-label">معرف الموعد</label>
                <input name="appointment_id" value={formData.appointment_id || ''} onChange={handleChange}
                  className="field-input" placeholder="اختياري" />
              </div>
              <div className="field-group">
                <label className="field-label">نوع العلاج</label>
                <input name="treatment_type" value={formData.treatment_type || ''} onChange={handleChange} className="field-input" />
              </div>
              <div className="field-group">
                <label className="field-label">التكلفة</label>
                <input name="cost" type="number" step="0.01" value={formData.cost || ''} onChange={handleChange} className="field-input" />
              </div>
              <div className="field-group full">
                <label className="field-label">تاريخ العلاج</label>
                <input name="treatment_date" type="date" value={formData.treatment_date || ''} onChange={handleChange} className="field-input" />
              </div>
              <div className="field-group full">
                <label className="field-label">ملاحظات</label>
                <textarea name="notes" value={formData.notes || ''} onChange={handleChange}
                  rows={3} className="field-input" placeholder="أضف ملاحظات..." />
              </div>
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
                  background: 'var(--warning-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                }}>🦷</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {treatment.treatment_type}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                    {formatCost(treatment.cost)}
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">معرف المريض</div>
                  <div className="detail-value">#{treatment.patient_id}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">معرف الموعد</div>
                  <div className="detail-value">{treatment.appointment_id ? `#${treatment.appointment_id}` : '—'}</div>
                </div>
                <div className="detail-item detail-item-full">
                  <div className="detail-label">تاريخ العلاج</div>
                  <div className="detail-value">{treatment.treatment_date || '—'}</div>
                </div>
                {treatment.notes && (
                  <div className="detail-item detail-item-full">
                    <div className="detail-label">ملاحظات</div>
                    <div className="detail-value">{treatment.notes}</div>
                  </div>
                )}
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

export default TreatmentDetailModal;