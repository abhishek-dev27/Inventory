import React from 'react';
import { FiArrowDownLeft, FiArrowUpRight, FiClock } from 'react-icons/fi';
import { formatRelative } from '../../utils/formatDate';

const RecentActivity = ({ activities = [] }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Inventory Activity</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Latest 10 transactions
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <FiClock />
          <p>No recent activity recorded</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map((item) => {
            const isIn = item.type === 'in';
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-md)',
                      background: isIn ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: isIn ? 'var(--success)' : 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isIn ? <FiArrowDownLeft size={18} /> : <FiArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.product?.name || 'Product'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.reason} • By {item.user?.name || 'System'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    className={`badge ${isIn ? 'badge-in' : 'badge-out'}`}
                    style={{ fontWeight: 700 }}
                  >
                    {isIn ? `+${item.quantity}` : `-${item.quantity}`}
                  </span>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {formatRelative(item.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
