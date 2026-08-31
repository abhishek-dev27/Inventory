import React, { useState } from 'react';
import {
  FiEdit2,
  FiTrash2,
  FiUser,
  FiShield,
  FiUsers,
  FiMapPin,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiCheck,
  FiKey,
  FiClock,
} from 'react-icons/fi';
import Button from '../common/Button';
import StickyTableContainer from '../common/StickyTableContainer';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const UserTable = ({ users = [], onEdit, onDelete, onViewHistory, currentUserId }) => {
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const togglePassword = (userId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyToClipboard = (text, userId) => {
    if (!text) {
      toast.error('No saved password available for this user');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(userId);
    toast.success('Password copied to clipboard');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

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
    <StickyTableContainer>
      <table style={{ width: '100%', minWidth: '1080px' }}>
        <thead>
          <tr>
            <th>User & Username</th>
            <th>Mobile / Phone</th>
            <th>Role</th>
            <th>Saved Password & History</th>
            <th>Permitted Modules</th>
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

            const allowed = Array.isArray(u.allowedModules) ? u.allowedModules : ['dashboard', 'products', 'stock_in', 'stock_out', 'stock_history'];
            const hasCommercials = allowed.includes('customers') || allowed.includes('accounts') || allowed.includes('reports');

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
                {/* Saved Password & History */}
                <td>
                  {(() => {
                    const isRevealed = Boolean(showPasswords[u.id]);
                    const isCopied = copiedId === u.id;
                    const hasHistory = Array.isArray(u.passwordHistory) && u.passwordHistory.length > 0;
                    const displayPwd = u.savedPassword || (isSelf ? '••••••' : null);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              backgroundColor: 'var(--bg-secondary)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                              letterSpacing: isRevealed ? '0' : '2px',
                              color: isRevealed ? 'var(--primary-light)' : 'var(--text-muted)',
                              fontWeight: isRevealed ? 700 : 900,
                              minWidth: '80px',
                            }}
                          >
                            {isRevealed ? (u.savedPassword || 'Not Recorded') : '••••••••'}
                          </div>

                          <button
                            type="button"
                            onClick={() => togglePassword(u.id)}
                            title={isRevealed ? 'Hide Password' : 'Show Saved Password'}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              color: isRevealed ? 'var(--primary-light)' : 'var(--text-secondary)',
                              backgroundColor: 'var(--surface)',
                            }}
                          >
                            {isRevealed ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                          </button>

                          {u.savedPassword && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.savedPassword, u.id)}
                              title="Copy Password to Clipboard"
                              style={{
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: isCopied ? 'var(--success)' : 'var(--text-secondary)',
                                backgroundColor: 'var(--surface)',
                              }}
                            >
                              {isCopied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                            </button>
                          )}
                        </div>

                        {hasHistory && (
                          <button
                            type="button"
                            onClick={() => onViewHistory && onViewHistory(u)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '0.72rem',
                              color: 'var(--primary-light)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textAlign: 'left',
                              width: 'fit-content',
                            }}
                          >
                            <FiClock size={11} /> {u.passwordHistory.length} {u.passwordHistory.length === 1 ? 'Entry' : 'Entries'} in History
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  {isAdmin ? (
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      👑 Full Access
                    </span>
                  ) : !hasCommercials ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--success)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      📦 Inventory Only
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--primary-light)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      💼 Full Staff ({allowed.length} mods)
                    </span>
                  )}
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
    </StickyTableContainer>
  );
};

export default UserTable;
