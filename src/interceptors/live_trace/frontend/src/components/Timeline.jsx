import { useState } from 'react'

export default function Timeline({ timeline }) {
  return (
    <div className="timeline">
      {timeline.map((item, index) => (
        <TimelineItem key={index} item={item} />
      ))}
    </div>
  )
}

function TimelineItem({ item }) {
  const [showRaw, setShowRaw] = useState(false)

  // Determine alignment
  let alignmentClass = 'center'
  if (item.event_type === 'llm.call.start' || item.event_type === 'tool.execution') {
    alignmentClass = 'right'
  } else if (item.event_type === 'llm.call.finish' || item.event_type === 'tool.result') {
    alignmentClass = 'left'
  }

  const errorClass = item.level === 'ERROR' ? 'error' : ''

  return (
    <div className={`timeline-item ${alignmentClass} ${errorClass}`}>
      <div className="timeline-bubble">
        <div className="timeline-time">
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
            {item.event_type}
          </span>
          {' • '}
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            {timeAgo(item.timestamp)}
          </span>
        </div>

        {/* LLM Call Start - show request message */}
        {item.event_type === 'llm.call.start' && item.details && renderLLMCallStart(item.details)}

        {/* LLM Call Finish - show response */}
        {item.event_type === 'llm.call.finish' && item.details && renderLLMCallFinish(item.details)}

        {/* Tool Execution */}
        {item.event_type === 'tool.execution' && item.details && renderToolExecution(item.details)}

        {/* Tool Result */}
        {item.event_type === 'tool.result' && item.details && renderToolResult(item.details)}

        {/* Other events - show description */}
        {!['llm.call.start', 'llm.call.finish', 'tool.execution', 'tool.result'].includes(item.event_type) && (
          <div className="timeline-title" style={{ marginTop: '4px', color: '#1e293b' }}>
            {item.description}
          </div>
        )}

        {/* Error details */}
        {item.level === 'ERROR' && item.details?.['error.message'] && (
          <div className="timeline-description text-error">
            <strong>Error:</strong> {item.details['error.message']}
          </div>
        )}

        {/* Expandable raw event */}
        <details style={{ marginTop: '10px' }} open={showRaw}>
          <summary
            style={{ cursor: 'pointer', fontSize: '12px', color: '#6b7280', userSelect: 'none' }}
            onClick={(e) => {
              e.preventDefault()
              setShowRaw(!showRaw)
            }}
          >
            Show raw event
          </summary>
          <div style={{
            marginTop: '8px',
            padding: '10px',
            background: '#f8fafc',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>
              <strong>Event Type:</strong> {item.event_type}
            </div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>
              <strong>Level:</strong> {item.level}
            </div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>
              <strong>Timestamp:</strong> {item.timestamp}
            </div>
            {item.details && Object.keys(item.details).length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: '#374151' }}>Attributes:</strong>
                <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                  {Object.entries(item.details).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '3px', wordBreak: 'break-all' }}>
                      <span style={{ color: '#059669' }}>{key}:</span>{' '}
                      <span style={{ color: '#1e40af' }}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}

function renderLLMCallStart(details) {
  const requestData = details['llm.request.data'] || {}
  const messages = requestData.messages || []

  if (messages.length === 0) return null

  const lastMessage = messages[messages.length - 1]
  const content = lastMessage.content || ''

  if (typeof content === 'string') {
    const truncated = content.length > 500 ? content.substring(0, 500) + '...' : content
    return (
      <div style={{
        marginTop: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        color: '#1e293b'
      }}>
        {truncated}
      </div>
    )
  } else {
    const contentStr = JSON.stringify(content, null, 2)
    const truncated = contentStr.length > 400 ? contentStr.substring(0, 400) + '...' : contentStr
    return <div className="monospace-content">{truncated}</div>
  }
}

function renderLLMCallFinish(details) {
  const responseContent = details['llm.response.content'] || []

  if (responseContent.length === 0) return null

  const firstChoice = responseContent[0]
  const text = firstChoice.text || firstChoice.content || ''

  if (!text) return null

  const truncated = text.length > 500 ? text.substring(0, 500) + '...' : text

  return (
    <div style={{
      marginTop: '8px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.5,
      color: '#1e293b'
    }}>
      {truncated}
    </div>
  )
}

function renderToolExecution(details) {
  const toolName = details['tool.name'] || 'unknown'
  const toolParams = details['tool.params']

  return (
    <div style={{ marginTop: '8px' }}>
      <div className="tool-name-badge">{toolName}</div>
      {toolParams && (
        <div className="monospace-content">
          {JSON.stringify(toolParams, null, 2).length > 300
            ? JSON.stringify(toolParams, null, 2).substring(0, 300) + '...'
            : JSON.stringify(toolParams, null, 2)}
        </div>
      )}
    </div>
  )
}

function renderToolResult(details) {
  const toolResult = details['tool.result']

  if (!toolResult) return null

  const resultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
  const truncated = resultStr.length > 300 ? resultStr.substring(0, 300) + '...' : resultStr

  return <div className="monospace-content">{truncated}</div>
}

function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}
