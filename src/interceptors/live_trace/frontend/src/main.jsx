import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import SessionPage from './components/SessionPage'
import AgentPage from './components/AgentPage'
import AgentReportPage from './components/AgentReportPage'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session/:sessionId" element={<SessionPage />} />
        <Route path="/agent/:agentId" element={<AgentPage />} />
        <Route path="/agent/:agentId/report" element={<AgentReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
