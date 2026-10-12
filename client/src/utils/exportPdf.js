import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from './formatDate';
import { SOLOGIX_LOGO_BASE64 } from '../assets/logoBase64';
import { SOLOGIX_SIGNATURE_BASE64 } from '../assets/signatureBase64';

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

  // 2. Consignee Details Box
  let y = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(108, 92, 231);
  doc.text('CONSIGNEE / RECIPIENT DETAILS', 18, y + 6);
  doc.text('DISPATCH DESTINATION & PURPOSE', 115, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Receiver / Consignee:`, 18, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.personName || 'Direct Recipient'}`, 52, y + 12);

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
  doc.text('Received By (Authorized Signature)', 145, sigY + 5);

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
 * Determine HSN code from product attributes
 */
export const getHSNCode = (productOrItem) => {
  if (productOrItem?.hsn) return productOrItem.hsn;
  const combined = (
    (productOrItem?.name || '') + ' ' +
    (productOrItem?.productType || '') + ' ' +
    (productOrItem?.category || '') + ' ' +
    (productOrItem?.description || '')
  ).toLowerCase();
  const sku = (productOrItem?.sku || '').toUpperCase();

  if (combined.includes('inverter') || sku.startsWith('OGI') || sku.startsWith('HYB') || sku.startsWith('INV')) return '85044090';
  if (combined.includes('panel') || combined.includes('module') || sku.startsWith('PNL')) return '85414300';
  if (combined.includes('battery') || combined.includes('storage') || sku.startsWith('BAT') || sku.startsWith('ESS') || sku.startsWith('LFP')) return '85072000';
  if (combined.includes('acdb') || combined.includes('dcdb') || combined.includes('msb') || sku.startsWith('ACD') || sku.startsWith('DCD') || sku.startsWith('MSB')) return '85371000';
  if (combined.includes('mcb') || combined.includes('breaker') || sku.startsWith('MCB')) return '85362030';
  if (combined.includes('wire') || combined.includes('cable') || sku.startsWith('WIR')) return '85444999';
  if (combined.includes('structure') || sku.startsWith('STR')) return '73089000';
  if (combined.includes('earthing') || combined.includes('grounding') || sku.startsWith('ETH')) return '85359090';
  if (combined.includes('nut') || combined.includes('bolt') || combined.includes('fastener')) return '73181500';
  return '85044090';
};

/**
 * Export Official Sologix GST Tax Invoice to PDF
 */
export const exportTaxInvoicePdf = (invoice) => {
  if (!invoice || !invoice.items || invoice.items.length === 0) {
    alert('No invoice data available to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Company Logo & Header (Left)
  try {
    if (SOLOGIX_LOGO_BASE64) {
      // Cropped logo has 1.928 : 1 aspect ratio (428x222 px)
      doc.addImage(SOLOGIX_LOGO_BASE64, 'PNG', 14, 10, 31, 16.1);
    }
  } catch (err) {
    console.error('Failed to embed logo in PDF', err);
  }

  const textStartX = 47;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(30, 58, 138); // Navy blue #1e3a8a
  doc.text('Sologix Energy Pvt Ltd', textStartX, 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text('Second Floor, Tower 2, STPI Ranchi, Jharkhand', textStartX, 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('GSTIN/UIN: 20AAZCS9296C1ZT   *   State: Jharkhand, Code: 20', textStartX, 21.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('PAN: AAZCS9296C   *   Tel: +91 82877 66474', textStartX, 25.5);
  doc.text('Email: sales@sologix.com', textStartX, 29.5);

  const driverNameVal = invoice.driverName || invoice.supply?.driverName || '';
  const driverPhoneVal = invoice.driverPhone || invoice.supply?.driverPhone || '';
  const vehicleNoVal = invoice.vehicleNo || invoice.supply?.vehicleNo || '';
  const timeVal = invoice.time || invoice.supply?.dispatchTime || '';

  // Top Right: DELIVERY CHALLAN Badge & Metadata Block (Without Overlap)
  const badgeWidth = 44;
  const badgeHeight = 7;
  const badgeX = pageWidth - 14 - badgeWidth;
  doc.setFillColor(30, 58, 138); // #1e3a8a
  doc.roundedRect(badgeX, 8.5, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DELIVERY CHALLAN', badgeX + badgeWidth / 2, 13, { align: 'center' });

  const metaLabelX = 138;
  doc.setFontSize(7.6);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Challan No:', metaLabelX, 19.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.invoiceNo || 'DC-26-001'}`, pageWidth - 14, 19.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date:', metaLabelX, 24.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.date || formatDate(new Date())}`, pageWidth - 14, 24.0, { align: 'right' });
  if (timeVal) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Time:', metaLabelX, 28.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${timeVal}`, pageWidth - 14, 28.0, { align: 'right' });
  }

  // Divider Line
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(14, 35.5, pageWidth - 14, 35.5);

  // 2. Billed To & Shipped To (Two Side-by-Side Cards)
  const cardY = 38.5;
  const cardWidth = (pageWidth - 28 - 6) / 2;
  const cardHeight = 40;

  const buyerObj = invoice.buyer || {};
  const consigneeObj = invoice.consignee || buyerObj;

  // Left Card: Billed To
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text('BILLED TO (BUYER DETAILS)', 18, cardY + 5.5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${buyerObj.name || 'Authorized Buyer'}`, 18, cardY + 12.0, { maxWidth: cardWidth - 8 });

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${buyerObj.place || 'Jharkhand'}`, 18, cardY + 17.5, { maxWidth: cardWidth - 8 });
  doc.text(`State: ${buyerObj.state || 'Jharkhand'}`, 18, cardY + 23.0);
  if (buyerObj.phone) {
    doc.text(`Phone: ${buyerObj.phone}`, 18, cardY + 28.5);
  }
  if (buyerObj.gstin) {
    doc.text(`GSTIN: ${buyerObj.gstin}`, 18, cardY + 34.0);
  }

  // Right Card: Shipped To
  const rightCardX = 14 + cardWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199);
  doc.text('SHIPPED TO (CONSIGNEE / DELIVERY SITE)', rightCardX + 4, cardY + 5.5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${consigneeObj.name || buyerObj.name || 'Site Consignee'}`, rightCardX + 4, cardY + 12.0, { maxWidth: cardWidth - 8 });

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${consigneeObj.place || buyerObj.place || 'Project Site'}`, rightCardX + 4, cardY + 17.5, { maxWidth: cardWidth - 8 });
  doc.text(`State: ${consigneeObj.state || buyerObj.state || 'Jharkhand'}`, rightCardX + 4, cardY + 23.0);
  if (consigneeObj.phone || buyerObj.phone) {
    doc.text(`Contact: ${consigneeObj.phone || buyerObj.phone}`, rightCardX + 4, cardY + 28.5);
  }
  doc.text(`Place of Supply: ${invoice.supply?.placeOfSupply || consigneeObj.state || 'Jharkhand'}`, rightCardX + 4, cardY + 34.0);

  // 3. Items Table (Delivery Challan - No Pricing)
  const totalUnits = (invoice.items || []).reduce((sum, it) => sum + (parseFloat(it.quantity) || 1), 0);

  const tableRows = (invoice.items || []).map((item, idx) => {
    let desc = item.description || item.name || 'Product Item';
    if (item.brand) {
      desc += `\nBrand: ${item.brand}`;
    }

    const serialsText = (item.serialNumbers && item.serialNumbers.length > 0)
      ? item.serialNumbers.join(', ')
      : '-';

    const qtyNum = parseFloat(item.quantity) || 1;

    return [
      String(idx + 1),
      desc,
      item.itemCode || item.sku || '-',
      item.hsn || getHSNCode(item),
      serialsText,
      `${qtyNum} ${item.unit || 'pcs'}`,
    ];
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 4,
    head: [['#', 'Item Description / Equipment', 'Item Code / SKU', 'HSN Code', 'Product Serial No.', 'Dispatched Qty']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.6,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 32, fontSize: 7.4, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 20, fontSize: 7.4 },
      4: { halign: 'center', cellWidth: 38, fontSize: 7.2 },
      5: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = doc.lastAutoTable.finalY + 4;
  if (finalY > pageHeight - 55) {
    doc.addPage();
    finalY = 16;
  }

  // 4. Bottom Cards: Dispatch Logistics Verification & Dispatch Quantity Summary
  const bottomCardHeight = 40;

  // Left Bottom: Dispatch & Logistics Verification
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, cardWidth, bottomCardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text('DISPATCH & LOGISTICS VERIFICATION', 18, finalY + 5.5);

  const dispValX = 41;
  doc.setFontSize(7.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Vehicle Number:', 18, finalY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`${vehicleNoVal ? vehicleNoVal.toUpperCase() : 'Not Specified'}`, dispValX, finalY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Driver in Charge:', 18, finalY + 17.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const bottomDriver = `${driverNameVal || 'Authorized Driver'}${driverPhoneVal ? ` (Ph: ${driverPhoneVal})` : ''}`.slice(0, 30);
  doc.text(bottomDriver, dispValX, finalY + 17.0);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Carrier / Transport:', 18, finalY + 22.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const carrierVal = (invoice.supply?.transport || 'Road Logistics').slice(0, 28);
  doc.text(carrierVal, dispValX, finalY + 22.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Date & Time:', 18, finalY + 28.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const bottomDateTime = `${invoice.date || formatDate(new Date())}${timeVal ? `  ${timeVal}` : ''}`;
  doc.text(bottomDateTime, dispValX, finalY + 28.0);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Gate Security:', 18, finalY + 33.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('VERIFIED & CLEARED FOR TRANSIT', dispValX, finalY + 33.5);

  // Right Bottom: Dispatch Quantity Summary (Replaces pricing box)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightCardX, finalY, cardWidth, bottomCardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text('DISPATCH QUANTITY SUMMARY', rightCardX + 6, finalY + 5.5);

  doc.setFontSize(7.6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Distinct Items:', rightCardX + 6, finalY + 12.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${(invoice.items || []).length} Products`, pageWidth - 18, finalY + 12.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Gate Security Status:', rightCardX + 6, finalY + 18.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('ISSUED & DISPATCHED', pageWidth - 18, finalY + 18.0, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(rightCardX + 4, finalY + 23.5, pageWidth - 16, finalY + 23.5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL QUANTITY:', rightCardX + 6, finalY + 32.5);
  doc.setTextColor(22, 163, 74); // Green
  doc.setFontSize(11);
  doc.text(`${totalUnits} Units`, pageWidth - 18, finalY + 32.5, { align: 'right' });

  // 5. Official Corporate Declaration & Authorized Signatory Block
  let authY = finalY + bottomCardHeight + 5;
  const authHeight = 31;

  if (authY + authHeight > pageHeight - 12) {
    doc.addPage();
    authY = 16;
  }

  // Left: Official Declaration Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, authY, cardWidth, authHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138); // Deep Navy #1e3a8a
  doc.text('DECLARATION & TERMS OF MOVEMENT', 18, authY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text('We declare that this Delivery Challan represents actual materials dispatched', 18, authY + 11);
  doc.text('from warehouse and that all particulars are true and correct.', 18, authY + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('Computer Generated Delivery Challan * Gate Pass Authorized', 18, authY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Subject to Ranchi Jurisdiction. E.&O.E.', 18, authY + 26);

  // Right: High-Impact Authorized Signatory Box with Official Stamp
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightCardX, authY, cardWidth, authHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // Bold Deep Navy
  doc.text('For Sologix Energy Pvt Ltd', rightCardX + cardWidth / 2, authY + 5.5, { align: 'center' });

  // Embed Official Stamp & Signature Seal
  try {
    if (SOLOGIX_SIGNATURE_BASE64) {
      const stampSize = 17.5;
      const stampX = rightCardX + (cardWidth - stampSize) / 2;
      const stampY = authY + 6.8;
      doc.addImage(SOLOGIX_SIGNATURE_BASE64, 'PNG', stampX, stampY, stampSize, stampSize);
    }
  } catch (err) {
    console.error('Failed to embed signature stamp in PDF', err);
  }

  // Clean Signature Rule
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(rightCardX + 16, authY + 24.5, rightCardX + cardWidth - 16, authY + 24.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42); // Strong Bold Dark Slate
  doc.text('AUTHORIZED SIGNATORY', rightCardX + cardWidth / 2, authY + 28.5, { align: 'center' });

  // Bottom Page Reference
  if (authY + authHeight < pageHeight - 5) {
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Official Sologix Energy System Generated Delivery Challan - Valid for Transit & Gate Security', 14, pageHeight - 4.5);
    doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 4.5, { align: 'right' });
  }

  doc.save(`Delivery_Challan_${invoice.invoiceNo || 'DC'}.pdf`);
};

/**
 * Direct Print Action (Triggers browser print sheet)
 */
export const triggerPrint = () => {
  window.print();
};

