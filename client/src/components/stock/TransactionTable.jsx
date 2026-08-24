import React from 'react';
import {
  FiClock,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiUser,
  FiMapPin,
  FiEye,
  FiZap,
} from 'react-icons/fi';
import { formatDateTime, formatRelative } from '../../utils/formatDate';
import Button from '../common/Button';

const TransactionTable = ({ transactions = [], onInspect }) => {
  if (transactions.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <FiClock />
          <p>No transaction history records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table style={{ minWidth: '1080px', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '160px' }}>Date & Time</th>
            <th style={{ width: '120px' }}>Movement</th>
            <th style={{ width: '260px' }}>Product & Unique ID</th>
            <th style={{ width: '110px' }}>Quantity</th>
            <th style={{ width: '180px' }}>Person (Issued To / From)</th>
            <th style={{ width: '200px' }}>Place / Project Site</th>
            <th style={{ width: '160px' }}>Reason & Ref #</th>
            <th style={{ width: '130px' }}>Handled By</th>
            <th style={{ textAlign: 'right', width: '90px', paddingRight: '20px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIn = tx.type === 'in';
            const unit = tx.product?.unit || 'pcs';
            const displayDate = tx.transactionDate || tx.createdAt;

            const txSerials = Array.isArray(tx.serialNumbers)
              ? tx.serialNumbers
              : typeof tx.serialNumbers === 'string'
              ? JSON.parse(tx.serialNumbers || '[]')
              : [];

            return (
              <tr key={tx.id}>
                {/* Date & Time */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(displayDate)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {formatRelative(displayDate)}
                  </div>
                </td>

                {/* Type Badge */}
                <td>
                  <span
                    className={`badge ${isIn ? 'badge-in' : 'badge-out'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {isIn ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                    {isIn ? 'Stock In' : 'Stock Out'}
                  </span>
                </td>

                {/* Product Name, SKU, Type */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.3 }}>
                    {tx.product?.name || 'Deleted Product'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.72rem',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                    >
                      {tx.product?.sku}
                    </span>
                    {tx.product?.productType && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          background: 'rgba(108, 92, 231, 0.08)',
                          color: 'var(--primary-light)',
                          border: '1px solid var(--primary-border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.product.productType}
                      </span>
                    )}
                    {tx.product?.capacity && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          background: 'rgba(0, 214, 143, 0.08)',
                          color: 'var(--success)',
                          border: '1px solid var(--success-border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.product.capacity}
                      </span>
                    )}
                  </div>
                </td>

                {/* Quantity with unit & serials count */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: isIn ? 'var(--success)' : 'var(--danger)', fontSize: '1.05rem' }}>
                      {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                  {txSerials.length > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.68rem',
                        color: 'var(--primary-light)',
                        backgroundColor: 'rgba(108, 92, 231, 0.08)',
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '2px',
                      }}
                    >
                      <FiZap size={9} />
                      <span>{txSerials.length} SNs</span>
                    </div>
                  )}
                </td>

                {/* Person Name */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8125rem' }}>
                    <FiUser size={13} color="var(--primary-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.personName || '—'}
                    </span>
                  </div>
                </td>

                {/* Place / Site */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8125rem' }}>
                    <FiMapPin size={13} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {tx.place || '—'}
                    </span>
                  </div>
                </td>

                {/* Reason & Ref */}
                <td>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {tx.reason}
                  </div>
                  {tx.referenceNo && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      Ref: {tx.referenceNo}
                    </div>
                  )}
                </td>

                {/* Handled By */}
                <td>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {tx.user?.name || 'System User'}
                  </span>
                </td>

                {/* Action / Voucher Button */}
                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={FiEye}
                    title="Inspect Voucher & Full Product Details"
                    onClick={() => onInspect && onInspect(tx)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
