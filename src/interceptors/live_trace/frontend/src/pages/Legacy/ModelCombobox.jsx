import { useState, useRef, useEffect } from 'react'

export default function ModelCombobox({ value, onChange, models, provider }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync search term with external value changes
  useEffect(() => {
    setSearchTerm(value || '')
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter models based on search term
  const filteredModels = (models || []).filter(model =>
    model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Find pricing for current value
  const selectedModel = (models || []).find(m => m.id === value)

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleSelect = (model) => {
    setSearchTerm(model.id)
    onChange(model.id)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter' && filteredModels.length > 0) {
      e.preventDefault()
      handleSelect(filteredModels[0])
    }
  }

  const formatPrice = (price) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    }
    return `$${price.toFixed(3)}`
  }

  return (
    <div className="model-combobox" ref={containerRef}>
      <div className="model-combobox-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="form-input"
          placeholder={`Search ${provider} models...`}
          autoComplete="off"
        />
        <span className={`model-combobox-icon ${isOpen ? 'open' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {/* Dropdown suggestions */}
      {isOpen && filteredModels.length > 0 && (
        <div className="model-suggestions">
          {filteredModels.map(model => (
            <div
              key={model.id}
              className={`model-suggestion-item ${model.id === value ? 'selected' : ''}`}
              onClick={() => handleSelect(model)}
            >
              <div className="model-suggestion-info">
                <span className="model-suggestion-id">{model.id}</span>
                {model.name !== model.id && (
                  <span className="model-suggestion-name">{model.name}</span>
                )}
              </div>
              <span className="model-pricing-badge">
                {formatPrice(model.input)} / {formatPrice(model.output)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pricing info for selected model */}
      {selectedModel && !isOpen && (
        <div className="model-selected-pricing">
          <span className="model-pricing-label">Pricing (per 1M tokens):</span>
          <span className="model-pricing-value">
            {formatPrice(selectedModel.input)} input / {formatPrice(selectedModel.output)} output
          </span>
        </div>
      )}
    </div>
  )
}
