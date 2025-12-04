export default function Loader({ size = 'medium', text = null, className = '' }) {
  const sizeClass = `loader-${size}`

  return (
    <div className={`loader-container ${className}`}>
      <div className={`loading-spinner ${sizeClass}`}></div>
      {text && <span className="loader-text">{text}</span>}
    </div>
  )
}
