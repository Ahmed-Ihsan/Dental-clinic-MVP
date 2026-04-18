/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ProfessionalDetailModal from './ProfessionalDetailModal.jsx';

const ProfessionalList = ({ refreshTrigger }) => {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchProfessionals = useCallback(async () => {
    try {
      const res = await api.get(`/professionals?search=${search}`);
      setProfessionals(res.data);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    }
  }, [search]);

  const deleteProfessional = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المتخصص؟')) {
      try {
        await api.delete(`/professionals/${id}`);
        fetchProfessionals();
      } catch (err) {
        console.error('Error deleting professional:', err);
      }
    }
  };

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals, refreshTrigger]);

  const totalPages = Math.ceil(professionals.length / perPage);
  const current = professionals.slice((currentPage - 1) * perPage, currentPage * perPage);

  const getInitials = (first, last) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  const avatarColors = ['var(--primary-light)', 'var(--accent-light)', 'var(--success-bg)', 'var(--warning-bg)'];

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          قائمة المتخصصين
          <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {professionals.length}
          </span>
        </h3>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="🔍 بحث بالاسم أو التخصص"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-input"
            style={{ minWidth: 260 }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="btn btn-ghost btn-sm">↺ مسح</button>
          )}
        </div>
      </div>

      {professionals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👨‍⚕️</div>
          <div className="empty-state-text">لا توجد متخصصين مطابقين للبحث</div>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>التخصص</th>
                <th>الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الترخيص</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {current.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {(currentPage - 1) * perPage + i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-full)',
                        background: avatarColors[i % avatarColors.length],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0
                      }}>
                        {getInitials(p.first_name, p.last_name)}
                      </div>
                      <div>
                        <strong className="patient-name">{p.first_name} {p.last_name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.specialty ? (
                      <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {p.specialty}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{p.phone || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td>
                    {p.license_number ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {p.license_number}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => setSelectedProfessional(p)} className="btn btn-ghost btn-sm">👁 عرض</button>
                      <button onClick={() => deleteProfessional(p.id)} className="btn btn-danger btn-sm">🗑 حذف</button>
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

      {selectedProfessional && (
        <ProfessionalDetailModal
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onUpdate={fetchProfessionals}
        />
      )}
    </div>
  );
};

export default ProfessionalList;