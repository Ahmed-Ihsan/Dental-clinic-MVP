import { useState } from 'react';

/**
 * RevenueTable — sortable, paginated data table for the Revenue dashboard.
 *
 * Props:
 *   columns  — [{ key, label, render?, sortable? }]
 *   rows     — array of row objects
 *   emptyMsg — string shown when rows is empty
 *   perPage  — rows per page (default 10)
 */
export default function RevenueTable({ columns, rows, emptyMsg = 'لا توجد بيانات', perPage = 10 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [page,    setPage]    = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="rev-table-shell">
      <div className="rev-table-scroll">
        <table className="rev-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`rev-th ${col.sortable !== false ? 'sortable' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span className="rev-sort-icon">
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
                  <div className="rev-empty">
                    <span className="rev-empty-icon">📭</span>
                    <span>{emptyMsg}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.category_id || row.receipt_id || i} className="rev-tr">
                  {columns.map(col => (
                    <td key={col.key} className="rev-td">
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
        <div className="rev-pagination">
          <span className="rev-page-info">
            الصفحة {page} من {totalPages} — {rows.length} سجل
          </span>
          <div className="rev-page-controls">
            <button
              className="rev-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >‹ السابق</button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(n => (
              <button
                key={n}
                className={`rev-page-btn ${n === page ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >{n}</button>
            ))}
            <button
              className="rev-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >التالي ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
