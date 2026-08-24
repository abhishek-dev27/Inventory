import React, { useState, useEffect, useMemo } from 'react';
import {
  FiUsers,
  FiSearch,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiDownload,
  FiPrinter,
  FiEye,
  FiZap,
  FiCheckCircle,
  FiArrowUpRight,
  FiRefreshCw,
} from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import { stockService } from '../../services/stockService';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { triggerPrint, exportMultiItemBillPdf } from '../../utils/exportPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const CustomerReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchOutwardTransactions = async () => {
    setLoading(true);
    try {
      // Fetch all stock out movements
      const res = await stockService.getTransactions({
        limit: 500,
        type: 'out',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(res.data || []);
    } catch (err) {
      toast.error('Failed to load customer dispatch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutwardTransactions();
  }, [startDate, endDate]);

  // Filter transactions with useMemo for smooth responsiveness
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return transactions;
    return transactions.filter((t) => {
      const customer = (t.personName || '').toLowerCase();
      const site = (t.place || '').toLowerCase();
      const ref = (t.referenceNo || '').toLowerCase();
      const prodName = (t.product?.name || '').toLowerCase();
      return (
        customer.includes(term) ||
        site.includes(term) ||
        ref.includes(term) ||
        prodName.includes(term)
      );
    });
  }, [transactions, searchTerm]);

  // Group by Bill Reference
  const billList = useMemo(() => {
    const billGroups = {};
    filtered.forEach((t) => {
      const key = t.referenceNo || `TX-${t.id}`;
      if (!billGroups[key]) {
        billGroups[key] = {
          billRef: key,
          customerName: t.personName || 'Unassigned Customer',
          place: t.place || 'Project Site',
          reason: t.reason || 'Project Site Dispatch',
          transactionDate: t.transactionDate || t.createdAt,
          user: t.user,
          notes: t.notes,
          items: [],
        };
      }
      billGroups[key].items.push(t);
    });

    return Object.values(billGroups).sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  }, [filtered]);

  // Group by Customer
  const customerList = useMemo(() => {
    const customerMap = {};
    filtered.forEach((t) => {
      const cName = t.personName?.trim() || 'General Customer';
      if (!customerMap[cName]) {
        customerMap[cName] = {
          name: cName,
          totalBills: new Set(),
          totalUnits: 0,
          totalValuation: 0,
          sites: new Set(),
          latestDate: t.transactionDate || t.createdAt,
        };
      }
      customerMap[cName].totalBills.add(t.referenceNo || `TX-${t.id}`);
      customerMap[cName].totalUnits += t.quantity || 0;
      const price = parseFloat(t.product?.price) || 0;
      customerMap[cName].totalValuation += (t.quantity || 0) * price;
      if (t.place) customerMap[cName].sites.add(t.place);
    });

    return Object.values(customerMap);
  }, [filtered]);

  // Metrics
  const { totalCustomersCount, totalBillsCount, totalUnitsDispatched, totalDispatchedValuation } = useMemo(() => {
    return {
      totalCustomersCount: customerList.length,
      totalBillsCount: billList.length,
      totalUnitsDispatched: filtered.reduce((sum, t) => sum + (t.quantity || 0), 0),
      totalDispatchedValuation: filtered.reduce((sum, t) => {
        const price = parseFloat(t.product?.price) || 0;
        return sum + (t.quantity || 0) * price;
      }, 0),
    };
  }, [filtered, customerList, billList]);

  // Export Customer Report to PDF
  const exportCustomerReportPdf = () => {
    if (filtered.length === 0) {
      toast.error('No customer dispatch records to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Banner Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('INVENTORY PRO — CUSTOMER DOSSIER & DISPATCH REPORT', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(162, 155, 254);
    doc.text(
      `Generated on: ${formatDateTime(new Date().toISOString())} | Total Customers: ${totalCustomersCount} | Total Orders: ${totalBillsCount}`,
      14,
      19
    );

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Total Dispatched Units: ${totalUnitsDispatched}  |  Valuation: ${formatCurrency(totalDispatchedValuation)}`,
      pageWidth - 14,
      15,
      { align: 'right' }
    );

    const tableData = billList.map((bill, idx) => {
      const itemsStr = bill.items
        .map(
          (i) =>
            `• ${i.product?.name || 'Item'} (${i.quantity} ${i.product?.unit || 'pcs'})`
        )
        .join('\n');

      const billTotal = bill.items.reduce((sum, i) => {
        const p = parseFloat(i.product?.price) || 0;
        return sum + (i.quantity || 0) * p;
      }, 0);

      const billUnits = bill.items.reduce((sum, i) => sum + (i.quantity || 0), 0);

      return [
        idx + 1,
        formatDate(bill.transactionDate),
        bill.customerName,
        bill.place,
        bill.billRef,
        itemsStr,
        `${billUnits} units`,
        formatCurrency(billTotal),
        bill.reason,
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [
        [
          '#',
          'Date',
          'Customer / Client Name',
          'Project Site / Destination',
          'Bill Ref #',
          'Dispatched Items Breakdown',
          'Total Qty',
          'Bill Value',
          'Purpose / Reason',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 92, 231],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 40 },
        4: { cellWidth: 28 },
        5: { cellWidth: 64 },
        6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 25 },
      },
      didDrawPage: () => {
        const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: 'right' });
        doc.text('Customer Dispatch Statement — Solar & Industrial Inventory ERP', 14, pageHeight - 6);
      },
    });

    doc.save(`Customer_Dispatch_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Customer report PDF exported');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Distinct Customers
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiUsers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalCustomersCount}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered client destinations</span>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Dispatch Bills
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiFileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalBillsCount}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Consolidated orders issued</span>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Units Dispatched
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiPackage size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalUnitsDispatched}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Items delivered to project sites</span>
        </div>
      </div>

      {/* Search & Export Toolbar */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            flex: 1,
            minWidth: '280px',
          }}
        >
          <Input
            icon={FiSearch}
            label="Search Customer or Site"
            placeholder="Search by customer name, project site, bill #, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Input
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={FiRefreshCw}
            onClick={fetchOutwardTransactions}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            icon={FiDownload}
            onClick={exportCustomerReportPdf}
            disabled={filtered.length === 0}
          >
            Export PDF Report
          </Button>

          <Button
            variant="secondary"
            icon={FiPrinter}
            onClick={triggerPrint}
            disabled={filtered.length === 0}
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Customer Dispatches Table */}
      <div className="table-container">
        {loading ? (
          <Loader text="Loading customer dispatch dossiers..." />
        ) : billList.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiUsers size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              No customer dispatch records found matching your filters
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Customer / Receiver</th>
                <th style={{ minWidth: '180px' }}>Project Site / Place</th>
                <th style={{ minWidth: '130px' }}>Bill / Challan Ref</th>
                <th style={{ minWidth: '240px' }}>Equipment Dispatched</th>
                <th style={{ minWidth: '90px', textAlign: 'right' }}>Total Units</th>
                <th style={{ minWidth: '120px', textAlign: 'right' }}>Bill Valuation</th>
                <th style={{ minWidth: '120px' }}>Date</th>
                <th style={{ textAlign: 'right', minWidth: '100px' }}>Voucher</th>
              </tr>
            </thead>
            <tbody>
              {billList.map((bill) => {
                const billTotal = bill.items.reduce((sum, i) => {
                  const p = parseFloat(i.product?.price) || 0;
                  return sum + (i.quantity || 0) * p;
                }, 0);
                const billUnits = bill.items.reduce((sum, i) => sum + (i.quantity || 0), 0);

                return (
                  <tr key={bill.billRef}>
                    {/* Customer */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {bill.customerName}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Purpose: {bill.reason}
                      </span>
                    </td>

                    {/* Site */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        <FiMapPin size={13} color="var(--primary-light)" />
                        <span>{bill.place}</span>
                      </div>
                    </td>

                    {/* Bill Ref */}
                    <td>
                      <span
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--bg-secondary)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          color: 'var(--primary-light)',
                        }}
                      >
                        {bill.billRef}
                      </span>
                    </td>

                    {/* Items List */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bill.items.map((i, idx) => (
                          <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              • {i.product?.name || 'Product'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                                color: 'var(--primary-light)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              x{i.quantity} {i.product?.unit || 'pcs'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Units */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {billUnits}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {formatDate(bill.transactionDate)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(bill.transactionDate).split(',')[1] || ''}
                      </span>
                    </td>

                    {/* Action View Bill */}
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={FiEye}
                        onClick={() => setSelectedBill(bill)}
                        title="View Full Customer Bill Voucher"
                      >
                        Bill
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: CUSTOMER DISPATCH BILL & VOUCHER INSPECTOR */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title="Customer Dispatch Bill & Gate Pass"
        size="lg"
      >
        {selectedBill && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Voucher Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary-light)',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  BILL REF: {selectedBill.billRef}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedBill.customerName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiMapPin size={13} color="var(--primary-light)" />
                  <span>{selectedBill.place}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Dispatch Date
                </span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatDate(selectedBill.transactionDate)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                  {selectedBill.reason}
                </span>
              </div>
            </div>

            {/* Bill Line Items Table */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Dispatched Equipment & Materials ({selectedBill.items.length} Items)
              </h4>

              <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                      <th>Equipment / Material</th>
                      <th>Specifications</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items.map((item, idx) => {
                      const serials = Array.isArray(item.serialNumbers)
                        ? item.serialNumbers
                        : typeof item.serialNumbers === 'string'
                        ? JSON.parse(item.serialNumbers || '[]')
                        : [];

                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', width: '30px' }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                              {item.product?.name || 'Item'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                              SKU: {item.product?.sku || '—'}
                            </div>
                            {serials.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {serials.map((sn, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      fontFamily: 'ui-monospace, monospace',
                                      fontSize: '0.68rem',
                                      backgroundColor: 'var(--bg-secondary)',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    ⚡ {sn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {item.product?.productType || item.product?.category || 'Standard'}
                              {item.product?.capacity ? ` • ${item.product.capacity}` : ''}
                              {item.product?.dcrType ? ` • ${item.product.dcrType}` : ''}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {item.quantity} {item.product?.unit || 'pcs'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Summary Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Dispatched Items:
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                {selectedBill.items.reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 0), 0)} Units ({selectedBill.items.length} Products)
              </span>
            </div>

            {selectedBill.notes && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong>Remarks:</strong> {selectedBill.notes}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  icon={FiDownload}
                  onClick={() => exportMultiItemBillPdf(selectedBill)}
                >
                  Download PDF Bill
                </Button>
                <Button variant="secondary" icon={FiPrinter} onClick={triggerPrint}>
                  Print Bill Sheet
                </Button>
              </div>

              <Button variant="secondary" onClick={() => setSelectedBill(null)}>
                Close Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerReport;
