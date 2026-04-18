/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import AppointmentDetailModal from './AppointmentDetailModal.jsx';

const getStatusText  = s => ({ scheduled: 'مجدول', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' }[s] ?? s);
const getStatusBadge = s => ({ scheduled: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' }[s] ?? 'badge-ghost');

const AppointmentList = ({ refreshTrigger }) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [patientId, setPatientId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: statusFilter, date_from: dateFrom, date_to: dateTo, patient_id: patientId });
      const res = await api.get(`/appointments?${params}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  }, [statusFilter, dateFrom, dateTo, patientId]);

  const deleteAppointment = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchAppointments();
      } catch (err) {
        console.error('Error deleting appointment:', err);
      }
    }
  };

  useEffect(() => { fetchAppointments(); }, [fetchAppointments, refreshTrigger]);

  const totalPages = Math.ceil(appointments.length / perPage);
  const currentAppointments = appointments.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          قائمة المواعيد
          <span className="badge badge-primary">{appointments.length}</span>
        </h3>
        <div className="filter-bar">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-input">
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدول</option>
            <option value="confirmed">مؤكد</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input" title="من تاريخ" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input" title="إلى تاريخ" />
          <input type="number" placeholder="رقم المريض" value={patientId} onChange={e => setPatientId(e.target.value)}
            className="filter-input" style={{ width: 130 }} />
          <button
            onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPatientId(''); }}
            className="btn btn-ghost btn-sm"
          >↺ مسح</button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">لا توجد مواعيد مطابقة للفلتر</div>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>المريض</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>الطبيب</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentAppointments.map((a, i) => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {(currentPage - 1) * perPage + i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0
                      }}>👤</div>
                      <strong className="patient-name">مريض #{a.patient_id}</strong>
                    </div>
                  </td>
                  <td>{a.appointment_date}</td>
                  <td>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                      {a.start_time} — {a.end_time}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(a.status)}`}>
                      {getStatusText(a.status)}
                    </span>
                  </td>
                  <td>{a.dentist_id ? `#${a.dentist_id}` : <span style={{ color: 'var(--text-muted)' }}>غير محدد</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => setSelectedAppointment(a)} className="btn btn-ghost btn-sm">👁 عرض</button>
                      <button onClick={() => deleteAppointment(a.id)} className="btn btn-danger btn-sm">🗑 حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="page-btn">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)} className={`page-btn ${n === currentPage ? 'active' : ''}`}>{n}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="page-btn">›</button>
            </div>
          )}
        </>
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={fetchAppointments}
        />
      )}
    </div>
  );
};

export default AppointmentList;