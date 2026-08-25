import React from 'react';
import { FiMenu, FiBell, FiSearch, FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      {/* Left items: Menu button toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <FiMenu size={20} />
        </button>

        <span
          className="hidden-mobile"
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
        </span>
      </div>

      {/* Right items: Godown indicator, Role badge & Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: user?.role === 'admin' ? 'rgba(108, 92, 231, 0.12)' : 'rgba(0, 184, 148, 0.12)',
            color: user?.role === 'admin' ? 'var(--primary-light)' : 'var(--success)',
            border: `1px solid ${user?.role === 'admin' ? 'rgba(108, 92, 231, 0.25)' : 'rgba(0, 184, 148, 0.25)'}`,
          }}
          title={user?.role === 'admin' ? 'Admin has access to all godowns & locations' : `Designated access: ${user?.assignedLocation || 'Ranchi'}`}
        >
          🏢 {user?.role === 'admin' ? 'All Godowns' : (user?.assignedLocation || 'Ranchi')}
        </span>

        <span
          className={`badge ${user?.role === 'admin' ? 'badge-primary' : 'badge-success'}`}
          style={{ textTransform: 'uppercase', fontSize: '0.72rem', padding: '3px 8px' }}
        >
          {user?.role}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden-mobile" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
