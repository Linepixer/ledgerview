import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import es from '../locales/es.json';

export default function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = es.auth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '100px auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', marginTop: '0.2rem' }}
            title={t.backToLogin}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{t.forgotPasswordTitle}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{t.forgotPasswordSubtitle}</p>
          </div>
        </div>

        {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--loss)', borderRadius: '4px', color: 'var(--loss)' }}>{error}</div>}
        {success && <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--profit)', borderRadius: '4px', color: 'var(--profit)' }}>{t.emailSent}</div>}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="summary-label">{t.emailLabel}</label>
              <input 
                type="email" 
                required
                placeholder={t.loginEmailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
              {loading ? '...' : t.sendEmail}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
