import { useState, useEffect } from 'react'
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
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && (currentPath === '/reset-password' || currentPath === '/forgot-password' || currentPath === '/login')) {
      window.history.replaceState({}, document.title, '/');
      setCurrentPath('/');
    }
    
    // Protect admin routes only if we are absolutely sure they are not authenticated
    if (!isAuthenticated && currentPath.startsWith('/admin') && !localStorage.getItem('token')) {
      window.history.replaceState({}, document.title, '/login');
      setCurrentPath('/login');
    }
  }, [isAuthenticated, currentPath]);

  useEffect(() => {
    // Grab the email verification token from the URL if it's there
    const params = new URLSearchParams(window.location.search)
    const tokenParams = params.get('token')
    
    // Only try to verify if they landed on the root or were redirected to login
    if (tokenParams && (window.location.pathname === '/' || window.location.pathname === '/login')) {
      verifyEmail(tokenParams)
      // Strip the token from the URL so it doesn't linger
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      fetchUser()
      if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
        window.history.replaceState({}, document.title, '/')
      }
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
    window.history.replaceState({}, document.title, '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="app-container">
      <header>
        <div 
          className="logo-text" 
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
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
        {isAuthenticated ? (
          currentPath === '/admin' ? (
            <AdminDashboard user={user} />
          ) : currentPath === '/admin/delete-account' ? (
            <DeleteAccountConfirm user={user} />
          ) : (
            <Dashboard currency={currency} />
          )
        ) : (
          currentPath === '/forgot-password' ? (
            <ForgotPassword onSwitchToLogin={() => {
              window.history.pushState({}, '', '/login')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }} />
          ) : currentPath === '/reset-password' ? (
            <ResetPassword onLogin={() => {
              setIsAuthenticated(true)
              fetchUser()
              window.history.replaceState({}, document.title, '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }} />
          ) : (
            <Auth onLogin={() => {
              setIsAuthenticated(true)
              fetchUser()
              window.history.replaceState({}, document.title, '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }} />
          )
        )}
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
