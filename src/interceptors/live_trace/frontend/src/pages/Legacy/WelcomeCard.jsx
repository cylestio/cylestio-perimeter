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
      <div className="welcome-header">
        <h2 className="welcome-title">
          Welcome to Agent Inspector
        </h2>
        <p className="welcome-subtitle">Real‑time behavioral analysis and readiness checks for LLM agents.</p>
      </div>
      
      <div className="welcome-content">
        <p className="welcome-text">
          Agent Inspector gives you instant visibility into your AI agents with ready-to-run profiles for OpenAI and Anthropic. Start a local proxy and live tracing dashboard with a single command.
        </p>
        
        <p className="welcome-text">
          Ideal for development-time evaluation and for running alongside your test suite (including CI) and evals.
        </p>

        <p className="welcome-text">
          <a 
            href="https://github.com/cylestio/agent-inspector/blob/main/README.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="readme-link"
          >
            Read the documentation
          </a> for installation and configuration details.
        </p>
      </div>

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
