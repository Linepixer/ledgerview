import { useState, useRef, useEffect } from 'react';
import { User, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

export default function AccountMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-row"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            color: 'var(--text-main)',
            cursor: 'pointer',
            gap: '0.5rem'
          }}
        >
          <User size={18} />
          <span style={{ fontWeight: 500 }}>{user?.name || 'Usuario'}</span>
          <ChevronDown size={16} className="text-muted" />
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '200px',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                setShowPasswordModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: user?.is_admin ? 'none' : '1px solid var(--border)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <KeyRound size={16} className="text-muted" />
              Cambiar contraseña
            </button>
            {user?.is_admin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.history.pushState({}, '', '/admin');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User size={16} />
                Administrar la plataforma
              </button>
            )}
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--loss)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            alert('¡Contraseña actualizada correctamente!');
          }}
        />
      )}
    </>
  );
}
