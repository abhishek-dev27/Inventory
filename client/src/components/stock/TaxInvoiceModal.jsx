import React from 'react';
import { FiX, FiPrinter, FiDownload, FiCheckCircle, FiShield, FiTag } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { exportTaxInvoicePdf, triggerPrint, getHSNCode } from '../../utils/exportPdf';
import { formatDate } from '../../utils/formatDate';
import { SOLOGIX_LOGO_BASE64 } from '../../assets/logoBase64';

const TaxInvoiceModal = ({ isOpen, onClose, invoiceData, onNewDispatch, onGoHistory }) => {
  if (!invoiceData) return null;

  const {
    invoiceNo = 'INV-26-001',
    date = formatDate(new Date()),
    time = '',
    driverName = '',
    driverPhone = '',
    vehicleNo = '',
    refProposal = 'RSP-26-001',
    buyer = {},
    consignee = {},
    supply = {},
    items = [],
    totals = {},
    bank = {
      beneficiary: 'Sologix Energy Pvt Ltd',
      bankName: 'Canara Bank, Chutia Branch, Ranchi',
      accountNumber: '125009426214',
      ifsc: 'CNRB0002598',
    },
  } = invoiceData;

  const driverNameVal = driverName || supply.driverName || '';
  const driverPhoneVal = driverPhone || supply.driverPhone || '';
  const vehicleNoVal = vehicleNo || supply.vehicleNo || '';
  const timeVal = time || supply.dispatchTime || supply.time || '';

  const activeBuyer = {
    name: buyer?.name?.trim() || '—',
    place: buyer?.place?.trim() || '—',
    state: buyer?.state?.trim() || 'Jharkhand',
    phone: buyer?.phone?.trim() || '',
    gstin: buyer?.gstin?.trim() || '',
  };

  const activeConsignee = {
    name: consignee?.name?.trim() || buyer?.name?.trim() || '—',
    place: consignee?.place?.trim() || buyer?.place?.trim() || '—',
    state: consignee?.state?.trim() || buyer?.state?.trim() || 'Jharkhand',
    phone: consignee?.phone?.trim() || buyer?.phone?.trim() || '',
  };

  const handleDownload = () => {
    exportTaxInvoicePdf(invoiceData);
  };

  const handlePrint = () => {
    triggerPrint();
  };

  // Helper format currency
  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Total units dispatched
  const totalUnits = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delivery Challan: ${invoiceNo}`}
      subtitle="Official Sologix Energy Solutions Outward Delivery Challan & Gate Pass"
      maxWidth="880px"
    >
      <div
        className="tax-invoice-printable"
        style={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* 1. Header: Company Info (Left) & Invoice Meta (Right) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Company Details */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '320px' }}>
            <img
              src={SOLOGIX_LOGO_BASE64}
              alt="Sologix Energy Logo"
              style={{
                width: '116px',
                height: '60px',
                objectFit: 'contain',
                flexShrink: 0,
                marginTop: '1px',
              }}
              onError={(e) => {
                e.target.src = '/invoice-logo.png';
              }}
            />
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#1e3a8a',
                  letterSpacing: '0.01em',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Sologix Energy Pvt Ltd
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#334155',
                  fontWeight: 600,
                  margin: '4px 0 5px 0',
                  lineHeight: 1.3,
                }}
              >
                Second Floor, Tower 2, STPI Ranchi, Jharkhand
              </p>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#0f172a',
                  fontWeight: 600,
                  margin: '3px 0',
                  lineHeight: 1.4,
                }}
              >
                <span>
                  GSTIN/UIN: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>20AAZCS9296C1ZT</strong>
                </span>
                <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>
                <span>
                  State: <strong style={{ color: '#0f172a' }}>Jharkhand (20)</strong>
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#334155',
                  fontWeight: 600,
                  margin: '0 0 3px 0',
                  lineHeight: 1.4,
                }}
              >
                <span>
                  PAN: <strong style={{ color: '#0f172a' }}>AAZCS9296C</strong>
                </span>
                <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>
                <span>
                  Tel: <strong style={{ color: '#0f172a' }}>+91 82877 66474</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>
                Email: <span style={{ color: '#1e3a8a', fontWeight: 600 }}>sales@sologix.com</span>
              </div>
            </div>
          </div>

          {/* Invoice Badge & Numbers */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
              minWidth: '220px',
            }}
          >
            <div
              style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                padding: '4px 16px',
                borderRadius: '4px',
                marginBottom: '10px',
                display: 'inline-block',
              }}
            >
              DELIVERY CHALLAN
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '3px' }}>
              <span style={{ color: '#64748b', marginRight: '6px' }}>Challan No:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                {invoiceNo}
              </strong>
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '3px' }}>
              <span style={{ color: '#64748b', marginRight: '6px' }}>Date:</span>
              <strong style={{ color: '#0f172a' }}>{date}</strong>
            </div>
            {timeVal && (
              <div style={{ fontSize: '0.85rem', marginBottom: '3px' }}>
                <span style={{ color: '#64748b', marginRight: '6px' }}>Time:</span>
                <strong style={{ color: '#0f172a' }}>{timeVal}</strong>
              </div>
            )}
            {vehicleNoVal && (
              <div style={{ fontSize: '0.85rem', marginBottom: '3px' }}>
                <span style={{ color: '#64748b', marginRight: '6px' }}>Vehicle No:</span>
                <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{vehicleNoVal}</strong>
              </div>
            )}
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b', marginRight: '6px' }}>Ref Proposal:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{refProposal}</strong>
            </div>
          </div>
        </div>

        {/* Thick Horizontal Divider */}
        <div
          style={{
            height: '2px',
            backgroundColor: '#1e293b',
            width: '100%',
            marginTop: '4px',
          }}
        />

        {/* 2. Side-by-Side Cards: Billed To (Left) & Shipped To (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Billed To Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e3a8a' }}></span>
              BILLED TO (BUYER DETAILS)
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '4px',
              }}
            >
              {activeBuyer.name}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '2px' }}>
              {activeBuyer.place}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '4px' }}>
              State: <strong style={{ color: '#1e293b' }}>{activeBuyer.state}</strong>
            </div>
            {activeBuyer.phone && (
              <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '4px' }}>
                Phone: <strong style={{ color: '#1e293b' }}>{activeBuyer.phone}</strong>
              </div>
            )}
            {activeBuyer.gstin && (
              <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                GSTIN: <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{activeBuyer.gstin}</strong>
              </div>
            )}
          </div>

          {/* Shipped To Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0284c7',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              SHIPPED TO (CONSIGNEE / DELIVERY SITE)
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '4px',
              }}
            >
              {activeConsignee.name}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '2px' }}>
              {activeConsignee.place}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '4px' }}>
              Destination State: <strong style={{ color: '#1e293b' }}>{activeConsignee.state}</strong>
            </div>
            {activeConsignee.phone && (
              <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '4px' }}>
                Site Contact: <strong style={{ color: '#1e293b' }}>{activeConsignee.phone}</strong>
              </div>
            )}
            <div style={{ fontSize: '0.825rem', color: '#475569' }}>
              Place of Supply: <strong style={{ color: '#1e293b' }}>{supply.placeOfSupply || activeConsignee.state}</strong>
            </div>
          </div>
        </div>

        {/* 3. Items Table */}
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            marginTop: '4px',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.825rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                <th style={{ padding: '9px 10px', textAlign: 'center', width: '38px' }}>#</th>
                <th style={{ padding: '9px 12px' }}>Item Description / Equipment</th>
                <th style={{ padding: '9px 10px', textAlign: 'center', width: '120px' }}>Item Code / SKU</th>
                <th style={{ padding: '9px 10px', textAlign: 'center', width: '85px' }}>HSN Code</th>
                <th style={{ padding: '9px 12px', textAlign: 'center', width: '190px' }}>Product Serial No.</th>
                <th style={{ padding: '9px 12px', textAlign: 'center', width: '95px' }}>Dispatched Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = parseFloat(item.quantity) || 1;
                const unit = item.unit || 'pcs';
                const hsn = item.hsn || getHSNCode(item);
                const serials = item.serialNumbers || [];

                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                        {item.description || item.name}
                      </div>
                      {item.brand && (
                        <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                          Brand: {item.brand}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        color: '#1e293b',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.itemCode || item.sku || '-'}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        color: '#475569',
                      }}
                    >
                      {hsn}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {serials.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            maxHeight: '120px',
                            overflowY: 'auto',
                          }}
                        >
                          {serials.map((sn, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                fontSize: '0.72rem',
                                fontFamily: 'monospace',
                                color: '#1e293b',
                                fontWeight: 700,
                              }}
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                      {qty} {unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Side-by-Side Bottom Cards: Bank Details (Left) & Totals (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'stretch',
          }}
        >
          {/* Dispatch Verification & Logistics Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
              }}
            >
              DISPATCH & LOGISTICS VERIFICATION
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '5px 12px',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: '#64748b' }}>Vehicle Number:</span>
              <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>
                {vehicleNoVal ? vehicleNoVal.toUpperCase() : 'Not Specified'}
              </strong>

              <span style={{ color: '#64748b' }}>Driver in Charge:</span>
              <strong style={{ color: '#0f172a' }}>
                {driverNameVal || 'Authorized Driver'}{driverPhoneVal ? ` (Ph: ${driverPhoneVal})` : ''}
              </strong>

              <span style={{ color: '#64748b' }}>Carrier / Transport:</span>
              <strong style={{ color: '#0f172a' }}>
                {supply.transport || 'SafeXpress / Road Logistics'}
              </strong>

              <span style={{ color: '#64748b' }}>Date & Time:</span>
              <strong style={{ color: '#0f172a' }}>
                {date} {timeVal ? `• ${timeVal}` : ''}
              </strong>

              <span style={{ color: '#64748b' }}>Destination Site:</span>
              <strong style={{ color: '#0f172a' }}>
                {activeConsignee.place || activeConsignee.state || 'Local Site Delivery'}
              </strong>

              <span style={{ color: '#64748b' }}>Gate Security:</span>
              <strong style={{ color: '#16a34a' }}>
                VERIFIED & CLEARED FOR TRANSIT
              </strong>
            </div>
          </div>

          {/* Dispatch Quantity Summary Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Total Distinct Items:</span>
              <strong style={{ color: '#0f172a' }}>
                {items.length} Products
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Gate Security Status:</span>
              <strong style={{ color: '#1e3a8a' }}>
                ISSUED & DISPATCHED
              </strong>
            </div>
            <div
              style={{
                height: '1px',
                backgroundColor: '#cbd5e1',
                margin: '4px 0',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1.05rem',
                fontWeight: 900,
              }}
            >
              <span style={{ color: '#0f172a' }}>TOTAL QUANTITY:</span>
              <span style={{ color: '#16a34a', fontSize: '1.25rem' }}>
                {totalUnits} Units
              </span>
            </div>
          </div>
        </div>

        {/* 5. Declaration & Authorized Signatory Block */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'stretch',
            marginTop: '4px',
          }}
        >
          {/* Declaration Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              DECLARATION & TERMS OF MOVEMENT
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.45 }}>
              We declare that this Delivery Challan represents the actual materials dispatched from warehouse and that all particulars are true and correct.
            </div>
            <div
              style={{
                fontSize: '0.73rem',
                fontWeight: 700,
                color: '#1e293b',
                marginTop: '8px',
              }}
            >
              Computer Generated Delivery Challan • Gate Pass Authorized
            </div>
          </div>

          {/* Authorized Signatory Box with Official Stamp */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 20px 10px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 900,
                color: '#1e3a8a',
                letterSpacing: '0.02em',
                marginBottom: '4px',
              }}
            >
              For Sologix Energy Pvt Ltd
            </div>

            {/* Official Stamp & Signature Seal */}
            <div
              style={{
                margin: '-2px 0 -4px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src="/invoice-signature.png"
                alt="Authorized Signature & Stamp"
                style={{
                  height: '76px',
                  width: '78px',
                  objectFit: 'contain',
                  filter: 'contrast(1.05)',
                }}
              />
            </div>

            <div
              style={{
                width: '72%',
                height: '1px',
                backgroundColor: '#94a3b8',
                marginBottom: '6px',
              }}
            />
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              AUTHORIZED SIGNATORY
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px',
            marginTop: '6px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="primary"
              icon={FiDownload}
              onClick={handleDownload}
            >
              Download Delivery Challan PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={FiPrinter}
              onClick={handlePrint}
            >
              Print Delivery Challan
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onNewDispatch && (
              <Button type="button" variant="secondary" onClick={onNewDispatch}>
                Dispatch Another
              </Button>
            )}
            {onGoHistory && (
              <Button type="button" variant="secondary" onClick={onGoHistory}>
                View in History
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaxInvoiceModal;
