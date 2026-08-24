import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiEdit2,
  FiTag,
  FiLayers,
  FiMapPin,
  FiHash,
  FiDollarSign,
  FiCpu,
  FiSun,
  FiTool,
  FiUser,
  FiPhone,
  FiHelpCircle,
  FiZap,
  FiCopy,
  FiCheck,
  FiSearch,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProductDetails = ({ product, isOpen, onClose }) => {
  const [copiedSN, setCopiedSN] = useState(null);
  const [snSearch, setSnSearch] = useState('');

  if (!product) return null;

  const isLowStock = product.quantity <= product.lowStockThreshold;
  const isOutOfStock = product.quantity === 0;
  const unit = product.unit || 'pcs';
  const price = Number(product.price) || 0;
  const costPrice = Number(product.costPrice) || 0;
  const totalValuation = (product.quantity * price).toFixed(2);
  const margin = price > 0 && costPrice > 0 ? (((price - costPrice) / price) * 100).toFixed(1) : null;

  const isInverter =
    product.productType === 'Ongrid Inverter' ||
    product.productType === 'Hybrid Inverter';

  const isModule = product.productType === 'Panels';
  const isMCB = product.productType === 'MCB';
  const isConsumable = product.productType === 'Consumable';
  const isSpare = product.productType === 'Spare';

  const serials = Array.isArray(product.serialNumbers)
    ? product.serialNumbers
    : typeof product.serialNumbers === 'string'
    ? JSON.parse(product.serialNumbers || '[]')
    : [];

  const filteredSerials = serials.filter((sn) =>
    sn.toLowerCase().includes(snSearch.toLowerCase())
  );

  const handleCopySerial = (sn) => {
    navigator.clipboard.writeText(sn);
    setCopiedSN(sn);
    toast.success(`Copied: ${sn}`);
    setTimeout(() => setCopiedSN(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`Unique ID: ${product.sku}`}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            className="badge"
            style={{
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              fontWeight: 700,
            }}
          >
            {product.productType || 'Standard Product'}
          </span>
          {isModule && product.dcrType && (
            <span
              className="badge"
              style={{
                backgroundColor: product.dcrType === 'DCR' ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                color: product.dcrType === 'DCR' ? 'var(--success)' : 'var(--warning)',
                border: product.dcrType === 'DCR' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)',
                fontWeight: 800,
              }}
            >
              ☀️ {product.dcrType}
            </span>
          )}
          {isConsumable && product.subType && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                color: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                fontWeight: 700,
              }}
            >
              🛠️ {product.subType}
            </span>
          )}
          {isSpare && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 170, 0, 0.15)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
                fontWeight: 700,
              }}
            >
              📦 Spare Replacement Part
            </span>
          )}
          <span className="badge badge-primary">{product.category}</span>
          {isOutOfStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">Low Stock Warning</span>
          ) : (
            <span className="badge badge-success">In Stock</span>
          )}
        </div>

        {/* Valuation Summary Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Stock
            </span>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)',
                marginTop: '2px',
              }}
            >
              {product.quantity} <span style={{ fontSize: '0.85rem' }}>{unit}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Low Stock Alert Level
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', marginTop: '2px' }}>
              {product.lowStockThreshold || 0} <span style={{ fontSize: '0.85rem' }}>{unit}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Storage Location
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {product.location || 'Warehouse Rack'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Stock Status
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)', marginTop: '2px' }}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Alert' : 'In Stock'}
            </div>
          </div>
        </div>

        {/* SPARE MATERIAL & SENDER PARTICULARS CARD */}
        {(isSpare || product.senderName) && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--warning)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiTool size={15} />
              Spare Material & Sender Dossier
            </div>

            <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Company / Brand
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  🏢 {product.brand || 'Not Specified'}
                </div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reason for Sending / Receipt
                </span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '2px' }}>
                  🏷️ {product.senderReason || 'Warranty Replacement / RMA'}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Sender Contact & Origin Details
              </span>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sender Person Name:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', marginTop: '1px' }}>
                    👤 {product.senderName || 'Not recorded'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contact Number:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', marginTop: '1px' }}>
                    📞 {product.senderPhone || 'Not recorded'}
                  </div>
                </div>

                {product.senderCompany && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sender Company / Vendor:</span>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '1px' }}>
                      🏢 {product.senderCompany}
                    </div>
                  </div>
                )}

                <div style={{ gridColumn: product.senderCompany ? 'auto' : 'span 2' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sender Address / Facility:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '1px' }}>
                    📍 {product.senderAddress || 'Not recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONSUMABLE SPECIFICATIONS (Nut & Bolt Type, Tape Color, Chemical Type) */}
        {isConsumable && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiTool size={15} />
              Consumable Specifications
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Consumable Type / Specification
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  🛠️ {product.subType || 'General Consumable'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Storage Bin / Rack Location
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  📍 {product.location || 'Warehouse Consumable Bin'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MCB SPECIFICATIONS (Company, Current Rating in Amperes, 1/2/4 Phase Poles) */}
        {isMCB && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiZap size={15} />
              MCB (Miniature Circuit Breaker) Specifications
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Manufacturer / Brand
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  🏢 {product.brand || 'Schneider Electric'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Current Rating (Amperes)
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
                  ⚡ {product.capacity || '32A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Number of Phase / Poles
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                  🔌 {product.phase || '2-Phase (2P)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SOLAR MODULE SPECIFICATIONS (Company, Capacity, DCR/NSCR) */}
        {isModule && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--warning)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiSun size={15} />
              Solar Module Specifications
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Company / Brand
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {product.brand || '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Wattage Capacity
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {product.capacity || '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Compliance
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: product.dcrType === 'DCR' ? 'var(--success)' : 'var(--warning)', marginTop: '2px' }}>
                  ☀️ {product.dcrType || 'DCR'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVERTER MODEL SPECIFICATIONS (Company, Capacity, Phase) */}
        {isInverter && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiCpu size={14} />
              Inverter Model Specifications
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Company / Brand
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {product.brand || '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Capacity
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {product.capacity || '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Electrical Phase
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: product.phase === '3-Phase' ? 'var(--success)' : 'var(--primary-light)', marginTop: '2px' }}>
                  ⚡ {product.phase || '1-Phase'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REGISTERED SERIAL NUMBERS SECTION */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiZap size={14} color="var(--primary-light)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Unit Serial Numbers ({serials.length})
              </span>
            </div>

            {serials.length > 3 && (
              <div style={{ position: 'relative', width: '180px' }}>
                <input
                  type="text"
                  placeholder="Filter serial..."
                  value={snSearch}
                  onChange={(e) => setSnSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px 4px 24px',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
                <FiSearch
                  size={12}
                  style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }}
                />
              </div>
            )}
          </div>

          {serials.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '12px' }}>
              No individual unit serial numbers tracked for this item.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: '130px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {filteredSerials.map((sn, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopySerial(sn)}
                  title="Click to copy serial number"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <FiZap size={11} color="var(--primary-light)" />
                  <span>{sn}</span>
                  {copiedSN === sn ? (
                    <FiCheck size={12} color="var(--success)" />
                  ) : (
                    <FiCopy size={11} color="var(--text-muted)" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Metadata Details */}
        <div className="grid-2" style={{ gap: '10px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Storage Location
            </span>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              📍 {product.location || 'Warehouse Storage'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Minimum Alert Stock
            </span>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {product.lowStockThreshold} {unit}
            </div>
          </div>
        </div>

        {/* Description / Specs */}
        {product.description && (
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Description & Specifications
            </span>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginTop: '4px',
                lineHeight: 1.5,
              }}
            >
              {product.description}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/stock/in" state={{ selectedProduct: product }}>
              <Button size="sm" variant="success" icon={FiArrowDownLeft}>
                Stock In
              </Button>
            </Link>
            <Link to="/stock/out" state={{ selectedProduct: product }}>
              <Button size="sm" variant="danger" icon={FiArrowUpRight}>
                Stock Out
              </Button>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/products/edit/${product.id}`}>
              <Button size="sm" variant="secondary" icon={FiEdit2}>
                Edit Details
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetails;
