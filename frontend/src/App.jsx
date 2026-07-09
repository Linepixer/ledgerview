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

  useEffect(() => {
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
        {isAuthenticated ? <Dashboard currency={currency} /> : <Auth onLogin={() => {
          setIsAuthenticated(true)
          fetchUser()
        }} />}
      </main>
    </div>
  )
}

export default App
