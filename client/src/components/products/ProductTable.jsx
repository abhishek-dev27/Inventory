import React from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiBox, FiTag } from 'react-icons/fi';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const ProductTable = ({
  products = [],
  onViewDetails,
  onDelete,
  isAdmin = false,
}) => {
  if (products.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiBox size={42} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            No products found matching your search or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ minWidth: '220px' }}>Product Name & SKU</th>
            <th style={{ minWidth: '180px' }}>Type & Category</th>
            <th style={{ minWidth: '120px' }}>Stock Level</th>
            <th style={{ minWidth: '100px' }}>Status</th>
            <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isLowStock = p.quantity <= p.lowStockThreshold;
            const isOutOfStock = p.quantity === 0;
            const unitLabel = p.unit || 'pcs';

            return (
              <tr key={p.id}>
                {/* Product Name & SKU */}
                <td>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {p.sku}
                    </span>
                    {p.brand && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        • {p.brand}
                      </span>
                    )}
                  </div>
                </td>

                {/* Type & Category */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(108, 92, 231, 0.08)',
                          color: 'var(--primary-light)',
                          border: '1px solid rgba(108, 92, 231, 0.25)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.productType || 'Standard'}
                      </span>
                      {p.dcrType && (
                        <span
                          className="badge"
                          style={{
                            background: p.dcrType === 'DCR' ? 'rgba(0, 214, 143, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                            color: p.dcrType === 'DCR' ? 'var(--success)' : 'var(--warning)',
                            border: p.dcrType === 'DCR' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.dcrType}
                        </span>
                      )}
                      {p.capacity && (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(0, 214, 143, 0.08)',
                            color: 'var(--success)',
                            border: '1px solid var(--success-border)',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.capacity}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {p.category}
                    </span>
                  </div>
                </td>

                {/* Stock Level with Unit */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--text-primary)',
                      }}
                    >
                      {p.quantity}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unitLabel}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Min: {p.lowStockThreshold} {unitLabel}
                  </div>
                </td>

                {/* Status Badge */}
                <td>
                  {isOutOfStock ? (
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      Low Stock
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      In Stock
                    </span>
                  )}
                </td>

                {/* Action Buttons */}
                <td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onViewDetails(p)}
                      title="View Details & Serial Numbers"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-light)';
                        e.currentTarget.style.color = 'var(--primary-light)';
                        e.currentTarget.style.backgroundColor = 'var(--primary-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }}
                    >
                      <FiEye size={15} />
                    </button>

                    <Link to={`/products/edit/${p.id}`}>
                      <button
                        type="button"
                        title="Edit Product"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-light)';
                          e.currentTarget.style.color = 'var(--primary-light)';
                          e.currentTarget.style.backgroundColor = 'var(--primary-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </Link>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        title="Delete Product"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          color: 'var(--danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--danger)';
                          e.currentTarget.style.backgroundColor = 'var(--danger)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                          e.currentTarget.style.color = 'var(--danger)';
                        }}
                      >
                        <FiTrash2 size={14} />
                      </button>
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

export default ProductTable;
