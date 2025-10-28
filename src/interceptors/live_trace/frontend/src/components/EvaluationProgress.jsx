export default function EvaluationProgress({ currentSessions, minSessionsRequired }) {
  const percentage = (currentSessions / minSessionsRequired) * 100

  return (
    <div style={{
      padding: 'var(--space-2xl)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-medium)',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: 'var(--space-2xl)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-md)'
      }}>
        <div>
          <div className="text-xs text-muted weight-semibold mb-xs" style={{ letterSpacing: '0.08em' }}>
            EVALUATION STATUS
          </div>
          <div className="text-md weight-semibold text-primary">
            Collecting sessions for analysis
          </div>
        </div>
        <div className="text-lg weight-bold font-mono" style={{ color: 'var(--color-accent-primary)' }}>
          {currentSessions}/{minSessionsRequired}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: 'var(--color-accent-primary)',
          transition: 'width var(--transition-base)',
          borderRadius: 'var(--radius-sm)'
        }}></div>
      </div>

      <div className="text-xs text-muted mt-sm">
        Need {minSessionsRequired - currentSessions} more {minSessionsRequired - currentSessions === 1 ? 'session' : 'sessions'} for risk analysis
      </div>
    </div>
  )
}
