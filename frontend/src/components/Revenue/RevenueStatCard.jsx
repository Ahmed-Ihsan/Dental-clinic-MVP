/**
 * RevenueStatCard — KPI card for the Revenue & Income dashboard.
 * Props:
 *   label    — Arabic label string
 *   value    — numeric or string value to display
 *   icon     — emoji element
 *   variant  — 'primary' | 'success' | 'danger' | 'warning' | 'accent' | 'info'
 *   unit     — optional unit suffix (e.g. 'IQD' or '%')
 *   sub      — optional subtitle / caption
 *   trend    — optional trend string (e.g. '+12%')
 *   trendUp  — boolean, determines arrow color
 */
export default function RevenueStatCard({
  label,
  value,
  icon,
  variant = 'primary',
  unit = 'IQD',
  sub,
  trend,
  trendUp,
}) {
  const fmt = (v) => {
    if (typeof v === 'number') return v.toLocaleString('ar-SA');
    return v;
  };

  return (
    <div className={`rev-stat-card rev-stat-${variant}`}>
      <div className="rev-stat-top">
        <span className="rev-stat-label">{label}</span>
        <div className="rev-stat-icon-wrap">{icon}</div>
      </div>
      <div className="rev-stat-value">
        {fmt(value)}
        {unit && <span className="rev-stat-unit">{unit}</span>}
      </div>
      <div className="rev-stat-footer">
        {sub && <div className="rev-stat-sub">{sub}</div>}
        {trend && (
          <span className={`rev-stat-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
