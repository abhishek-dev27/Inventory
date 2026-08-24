import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

const LowStockList = ({ products = [] }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertTriangle color="var(--warning)" size={18} />
          <h3 className="card-title">Low Stock Alert</h3>
        </div>
        <Link
          to="/products"
          style={{
            fontSize: '0.75rem',
            color: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          View All <FiArrowRight size={12} />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: 'var(--success)' }}>All products are healthy above minimum thresholds</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {products.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 170, 0, 0.2)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  SKU: {item.sku} • Category: {item.category}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-warning">
                  {item.quantity} left (Min: {item.lowStockThreshold})
                </span>
                <div style={{ marginTop: '6px' }}>
                  <Link
                    to="/stock/in"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary-light)',
                      textDecoration: 'underline',
                    }}
                  >
                    Restock Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LowStockList;
