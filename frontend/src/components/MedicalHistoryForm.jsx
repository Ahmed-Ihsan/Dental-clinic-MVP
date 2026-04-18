import { useState, useEffect } from 'react';
import { MdAdd, MdCheckCircle, MdPerson, MdSearch, MdDateRange, MdDescription, MdHourglassEmpty, MdSave } from 'react-icons/md';
import api from '../services/api';

const MedicalHistoryForm = ({ onSave }) => {
  const empty = {
    patient_id: '', condition: '', diagnosis_date: '', notes: ''
  };
  const [form, setForm] = useState(empty);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'condition') {
      value = value.replace(/\b\w/g, l => l.toUpperCase()); // Title case
    }
    setForm({ ...form, [e.target.name]: value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.patient_id) newErrors.patient_id = 'يجب اختيار المريض';
    if (!form.condition.trim()) newErrors.condition = 'يجب إدخال التشخيص';
    if (!form.diagnosis_date) newErrors.diagnosis_date = 'يجب إدخال تاريخ التشخيص';
    const today = new Date().toISOString().split('T')[0];
    if (form.diagnosis_date > today) newErrors.diagnosis_date = 'تاريخ التشخيص لا يمكن أن يكون في المستقبل';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await api.post('/medical_histories', form);
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving medical history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mh-container" dir="rtl">
      <form onSubmit={handleSubmit} className="mh-glass-card mh-form-card mh-animate-in">
        <div className="mh-form-header">
          <h3 className="mh-form-title">
            <MdAdd className="mh-icon" />
            إضافة سجل طبي جديد
          </h3>
        </div>

        {success && (
          <div className="mh-success-message">
            <MdCheckCircle className="mh-icon" />
            تم إضافة السجل الطبي بنجاح
          </div>
        )}

        <div className="mh-form-grid">
          <div className="mh-form-group">
            <label className="mh-label">
              <MdPerson className="mh-icon" />
              المريض <span className="mh-required">*</span>
            </label>
            <select
              name="patient_id"
              value={form.patient_id}
              onChange={handleChange}
              className={`mh-input ${errors.patient_id ? 'mh-error' : ''}`}
              required
            >
              <option value="">اختر المريض</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.date_of_birth}</option>
              ))}
            </select>
            {errors.patient_id && <span className="mh-error-text">{errors.patient_id}</span>}
          </div>

          <div className="mh-form-group">
            <label className="mh-label">
              <MdSearch className="mh-icon" />
              التشخيص <span className="mh-required">*</span>
            </label>
            <input
              type="text"
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className={`mh-input ${errors.condition ? 'mh-error' : ''}`}
              placeholder="أدخل التشخيص"
              required
            />
            {errors.condition && <span className="mh-error-text">{errors.condition}</span>}
          </div>

          <div className="mh-form-group">
            <label className="mh-label">
              <MdDateRange className="mh-icon" />
              تاريخ التشخيص <span className="mh-required">*</span>
            </label>
            <input
              type="date"
              name="diagnosis_date"
              value={form.diagnosis_date}
              onChange={handleChange}
              className={`mh-input ${errors.diagnosis_date ? 'mh-error' : ''}`}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.diagnosis_date && <span className="mh-error-text">{errors.diagnosis_date}</span>}
          </div>

          <div className="mh-form-group mh-form-group-full">
            <label className="mh-label">
              <MdDescription className="mh-icon" />
              التفاصيل الإضافية
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="mh-input mh-textarea"
              placeholder="أدخل التفاصيل الإضافية"
            />
          </div>
        </div>

        <div className="mh-form-actions">
          <button type="submit" className="mh-btn mh-btn-primary" disabled={loading}>
            {loading ? <MdHourglassEmpty className="mh-icon" /> : <MdSave className="mh-icon" />}
            {loading ? 'جاري الحفظ...' : 'حفظ السجل الطبي'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalHistoryForm;