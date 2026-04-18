import { useState, useEffect } from 'react';
import api from '../services/api';

const TreatmentForm = ({ onSave }) => {
  const empty = {
    patient_id: '', appointment_id: '', treatment_type: '',
    cost: '', notes: '', treatment_date: ''
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments')
        ]);
        setPatients(patientsRes.data);
        setAppointments(appointmentsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/treatments', { ...form, cost: parseFloat(form.cost) || 0 });
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving treatment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">🦷</span>
          إضافة علاج جديد
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ تم إضافة العلاج بنجاح!
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label">معرف المريض *</label>
          <select name="patient_id" value={form.patient_id} onChange={handleChange}
            required className="field-input" disabled={loadingData}>
            <option value="">{loadingData ? 'جارٍ التحميل...' : 'اختر مريض'}</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">معرف الموعد</label>
          <select name="appointment_id" value={form.appointment_id} onChange={handleChange}
            className="field-input" disabled={loadingData}>
            <option value="">{loadingData ? 'جارٍ التحميل...' : 'اختر موعد (اختياري)'}</option>
            {appointments.map(appointment => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.appointment_date} - {appointment.start_time}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">نوع العلاج *</label>
          <input name="treatment_type" value={form.treatment_type} onChange={handleChange}
            placeholder="مثال: حشو، تنظيف..." required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">التكلفة *</label>
          <input name="cost" value={form.cost} onChange={handleChange}
            type="number" step="0.01" min="0" placeholder="0.00 IQD" required className="field-input" />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">تاريخ العلاج *</label>
          <input name="treatment_date" value={form.treatment_date} onChange={handleChange}
            type="date" required className="field-input" />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">ملاحظات</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="أضف أي تفاصيل عن العلاج..." rows={3} className="field-input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : '🦷 إضافة العلاج'}
      </button>
    </form>
  );
};

export default TreatmentForm;