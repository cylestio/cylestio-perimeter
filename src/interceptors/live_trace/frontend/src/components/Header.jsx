export default function Header() {
  return (
    <div className="app-header">
      <div className="app-header-content">
        <div className="brand-text">
          <h1 className="brand-title">Agent Inspector</h1>
          <a 
            href="https://www.cylestio.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="brand-subtitle"
          >
            by Cylestio
          </a>
        </div>
        <a href="https://www.cylestio.com" target="_blank" rel="noopener noreferrer" className="logo-link">
          <img 
            src="/cylestio_full_logo.png" 
            alt="Cylestio Logo" 
            className="brand-logo"
          />
        </a>
      </div>
    </div>
  )
}

