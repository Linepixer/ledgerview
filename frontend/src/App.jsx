import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import AccountMenu from './components/AccountMenu'
import api from './api'
import './index.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [user, setUser] = useState(null)
  const [verificationMessage, setVerificationMessage] = useState('')

  useEffect(() => {
    // Check for email verification token in URL
    const params = new URLSearchParams(window.location.search)
    const tokenParams = params.get('token')
    if (tokenParams) {
      verifyEmail(tokenParams)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      fetchUser()
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me')
      setUser(res.data)
    } catch (err) {
      console.error("Error fetching user profile", err)
    }
  }

  const verifyEmail = async (verificationToken) => {
    try {
      const res = await api.post(`/verify?token=${verificationToken}`)
      setVerificationMessage('¡Cuenta verificada exitosamente!')
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token)
        setIsAuthenticated(true)
        fetchUser()
      }
    } catch (err) {
      setVerificationMessage('El link de verificación es inválido o expiró.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="LedgerView Logo" style={{ height: '32px' }} />
          LedgerView
        </div>
        <div className="flex-row">
          {isAuthenticated && (
            <div className="currency-toggle" style={{ marginRight: '1rem' }}>
              <button className={`toggle-btn ${currency === 'ARS' ? 'active' : ''}`} onClick={() => setCurrency('ARS')}>ARS</button>
              <button className={`toggle-btn ${currency === 'USD' ? 'active' : ''}`} onClick={() => setCurrency('USD')}>USD</button>
            </div>
          )}
          {isAuthenticated && (
            <AccountMenu user={user} onLogout={handleLogout} />
          )}
        </div>
      </header>

      <main>
        {verificationMessage && (
          <div style={{ maxWidth: '500px', margin: '0 auto 20px auto' }}>
             <div className={`badge ${verificationMessage.includes('exitosamente') ? 'badge-profit' : 'badge-loss'}`} style={{ display: 'block', padding: '1rem', textAlign: 'center', fontSize: '1rem' }}>
               {verificationMessage}
             </div>
          </div>
        )}
        {isAuthenticated ? <Dashboard currency={currency} /> : <Auth onLogin={() => {
          setIsAuthenticated(true)
          fetchUser()
        }} />}
      </main>

      {isAuthenticated && (
        <footer style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 0 0.1rem 0',
          marginTop: 'auto',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <div>LedgerView &copy; 2026 &mdash; Proyecto de código abierto para seguimiento de inversiones personales.</div>
          <div>Contacto: <a href="mailto:diazmatias@linepixer.com" style={{ color: 'inherit', textDecoration: 'none' }}>diazmatias@linepixer.com</a></div>
        </footer>
      )}
    </div>
  )
}

export default App
