export default function CaseSheetSkeleton() {
  return (
    <div className="cs-skeleton-wrap">
      {/* Header skeleton */}
      <div className="cs-skeleton-header">
        <div className="cs-skel cs-skel-circle cs-skel-avatar" />
        <div className="cs-skeleton-info">
          <div className="cs-skel cs-skel-line cs-skel-title" />
          <div className="cs-skel cs-skel-line cs-skel-sub" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <div className="cs-skel cs-skel-chip" />
            <div className="cs-skel cs-skel-chip" />
            <div className="cs-skel cs-skel-chip" />
          </div>
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="cs-skeleton-tabs">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="cs-skel cs-skel-tab" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="cs-skeleton-kpis">
        {[1,2,3,4].map(i => (
          <div key={i} className="cs-skel cs-skel-kpi" />
        ))}
      </div>
      <div className="cs-skeleton-rows">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="cs-skel cs-skel-row" style={{ width: `${85 + Math.random()*15}%` }} />
        ))}
      </div>
    </div>
  );
}
