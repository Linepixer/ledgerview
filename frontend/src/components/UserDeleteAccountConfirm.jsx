import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

export default function UserDeleteAccountConfirm({ onAccountDeleted }) {
  const [status, setStatus] = useState('procesando'); // procesando, exito, error
  const [errorMessage, setErrorMessage] = useState('');
  const hasRequested = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Token no encontrado en la URL.');
      return;
    }

    const deleteAccount = async () => {
      try {
        await api.delete(`/users/me?token=${token}`);
        setStatus('exito');
        if (onAccountDeleted) {
          onAccountDeleted();
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.detail || 'Hubo un error al intentar eliminar la cuenta.');
      }
    };

    deleteAccount();
  }, [location, onAccountDeleted]);

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '1rem' }}>
      {status === 'procesando' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Procesando solicitud...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estamos eliminando tu cuenta permanentemente.</p>
        </div>
      )}

      {status === 'exito' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Cuenta eliminada
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            Tu cuenta y todos tus datos fueron eliminados de forma permanente.
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/login')}
            style={{ padding: '0.65rem 1.5rem', fontWeight: 500 }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--loss)' }}>
            Error al eliminar cuenta
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            {errorMessage}
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/login')}
            style={{ padding: '0.65rem 1.5rem', fontWeight: 500 }}
          >
            Ir al inicio de sesión
          </button>
        </div>
      )}
    </div>
  );
}
