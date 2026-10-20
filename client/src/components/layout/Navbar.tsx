import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
          Cloud-Based Student Record System
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <UserIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 6px' }}>
                  {user.role}
                </span>
                {user.rollNumber && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ({user.rollNumber})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
