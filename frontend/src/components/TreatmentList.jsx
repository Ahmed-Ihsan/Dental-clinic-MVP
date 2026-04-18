/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import TreatmentDetailModal from './TreatmentDetailModal.jsx';

const TreatmentList = ({ refreshTrigger }) => {
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await api.get('/treatments');
      setTreatments(res.data);
    } catch (err) {
      console.error('Error fetching treatments:', err);
    }
  }, []);

  const deleteTreatment = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
      try {
        await api.delete(`/treatments/${id}`);
        fetchTreatments();
      } catch (err) {
        console.error('Error deleting treatment:', err);
      }
    }
  };

  useEffect(() => { fetchTreatments(); }, [fetchTreatments, refreshTrigger]);

  const filtered = treatments.filter(t =>
    t.treatment_type?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const formatCost = (c) => {
    const n = parseFloat(c);
    return isNaN(n) ? '—' : `${n.toLocaleString('ar-SA')} IQD`;
  };

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          قائمة العلاجات
          <span className="badge badge-warning">{treatments.length}</span>
        </h3>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="🔍 بحث بنوع العلاج"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-input"
            style={{ minWidth: 220 }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="btn btn-ghost btn-sm">↺ مسح</button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🦷</div>
          <div className="empty-state-text">لا توجد علاجات مسجلة</div>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع العلاج</th>
                <th>المريض</th>
                <th>تاريخ العلاج</th>
                <th>التكلفة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {current.map((t, i) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {(currentPage - 1) * perPage + i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 'var(--radius-full)',
                        background: 'var(--warning-bg)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0
                      }}>🦷</div>
                      <strong className="patient-name">{t.treatment_type}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">#{t.patient_id}</span>
                  </td>
                  <td>{t.treatment_date || '—'}</td>
                  <td>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
                      {formatCost(t.cost)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => setSelectedTreatment(t)} className="btn btn-ghost btn-sm">👁 عرض</button>
                      <button onClick={() => deleteTreatment(t.id)} className="btn btn-danger btn-sm">🗑 حذف</button>
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

      {selectedTreatment && (
        <TreatmentDetailModal
          treatment={selectedTreatment}
          onClose={() => setSelectedTreatment(null)}
          onUpdate={fetchTreatments}
        />
      )}
    </div>
  );
};

export default TreatmentList;