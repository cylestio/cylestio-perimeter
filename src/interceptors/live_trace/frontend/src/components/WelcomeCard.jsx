export default function WelcomeCard({ config }) {
  if (!config) {
    return null
  }

  return (
    <div className="welcome-card">
      <h2 className="welcome-title">
        Welcome to Cylestio Perimeter
      </h2>
      <p className="welcome-text">
        Your LLM proxy server is running and ready to monitor agent activity in real-time.
        Configure your agents to route requests through this proxy to see live traces, tool usage, and performance metrics.
      </p>

      <div className="config-display">
        <h3 className="text-md weight-semibold text-primary mb-md font-mono">
          Current Configuration
        </h3>
        <div className="config-item">
          <strong className="config-label">Provider:</strong>
          <code className="config-value">{config.provider_type}</code>
        </div>
        <div className="config-item mb-0">
          <strong className="config-label">Target URL:</strong>
          <code className="config-value text-xs">{config.provider_base_url}</code>
        </div>
      </div>

      <div className="alert-banner alert-banner-warning">
        <div className="alert-content">
          <h3>Configure Your Agent</h3>
          <p className="mb-sm">Set your agent's <code>base_url</code> to:</p>
          <div className="config-value font-mono weight-bold text-base">
            http://{config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host}:{config.proxy_port}
          </div>
        </div>
      </div>

      <div className="alert-banner alert-banner-info">
        <div className="alert-content">
          <h3>Waiting for Agent Activity</h3>
          <p>Once your agent makes its first request, live traces will appear here automatically.</p>
        </div>
      </div>
    </div>
  )
}
