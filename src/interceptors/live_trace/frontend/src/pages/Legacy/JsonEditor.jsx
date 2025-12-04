import { useState, useEffect } from 'react'
import { JsonEditor as JsonEdit } from 'json-edit-react'

// Custom theme matching the app's design system
const customTheme = {
  displayName: 'Cylestio',
  fragments: {
    edit: '#0891b2', // cyan accent
  },
  styles: {
    // Main container
    container: {
      backgroundColor: '#ffffff',
      fontFamily: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
      fontSize: '12px',
      lineHeight: '1.5',
    },
    // Collection brackets and structure
    collection: {},
    collectionInner: {},
    collectionElement: {
      paddingTop: '2px',
      paddingBottom: '2px',
    },
    dropZone: {
      backgroundColor: '#dbeafe',
    },
    // Property keys
    property: {
      color: '#1e293b',
      fontWeight: '500',
    },
    // Brackets [ ] { }
    bracket: {
      color: '#64748b',
      fontWeight: '600',
    },
    // Item count (3 items)
    itemCount: {
      color: '#94a3b8',
      fontStyle: 'italic',
      fontSize: '11px',
    },
    // Value types with elegant colors
    string: '#059669',      // green for strings
    number: '#0891b2',      // cyan for numbers
    boolean: '#7c3aed',     // purple for booleans
    null: {
      color: '#94a3b8',
      fontStyle: 'italic',
    },
    // Input field styling
    input: {
      color: '#1e293b',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      outline: 'none',
    },
    inputHighlight: '#dbeafe',
    // Error messages
    error: {
      fontSize: '11px',
      color: '#dc2626',
      fontWeight: '500',
    },
    // Icons - using cyan accent theme
    iconCollection: '#64748b',
    iconEdit: '#0891b2',
    iconDelete: '#dc2626',
    iconAdd: '#059669',
    iconCopy: '#64748b',
    iconOk: '#059669',
    iconCancel: '#dc2626',
  },
}

/**
 * JsonEditor - A tree-based JSON editor component
 *
 * @param {Object} props
 * @param {string} props.value - JSON string to edit
 * @param {function} props.onChange - Callback with updated JSON string
 * @param {string} [props.label] - Optional label for the editor
 * @param {string} [props.placeholder] - Placeholder text when empty
 */
export default function JsonEditor({ value, onChange, label, placeholder }) {
  const [jsonData, setJsonData] = useState(null)
  const [parseError, setParseError] = useState(null)

  // Parse JSON string to object when value changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]')
      setJsonData(parsed)
      setParseError(null)
    } catch (e) {
      setParseError(e.message)
    }
  }, [value])

  // Handle data updates from the editor
  const handleSetData = (newData) => {
    setJsonData(newData)
    onChange(JSON.stringify(newData, null, 2))
  }

  if (parseError) {
    return (
      <div className="json-editor">
        {label && <label className="json-editor-label">{label}</label>}
        <div className="json-editor-error">
          <div className="json-editor-error-title">Invalid JSON</div>
          <div className="json-editor-error-message">{parseError}</div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-textarea font-mono"
            rows={8}
            spellCheck={false}
            placeholder={placeholder}
          />
        </div>
      </div>
    )
  }

  if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
    return (
      <div className="json-editor">
        {label && <label className="json-editor-label">{label}</label>}
        <div className="json-editor-empty">
          <span className="json-editor-empty-text">{placeholder || 'Empty array'}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const newData = Array.isArray(jsonData) ? [{ role: 'user', content: '' }] : {}
              setJsonData(newData)
              onChange(JSON.stringify(newData, null, 2))
            }}
          >
            + Add Item
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="json-editor">
      {label && <label className="json-editor-label">{label}</label>}
      <div className="json-editor-container">
        <JsonEdit
          data={jsonData}
          setData={handleSetData}
          collapse={2}
          theme={customTheme}
          rootFontSize={13}
          indent={3}
          minWidth={200}
          maxWidth="100%"
        />
      </div>
    </div>
  )
}
