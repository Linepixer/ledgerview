import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../api';

export default function DeleteAccountConfirm({ user }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Enlace inválido o expirado.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    setError('');
    setLoading(true);

    try {
      await api.post('/admin/users/confirm-deletion', {
        token: token,
        confirmation_email: email
      });
      setSuccess(true);
      // Clean up URL
      window.history.replaceState({}, document.title, '/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <div style={{ maxWidth: '800px', margin: '100px auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--loss)' }}>Acceso Denegado</h2>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: '500px', margin: '100px auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Cuenta Eliminada</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            La cuenta y todos sus datos asociados fueron eliminados permanentemente del sistema.
          </p>
          <button className="btn-primary" onClick={() => window.location.href = '/admin'}>
            Volver a Administración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '100px auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        {error && !token ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--loss)', borderRadius: '4px', color: 'var(--loss)', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--loss)', marginBottom: '1rem' }}>
              <AlertTriangle size={28} />
              <h2 style={{ margin: 0 }}>Peligro: Borrado Permanente</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Estás a punto de eliminar definitivamente una cuenta. Para confirmar que estás borrando la cuenta correcta, por favor escribe el correo electrónico de la cuenta que será eliminada.
            </p>
            
            {error && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--loss)', borderRadius: '4px', color: 'var(--loss)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="summary-label">Escribe el email a eliminar para confirmar</label>
                <input 
                  type="email"
                  required
                  placeholder="ejemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'white',
                    outline: 'none',
                    marginTop: '0.5rem'
                  }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem',
                  background: 'var(--loss)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Eliminando...' : 'Eliminar cuenta permanentemente'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
