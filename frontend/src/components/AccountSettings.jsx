import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function AccountSettings({ user }) {
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [showDeleteTransactionsModal, setShowDeleteTransactionsModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleDeleteAllTransactions = async () => {
    setLoadingTransactions(true);
    setMessage(null);
    try {
      await api.delete('/transactions/all');
      setShowDeleteTransactionsModal(false);
      navigate('/');
    } catch (error) {
      console.error("Error al borrar transacciones", error);
      alert("Hubo un error al intentar borrar las transacciones.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleRequestAccountDeletion = async () => {
    setLoadingAccount(true);
    setMessage(null);
    try {
      await api.post('/users/me/request-delete');
      setShowDeleteAccountModal(false);
      setMessage({ type: 'success', text: 'Te enviamos un correo con el enlace para confirmar la eliminación de tu cuenta.' });
    } catch (error) {
      console.error("Error solicitando eliminación", error);
      setMessage({ type: 'error', text: 'No se pudo procesar la solicitud. Intenta nuevamente.' });
    } finally {
      setLoadingAccount(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '1rem 0' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Mi cuenta</h1>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: `1px solid ${message.type === 'success' ? 'var(--profit)' : 'var(--loss)'}`,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? 'var(--profit)' : 'var(--loss)',
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Información de usuario */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Información personal
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Nombre</span>
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}>
              {user?.name || '-'}
            </div>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Email</span>
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}>
              {user?.email || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de datos y cuenta */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Gestión de datos
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Borrar transacciones */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                Borrar todas las transacciones
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Elimina el historial completo de operaciones y reinicia tu portafolio a cero.
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowDeleteTransactionsModal(true)}
              style={{
                flexShrink: 0,
                color: 'var(--loss)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={15} />
              Borrar transacciones
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Eliminar cuenta */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                Eliminar cuenta
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Envía un correo de confirmación para eliminar definitivamente tu usuario y datos.
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => !user?.is_admin && setShowDeleteAccountModal(true)}
              disabled={user?.is_admin}
              title={user?.is_admin ? "Las cuentas de superusuario no pueden eliminarse" : ""}
              style={{
                flexShrink: 0,
                color: user?.is_admin ? 'var(--text-muted)' : 'var(--loss)',
                opacity: user?.is_admin ? 0.4 : 1,
                cursor: user?.is_admin ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={15} />
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Modal Confirmación Borrar Transacciones */}
      {showDeleteTransactionsModal && (
        <div className="modal-overlay" onClick={() => !loadingTransactions && setShowDeleteTransactionsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ padding: '1.75rem', textAlign: 'center' }}>
              <AlertTriangle size={44} color="var(--loss)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>¿Borrar todas las transacciones?</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.45' }}>
                Esta acción eliminará todo tu historial de operaciones y tu portafolio quedará en cero. No se puede deshacer.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  onClick={() => setShowDeleteTransactionsModal(false)}
                  disabled={loadingTransactions}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAllTransactions}
                  disabled={loadingTransactions}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--loss)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    cursor: loadingTransactions ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: loadingTransactions ? 0.7 : 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '42px'
                  }}
                >
                  {loadingTransactions ? <Loader2 className="animate-spin" size={20} /> : 'Sí, borrar todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar Cuenta */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" onClick={() => !loadingAccount && setShowDeleteAccountModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ padding: '1.75rem', textAlign: 'center' }}>
              <AlertTriangle size={44} color="var(--loss)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>¿Solicitar eliminación de cuenta?</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.45' }}>
                Te enviaremos un correo electrónico con un enlace seguro para confirmar la eliminación permanente de tu cuenta y todos tus datos.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={loadingAccount}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestAccountDeletion}
                  disabled={loadingAccount}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'var(--loss)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    cursor: loadingAccount ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: loadingAccount ? 0.7 : 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '42px'
                  }}
                >
                  {loadingAccount ? <Loader2 className="animate-spin" size={20} /> : 'Enviar correo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
