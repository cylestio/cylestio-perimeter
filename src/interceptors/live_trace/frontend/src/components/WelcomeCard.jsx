import { useState } from 'react'
import Loader from './Loader'

export default function WelcomeCard({ config }) {
  const [copied, setCopied] = useState(false)

  if (!config) {
    return null
  }

  const proxyUrl = `http://${config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host}:${config.proxy_port}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proxyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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

      {/* Current Configuration - Subtle display */}
      <div className="config-info">
        <div className="config-info-item">
          <span className="config-info-label">Provider</span>
          <code className="config-info-value">{config.provider_type}</code>
        </div>
        <div className="config-info-item">
          <span className="config-info-label">Target</span>
          <code className="config-info-value">{config.provider_base_url}</code>
        </div>
      </div>

      {/* Configure Your Agent - Primary action section */}
      <div className="setup-section">
        <h3 className="setup-title">Configure Your Agent</h3>
        <p className="setup-description">Set your agent's <code>base_url</code> to:</p>
        <div className="proxy-url-container">
          <div className="proxy-url-text">
            {proxyUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`copy-button ${copied ? 'copied' : ''}`}
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Waiting status - Minimal display */}
      <div className="waiting-status">
        <Loader size="small" />
        <span className="waiting-text">Waiting for agent activity...</span>
      </div>
    </div>
  )
}
