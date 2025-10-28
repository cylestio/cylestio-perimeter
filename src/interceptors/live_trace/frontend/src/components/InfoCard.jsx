export default function InfoCard({ title, primaryLabel, primaryValue, stats, badge }) {
  return (
    <div className="card card-elevated">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-content">
        <div className="mb-xl">
          <div className="text-xs text-muted mb-xs weight-semibold">{primaryLabel}</div>
          <div className="font-mono text-sm text-primary" style={{ wordBreak: 'break-all' }}>
            {primaryValue}
          </div>
        </div>
        {stats && stats.length > 0 && (
          <div className="stats-grid-2col">
            {stats.map((stat, index) => (
              <div key={index} className="mb-md">
                <div className="text-xs text-muted mb-xs weight-semibold">{stat.label}</div>
                {stat.badge ? (
                  stat.badge
                ) : (
                  <div className="text-sm text-secondary">{stat.value}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {badge && (
          <div style={{ marginTop: 'var(--space-lg)' }}>
            {badge}
          </div>
        )}
      </div>
    </div>
  )
}
