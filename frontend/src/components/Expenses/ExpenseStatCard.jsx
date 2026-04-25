/**
 * ExpenseStatCard — reusable KPI card for the Expenses dashboard header.
 * Props:
 *   label    — Arabic label string
 *   value    — numeric or string value to display
 *   icon     — emoji / SVG element
 *   variant  — 'primary' | 'success' | 'danger' | 'warning' | 'accent'
 *   unit     — optional unit suffix (e.g. 'ر.س')
 *   sub      — optional subtitle / caption
 */
export default function ExpenseStatCard({ label, value, icon, variant = 'primary', unit = 'ر.س', sub }) {
  const fmt = (v) => {
    if (typeof v === 'number') return v.toLocaleString('ar-SA');
    return v;
  };

  return (
    <div className={`exp-stat-card exp-stat-${variant}`}>
      <div className="exp-stat-top">
        <span className="exp-stat-label">{label}</span>
        <div className="exp-stat-icon-wrap">{icon}</div>
      </div>
      <div className="exp-stat-value">
        {fmt(value)}
        {unit && <span className="exp-stat-unit">{unit}</span>}
      </div>
      {sub && <div className="exp-stat-sub">{sub}</div>}
    </div>
  );
}
