import { useState, useEffect } from 'react';
import { UserX, UserCheck, Trash2, Shield, AlertTriangle } from 'lucide-react';
import api from '../api';
import CorporateEventsManager from './CorporateEventsManager';

export default function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError("No se pudo cargar la lista de usuarios. ¿Tienes permisos?");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmToggle) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${confirmToggle.id}/toggle-status`);
      // Update local state
      setUsers(users.map(u => u.id === confirmToggle.id ? { ...u, is_active: res.data.is_active } : u));
      setConfirmToggle(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Error al cambiar el estado");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${confirmDelete.id}/request-deletion`);
      setDeleteMessage("¡Correo enviado! Revisa tu bandeja de entrada para confirmar la eliminación.");
      setTimeout(() => {
        setDeleteMessage('');
        setConfirmDelete(null);
      }, 5000);
    } catch (err) {
      alert(err.response?.data?.detail || "Error al solicitar eliminación");
    } finally {
      setActionLoading(false);
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

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <CorporateEventsManager />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', marginTop: '40px' }}>
        <Shield size={32} color="var(--accent)" />
        <h1 style={{ margin: 0 }}>Administración de cuentas</h1>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--loss)' }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombre</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Email</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...users].sort((a, b) => {
                  if (a.is_admin && !b.is_admin) return -1;
                  if (!a.is_admin && b.is_admin) return 1;
                  if (a.is_active && !b.is_active) return -1;
                  if (!a.is_active && b.is_active) return 1;
                  return a.email.localeCompare(b.email);
                }).map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '15px 20px' }}>{u.name || '-'}</td>
                    <td style={{ padding: '15px 20px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '15px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {u.is_admin ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          background: 'rgba(249, 115, 22, 0.1)',
                          color: '#f97316'
                        }}>
                          Superusuario
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          background: u.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: u.is_active ? 'var(--profit)' : 'var(--loss)'
                        }}>
                          {u.is_active ? 'Activa' : 'Desactivada'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        
                        {/* Custom Toggle Switch for Active/Inactive */}
                        <div 
                          onClick={() => !u.is_admin && setConfirmToggle(u)}
                          title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                          style={{
                            width: '36px',
                            height: '20px',
                            background: u.is_active ? 'var(--profit)' : 'var(--bg-main)',
                            border: `1px solid ${u.is_active ? 'var(--profit)' : 'var(--border)'}`,
                            borderRadius: '20px',
                            position: 'relative',
                            cursor: u.is_admin ? 'not-allowed' : 'pointer',
                            opacity: u.is_admin ? 0.3 : 1,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{
                            width: '14px',
                            height: '14px',
                            background: u.is_active ? '#fff' : 'var(--text-muted)',
                            borderRadius: '50%',
                            position: 'absolute',
                            left: u.is_active ? 'calc(100% - 16px)' : '2px',
                            transition: 'all 0.2s'
                          }} />
                        </div>

                        {/* Minimal Trash Button */}
                        <button
                          onClick={() => {
                            setDeleteMessage('');
                            setConfirmDelete(u);
                          }}
                          disabled={u.is_admin}
                          title="Borrar cuenta"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: u.is_admin ? 'not-allowed' : 'pointer',
                            opacity: u.is_admin ? 0.3 : 1,
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => { if (!u.is_admin) e.currentTarget.style.color = 'var(--loss)'; }}
                          onMouseLeave={(e) => { if (!u.is_admin) e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toggle Status Modal */}
      {confirmToggle && (
        <div className="modal-overlay" onClick={() => !actionLoading && setConfirmToggle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Confirmar Acción</h2>
            <p>¿Estás seguro que deseas <strong>{confirmToggle.is_active ? 'desactivar' : 'activar'}</strong> la cuenta de <strong>{confirmToggle.email}</strong>?</p>
            {confirmToggle.is_active && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>El usuario no podrá iniciar sesión hasta que la vuelvas a activar.</p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setConfirmToggle(null)} disabled={actionLoading} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleToggleStatus} disabled={actionLoading} style={{ flex: 1 }}>
                {actionLoading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => !actionLoading && setConfirmDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--loss)', marginBottom: '15px' }}>
              <AlertTriangle size={24} />
              <h2 style={{ margin: 0 }}>Solicitar Borrado</h2>
            </div>

            {deleteMessage ? (
              <div style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--profit)', borderRadius: '6px', textAlign: 'center' }}>
                {deleteMessage}
              </div>
            ) : (
              <>
                <p>Estás a punto de solicitar la eliminación de la cuenta de <strong>{confirmDelete.email}</strong>.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Por seguridad, se te enviará un correo electrónico a tu cuenta ({user.email}) con un enlace de confirmación. Solo podrás borrar la cuenta tras confirmar desde ese correo.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <button className="btn-secondary" onClick={() => setConfirmDelete(null)} disabled={actionLoading} style={{ flex: 1 }}>Cancelar</button>
                  <button onClick={handleRequestDelete} disabled={actionLoading} style={{
                    flex: 1,
                    background: 'var(--loss)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    {actionLoading ? 'Enviando...' : 'Enviar Correo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
