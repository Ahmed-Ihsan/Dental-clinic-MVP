import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DataList = ({
  endpoint,
  title,
  icon,
  columns,
  filters = [],
  actions = [],
  perPage = 10,
  refreshTrigger,
  rowStyle,         // (item) => CSSProperties — per-row inline style
  clientSideFilter, // (data[]) => data[]     — applied after fetch, before pagination
}) => {
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams(filterValues);
      const res = await api.get(`${endpoint}?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [endpoint, filterValues]);

  const deleteItem = async (id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await api.delete(`${endpoint}/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }
  };

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

  const displayData = clientSideFilter ? clientSideFilter(data) : data;
  const totalPages = Math.ceil(displayData.length / perPage);
  const currentData = displayData.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleFilterChange = (name, value) => {
    setFilterValues({ ...filterValues, [name]: value });
    setCurrentPage(1); // reset page
  };

  const clearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <h3 className="table-header-title">
          {icon} {title}
          <span className="badge badge-primary">{displayData.length}</span>
        </h3>
        <div className="filter-bar">
          {filters.map(f => (
            <div key={f.name}>
              {f.type === 'select' ? (
                <select
                  value={filterValues[f.name] || f.defaultValue || ''}
                  onChange={e => handleFilterChange(f.name, e.target.value)}
                  className="filter-input"
                >
                  <option value={f.defaultValue || ''}>{f.placeholder}</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={filterValues[f.name] || ''}
                  onChange={e => handleFilterChange(f.name, e.target.value)}
                  className="filter-input"
                  style={f.style}
                />
              )}
            </div>
          ))}
          <button onClick={clearFilters} className="btn btn-ghost btn-sm">↺ مسح</button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{icon}</div>
          <div className="empty-state-text">لا توجد بيانات مطابقة</div>
        </div>
      ) : displayData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{icon}</div>
          <div className="empty-state-text">لا توجد نتائج مطابقة للبحث</div>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, i) => (
                <tr key={item.id} style={rowStyle ? rowStyle(item) : undefined}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {(currentPage - 1) * perPage + i + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(item[col.key], item) : item[col.key] || '—'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                     <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                       {actions.map(action => (
                         <button
                           key={action.key}
                           onClick={() => action.key === 'delete' ? deleteItem(item.id) : action.onClick(item)}
                           className={`btn btn-${action.variant} btn-sm`}
                         >
                           {action.label}
                         </button>
                       ))}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`page-btn ${n === currentPage ? 'active' : ''}`}
                >{n}</button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataList;