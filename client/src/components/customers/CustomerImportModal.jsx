import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/formatCurrency';
import {
  FiUploadCloud,
  FiFileText,
  FiClipboard,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiTrendingUp,
  FiTrash2,
  FiCheck,
  FiHelpCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Helper to normalize status values
const normalizeStatus = (val) => {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'true' || s === 'yes' || s === 'confirmed' || s === '1' || s === 'booked' || s === 'done') {
    return 'Confirmed';
  }
  if (s === 'false' || s === 'no' || s === 'cancelled' || s === 'lost' || s === 'lost / cancelled' || s === '0') {
    return 'Lost / Cancelled';
  }
  if (s === 'in discussion' || s === 'discussion' || s === 'negotiating') {
    return 'In Discussion';
  }
  return val && String(val).trim() ? String(val).trim() : 'Pending';
};

// Smart column mapping from header text
const findColumnValue = (row, headerNames, fallbackIndex = -1) => {
  if (Array.isArray(row)) {
    if (fallbackIndex >= 0 && fallbackIndex < row.length) {
      return row[fallbackIndex];
    }
    return '';
  }

  // Object keys matching
  const keys = Object.keys(row);
  for (const name of headerNames) {
    const matchedKey = keys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return row[matchedKey];
    }
  }

  // Partial match
  for (const name of headerNames) {
    const matchedKey = keys.find((k) => k.toLowerCase().includes(name.toLowerCase()));
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      return row[matchedKey];
    }
  }

  return '';
};

// Parse row into standard customer item
const mapToCustomerItem = (rawRow, index) => {
  const isArr = Array.isArray(rawRow);

  const rawName = findColumnValue(rawRow, ['customer name', 'customername', 'client name', 'client', 'name'], 0);
  const nameStr = String(rawName || '').trim();

  if (!nameStr) return null;

  // Filter out table headers or accidental note rows
  if (nameStr.toLowerCase().includes('customer name') || nameStr.toLowerCase().includes('client name')) {
    return null;
  }

  // Check if this is an accidental fragment line
  const isFragment =
    nameStr.startsWith('Loan :') ||
    nameStr.startsWith('Baad me') ||
    nameStr.startsWith('To Final') ||
    (nameStr.startsWith('Inka') && nameStr.length < 30) ||
    (nameStr.toLowerCase() === 'but' || nameStr.toLowerCase() === 'no');

  const rawPhone = String(findColumnValue(rawRow, ['contact no', 'contactno', 'phone', 'mobile', 'contact'], 2) || '').trim();
  const rawCapacity = String(findColumnValue(rawRow, ['capacity', 'system capacity', 'kw', 'capacity kw'], 4) || '').trim();

  if (isFragment && !rawPhone && !rawCapacity) {
    return null;
  }

  const rawStatus = findColumnValue(rawRow, ['booking confirmed', 'bookingconfirmed', 'confirmed', 'status', 'booking'], 12);
  const rawBookingAmt = findColumnValue(rawRow, ['booking amount', 'bookingamount', 'advance', 'booking advance', 'token'], 13);
  const rawProjVal = findColumnValue(rawRow, ['project value', 'projectvalue', 'project cost', 'total value', 'value'], 15);

  const cleanNum = (v) => {
    if (typeof v === 'number') return v;
    const s = String(v || '').replace(/[^0-9.-]/g, '');
    return parseFloat(s) || 0;
  };

  return {
    customerName: nameStr,
    address: String(findColumnValue(rawRow, ['address', 'location', 'site address', 'city'], 1) || '').trim(),
    contactNo: rawPhone,
    systemType: String(findColumnValue(rawRow, ['system type', 'systemtype', 'type'], 3) || 'On-Grid').trim(),
    capacity: rawCapacity,
    dateOfVisit: findColumnValue(rawRow, ['date of visit', 'dateofvisit', 'date', 'visit date'], 5) || null,
    timeOfVisit: String(findColumnValue(rawRow, ['time of visit', 'timeofvisit', 'time'], 6) || '').trim(),
    reference: String(findColumnValue(rawRow, ['reference', 'ref', 'source'], 7) || '').trim(),
    bdeEmail: String(findColumnValue(rawRow, ['bde email', 'bdeemail', 'executive email'], 8) || '').trim(),
    bdeName: String(findColumnValue(rawRow, ['bde name', 'bdename', 'bde', 'executive'], 9) || '').trim(),
    comments: String(findColumnValue(rawRow, ['comments', 'remarks', 'notes', 'comment'], 10) || '').trim(),
    uniqueId: String(findColumnValue(rawRow, ['unique id', 'uniqueid', 'id', 'code', 'serial'], 11) || '').trim(),
    bookingConfirmed: normalizeStatus(rawStatus),
    bookingAmount: cleanNum(rawBookingAmt),
    modeOfPayment: String(findColumnValue(rawRow, ['mode of payment', 'modeofpayment', 'payment mode', 'mode'], 14) || 'UPI').trim(),
    projectValue: cleanNum(rawProjVal),
    addOn1: String(findColumnValue(rawRow, ['add on 1', 'addon1', 'add-on 1'], 16) || '').trim(),
    addOn2: String(findColumnValue(rawRow, ['add on 2', 'addon2', 'add-on 2'], 17) || '').trim(),
    addOn3: String(findColumnValue(rawRow, ['add on 3', 'addon3', 'add-on 3'], 18) || '').trim(),
  };
};

const CustomerImportModal = ({ isOpen, onClose, onImport, loading = false }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [previewItems, setPreviewItems] = useState([]);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef(null);

  // Parse Excel file (.xlsx, .xls, .csv)
  const processExcelFile = async (file) => {
    try {
      setParseError('');
      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to json array of objects
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        setParseError('The selected file appears to be empty.');
        setPreviewItems([]);
        return;
      }

      const parsedItems = [];
      jsonData.forEach((row, idx) => {
        const item = mapToCustomerItem(row, idx);
        if (item) {
          parsedItems.push(item);
        }
      });

      if (parsedItems.length === 0) {
        setParseError('No valid customer records found. Please ensure the file has a "Customer Name" column.');
        setPreviewItems([]);
      } else {
        setPreviewItems(parsedItems);
        toast.success(`Extracted ${parsedItems.length} records from ${file.name}`);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setParseError('Failed to parse file: ' + (err.message || 'Unknown format'));
      setPreviewItems([]);
    }
  };

  // Quote-aware CSV & TSV parser for Copy-Paste
  const processPastedText = (rawText) => {
    try {
      setParseError('');
      setPasteText(rawText);

      if (!rawText.trim()) {
        setPreviewItems([]);
        return;
      }

      const rows = [];
      let currentRow = [];
      let currentCell = '';
      let inQuotes = false;

      const firstLine = rawText.split(/\r?\n/)[0] || '';
      const delimiter = firstLine.includes('\t') ? '\t' : ',';

      for (let i = 0; i < rawText.length; i++) {
        const char = rawText[i];
        const nextChar = rawText[i + 1];

        if (char === '"' || char === "'") {
          if (inQuotes && nextChar === char) {
            currentCell += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') i++;
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }

      if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
      }

      const parsedItems = [];
      rows.forEach((row, idx) => {
        const item = mapToCustomerItem(row, idx);
        if (item) {
          parsedItems.push(item);
        }
      });

      if (parsedItems.length === 0) {
        setParseError('No valid customer records recognized. Please paste valid spreadsheet rows.');
        setPreviewItems([]);
      } else {
        setPreviewItems(parsedItems);
      }
    } catch (err) {
      setParseError('Failed to parse pasted text: ' + err.message);
      setPreviewItems([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleReset = () => {
    setFileName('');
    setPasteText('');
    setPreviewItems([]);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (previewItems.length === 0) {
      toast.error('No valid records to import');
      return;
    }
    await onImport(previewItems);
    handleReset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Customer & BD Data"
      subtitle="Extract customer details directly from Excel files (.xlsx, .xls, .csv) or paste spreadsheet rows"
      maxWidth="900px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '4px',
            gap: '6px',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              handleReset();
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'upload' ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'upload' ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FiUploadCloud size={18} /> Direct Excel File Upload (.xlsx, .xls, .csv)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('paste');
              handleReset();
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'paste' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'paste' ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'paste' ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FiClipboard size={18} /> Copy-Paste Spreadsheet Text
          </button>
        </div>

        {/* Tab 1: Upload Excel File */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary-light)' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(108, 92, 231, 0.05)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(108, 92, 231, 0.12)',
                  color: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <FiUploadCloud size={28} />
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {fileName ? `Selected: ${fileName}` : 'Click to Browse or Drag & Drop Excel File'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Supports Microsoft Excel (<strong>.xlsx, .xls</strong>) and <strong>.csv</strong> spreadsheets
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Copy-Paste Textarea */}
        {activeTab === 'paste' && (
          <div>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => processPastedText(e.target.value)}
              placeholder="Copy rows from Google Sheets or Excel and paste them here (Ctrl+V)..."
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Error message */}
        {parseError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiAlertCircle size={18} /> {parseError}
          </div>
        )}

        {/* Live Extracted Preview */}
        {previewItems.length > 0 && (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              backgroundColor: 'var(--surface)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--success)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ {previewItems.length} Valid Records Ready
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Review live extracted customer data before importing
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiTrash2 size={12} /> Clear Data
              </button>
            </div>

            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>#</th>
                    <th style={{ padding: '8px 12px' }}>Customer Name</th>
                    <th style={{ padding: '8px 12px' }}>Contact</th>
                    <th style={{ padding: '8px 12px' }}>System</th>
                    <th style={{ padding: '8px 12px' }}>Capacity</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Booking Amount</th>
                    <th style={{ padding: '8px 12px' }}>Project Value</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.slice(0, 15).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.customerName}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.contactNo || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{item.systemType || 'On-Grid'}</td>
                      <td style={{ padding: '8px 12px' }}>{item.capacity || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: item.bookingConfirmed === 'Confirmed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: item.bookingConfirmed === 'Confirmed' ? 'var(--success)' : '#f59e0b',
                          }}
                        >
                          {item.bookingConfirmed}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--success)' }}>
                        {formatCurrency(item.bookingAmount)}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.projectValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewItems.length > 15 && (
                <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  ... and {previewItems.length - 15} more records ready to be imported
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={FiCheck}
            onClick={handleConfirmImport}
            disabled={previewItems.length === 0}
            loading={loading}
          >
            {previewItems.length > 0 ? `Confirm & Import ${previewItems.length} Customers` : 'Import Customers'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerImportModal;
