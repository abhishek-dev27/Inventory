import React from 'react';
import { FiEdit2, FiTrash2, FiUser, FiShield, FiUsers, FiMapPin, FiPhone } from 'react-icons/fi';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';

const UserTable = ({ users = [], onEdit, onDelete, currentUserId }) => {
  if (users.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <FiUsers />
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>User & Username</th>
            <th>Mobile / Phone</th>
            <th>Role</th>
            <th>Designated Place / Godown</th>
            <th>Address</th>
            <th>Created</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isAdmin = u.role === 'admin';
            const isSelf = u.id === currentUserId;
            const location = u.assignedLocation || 'All Locations';
            const isAllLocations = location === 'All Locations';
            const usernameDisplay = u.username ? `@${u.username}` : `@${(u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            return (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: isAdmin ? 'var(--gradient-primary)' : 'var(--surface-elevated)',
                        color: isAdmin ? '#ffffff' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.name} {isSelf && <span style={{ color: 'var(--primary-light)', fontSize: '0.75rem' }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontFamily: 'monospace', fontWeight: 600 }}>
                        {usernameDisplay}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {u.phone ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <FiPhone size={12} color="var(--primary-light)" /> {u.phone}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                      Login with Username
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${isAdmin ? 'badge-primary' : 'badge-success'}`}
                    style={{ textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isAdmin ? <FiShield size={12} /> : <FiUser size={12} />}
                    {u.role}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: isAllLocations ? 'rgba(108, 92, 231, 0.12)' : 'rgba(0, 184, 148, 0.12)',
                      color: isAllLocations ? 'var(--primary-light)' : 'var(--success)',
                      border: `1px solid ${isAllLocations ? 'rgba(108, 92, 231, 0.3)' : 'rgba(0, 184, 148, 0.3)'}`,
                    }}
                  >
                    <FiMapPin size={12} />
                    {location}
                  </span>
                </td>
                <td style={{ maxWidth: '200px' }}>
                  {u.address ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3, display: 'block' }}>
                      {u.address}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No address set
                    </span>
                  )}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {formatDate(u.createdAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={FiEdit2}
                      title="Edit Godown & Address Access"
                      onClick={() => onEdit(u)}
                    >
                      Edit Access
                    </Button>
                    {!isSelf && (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={FiTrash2}
                        title="Delete User"
                        onClick={() => onDelete(u)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
