import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0 }}>Cambiar Contraseña</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div className="text-loss flex-row" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={16} style={{ marginRight: '0.5rem' }}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label className="summary-label">Contraseña Actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  padding: '0.75rem', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-main)', 
                  borderRadius: '4px',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              />
            </div>
            
            <div>
              <label className="summary-label">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  padding: '0.75rem', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-main)', 
                  borderRadius: '4px',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              />
            </div>
            
            <div>
              <label className="summary-label">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  padding: '0.75rem', 
                  background: 'var(--bg-main)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-main)', 
                  borderRadius: '4px',
                  width: '100%',
                  marginTop: '0.5rem'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: '1rem', 
                width: '100%',
                padding: '1rem', 
                background: 'var(--accent)', 
                color: 'var(--accent-text)', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
