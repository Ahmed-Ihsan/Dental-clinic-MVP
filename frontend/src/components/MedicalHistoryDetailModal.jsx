import { useState } from 'react';
import api from '../services/api';

const MedicalHistoryDetailModal = ({ medicalHistory, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...medicalHistory });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'condition') {
      value = value.replace(/\b\w/g, l => l.toUpperCase());
    }
    setFormData({ ...formData, [e.target.name]: value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.condition.trim()) newErrors.condition = 'يجب إدخال التشخيص';
    if (!formData.diagnosis_date) newErrors.diagnosis_date = 'يجب إدخال تاريخ التشخيص';
    const today = new Date().toISOString().split('T')[0];
    if (formData.diagnosis_date > today) newErrors.diagnosis_date = 'تاريخ التشخيص لا يمكن أن يكون في المستقبل';
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await api.put(`/medical_histories/${medicalHistory.id}`, formData);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating medical history:', err);
    }
  };

  if (!medicalHistory) return null;

  return (
    <div className="mh-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mh-modal-box mh-glass-card mh-modal-animate">
        <div className="mh-modal-header">
          <h2 className="mh-modal-title">
            <span className="mh-icon">{isEditing ? '✏️' : '📋'}</span>
            {isEditing ? 'تعديل السجل الطبي' : 'تفاصيل السجل الطبي'}
          </h2>
          <button onClick={onClose} className="mh-modal-close">
            <span className="mh-icon">✕</span>
          </button>
        </div>

        <div className="mh-modal-body">
          {isEditing ? (
            <div className="mh-modal-edit-grid">
              <div className="mh-form-group">
                <div className="mh-input-wrapper">
                  <input
                    name="condition"
                    type="text"
                    value={formData.condition || ''}
                    onChange={handleChange}
                    className={`mh-input ${errors.condition ? 'mh-error' : ''} ${formData.condition ? 'mh-filled' : ''}`}
                    placeholder=" "
                  />
                  <label className="mh-floating-label">التشخيص <span className="mh-required">*</span></label>
                  <span className="mh-icon mh-input-icon">🔍</span>
                </div>
                {errors.condition && <span className="mh-error-text">{errors.condition}</span>}
              </div>
              <div className="mh-form-group">
                <div className="mh-input-wrapper">
                  <input
                    name="diagnosis_date"
                    type="date"
                    value={formData.diagnosis_date || ''}
                    onChange={handleChange}
                    className={`mh-input ${errors.diagnosis_date ? 'mh-error' : ''} ${formData.diagnosis_date ? 'mh-filled' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <label className="mh-floating-label">تاريخ التشخيص <span className="mh-required">*</span></label>
                  <span className="mh-icon mh-input-icon">📅</span>
                </div>
                {errors.diagnosis_date && <span className="mh-error-text">{errors.diagnosis_date}</span>}
              </div>
              <div className="mh-form-group mh-form-group-full">
                <div className="mh-input-wrapper">
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    className={`mh-input mh-textarea ${formData.notes ? 'mh-filled' : ''}`}
                    rows={4}
                    placeholder=" "
                  />
                  <label className="mh-floating-label">التفاصيل الإضافية</label>
                  <span className="mh-icon mh-textarea-icon">📝</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mh-modal-detail-grid">
              <div className="mh-detail-row">
                <span className="mh-detail-label">التشخيص:</span>
                <span className="mh-detail-value">{medicalHistory.condition}</span>
              </div>
              <div className="mh-detail-row">
                <span className="mh-detail-label">تاريخ التشخيص:</span>
                <span className="mh-detail-value">{medicalHistory.diagnosis_date}</span>
              </div>
              <div className="mh-detail-row">
                <span className="mh-detail-label">التفاصيل:</span>
                <span className="mh-detail-value">{medicalHistory.notes || 'لا توجد تفاصيل'}</span>
              </div>
              <div className="mh-detail-row">
                <span className="mh-detail-label">تاريخ الإنشاء:</span>
                <span className="mh-detail-value">{medicalHistory.created_at}</span>
              </div>
              <div className="mh-detail-row">
                <span className="mh-detail-label">آخر تحديث:</span>
                <span className="mh-detail-value">{medicalHistory.updated_at}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mh-modal-footer">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="mh-btn mh-btn-primary">
                <span className="mh-icon">💾</span> حفظ التغييرات
              </button>
              <button onClick={() => setIsEditing(false)} className="mh-btn mh-btn-ghost">
                <span className="mh-icon">❌</span> إلغاء
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="mh-btn mh-btn-secondary">
                <span className="mh-icon">✏️</span> تعديل
              </button>
              <button onClick={onClose} className="mh-btn mh-btn-ghost">
                <span className="mh-icon">🚪</span> إغلاق
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryDetailModal;