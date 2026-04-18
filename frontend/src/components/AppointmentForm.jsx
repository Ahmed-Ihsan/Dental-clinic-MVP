import { useState, useEffect } from 'react';
import api from '../services/api';

const AppointmentForm = ({ onSave }) => {
  const empty = {
    patient_id: '', appointment_date: '', start_time: '',
    end_time: '', dentist_id: '', status: 'scheduled', notes: ''
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients');
        setPatients(response.data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/appointments', form);
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'scheduled',  label: 'مجدول',  color: 'var(--warning)' },
    { value: 'confirmed',  label: 'مؤكد',   color: 'var(--info)' },
    { value: 'completed',  label: 'مكتمل',  color: 'var(--success)' },
    { value: 'cancelled',  label: 'ملغي',   color: 'var(--danger)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">📅</span>
          جدولة موعد جديد
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ تم جدولة الموعد بنجاح!
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label">معرف المريض *</label>
          <select name="patient_id" value={form.patient_id} onChange={handleChange}
            required className="field-input" disabled={loadingPatients}>
            <option value="">{loadingPatients ? 'جارٍ التحميل...' : 'اختر مريض'}</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ الموعد *</label>
          <input name="appointment_date" value={form.appointment_date} onChange={handleChange}
            type="date" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">وقت البداية *</label>
          <input name="start_time" value={form.start_time} onChange={handleChange}
            type="time" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">وقت النهاية *</label>
          <input name="end_time" value={form.end_time} onChange={handleChange}
            type="time" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">معرف الطبيب</label>
          <input name="dentist_id" value={form.dentist_id} onChange={handleChange}
            placeholder="رقم معرف الطبيب" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">حالة الموعد</label>
          <select name="status" value={form.status} onChange={handleChange} className="field-input">
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">ملاحظات</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="أضف أي ملاحظات خاصة بالموعد..." rows={3} className="field-input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : '📅 جدولة الموعد'}
      </button>
    </form>
  );
};

export default AppointmentForm;