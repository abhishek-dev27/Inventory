import React, { useState, useMemo } from 'react';
import {
  FiClock,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiUser,
  FiMapPin,
  FiEye,
  FiEdit2,
  FiZap,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiBox,
  FiLayers,
  FiCheck,
  FiCopy,
} from 'react-icons/fi';
import { formatDateTime, formatRelative } from '../../utils/formatDate';
import Button from '../common/Button';
import StickyTableContainer from '../common/StickyTableContainer';

const TransactionTable = ({
  transactions = [],
  onInspect,
  onEdit,
  onOpenInvoice,
  defaultViewMode = 'grouped',
}) => {
  const [viewMode, setViewMode] = useState(defaultViewMode); // 'grouped' | 'flat'
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  // Group transactions by Bill / Invoice Entry (Reference No + Type + Party)
  const groupedEntries = useMemo(() => {
    if (viewMode === 'flat') {
      return transactions.map((tx) => ({
        id: tx.id,
        groupKey: `flat_${tx.id}`,
        type: tx.type,
        referenceNo: tx.referenceNo || '',
        personName: tx.personName || '',
        place: tx.place || '',
        reason: tx.reason || '',
        senderPhone: tx.senderPhone || '',
        senderAddress: tx.senderAddress || '',
        senderCompany: tx.senderCompany || '',
        notes: tx.notes || '',
        transactionDate: tx.transactionDate || tx.createdAt,
        createdAt: tx.createdAt,
        user: tx.user,
        items: [
          {
            txId: tx.id,
            product: tx.product,
            quantity: tx.quantity || 0,
            serialNumbers: Array.isArray(tx.serialNumbers)
              ? tx.serialNumbers
              : typeof tx.serialNumbers === 'string'
              ? JSON.parse(tx.serialNumbers || '[]')
              : [],
            rawTx: tx,
          },
        ],
        totalQuantity: tx.quantity || 0,
        totalSerials: (Array.isArray(tx.serialNumbers) ? tx.serialNumbers : []).length,
        isFlat: true,
        rawTx: tx,
      }));
    }

    const map = new Map();
    transactions.forEach((tx) => {
      const ref = (tx.referenceNo || '').trim();
      let key;
      if (ref) {
        key = `ref_${tx.type || 'out'}_${ref.toUpperCase()}`;
      } else {
        const pName = (tx.personName || '').trim().toLowerCase();
        const place = (tx.place || '').trim().toLowerCase();
        const txDate = tx.transactionDate || tx.createdAt;
        const dateKey = txDate ? new Date(txDate).toISOString().slice(0, 16) : 'nodate';
        key = `fallback_${tx.type || 'out'}_${pName}_${place}_${dateKey}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          id: tx.id,
          groupKey: key,
          type: tx.type,
          referenceNo: tx.referenceNo || '',
          personName: tx.personName || '',
          place: tx.place || '',
          reason: tx.reason || '',
          senderPhone: tx.senderPhone || '',
          senderAddress: tx.senderAddress || '',
          senderCompany: tx.senderCompany || '',
          notes: tx.notes || '',
          transactionDate: tx.transactionDate || tx.createdAt,
          createdAt: tx.createdAt,
          user: tx.user,
          items: [],
          totalQuantity: 0,
          totalSerials: 0,
          rawTx: tx,
        });
      }

      const grp = map.get(key);

      let serials = [];
      if (tx.serialNumbers) {
        if (Array.isArray(tx.serialNumbers)) {
          serials = tx.serialNumbers;
        } else {
          try {
            const parsed = JSON.parse(tx.serialNumbers);
            if (Array.isArray(parsed)) serials = parsed;
          } catch {
            if (typeof tx.serialNumbers === 'string') {
              serials = tx.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean);
            }
          }
        }
      }

      grp.items.push({
        txId: tx.id,
        product: tx.product,
        quantity: tx.quantity || 0,
        serialNumbers: serials,
        notes: tx.notes,
        rawTx: tx,
      });

      grp.totalQuantity += parseInt(tx.quantity, 10) || 0;
      grp.totalSerials += serials.length;
    });

    return Array.from(map.values());
  }, [transactions, viewMode]);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allMultiKeys = groupedEntries
      .filter((e) => e.items.length > 1)
      .map((e) => e.groupKey);
    setExpandedKeys(new Set(allMultiKeys));
  };

  const handleCollapseAll = () => {
    setExpandedKeys(new Set());
  };

  const handleCopyRef = (ref, key, e) => {
    e.stopPropagation();
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const multiItemEntriesCount = groupedEntries.filter((g) => g.items.length > 1).length;

  return (
    <div>
      {/* View Switcher Ribbon & Controls */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '4px 2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ledger View:
          </span>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: viewMode === 'grouped' ? 800 : 600,
                backgroundColor: viewMode === 'grouped' ? '#ffffff' : 'transparent',
                color: viewMode === 'grouped' ? '#1e3a8a' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: viewMode === 'grouped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FiLayers size={13} color={viewMode === 'grouped' ? '#1e3a8a' : undefined} />
              <span>Grouped by Invoice / Bill Entry ({groupedEntries.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: viewMode === 'flat' ? 800 : 600,
                backgroundColor: viewMode === 'flat' ? '#ffffff' : 'transparent',
                color: viewMode === 'flat' ? '#1e3a8a' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: viewMode === 'flat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FiBox size={13} color={viewMode === 'flat' ? '#1e3a8a' : undefined} />
              <span>Individual Line Items ({transactions.length})</span>
            </button>
          </div>
        </div>

        {viewMode === 'grouped' && multiItemEntriesCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {multiItemEntriesCount} multi-product bill(s) detected
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <button
              type="button"
              onClick={handleExpandAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e3a8a',
                cursor: 'pointer',
                fontWeight: 700,
                padding: '2px 4px',
              }}
            >
              Expand All
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 4px',
              }}
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      <StickyTableContainer>
        <table className="transaction-table" style={{ width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '135px' }}>Date & Time</th>
              <th style={{ width: '105px' }}>Movement</th>
              <th style={{ width: '170px' }}>Invoice / Ref # & Reason</th>
              <th style={{ width: '160px' }}>Customer (Party)</th>
              <th style={{ width: '150px' }}>Place / Site</th>
              <th style={{ minWidth: '220px' }}>Product(s) Manifest</th>
              <th style={{ width: '95px' }}>Total Qty</th>
              <th style={{ width: '110px' }}>Handled By</th>
              <th className="no-print" style={{ textAlign: 'right', width: '160px', paddingRight: '20px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedEntries.map((entry) => {
              const isIn = entry.type === 'in';
              const displayDate = entry.transactionDate || entry.createdAt;
              const isMulti = entry.items.length > 1;
              const isExpanded = expandedKeys.has(entry.groupKey);

              return (
                <React.Fragment key={entry.groupKey}>
                  <tr
                    style={{
                      backgroundColor: isExpanded ? 'rgba(30, 58, 138, 0.02)' : undefined,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* 1. Date & Time */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(displayDate)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {formatRelative(displayDate)}
                      </div>
                    </td>

                    {/* 2. Movement Type Badge */}
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
                          fontWeight: 700,
                        }}
                      >
                        {isIn ? <FiArrowDownLeft size={14} /> : <FiArrowUpRight size={14} />}
                        {isIn ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>

                    {/* 3. Invoice / Ref # & Movement Reason (Prominently Categorized) */}
                    <td>
                      {entry.referenceNo ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor: isIn ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 58, 138, 0.08)',
                              color: isIn ? '#059669' : '#1e3a8a',
                              border: isIn ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(30, 58, 138, 0.2)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                            }}
                            title={`Invoice / Reference: ${entry.referenceNo}`}
                          >
                            <FiFileText size={11} />
                            <span>{entry.referenceNo}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyRef(entry.referenceNo, entry.groupKey, e)}
                            title="Copy Invoice / Ref #"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: copiedKey === entry.groupKey ? 'var(--success)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {copiedKey === entry.groupKey ? <FiCheck size={12} /> : <FiCopy size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          — No Ref # —
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                        }}
                      >
                        {entry.reason || 'General Movement'}
                      </div>
                    </td>

                    {/* 4. Customer / Party */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8125rem' }}>
                        <FiUser size={13} color="var(--primary-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {entry.personName || '—'}
                          </div>
                          {entry.senderCompany && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {entry.senderCompany}
                            </div>
                          )}
                          {entry.senderPhone && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {entry.senderPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Place / Site */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.8125rem' }}>
                        <FiMapPin size={13} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {entry.place || '—'}
                        </span>
                      </div>
                    </td>

                    {/* 6. Products Column (Single Product OR Multi-Product Manifest) */}
                    <td>
                      {!isMulti ? (
                        // Single product item
                        (() => {
                          const item = entry.items[0];
                          const prod = item?.product;
                          return (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.3 }}>
                                {prod?.name || 'Standard Equipment'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {prod?.sku && (
                                  <span
                                    style={{
                                      fontFamily: 'ui-monospace, monospace',
                                      fontSize: '0.7rem',
                                      backgroundColor: 'var(--bg-secondary)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--border)',
                                    }}
                                  >
                                    {prod.sku}
                                  </span>
                                )}
                                {prod?.productType && (
                                  <span
                                    className="badge"
                                    style={{
                                      fontSize: '0.67rem',
                                      padding: '1px 6px',
                                      background: 'rgba(108, 92, 231, 0.08)',
                                      color: 'var(--primary-light)',
                                      border: '1px solid var(--primary-border)',
                                    }}
                                  >
                                    {prod.productType}
                                  </span>
                                )}
                                {item?.serialNumbers?.length > 0 && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#1e3a8a',
                                      backgroundColor: 'rgba(30, 58, 138, 0.08)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <FiZap size={9} />
                                    <span>{item.serialNumbers.length} SN(s)</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        // Multi-Product Entry
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                backgroundColor: 'rgba(30, 58, 138, 0.08)',
                                color: '#1e3a8a',
                                border: '1px solid rgba(30, 58, 138, 0.2)',
                                padding: '3px 9px',
                                borderRadius: '6px',
                              }}
                            >
                              <FiBox size={13} />
                              <span>{entry.items.length} Products in Bill</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleExpand(entry.groupKey)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-light)',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  <FiChevronDown size={14} />
                                  <span>Hide Items</span>
                                </>
                              ) : (
                                <>
                                  <FiChevronRight size={14} />
                                  <span>Show All ({entry.items.length})</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Collapsed Compact Preview of Items */}
                          {!isExpanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                              {entry.items.slice(0, 2).map((item, iIdx) => (
                                <div
                                  key={iIdx}
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                                  <strong style={{ color: 'var(--text-primary)' }}>
                                    {item.product?.name || 'Equipment'}
                                  </strong>
                                  <span style={{ color: isIn ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                    ({isIn ? `+${item.quantity}` : `-${item.quantity}`} {item.product?.unit || 'pcs'})
                                  </span>
                                </div>
                              ))}
                              {entry.items.length > 2 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '8px' }}>
                                  + {entry.items.length - 2} more equipment line(s)...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 7. Total Quantity */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
                          <strong
                            style={{
                              color: isIn ? 'var(--success)' : 'var(--danger)',
                              fontSize: isMulti ? '1.1rem' : '1.05rem',
                              fontWeight: 900,
                            }}
                          >
                            {isIn ? `+${entry.totalQuantity}` : `-${entry.totalQuantity}`}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {isMulti ? 'Units' : entry.items[0]?.product?.unit || 'pcs'}
                          </span>
                        </div>
                        {isMulti && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            {entry.items.length} lines
                          </div>
                        )}
                        {entry.totalSerials > 0 && isMulti && (
                          <div
                            style={{
                              fontSize: '0.67rem',
                              color: '#1e3a8a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              marginTop: '2px',
                              fontWeight: 700,
                            }}
                          >
                            <FiZap size={9} />
                            <span>{entry.totalSerials} SNs</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 8. Handled By */}
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {entry.user?.name || 'System User'}
                      </span>
                    </td>

                    {/* 9. Action Buttons */}
                    <td className="no-print" style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {onOpenInvoice && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={FiFileText}
                            title={isMulti ? `View Invoice with all ${entry.items.length} Products` : 'View Official Sologix GST Tax Invoice'}
                            style={{
                              color: '#1e3a8a',
                              fontWeight: 700,
                              borderColor: '#cbd5e1',
                              backgroundColor: '#f8fafc',
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                            }}
                            onClick={() => onOpenInvoice(entry)}
                          >
                            Invoice
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={FiEye}
                          title={isMulti ? `Inspect Full Voucher (${entry.items.length} Products)` : 'Inspect Voucher & Details'}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => onInspect && onInspect(entry)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={FiEdit2}
                          title="Edit Stock Entry"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => onEdit && onEdit(entry)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Multi-Item Manifest Drawer Row */}
                  {isMulti && isExpanded && (
                    <tr style={{ backgroundColor: 'rgba(30, 58, 138, 0.02)' }}>
                      <td colSpan={9} style={{ padding: '0 20px 18px 20px', borderTop: 'none' }}>
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                              paddingBottom: '8px',
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FiLayers size={15} color="#1e3a8a" />
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Multi-Item Manifest ({entry.items.length} Products on {entry.referenceNo || 'This Entry'})
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Customer: <strong style={{ color: 'var(--text-primary)' }}>{entry.personName || '—'}</strong>
                            </span>
                          </div>

                          {/* Inner Sub-Table */}
                          <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '6px 8px', width: '32px' }}>#</th>
                                <th style={{ padding: '6px 8px' }}>Equipment & Model</th>
                                <th style={{ padding: '6px 8px', width: '130px' }}>SKU / Rating</th>
                                <th style={{ padding: '6px 8px', width: '120px' }}>Category</th>
                                <th style={{ padding: '6px 8px', width: '110px' }}>Quantity</th>
                                <th style={{ padding: '6px 8px' }}>Serial Numbers</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.items.map((item, itIdx) => {
                                const prod = item.product;
                                return (
                                  <tr
                                    key={item.txId || itIdx}
                                    style={{
                                      borderBottom: itIdx < entry.items.length - 1 ? '1px dashed #f1f5f9' : 'none',
                                    }}
                                  >
                                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                      {itIdx + 1}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {prod?.name || 'Equipment'}
                                      </div>
                                      {prod?.brand && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                          Brand: {prod.brand}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                      <span
                                        style={{
                                          fontFamily: 'ui-monospace, monospace',
                                          fontSize: '0.72rem',
                                          backgroundColor: '#f1f5f9',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          border: '1px solid #e2e8f0',
                                        }}
                                      >
                                        {prod?.sku || '—'}
                                      </span>
                                      {prod?.capacity && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                          {prod.capacity}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                      <span
                                        style={{
                                          fontSize: '0.7rem',
                                          backgroundColor: 'rgba(108, 92, 231, 0.08)',
                                          color: 'var(--primary-light)',
                                          padding: '2px 7px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {prod?.productType || prod?.category || 'Standard'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          fontSize: '0.85rem',
                                          color: isIn ? 'var(--success)' : 'var(--danger)',
                                        }}
                                      >
                                        {isIn ? `+${item.quantity}` : `-${item.quantity}`} {prod?.unit || 'pcs'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                      {item.serialNumbers && item.serialNumbers.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '55px', overflowY: 'auto' }}>
                                          {item.serialNumbers.map((sn, snIdx) => (
                                            <span
                                              key={snIdx}
                                              style={{
                                                fontSize: '0.7rem',
                                                fontFamily: 'ui-monospace, monospace',
                                                backgroundColor: '#f8fafc',
                                                border: '1px solid #cbd5e1',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                color: '#1e293b',
                                                fontWeight: 600,
                                              }}
                                            >
                                              ⚡ {sn}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                          (No serials recorded)
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </StickyTableContainer>
    </div>
  );
};

export default TransactionTable;
