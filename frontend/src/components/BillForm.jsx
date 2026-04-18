import { useState, useEffect } from 'react';
import api from '../services/api';

const BillForm = ({ onSave }) => {
  const empty = {
    patient_id: '', appointment_id: '', total_amount: '', paid_amount: 0.0, balance: '', due_date: '', status: 'pending'
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.all([api.get('/patients'), api.get('/appointments')]);
        setPatients(pRes.data);
        setAppointments(aRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, total_amount: parseFloat(form.total_amount), paid_amount: parseFloat(form.paid_amount), balance: parseFloat(form.balance) };
      await api.post('/bills', data);
      setSuccess(true);
      setForm(empty);
      onSave();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving bill:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'معلق' },
    { value: 'paid', label: 'مدفوع' },
    { value: 'overdue', label: 'متأخر' }
  ];

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">💰</span>
          إنشاء فاتورة جديدة
        </h3>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          ✅ تم إنشاء الفاتورة بنجاح!
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label">المريض *</label>
          <select name="patient_id" value={form.patient_id} onChange={handleChange} required className="field-input">
            <option value="">اختر مريض</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">الموعد</label>
          <select name="appointment_id" value={form.appointment_id} onChange={handleChange} className="field-input">
            <option value="">اختر موعد (اختياري)</option>
            {appointments.map(a => <option key={a.id} value={a.id}>{a.appointment_date} - {a.start_time}</option>)}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">المبلغ الإجمالي *</label>
          <input name="total_amount" value={form.total_amount} onChange={handleChange} type="number" step="0.01" min="0" placeholder="0.00 IQD" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">المبلغ المدفوع</label>
          <input name="paid_amount" value={form.paid_amount} onChange={handleChange} type="number" step="0.01" min="0" placeholder="0.00 IQD" className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">المبلغ المتبقي *</label>
          <input name="balance" value={form.balance} onChange={handleChange} type="number" step="0.01" min="0" placeholder="0.00 IQD" required className="field-input" />
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ الاستحقاق</label>
          <input name="due_date" value={form.due_date} onChange={handleChange} type="date" className="field-input" />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">حالة الدفع</label>
          <select name="status" value={form.status} onChange={handleChange} className="field-input">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? '⏳ جارٍ الحفظ...' : '💰 إنشاء الفاتورة'}
      </button>
    </form>
  );
};

export default BillForm;