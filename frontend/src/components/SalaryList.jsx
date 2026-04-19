import { useState, useEffect } from 'react';
import api from '../services/api';

const SalaryList = ({ refreshTrigger, onEditSalary }) => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ professional: '', status: '' });

  useEffect(() => {
    fetchSalaries();
  }, [refreshTrigger]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/salaries');
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الراتب؟')) {
      try {
        await api.delete(`/salaries/${id}`);
        fetchSalaries();
      } catch (error) {
        console.error('Error deleting salary:', error);
        alert('لا يمكن حذف هذا الراتب لأنه مرتبط بسجلات أخرى');
      }
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 'badge-success' : 'badge-secondary';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  const filteredSalaries = salaries.filter(salary => {
    const matchesProfessional = !filter.professional ||
      `${salary.professional.first_name} ${salary.professional.last_name}`
        .toLowerCase()
        .includes(filter.professional.toLowerCase());

    const matchesStatus = !filter.status ||
      (filter.status === 'active' && salary.is_active) ||
      (filter.status === 'inactive' && !salary.is_active);

    return matchesProfessional && matchesStatus;
  });

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          <span>💰</span>
          قائمة الرواتب
          <span className="badge badge-primary">{filteredSalaries.length}</span>
        </h3>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="البحث بالموظف"
            value={filter.professional}
            onChange={(e) => setFilter({ ...filter, professional: e.target.value })}
            className="filter-input"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-input"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {filteredSalaries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">لا توجد رواتب مسجلة</div>
          <div className="empty-state-subtext">
            {filter.professional || filter.status ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ بإضافة راتب جديد'}
          </div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الموظف</th>
              <th>الراتب الأساسي</th>
              <th>البدلات</th>
              <th>الخصومات</th>
              <th>صافي الراتب</th>
              <th>الحالة</th>
              <th>تاريخ السريان</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalaries.map((salary, index) => (
              <tr key={salary.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {index + 1}
                </td>
                <td>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {salary.professional.first_name} {salary.professional.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {salary.professional.specialty}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {salary.base_salary.toLocaleString()} {salary.currency}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {salary.salary_type === 'monthly' ? 'شهري' :
                     salary.salary_type === 'hourly' ? 'بالساعة' : 'يومي'}
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    +{salary.total_allowances.toLocaleString()} {salary.currency}
                  </span>
                </td>
                <td>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    -{salary.total_deductions.toLocaleString()} {salary.currency}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {salary.net_salary.toLocaleString()} {salary.currency}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(salary.is_active)}`}>
                    {getStatusText(salary.is_active)}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {new Date(salary.effective_date).toLocaleDateString('ar-SA')}
                  </div>
                  {salary.end_date && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      حتى {new Date(salary.end_date).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={() => onEditSalary && onEditSalary(salary)}
                      className="btn btn-primary btn-sm"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(salary.id)}
                      className="btn btn-danger btn-sm"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalaryList;