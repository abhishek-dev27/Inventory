import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from './formatDate';

/**
 * Export Multi-Item Dispatch Bill / Delivery Challan to PDF (No Pricing)
 */
export const exportMultiItemBillPdf = (bill) => {
  if (!bill || !bill.items || bill.items.length === 0) {
    alert('No bill data to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Top Organization Header Banner
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INVENTORY PRO ERP', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(162, 155, 254);
  doc.text('SOLAR & INDUSTRIAL SUPPLY CHAIN MANAGEMENT', 14, 18);
  doc.text('OFFICIAL STOCK DISPATCH BILL & DELIVERY CHALLAN', 14, 23);

  // Right Header Bill Ref & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`BILL REF: ${bill.billRef || bill.referenceNo || 'BILL-2026'}`, pageWidth - 14, 13, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Date: ${formatDateTime(bill.transactionDate || new Date().toISOString())}`,
    pageWidth - 14,
    19,
    { align: 'right' }
  );
  doc.text('Gate Pass: Authorized', pageWidth - 14, 24, { align: 'right' });

  // 2. Customer & Consignee Details Box
  let y = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(108, 92, 231);
  doc.text('CONSIGNEE / CUSTOMER DETAILS', 18, y + 6);
  doc.text('DISPATCH DESTINATION & PURPOSE', 115, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Customer / Client:`, 18, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.customerName || bill.personName || 'Direct Customer'}`, 52, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Delivery Site:`, 115, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.place || 'Project Installation Site'}`, 142, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Movement Purpose:`, 18, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.reason || 'Project Site Dispatch'}`, 52, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`Issued By:`, 115, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.user?.name ? `${bill.user.name} (${bill.user.email})` : 'Authorized Admin'}`, 142, y + 18);

  // 3. Itemized Equipment Table (Quantity & Specs Only)
  y += 30;

  const tableData = bill.items.map((item, idx) => {
    const prod = item.product || {};
    const qty = parseInt(item.quantity, 10) || 0;

    let serials = [];
    if (item.serialNumbers) {
      serials = Array.isArray(item.serialNumbers)
        ? item.serialNumbers
        : typeof item.serialNumbers === 'string'
        ? JSON.parse(item.serialNumbers || '[]')
        : [];
    }

    const specs = [
      prod.brand || '',
      prod.capacity || '',
      prod.phase || '',
      prod.dcrType ? `[${prod.dcrType}]` : '',
      prod.subType || '',
    ]
      .filter(Boolean)
      .join(' • ');

    const nameCell = `${prod.name || 'Product'}\nSKU: ${prod.sku || '—'}${
      serials.length > 0 ? `\nSerials (${serials.length}): ${serials.join(', ')}` : ''
    }`;

    return [
      idx + 1,
      nameCell,
      prod.productType || prod.category || 'General',
      specs || 'Standard Specification',
      `${qty} ${prod.unit || 'pcs'}`,
    ];
  });

  const totalUnits = bill.items.reduce(
    (sum, i) => sum + (parseInt(i.quantity, 10) || 0),
    0
  );

  autoTable(doc, {
    startY: y,
    head: [
      [
        '#',
        'Equipment / Material Description',
        'Category',
        'Specifications / Rating',
        'Dispatched Quantity',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 46 },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
  });

  let finalY = doc.lastAutoTable.finalY + 8;

  // 4. Quantity Summary Card
  if (finalY + 40 > pageHeight - 30) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - 90, finalY, 76, 20, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Distinct Items:`, pageWidth - 86, finalY + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.items.length}`, pageWidth - 18, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Units Dispatched:`, pageWidth - 86, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${totalUnits} Units`, pageWidth - 18, finalY + 14, { align: 'right' });

  // Remarks
  if (bill.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dispatch Remarks: ${bill.notes}`, 14, finalY + 8);
    doc.text('Goods received in good condition and tested according to standards.', 14, finalY + 14);
  }

  // 5. Official Signature Handover Block
  const sigY = Math.max(finalY + 32, pageHeight - 34);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  doc.line(14, sigY, 65, sigY);
  doc.text('Prepared By (Store Incharge)', 14, sigY + 5);

  doc.line(80, sigY, 130, sigY);
  doc.text('Verified By (Site Supervisor)', 80, sigY + 5);

  doc.line(145, sigY, 195, sigY);
  doc.text('Received By (Customer Signature)', 145, sigY + 5);

  // Footer text
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Computer Generated Delivery Challan / Gate Pass — Inventory Pro ERP', 14, pageHeight - 6);
  doc.text(`Page 1 of 1`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  const cleanRef = (bill.billRef || bill.referenceNo || 'BILL').replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Dispatch_Bill_${cleanRef}.pdf`);
};

/**
 * Export Stock Ledger / Movement History to PDF
 */
export const exportStockLedgerPdf = (transactions = []) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('INVENTORY PRO — STOCK MOVEMENT LEDGER REPORT', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(162, 155, 254);
  doc.text(
    `Generated on: ${formatDateTime(new Date().toISOString())} | Total Records: ${transactions.length}`,
    14,
    19
  );

  const totalIn = transactions.filter((t) => t.type === 'in').reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalOut = transactions.filter((t) => t.type === 'out').reduce((sum, t) => sum + (t.quantity || 0), 0);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Inward: +${totalIn} units  |  Outward: -${totalOut} units`, pageWidth - 14, 15, { align: 'right' });

  const tableData = transactions.map((t, idx) => {
    const isOut = t.type === 'out';
    const prod = t.product || {};
    const specs = [
      prod.brand || '',
      prod.capacity || '',
      prod.phase || '',
      prod.dcrType || '',
      prod.subType || '',
    ]
      .filter(Boolean)
      .join(' • ');

    const dateStr = formatDate(t.transactionDate || t.createdAt);
    const qtyStr = `${isOut ? '-' : '+'}${t.quantity} ${prod.unit || 'pcs'}`;
    const personStr = t.personName ? `${t.personName}${t.senderPhone ? ` (${t.senderPhone})` : ''}` : '—';

    return [
      idx + 1,
      dateStr,
      isOut ? 'OUT (Dispatch)' : 'IN (Receipt)',
      `${prod.name || 'Product'}\n[${prod.sku || '—'}]`,
      `${prod.productType || prod.category || '—'}${specs ? `\n${specs}` : ''}`,
      qtyStr,
      personStr,
      t.place || '—',
      t.referenceNo || '—',
      t.reason || 'General',
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [
      [
        '#',
        'Date',
        'Movement',
        'Product & SKU',
        'Type / Specifications',
        'Quantity',
        'Party / Person',
        'Site / Location',
        'Ref #',
        'Reason',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [108, 92, 231],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 22, fontStyle: 'bold' },
      3: { cellWidth: 46 },
      4: { cellWidth: 44 },
      5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 32 },
      7: { cellWidth: 30 },
      8: { cellWidth: 22 },
      9: { cellWidth: 25 },
    },
    didDrawPage: () => {
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: 'right' });
      doc.text('Confidential — Solar & Industrial Inventory ERP', 14, pageHeight - 6);
    },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`Stock_Movement_Ledger_${timestamp}.pdf`);
};

/**
 * Export Product Catalog & Inventory Stock to PDF (No Pricing)
 */
export const exportProductCatalogPdf = (products = []) => {
  if (!products || products.length === 0) {
    alert('No products to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('INVENTORY PRO — PRODUCT CATALOG & STOCK REPORT', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(162, 155, 254);
  doc.text(
    `Generated on: ${formatDateTime(new Date().toISOString())} | Total SKUs: ${products.length}`,
    14,
    19
  );

  const totalUnits = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Total Units in Stock: ${totalUnits}`,
    pageWidth - 14,
    15,
    { align: 'right' }
  );

  const tableData = products.map((p, idx) => {
    const specs = [
      p.brand || '',
      p.capacity || '',
      p.phase || '',
      p.dcrType || '',
      p.subType || '',
    ]
      .filter(Boolean)
      .join(' • ');

    const status =
      p.quantity === 0
        ? 'OUT OF STOCK'
        : p.quantity <= p.lowStockThreshold
        ? 'LOW STOCK'
        : 'IN STOCK';

    return [
      idx + 1,
      p.sku || '—',
      p.name || 'Unnamed',
      p.productType || 'Standard',
      specs || p.category || '—',
      `${p.quantity} ${p.unit || 'pcs'}`,
      p.location || 'Warehouse',
      status,
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [
      [
        '#',
        'SKU / ID',
        'Product Name',
        'Type',
        'Specifications / Category',
        'Stock Available',
        'Storage Bin',
        'Status',
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
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 32 },
      4: { cellWidth: 60 },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 26 },
      7: { cellWidth: 26, halign: 'center' },
    },
    didDrawPage: () => {
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: 'right' });
      doc.text('Inventory Pro — Confidential Stock Summary', 14, pageHeight - 6);
    },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`Product_Catalog_Stock_${timestamp}.pdf`);
};

/**
 * Export a Single Transaction Voucher / Gate Pass to PDF
 */
export const exportSingleVoucherPdf = (tx) => {
  if (!tx) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isIn = tx.type === 'in';
  const prod = tx.product || {};
  const serials = Array.isArray(tx.serialNumbers)
    ? tx.serialNumbers
    : typeof tx.serialNumbers === 'string'
    ? JSON.parse(tx.serialNumbers || '[]')
    : [];

  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INVENTORY PRO ERP', 14, 13);

  doc.setFontSize(10);
  doc.setTextColor(isIn ? 0 : 255, isIn ? 214 : 107, isIn ? 143 : 107);
  doc.text(isIn ? 'OFFICIAL MATERIAL INWARD RECEIPT' : 'OFFICIAL STOCK DISPATCH VOUCHER / GATE PASS', 14, 21);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Voucher Ref: ${tx.referenceNo || `TX-${tx.id}`}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Date: ${formatDate(tx.transactionDate || tx.createdAt)}`, pageWidth - 14, 21, { align: 'right' });

  // Section 1: Movement Particulars
  let y = 38;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(108, 92, 231);
  doc.text('1. MOVEMENT & HANDOVER PARTICULARS', 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`Movement Type:`, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(isIn ? 'STOCK IN (Material Received)' : 'STOCK OUT (Site Dispatch)', 50, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Reason / Purpose:`, 110, y);
  doc.setFont('helvetica', 'bold');
  doc.text(tx.reason || 'General Movement', 150, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(isIn ? 'Received From:' : 'Issued To (Party):', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(tx.personName || 'Not Specified', 50, y);

  doc.setFont('helvetica', 'normal');
  doc.text(isIn ? 'Receiving Bay:' : 'Destination Site:', 110, y);
  doc.setFont('helvetica', 'bold');
  doc.text(tx.place || 'Warehouse', 150, y);

  if (tx.senderPhone || tx.senderCompany) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Contact / Company:`, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tx.senderPhone || ''} ${tx.senderCompany ? `• ${tx.senderCompany}` : ''}`, 50, y);
  }

  // Section 2: Material Specifications
  y += 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(108, 92, 231);
  doc.text('2. MATERIAL & PRODUCT SPECIFICATIONS', 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  const productTableData = [
    [
      prod.sku || '—',
      prod.name || 'Material Item',
      prod.productType || 'Standard',
      prod.brand || '—',
      `${prod.capacity || ''} ${prod.phase || ''} ${prod.dcrType || ''} ${prod.subType || ''}`.trim() || '—',
      `${tx.quantity} ${prod.unit || 'pcs'}`,
    ],
  ];

  autoTable(doc, {
    startY: y + 5,
    head: [['Unique SKU', 'Product Name', 'Type', 'Brand', 'Rating / Compliance', 'Quantity']],
    body: productTableData,
    theme: 'grid',
    headStyles: { fillColor: [26, 26, 46], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
  });

  y = doc.lastAutoTable.finalY + 10;

  if (serials.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(108, 92, 231);
    doc.text(`3. ASSOCIATED UNIT SERIAL NUMBERS (${serials.length} UNITS)`, 14, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    y += 8;
    doc.setFontSize(8);
    doc.setFont('courier', 'bold');
    doc.setTextColor(30, 41, 59);

    let sx = 14;
    let sy = y;
    serials.forEach((sn) => {
      if (sx + 45 > pageWidth - 14) {
        sx = 14;
        sy += 6;
      }
      doc.setFillColor(241, 245, 249);
      doc.rect(sx, sy - 4, 42, 5, 'F');
      doc.text(`* ${sn}`, sx + 2, sy);
      sx += 46;
    });

    y = sy + 14;
  }

  if (tx.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Remarks / Notes: ${tx.notes}`, 14, y);
    y += 12;
  }

  y = Math.max(y + 10, 230);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.line(14, y, 65, y);
  doc.text('Prepared / Handed Over By', 14, y + 5);

  doc.line(80, y, 130, y);
  doc.text('Received / Accepted By', 80, y + 5);

  doc.line(145, y, 195, y);
  doc.text('Authorized Security / Gate', 145, y + 5);

  doc.save(`Voucher_${tx.type.toUpperCase()}_${tx.referenceNo || tx.id}.pdf`);
};

/**
 * Direct Print Action (Triggers browser print sheet)
 */
export const triggerPrint = () => {
  window.print();
};
