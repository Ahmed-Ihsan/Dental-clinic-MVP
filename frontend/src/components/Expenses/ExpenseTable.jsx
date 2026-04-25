import { useState } from 'react';

/**
 * ExpenseTable — generic, reusable data table for expense views.
 *
 * Props:
 *   columns  — [{ key, label, render? }]
 *   rows     — array of row objects
 *   emptyMsg — string shown when rows is empty
 */
export default function ExpenseTable({ columns, rows, emptyMsg = 'لا توجد بيانات' }) {
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState('desc');
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 8;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    if (av === undefined || bv === undefined) return 0;
    return sortDir === 'asc'
      ? (av > bv ? 1 : av < bv ? -1 : 0)
      : (av < bv ? 1 : av > bv ? -1 : 0);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="exp-table-shell">
      {/* Table */}
      <div className="exp-table-scroll">
        <table className="exp-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`exp-th ${col.sortable !== false ? 'sortable' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span className="exp-sort-icon">
                      {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="exp-empty">
                    <span className="exp-empty-icon">📭</span>
                    <span>{emptyMsg}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id || i} className="exp-tr">
                  {columns.map(col => (
                    <td key={col.key} className="exp-td">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="exp-pagination">
          <span className="exp-page-info">
            الصفحة {page} من {totalPages} — {rows.length} سجل
          </span>
          <div className="exp-page-controls">
            <button
              className="exp-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >‹ السابق</button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(n => (
              <button
                key={n}
                className={`exp-page-btn ${n === page ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            ))}
            <button
              className="exp-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >التالي ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
