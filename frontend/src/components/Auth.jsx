import { useState, useEffect } from 'react';
import api from '../api';
import es from '../locales/es.json';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(() => {
    return window.location.pathname !== '/signup';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [bYear, setBYear] = useState('');
  const [bMonth, setBMonth] = useState('');
  const [bDay, setBDay] = useState('');
  const [country, setCountry] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const t = es.auth;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    // If we land on root or an unknown route while unauthenticated, default to /login
    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      window.history.replaceState({}, '', '/login');
      setIsLogin(true);
    }

    const handlePopState = () => {
      setIsLogin(window.location.pathname !== '/signup');
      setError('');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleMode = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    const newPath = loginMode ? '/login' : '/signup';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);

    if (!isLogin && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const res = await api.post('/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        localStorage.setItem('token', res.data.access_token);
        onLogin();
      } else {
        const birthDate = (bYear && bMonth && bDay) 
          ? new Date(`${bYear}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}T00:00:00Z`).toISOString() 
          : null;

        const payload = { 
          email, 
          password, 
          name: name || null, 
          birth_date: birthDate, 
          country: country || null 
        };
        await api.post('/users/', payload);
        setIsLogin(true);
        setError(t.registerSuccess);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.detail === 'not_verified') {
        setError(t.notVerified);
        setNeedsVerification(true);
      } else {
        setError(err.response?.data?.detail || t.defaultError);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/resend-verification', { email });
      setError(t.emailSent);
      setNeedsVerification(false);
    } catch (err) {
      setError(t.defaultError);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '100px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>{isLogin ? t.loginTitle : t.registerTitle}</h2>
        
        {error && <div className={`badge ${error.includes('exitoso') || error.includes('enviado') ? 'badge-profit' : 'badge-loss'}`} style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>{error}</div>}
        
        {needsVerification && (
          <button 
            type="button" 
            onClick={handleResendVerification}
            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {t.resendEmail}
          </button>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <>
              <div>
                <label className="summary-label">{t.nameLabel}</label>
                <input 
                  type="text" 
                  required
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="summary-label">{t.birthDateLabel}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={bDay}
                      onChange={(e) => setBDay(e.target.value)}
                      style={{ flex: 1, padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: bDay ? 'white' : 'var(--text-muted)', borderRadius: '4px' }}
                    >
                      <option value="" disabled hidden style={{ color: 'var(--text-muted)' }}>{t.day}</option>
                      {days.map(d => <option key={d} value={d} style={{ color: 'white' }}>{d}</option>)}
                    </select>
                    <select
                      value={bMonth}
                      onChange={(e) => setBMonth(e.target.value)}
                      style={{ flex: 1.5, padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: bMonth ? 'white' : 'var(--text-muted)', borderRadius: '4px' }}
                    >
                      <option value="" disabled hidden style={{ color: 'var(--text-muted)' }}>{t.month}</option>
                      {t.months.map((m, i) => <option key={i} value={i + 1} style={{ color: 'white' }}>{m}</option>)}
                    </select>
                    <select
                      value={bYear}
                      onChange={(e) => setBYear(e.target.value)}
                      style={{ flex: 1.2, padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: bYear ? 'white' : 'var(--text-muted)', borderRadius: '4px' }}
                    >
                      <option value="" disabled hidden style={{ color: 'var(--text-muted)' }}>{t.year}</option>
                      {years.map(y => <option key={y} value={y} style={{ color: 'white' }}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="summary-label">{t.countryLabel}</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: country ? 'white' : 'var(--text-muted)', borderRadius: '4px' }}
                  >
                    <option value="" disabled hidden style={{ color: 'var(--text-muted)' }}>{t.countryPlaceholder}</option>
                    {Object.entries(t.countries).map(([code, countryName]) => (
                      <option key={code} value={countryName} style={{ color: 'white' }}>{countryName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          <div>
            <label className="summary-label">{t.emailLabel}</label>
            <input 
              type="email" 
              required
              placeholder={isLogin ? t.loginEmailPlaceholder : t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label className="summary-label">{t.passwordLabel}</label>
            <div className="password-input-flex">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={isLogin ? t.loginPasswordPlaceholder : t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ flex: 1, color: 'white', outline: 'none', minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ paddingRight: '0.75rem', paddingLeft: '0.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {!isLogin && (
            <div>
              <label className="summary-label">{t.confirmPasswordLabel}</label>
              <div className="password-input-flex">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder={t.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ flex: 1, color: 'white', outline: 'none', minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ paddingRight: '0.75rem', paddingLeft: '0.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          
          <button type="submit" style={{ padding: '0.75rem', background: 'var(--accent)', color: 'var(--bg-main)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem' }}>
            {isLogin ? t.loginButton : t.registerButton}
          </button>
        </form>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {isLogin ? `${t.noAccount} ` : `${t.hasAccount} `}
          <span 
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => toggleMode(!isLogin)}
          >
            {isLogin ? t.switchToRegister : t.switchToLogin}
          </span>
        </p>
      </div>
    </div>
  );
}
