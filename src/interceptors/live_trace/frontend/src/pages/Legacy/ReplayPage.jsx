import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Tooltip from './Tooltip'
import JsonEditor from './JsonEditor'
import ModelCombobox from './ModelCombobox'

export default function ReplayPage() {
  const { sessionId, eventId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [originalEvent, setOriginalEvent] = useState(null)
  const [session, setSession] = useState(null)

  // Replay config state
  const [replayConfig, setReplayConfig] = useState(null)
  const [modelsData, setModelsData] = useState(null)

  // Form state
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [apiKeySource, setApiKeySource] = useState(null)
  const [useDefaultKey, setUseDefaultKey] = useState(true)
  const [model, setModel] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [messagesJson, setMessagesJson] = useState('[]')
  const [toolsJson, setToolsJson] = useState('[]')
  const [showTools, setShowTools] = useState(false)

  // Response state
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState(null)
  const [responseError, setResponseError] = useState(null)

  // Fetch original event and replay config
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session data, replay config, and models in parallel
        const [sessionRes, configRes, modelsRes] = await Promise.all([
          fetch(`/api/session/${sessionId}`),
          fetch('/api/replay/config'),
          fetch('/api/models')
        ])

        const sessionData = await sessionRes.json()
        const configData = await configRes.json()

        // Models endpoint is optional - don't fail if it's not available
        if (modelsRes.ok) {
          try {
            const modelsJson = await modelsRes.json()
            if (!modelsJson.error) {
              setModelsData(modelsJson)
            }
          } catch {
            // Ignore models fetch errors - feature degrades gracefully
          }
        }

        if (sessionData.error) {
          setError(sessionData.error)
          return
        }

        setSession(sessionData.session)
        setReplayConfig(configData)

        // Find the event by eventId (span_id)
        const event = sessionData.events?.find(e => e.id === eventId)
        if (!event) {
          setError(`Event ${eventId} not found in session`)
          return
        }

        if (event.name !== 'llm.call.start') {
          setError('Only llm.call.start events can be replayed')
          return
        }

        setOriginalEvent(event)

        // Initialize form with original event data
        const requestData = event.attributes?.['llm.request.data'] || {}
        const messages = requestData.messages || []
        const tools = requestData.tools || []

        // Set provider from config or event
        const eventProvider = event.attributes?.['llm.vendor'] || configData.provider_type || 'openai'
        setProvider(eventProvider)

        // Set model
        setModel(requestData.model || event.attributes?.['llm.model'] || '')

        // Set temperature and max tokens
        setTemperature(requestData.temperature ?? 0.7)
        setMaxTokens(requestData.max_tokens ?? 2048)

        // Extract system prompt (handle both OpenAI and Anthropic formats)
        let sysPrompt = requestData.system || ''
        if (!sysPrompt && messages.length > 0 && messages[0].role === 'system') {
          sysPrompt = messages[0].content
        }
        setSystemPrompt(sysPrompt)

        // Filter out system messages for the messages editor
        const nonSystemMessages = messages.filter(m => m.role !== 'system')
        setMessagesJson(JSON.stringify(nonSystemMessages, null, 2))

        // Set tools
        setToolsJson(JSON.stringify(tools, null, 2))
        setShowTools(tools.length > 0)

        // Set API key info
        if (configData.api_key_available) {
          setApiKeySource(configData.api_key_source)
          setUseDefaultKey(true)
        } else {
          setUseDefaultKey(false)
        }

      } catch (err) {
        setError('Failed to load event data: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId, eventId])

  // Send replay request
  const handleReplay = async () => {
    setSending(true)
    setResponse(null)
    setResponseError(null)

    try {
      // Parse messages and tools
      let messages
      let tools

      try {
        messages = JSON.parse(messagesJson)
      } catch (e) {
        setResponseError('Invalid messages JSON: ' + e.message)
        setSending(false)
        return
      }

      try {
        tools = JSON.parse(toolsJson)
      } catch (e) {
        setResponseError('Invalid tools JSON: ' + e.message)
        setSending(false)
        return
      }

      // Build request data based on provider
      const requestData = {
        model,
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens),
      }

      // Add tools if present
      if (tools.length > 0) {
        requestData.tools = tools
      }

      // For Anthropic, use 'system' field instead of system message
      if (provider === 'anthropic' && systemPrompt) {
        requestData.system = systemPrompt
        requestData.messages = messages
      }

      const body = {
        provider,
        base_url: replayConfig?.base_url,
        request_data: requestData,
      }

      // Only include API key if not using default
      if (!useDefaultKey && apiKey) {
        body.api_key = apiKey
      }

      const res = await fetch('/api/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.error) {
        setResponseError(data.error + (data.details ? '\n' + data.details : ''))
      } else {
        setResponse(data)
      }
    } catch (err) {
      setResponseError('Request failed: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading event data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={`/session/${sessionId}`}>Session</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Replay</span>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="text-error">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        {session && (
          <>
            <Link to={`/agent/${session.agent_id}`}>
              Agent {session.agent_id.substring(0, 12)}...
            </Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <Link to={`/session/${sessionId}`}>
          Session {sessionId.substring(0, 12)}...
        </Link>
        <span className="breadcrumb-separator">/</span>
        <strong className="text-primary">Edit & Replay</strong>
      </div>

      <div className="replay-layout">
        {/* Left Column: Editor */}
        <div className="replay-editor">
          {/* API Key Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="api-key-header">
                <span>{provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : provider} API Key</span>
                <Tooltip
                  content="API keys are not stored in the platform. We retrieve them from your environment variables or proxy configuration for this replay request only."
                  position="right"
                >
                  <span className="api-key-warning">⚠️</span>
                </Tooltip>
              </h3>
            </div>
            <div className="card-content">
              {replayConfig?.api_key_available ? (
                <div className="api-key-toggle">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useDefaultKey}
                      onChange={(e) => setUseDefaultKey(e.target.checked)}
                    />
                    Use saved key ({replayConfig.api_key_masked})
                  </label>
                  {!useDefaultKey && (
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter API key"
                      className="form-input mt-sm"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key"
                    className="form-input"
                  />
                  <div className="text-warning text-sm mt-sm">
                    No API key found in proxy config or environment
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Editor */}
          <div className="card">
            <div className="card-header">
              <h3>Request Editor</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Model</label>
                  <ModelCombobox
                    value={model}
                    onChange={setModel}
                    models={modelsData?.models?.[provider] || []}
                    provider={provider}
                  />
                </div>
                <div className="form-group">
                  <label>Temperature</label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="form-input form-input-sm"
                    min="0"
                    max="2"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Max Tokens</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    className="form-input form-input-sm"
                    min="1"
                    max="200000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="form-textarea"
                  rows={8}
                  placeholder="System instructions..."
                />
              </div>

              <div className="form-group">
                <JsonEditor
                  value={messagesJson}
                  onChange={setMessagesJson}
                  label="Messages"
                  placeholder='Click "+ Add Item" to add a message'
                />
              </div>

              <div className="form-group">
                <button
                  type="button"
                  onClick={() => setShowTools(!showTools)}
                  className="btn btn-secondary btn-sm"
                >
                  {showTools ? 'Hide Tools' : 'Show Tools'}
                </button>
              </div>

              {showTools && (
                <div className="form-group">
                  <JsonEditor
                    value={toolsJson}
                    onChange={setToolsJson}
                    label="Tools"
                    placeholder='Click "+ Add Item" to add a tool'
                  />
                </div>
              )}

              <button
                onClick={handleReplay}
                disabled={sending}
                className="btn btn-primary btn-lg"
              >
                {sending ? (
                  <>
                    <span className="loading-spinner-sm"></span>
                    Sending...
                  </>
                ) : (
                  'Send Replay'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Response */}
        <div className="replay-response">
          <div className="card">
            <div className="card-header">
              <h3>
                Response
                {response?.parsed?.usage && (
                  <span className="token-usage ml-sm">
                    <span className="token-usage-value">{response.parsed.usage.total_tokens}</span>
                    <span className="token-usage-label">tokens</span>
                  </span>
                )}
              </h3>
            </div>
            <div className="card-content">
              {!response && !responseError && !sending && (
                <div className="response-empty-state">
                  <div className="response-empty-icon">↻</div>
                  <div className="response-empty-text">
                    Edit the request parameters and click "Send Replay" to see the response here
                  </div>
                </div>
              )}

              {sending && (
                <div className="response-loading">
                  <div className="loading-spinner"></div>
                  <div className="response-loading-text">Waiting for response...</div>
                </div>
              )}

              {responseError && (
                <div className="response-error">
                  <div className="text-error weight-semibold mb-sm">Error</div>
                  <pre className="error-details">{responseError}</pre>
                </div>
              )}

              {response && (
                <div className="response-content">
                  {/* Response metadata */}
                  <div className="response-meta">
                    <span className="badge badge-success">{response.parsed?.model}</span>
                    {response.parsed?.finish_reason && (
                      <span className="badge badge-secondary">
                        {response.parsed.finish_reason}
                      </span>
                    )}
                    {response.elapsed_ms && (
                      <span className="response-time-badge">
                        {response.elapsed_ms >= 1000
                          ? `${(response.elapsed_ms / 1000).toFixed(2)}s`
                          : `${Math.round(response.elapsed_ms)}ms`}
                      </span>
                    )}
                    {response.cost?.total > 0 && (
                      <span className="response-cost-badge">
                        ${response.cost.total < 0.01
                          ? response.cost.total.toFixed(4)
                          : response.cost.total.toFixed(3)}
                      </span>
                    )}
                  </div>

                  {/* Token usage and cost breakdown */}
                  {response.parsed?.usage && (
                    <div className="response-stats">
                      <div className="response-stat">
                        <span className="response-stat-label">Input</span>
                        <span className="response-stat-value">
                          {(response.parsed.usage.prompt_tokens || response.parsed.usage.input_tokens || 0).toLocaleString()} tokens
                          {response.cost?.input > 0 && (
                            <span className="response-stat-cost"> (${response.cost.input.toFixed(4)})</span>
                          )}
                        </span>
                      </div>
                      <div className="response-stat">
                        <span className="response-stat-label">Output</span>
                        <span className="response-stat-value">
                          {(response.parsed.usage.completion_tokens || response.parsed.usage.output_tokens || 0).toLocaleString()} tokens
                          {response.cost?.output > 0 && (
                            <span className="response-stat-cost"> (${response.cost.output.toFixed(4)})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Response content */}
                  {response.parsed?.content?.map((item, idx) => (
                    <div key={idx} className="response-item">
                      {item.type === 'text' && (
                        <div className="response-text">
                          {item.text}
                        </div>
                      )}
                      {item.type === 'tool_use' && (
                        <div className="response-tool-execution">
                          <div className="response-tool-header">
                            <span className="response-tool-type">tool.execution</span>
                          </div>
                          <div className="response-tool-content">
                            <div className="tool-name-badge">{item.name}</div>
                            <div className="monospace-content">
                              {typeof item.input === 'string'
                                ? item.input
                                : JSON.stringify(item.input, null, 2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Raw response toggle */}
                  <details className="mt-lg">
                    <summary>Show raw response</summary>
                    <pre className="monospace-content">
                      {JSON.stringify(response.raw_response, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
