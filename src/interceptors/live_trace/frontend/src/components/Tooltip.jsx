import { useState } from 'react'

/**
 * Tooltip component - displays additional information on hover
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 * @param {string} props.content - The tooltip content (text)
 * @param {string} [props.position='top'] - Position of tooltip: 'top', 'bottom', 'left', 'right'
 * @param {number} [props.delay=300] - Delay in ms before showing tooltip
 */
export default function Tooltip({ children, content, position = 'top', delay = 300 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)

  if (!content) {
    return children
  }

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }

  const getPositionStyles = () => {
    const base = {
      position: 'absolute',
      zIndex: 1000,
      padding: 'var(--space-md) var(--space-lg)',
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.5,
      borderRadius: 'var(--radius-md)',
      whiteSpace: 'pre-wrap',
      minWidth: '200px',
      maxWidth: '300px',
      boxShadow: 'var(--shadow-lg)',
      pointerEvents: 'none',
      border: '1px solid var(--color-border-medium)',
      fontFamily: 'var(--font-mono)'
    }

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 'var(--space-sm)'
        }
      case 'bottom':
        return {
          ...base,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 'var(--space-sm)'
        }
      case 'left':
        return {
          ...base,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: 'var(--space-sm)'
        }
      case 'right':
        return {
          ...base,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: 'var(--space-sm)'
        }
      default:
        return base
    }
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <span style={getPositionStyles()}>
          {content}
        </span>
      )}
    </span>
  )
}
