import React from 'react';
import { FiEdit2, FiTrash2, FiUser, FiShield, FiUsers } from 'react-icons/fi';
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
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isAdmin = u.role === 'admin';
            const isSelf = u.id === currentUserId;

            return (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isAdmin ? 'var(--gradient-primary)' : 'var(--surface-elevated)',
                        color: isAdmin ? '#ffffff' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.name} {isSelf && <span style={{ color: 'var(--primary-light)', fontSize: '0.75rem' }}>(You)</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td>
                  <span
                    className={`badge ${isAdmin ? 'badge-primary' : 'badge-success'}`}
                    style={{ textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isAdmin ? <FiShield size={12} /> : <FiUser size={12} />}
                    {u.role}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  {formatDate(u.createdAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={FiEdit2}
                      title="Edit User"
                      onClick={() => onEdit(u)}
                    />
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
