import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import AccountMenu from './components/AccountMenu'
import AdminDashboard from './components/AdminDashboard'
import DeleteAccountConfirm from './components/DeleteAccountConfirm'
import api from './api'
import './index.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [currency, setCurrency] = useState('USD')
  const [user, setUser] = useState(null)
  const [verificationMessage, setVerificationMessage] = useState('')
  
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  useEffect(() => {
    // Grab the email verification token from the URL if it's there
    const params = new URLSearchParams(location.search)
    const tokenParams = params.get('token')
    
    // Only try to verify if they landed on the root or were redirected to login
    if (tokenParams && (currentPath === '/' || currentPath === '/login')) {
      verifyEmail(tokenParams)
      // Strip the token from the URL so it doesn't linger
      navigate(currentPath, { replace: true })
    }

    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      fetchUser()
      if (currentPath === '/login' || currentPath === '/signup') {
        navigate('/', { replace: true })
      }
    }
  }, []) // Empty dependency array is intentional for initial load

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
    navigate('/login', { replace: true })
  }

  const onLoginSuccess = () => {
    setIsAuthenticated(true)
    fetchUser()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-container">
      <header>
        <div 
          className="logo-text" 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="LedgerView Logo" style={{ height: '32px' }} />
          <span className="hide-on-mobile">LedgerView</span>
        </div>
        <div className="flex-row">
          {isAuthenticated && !currentPath.startsWith('/admin') && (
            <div className="currency-toggle header-currency-toggle">
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
        
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/admin" element={<AdminDashboard user={user} />} />
              <Route path="/admin/delete-account" element={<DeleteAccountConfirm user={user} />} />
              
              <Route path="/" element={<Dashboard currency={currency} />} />
              <Route path="/portfolio" element={<Dashboard currency={currency} />} />
              <Route path="/portfolio/possession/:ticker" element={<Dashboard currency={currency} />} />
              
              <Route path="/market" element={<Dashboard currency={currency} />} />
              <Route path="/asset/:ticker" element={<Dashboard currency={currency} />} />
              
              <Route path="/transactions" element={<Dashboard currency={currency} />} />
              <Route path="/transactions/import" element={<Dashboard currency={currency} />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Auth onLogin={onLoginSuccess} />} />
              <Route path="/signup" element={<Auth onLogin={onLoginSuccess} />} />
              <Route path="/forgot-password" element={<ForgotPassword onSwitchToLogin={() => navigate('/login')} />} />
              <Route path="/reset-password" element={<ResetPassword onLogin={onLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </main>

      {isAuthenticated && (
        <footer className="app-footer">
          <div style={{ maxWidth: '400px', lineHeight: '1.4' }}>LedgerView &copy; 2026 &mdash; Proyecto de código abierto para seguimiento de inversiones personales.</div>
          <div>Contacto: <a href="mailto:diazmatias@linepixer.com" style={{ color: 'inherit', textDecoration: 'none' }}>diazmatias@linepixer.com</a></div>
        </footer>
      )}
    </div>
  )
}

export default App
