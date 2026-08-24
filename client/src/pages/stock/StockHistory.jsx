import React, { useState, useEffect, useCallback } from 'react';
import {
  FiClock,
  FiFilter,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiUser,
  FiMapPin,
  FiBox,
  FiFileText,
  FiCheckCircle,
  FiPrinter,
} from 'react-icons/fi';
import TransactionTable from '../../components/stock/TransactionTable';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { stockService } from '../../services/stockService';
import { formatDateTime, formatRelative, formatDate } from '../../utils/formatDate';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/formatCurrency';
import { exportStockLedgerPdf, exportSingleVoucherPdf, triggerPrint } from '../../utils/exportPdf';
import toast from 'react-hot-toast';

const StockHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await stockService.getTransactions({
        page,
        limit: 25,
        search: searchTerm.trim() || undefined,
        type: filters.type || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setTransactions(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      toast.error('Failed to load transaction ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ type: '', startDate: '', endDate: '' });
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(true);
    toast.success('Ledger updated');
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'Date & Time',
      'Movement Type',
      'Product Name',
      'Unique ID (SKU)',
      'Product Type',
      'Company / Brand',
      'Capacity',
      'Phase',
      'Serial Numbers',
      'Quantity',
      'Unit',
      'Person Name (Issued To/From)',
      'Place / Project Site',
      'Reason',
      'Reference / Work Order #',
      'Notes',
      'Operator',
    ];

    const rows = transactions.map((tx) => {
      const txSerials = Array.isArray(tx.serialNumbers)
        ? tx.serialNumbers.join('; ')
        : typeof tx.serialNumbers === 'string'
        ? JSON.parse(tx.serialNumbers || '[]').join('; ')
        : '';

      return [
        tx.id,
        `"${formatDateTime(tx.transactionDate || tx.createdAt)}"`,
        tx.type.toUpperCase(),
        `"${tx.product?.name || 'Deleted'}"`,
        `"${tx.product?.sku || '—'}"`,
        `"${tx.product?.productType || '—'}"`,
        `"${tx.product?.brand || '—'}"`,
        `"${tx.product?.capacity || '—'}"`,
        `"${tx.product?.phase || '—'}"`,
        `"${txSerials}"`,
        tx.quantity,
        `"${tx.product?.unit || 'pcs'}"`,
        `"${tx.personName || '—'}"`,
        `"${tx.place || '—'}"`,
        `"${tx.reason || '—'}"`,
        `"${tx.referenceNo || '—'}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
        `"${tx.user?.name || '—'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger CSV exported');
  };

  const isIn = selectedTx?.type === 'in';
  const unit = selectedTx?.product?.unit || 'pcs';
  const unitPrice = Number(selectedTx?.product?.price) || 0;
  const valuation = (selectedTx?.quantity * unitPrice).toFixed(2);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Outward & Inward Ledger</h1>
          <p className="page-subtitle">
            Audit history tracking product details, outward quantity, recipient person, destination site, and date & time
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={FiRefreshCw}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Updating...' : 'Refresh'}
          </Button>
          <Button
            variant="secondary"
            icon={FiDownload}
            onClick={exportToCSV}
            disabled={transactions.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={FiFileText}
            onClick={() => exportStockLedgerPdf(transactions, filters)}
            disabled={transactions.length === 0}
          >
            Export PDF Report
          </Button>
          <Button
            variant="secondary"
            icon={FiPrinter}
            onClick={triggerPrint}
            disabled={transactions.length === 0}
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ gridColumn: 'span 2', minWidth: '240px' }}>
            <Input
              icon={FiSearch}
              label="Search Movements"
              placeholder="Search by person name, place, reference #, or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Input
              as="select"
              label="Movement Type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Movements</option>
              <option value="out">Stock Out (Consumption / Dispatch)</option>
              <option value="in">Stock In (Inward Restock)</option>
            </Input>
          </div>

          <div>
            <Input
              label="From Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <Input
              label="To Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <Loader text="Loading transaction records..." />
      ) : (
        <>
          <TransactionTable
            transactions={transactions}
            onInspect={(tx) => setSelectedTx(tx)}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={page === p ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* FULL DISPATCH / CONSUMPTION VOUCHER MODAL */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title={isIn ? 'Stock Inward Voucher' : 'Stock Outward / Consumption Voucher'}
        subtitle={
          selectedTx
            ? `Transaction ID #${selectedTx.id} • ${formatDateTime(selectedTx.transactionDate || selectedTx.createdAt)}`
            : ''
        }
        maxWidth="680px"
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Top Status Banner */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isIn ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: isIn ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isIn ? (
                  <FiArrowDownLeft size={22} color="var(--success)" />
                ) : (
                  <FiArrowUpRight size={22} color="var(--danger)" />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isIn ? 'var(--success)' : 'var(--danger)' }}>
                    {isIn ? `Restocked +${selectedTx.quantity} ${unit}` : `Dispatched / Consumed -${selectedTx.quantity} ${unit}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Reason: {selectedTx.reason}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Movement Quantity
                </span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isIn ? 'var(--success)' : 'var(--danger)' }}>
                  {isIn ? `+${selectedTx.quantity}` : `-${selectedTx.quantity}`} {unit}
                </div>
              </div>
            </div>

            {/* SECTION 1: FULL PRODUCT DETAILS */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
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
                <FiBox size={14} />
                Full Product Specifications
              </div>

              <div className="grid-2" style={{ gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Product Name
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {selectedTx.product?.name || 'Deleted Product'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Unique ID / SKU
                  </span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {selectedTx.product?.sku || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Product Type
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {selectedTx.product?.productType || 'Standard Product'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Company / Brand
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {selectedTx.product?.brand || selectedTx.product?.category || '—'}
                  </div>
                </div>

                {selectedTx.product?.capacity && (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Capacity & Phase
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.85rem' }}>
                      ⚡ {selectedTx.product.capacity} • {selectedTx.product.phase || '1-Phase'}
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Current Available Stock
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {selectedTx.product?.quantity ?? 0} {unit}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Storage Bin Location
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    📍 {selectedTx.product?.location || 'Warehouse Storage'}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: DISPATCH & RECEIVER PARTICULAR DETAILS */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiUser size={14} color="var(--primary-light)" />
                Movement & Handover Details
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isIn ? 'Received From / Sender Person' : 'Issued To (Person Name / Technician)'}
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '2px' }}>
                    👤 {selectedTx.personName || 'Not Specified'}
                  </div>
                  {selectedTx.senderPhone && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📞 {selectedTx.senderPhone}
                    </div>
                  )}
                  {selectedTx.senderCompany && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      🏢 {selectedTx.senderCompany}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isIn ? 'Receiving Location / Origin' : 'Destination Place / Project Site'}
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '2px' }}>
                    📍 {selectedTx.place || 'Not Specified'}
                  </div>
                  {selectedTx.senderAddress && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      🏠 {selectedTx.senderAddress}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Reason / Category
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.85rem', marginTop: '2px' }}>
                    🏷️ {selectedTx.reason || 'General'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Exact Date & Time
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '2px' }}>
                    📅 {formatDateTime(selectedTx.transactionDate || selectedTx.createdAt)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Logged By (Operator)
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '2px' }}>
                    {selectedTx.user?.name || 'Administrator'} ({selectedTx.user?.email || '—'})
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Current Available Stock
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '2px' }}>
                    {selectedTx.product?.quantity} {unit}
                  </div>
                </div>
              </div>

              {/* ATTACHED SERIAL NUMBERS IN VOUCHER */}
              {selectedTx.serialNumbers &&
                (Array.isArray(selectedTx.serialNumbers) ? selectedTx.serialNumbers : JSON.parse(selectedTx.serialNumbers || '[]')).length > 0 && (
                  <div style={{ marginTop: '12px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      Associated Unit Serial Numbers ({isIn ? 'Received' : 'Dispatched'})
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(Array.isArray(selectedTx.serialNumbers) ? selectedTx.serialNumbers : JSON.parse(selectedTx.serialNumbers || '[]')).map((sn, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            backgroundColor: 'var(--surface)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          ⚡ {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedTx.notes && (
                <div style={{ marginTop: '12px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Remarks & Notes
                  </span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedTx.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FiFileText}
                  onClick={() => exportSingleVoucherPdf(selectedTx)}
                >
                  Download PDF Voucher
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FiPrinter}
                  onClick={triggerPrint}
                >
                  Print Voucher
                </Button>
              </div>

              <Button variant="secondary" onClick={() => setSelectedTx(null)}>
                Close Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockHistory;
