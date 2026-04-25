import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

export function useCaseSheetData(patientId) {
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientRes, historyRes, treatmentsRes, appointmentsRes, billsRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get('/medical_histories', { params: { patient_id: patientId } }),
        api.get('/treatments'),
        api.get('/appointments'),
        api.get('/bills'),
      ]);
      setPatient(patientRes.data);
      setMedicalHistory(historyRes.data || []);
      setTreatments((treatmentsRes.data || []).filter(t => String(t.patient_id) === String(patientId)));
      setAppointments((appointmentsRes.data || []).filter(a => String(a.patient_id) === String(patientId)));
      setBills((billsRes.data || []).filter(b => String(b.patient_id) === String(patientId)));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load patient data.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addMedicalHistory = async (data) => {
    const res = await api.post('/medical_histories', { ...data, patient_id: patientId });
    setMedicalHistory(prev => [res.data, ...prev]);
    return res.data;
  };

  const addTreatment = async (data) => {
    const res = await api.post('/treatments', { ...data, patient_id: patientId });
    setTreatments(prev => [res.data, ...prev]);
    return res.data;
  };

  const addAppointment = async (data) => {
    const res = await api.post('/appointments', { ...data, patient_id: patientId });
    setAppointments(prev => [res.data, ...prev]);
    return res.data;
  };

  const deleteTreatment = async (id) => {
    await api.delete(`/treatments/${id}`);
    setTreatments(prev => prev.filter(t => t.id !== id));
  };

  const deleteMedicalHistory = async (id) => {
    await api.delete(`/medical_histories/${id}`);
    setMedicalHistory(prev => prev.filter(h => h.id !== id));
  };

  const addBill = async (data) => {
    const res = await api.post('/bills', { ...data, patient_id: patientId });
    setBills(prev => [res.data, ...prev]);
    return res.data;
  };

  return {
    patient, medicalHistory, treatments, appointments, bills,
    loading, error, refetch: fetchAll,
    addMedicalHistory, addTreatment, addAppointment, addBill,
    deleteTreatment, deleteMedicalHistory,
  };
}
