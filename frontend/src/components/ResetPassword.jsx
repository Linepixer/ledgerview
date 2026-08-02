import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import es from '../locales/es.json';

export default function ResetPassword({ onLogin }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [token, setToken] = useState(null);
  const t = es.auth;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      api.get(`/reset-password/validate?token=${tokenParam}`)
        .then(() => setIsValidating(false))
        .catch(err => {
          setTokenError(err.response?.data?.detail || "Token inválido o expirado");
          setIsValidating(false);
        });
    } else {
      setTokenError("Token inválido o expirado");
      setIsValidating(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    
    if (!token) {
      setError("Falta el token de restablecimiento");
      return;
    }
    
    setLoading(true);

    try {
      const res = await api.post('/reset-password', { token, new_password: password });
      
      // Password changed successfully, log the user in automatically
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        // Clean up the URL so the token doesn't stay in the browser history
        navigate('/', { replace: true });
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return null; // Hide the UI until we know if the token is valid or not
  }

  return (
    <div style={{ maxWidth: '500px', margin: '100px auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        {tokenError ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--loss)', borderRadius: '4px', color: 'var(--loss)', textAlign: 'center', fontWeight: '500' }}>
            {tokenError}
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>{t.resetPasswordTitle}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{t.resetPasswordSubtitle}</p>
            
            {error && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--loss)', borderRadius: '4px', color: 'var(--loss)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="summary-label">{t.passwordLabel}</label>
                <div className="password-input-flex">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={t.passwordPlaceholder}
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
              
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
                {loading ? '...' : t.resetPasswordSubmit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
