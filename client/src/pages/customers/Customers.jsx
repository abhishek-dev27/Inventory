import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiDownload,
  FiUpload,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiZap,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiMail,
  FiArrowUpRight,
  FiRefreshCw,
  FiTrendingUp,
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import CustomerImportModal from '../../components/customers/CustomerImportModal';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatDateTime, getFinancialYear, getFinancialYearsList } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const SYSTEM_TYPES = [
  'On-Grid',
  'Hybrid',
  'Off-Grid',
  'Commercial Rooftop',
  'Residential Rooftop',
  'Ground Mount Solar',
  'Solar Water Pump',
  'Micro-Inverter System',
];

const BOOKING_STATUSES = [
  { value: 'Confirmed', label: 'Confirmed / Booked', color: 'var(--success)' },
  { value: 'Pending', label: 'Pending / Follow-up', color: '#f59e0b' },
  { value: 'In Discussion', label: 'In Discussion', color: 'var(--primary-light)' },
  { value: 'Lost / Cancelled', label: 'Lost / Cancelled', color: 'var(--danger)' },
];

const PAYMENT_MODES = ['UPI', 'NEFT / RTGS', 'Cheque', 'Cash', 'Net Banking', 'Credit / Debit Card'];

const Customers = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Data & State
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalConfirmed: 0,
    totalPending: 0,
    totalBookingAmount: 0,
    totalProjectValue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');
  const [fyFilter, setFyFilter] = useState('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const initialForm = {
    customerName: '',
    address: '',
    contactNo: '',
    systemType: 'On-Grid',
    capacity: '',
    dateOfVisit: new Date().toISOString().slice(0, 10),
    timeOfVisit: '10:00 AM',
    reference: '',
    bdeEmail: user?.email || '',
    bdeName: user?.name || '',
    comments: '',
    uniqueId: '',
    bookingConfirmed: 'Confirmed',
    bookingAmount: '',
    modeOfPayment: 'UPI',
    projectValue: '',
    addOn1: '',
    addOn2: '',
    addOn3: '',
    financialYear: getFinancialYear(new Date()),
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // Import State
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);

  const availableFYs = useMemo(() => getFinancialYearsList(5, 2), []);

  // Helper to auto-generate sequential unique ID
  const generateCustomerUniqueId = (fy, currentList = customers) => {
    const targetFY = fy || getFinancialYear(new Date());
    const matching = (currentList || []).filter(
      (c) => c.uniqueId && c.uniqueId.startsWith(`BD/${targetFY}/`)
    );
    let maxSeq = 0;
    matching.forEach((c) => {
      const parts = (c.uniqueId || '').split('/');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    // If no matching BD/ prefix found, check total count in FY
    if (maxSeq === 0) {
      const countInFY = (currentList || []).filter((c) => c.financialYear === targetFY).length;
      maxSeq = countInFY;
    }
    return `BD/${targetFY}/${String(maxSeq + 1).padStart(4, '0')}`;
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        systemType: systemFilter !== 'all' ? systemFilter : undefined,
        financialYear: fyFilter !== 'all' ? fyFilter : undefined,
        limit: 300,
      });

      setCustomers(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      toast.error('Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, systemFilter, fyFilter]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    const curFY = getFinancialYear(new Date());
    const autoId = generateCustomerUniqueId(curFY, customers);
    setFormData({
      ...initialForm,
      uniqueId: autoId,
      bdeEmail: user?.email || '',
      bdeName: user?.name || '',
      financialYear: curFY,
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cust) => {
    setIsEditing(true);
    setSelectedCustomer(cust);
    setFormData({
      customerName: cust.customerName || '',
      address: cust.address || '',
      contactNo: cust.contactNo || '',
      systemType: cust.systemType || 'On-Grid',
      capacity: cust.capacity || '',
      dateOfVisit: cust.dateOfVisit || '',
      timeOfVisit: cust.timeOfVisit || '',
      reference: cust.reference || '',
      bdeEmail: cust.bdeEmail || '',
      bdeName: cust.bdeName || '',
      comments: cust.comments || '',
      uniqueId: cust.uniqueId || '',
      bookingConfirmed: cust.bookingConfirmed || 'Pending',
      bookingAmount: cust.bookingAmount || '',
      modeOfPayment: cust.modeOfPayment || 'UPI',
      projectValue: cust.projectValue || '',
      addOn1: cust.addOn1 || '',
      addOn2: cust.addOn2 || '',
      addOn3: cust.addOn3 || '',
      financialYear: cust.financialYear || getFinancialYear(cust.dateOfVisit || new Date()),
    });
    setIsAddEditModalOpen(true);
  };

  // Save / Submit Customer
  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && selectedCustomer) {
        await customerService.update(selectedCustomer.id, formData);
        toast.success('Customer details updated successfully');
      } else {
        await customerService.create(formData);
        toast.success('New customer created successfully');
      }
      setIsAddEditModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      setSubmitting(true);
      await customerService.delete(selectedCustomer.id);
      toast.success('Customer record deleted');
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Dispatch Stock Out to this customer
  const handleCreateDispatch = (cust) => {
    // Navigate to stock out and pass state
    navigate('/stock/out', {
      state: {
        prefillCustomer: {
          personName: cust.customerName,
          place: cust.address,
          reason: `Project Dispatch - ${cust.systemType || 'Solar'} (${cust.capacity || 'N/A'})`,
          referenceNo: cust.uniqueId ? `DISP/${cust.uniqueId}` : undefined,
        },
      },
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }

    const headers = [
      'Customer Name',
      'Unique ID',
      'Contact No.',
      'Address',
      'System Type',
      'Capacity',
      'Date of Visit',
      'Time of Visit',
      'Reference',
      'BDE Name',
      'BDE Email',
      'Booking Confirmed',
      'Booking Amount',
      'Mode of Payment',
      'Project Value',
      'Add-on 1',
      'Add-on 2',
      'Add-on 3',
      'Comments',
    ];

    const rows = customers.map((c) => [
      `"${c.customerName || ''}"`,
      `"${c.uniqueId || ''}"`,
      `"${c.contactNo || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.systemType || ''}"`,
      `"${c.capacity || ''}"`,
      `"${c.dateOfVisit || ''}"`,
      `"${c.timeOfVisit || ''}"`,
      `"${c.reference || ''}"`,
      `"${c.bdeName || ''}"`,
      `"${c.bdeEmail || ''}"`,
      `"${c.bookingConfirmed || ''}"`,
      c.bookingAmount || 0,
      `"${c.modeOfPayment || ''}"`,
      c.projectValue || 0,
      `"${c.addOn1 || ''}"`,
      `"${c.addOn2 || ''}"`,
      `"${c.addOn3 || ''}"`,
      `"${(c.comments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BD_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customer data exported as CSV');
  };

  // Quote-aware CSV & TSV parser that preserves newlines inside quoted cells
  const parseSpreadsheetText = (rawText) => {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    // Auto-detect delimiter based on first line
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
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
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

    return rows;
  };

  // Bulk Import Parser with Quote & Data Integrity Protection
  const handleBulkImport = async () => {
    if (!pasteData.trim()) {
      toast.error('Please paste table or CSV data from Google Sheet');
      return;
    }

    try {
      setImporting(true);
      const matrix = parseSpreadsheetText(pasteData.trim());
      const items = [];

      matrix.forEach((cols) => {
        const rawName = (cols[0] || '').trim();
        if (!rawName) return;

        // Skip header if matches
        if (rawName.toLowerCase().includes('customer name') || rawName.toLowerCase().includes('client name')) return;

        // Skip dangling fragment lines
        const hasOtherData = cols.slice(1).some((c) => (c || '').trim().length > 0);
        if (!hasOtherData && (rawName.startsWith('Loan') || rawName.startsWith('Baad') || rawName.startsWith('To Final') || rawName.startsWith('Inka') || rawName.startsWith('But'))) {
          return;
        }

        const rawConfirmed = (cols[12] || '').trim().toLowerCase();
        let normalizedConfirmed = 'Confirmed';
        if (rawConfirmed === 'false' || rawConfirmed === 'no' || rawConfirmed === 'lost' || rawConfirmed === 'cancelled' || rawConfirmed === 'lost / cancelled' || rawConfirmed === '0') {
          normalizedConfirmed = 'Lost / Cancelled';
        } else if (rawConfirmed === 'in discussion' || rawConfirmed === 'discussion') {
          normalizedConfirmed = 'In Discussion';
        } else if (rawConfirmed === 'pending') {
          normalizedConfirmed = 'Pending';
        }

        items.push({
          customerName: rawName,
          address: cols[1] || '',
          contactNo: cols[2] || '',
          systemType: cols[3] || 'On-Grid',
          capacity: cols[4] || '',
          dateOfVisit: cols[5] || null,
          timeOfVisit: cols[6] || '',
          reference: cols[7] || '',
          bdeEmail: cols[8] || '',
          bdeName: cols[9] || '',
          comments: cols[10] || '',
          uniqueId: cols[11] || '',
          bookingConfirmed: normalizedConfirmed,
          bookingAmount: parseFloat(String(cols[13] || '').replace(/[^0-9.-]/g, '')) || 0,
          modeOfPayment: cols[14] || 'UPI',
          projectValue: parseFloat(String(cols[15] || '').replace(/[^0-9.-]/g, '')) || 0,
          addOn1: cols[16] || '',
          addOn2: cols[17] || '',
          addOn3: cols[18] || '',
        });
      });

      if (items.length === 0) {
        toast.error('No valid customer rows found in pasted text');
        return;
      }

      const res = await customerService.bulkImport(items);
      toast.success(res.message || `Successfully imported ${items.length} customers`);
      setIsImportModalOpen(false);
      setPasteData('');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import customers');
    } finally {
      setImporting(false);
    }
  };

  // Helper for Status Badge with automatic TRUE/FALSE conversion
  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    let bg = 'rgba(245, 158, 11, 0.12)';
    let color = '#f59e0b';
    let icon = FiAlertCircle;
    let label = status || 'Pending';

    if (s === 'confirmed' || s === 'true' || s === 'yes' || s === 'booked' || s === 'done' || s === '1') {
      bg = 'rgba(16, 185, 129, 0.12)';
      color = 'var(--success)';
      icon = FiCheckCircle;
      label = 'Confirmed';
    } else if (s === 'lost / cancelled' || s === 'false' || s === 'no' || s === 'cancelled' || s === 'lost' || s === '0') {
      bg = 'rgba(239, 68, 68, 0.12)';
      color = 'var(--danger)';
      icon = FiXCircle;
      label = 'Lost / Cancelled';
    } else if (s === 'in discussion' || s === 'discussion') {
      bg = 'rgba(108, 92, 231, 0.12)';
      color = 'var(--primary-light)';
      icon = FiTrendingUp;
      label = 'In Discussion';
    }

    const IconComponent = icon;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '12px',
          backgroundColor: bg,
          color: color,
          fontSize: '0.75rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        <IconComponent size={12} />
        {label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Customer Details & BD Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Manage client profiles, solar project capacities, BD site visits, and booking financials
          </p>
        </div>

        <div className="mobile-full-width-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={FiUpload} onClick={() => setIsImportModalOpen(true)}>
            Import Sheet
          </Button>
          <Button variant="secondary" icon={FiDownload} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAdd}>
            + Add Customer
          </Button>
        </div>
      </div>

      {/* 2. STATS & KPI METRICS CARDS */}
      <div className="stats-grid">
        {/* Total Leads */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(108, 92, 231, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
            }}
          >
            <FiUsers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total BD Customers
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {stats.totalLeads}
            </h3>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
            }}
          >
            <FiCheckCircle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Confirmed Bookings
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {stats.conversionRate}% Win
              </span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {stats.totalConfirmed}
            </h3>
          </div>
        </div>

        {/* Booking Amount Collected */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <FiDollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Booking Amount Collected
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {formatCurrency(stats.totalBookingAmount)}
            </h3>
          </div>
        </div>

        {/* Total Project Pipeline */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <FiTrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Project Pipeline
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {formatCurrency(stats.totalProjectValue)}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <div className="responsive-filter-toolbar">
        {/* Search */}
        <div className="search-box">
          <Input
            icon={FiSearch}
            placeholder="Search by customer name, unique ID, phone, site address, BDE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="filters-group">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Booking Statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* System Type Filter */}
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All System Types</option>
            {SYSTEM_TYPES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Financial Year Filter */}
          <select
            value={fyFilter}
            onChange={(e) => setFyFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Financial Years</option>
            {availableFYs.map((fy) => (
              <option key={fy} value={fy}>
                FY {fy}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            icon={FiRefreshCw}
            onClick={fetchCustomers}
            title="Refresh list"
            style={{ padding: '10px 12px' }}
          />
        </div>
      </div>

      {/* 4. CUSTOMERS TABLE */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 0' }}>
            <Loader message="Loading customer directory..." />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="No Customers Found"
            message={search || statusFilter !== 'all' ? 'Try adjusting your search filters.' : 'Get started by adding your first customer or importing from sheet.'}
            actionLabel="Add Customer"
            onAction={handleOpenAdd}
          />
        ) : (
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                textAlign: 'left',
                fontSize: '0.85rem',
                minWidth: '2050px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}
                >
                  <th
                    className="sticky-left-column"
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Customer & ID
                  </th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Contact No.</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', minWidth: '180px' }}>Address / Site</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>System Type</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Capacity</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Date of Visit</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Time of Visit</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Reference</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>BDE Email</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>BDE Name</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', minWidth: '180px' }}>Comments</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Booking Confirmed</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Booking Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Mode of Payment</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Project Value</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Add-on 1</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Add-on 2</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Add-on 3</th>
                  <th
                    className="sticky-right-actions"
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      backgroundColor: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, index) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      const tds = e.currentTarget.querySelectorAll('td');
                      tds.forEach((td) => (td.style.backgroundColor = 'var(--surface-hover)'));
                    }}
                    onMouseLeave={(e) => {
                      const tds = e.currentTarget.querySelectorAll('td');
                      tds.forEach((td) => (td.style.backgroundColor = 'var(--surface)'));
                    }}
                  >
                    {/* Sticky Customer & Unique ID */}
                    <td
                      className="sticky-left-column"
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--surface)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: 'var(--text-muted)',
                              backgroundColor: 'var(--bg-secondary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            #{index + 1}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                            {c.customerName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                            {c.uniqueId || '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Contact No. */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.contactNo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <FiPhone size={12} color="var(--primary-light)" />
                          <span>{c.contactNo}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* 4. Address */}
                    <td
                      style={{
                        padding: '14px 16px',
                        color: 'var(--text-secondary)',
                        maxWidth: '240px',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                      }}
                    >
                      {c.address ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                          <FiMapPin size={13} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.address}>
                            {c.address}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* 5. System Type */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                        }}
                      >
                        {c.systemType || 'On-Grid'}
                      </span>
                    </td>

                    {/* 6. Capacity */}
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.capacity || '—'}
                    </td>

                    {/* 7. Date of Visit */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.dateOfVisit ? formatDate(c.dateOfVisit) : '—'}
                    </td>

                    {/* 8. Time of Visit */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.timeOfVisit || '—'}
                    </td>

                    {/* 9. Reference */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.reference || '—'}
                    </td>

                    {/* 10. BDE Email */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.bdeEmail || '—'}
                    </td>

                    {/* 11. BDE Name */}
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.bdeName || '—'}
                    </td>

                    {/* 12. Comments */}
                    <td
                      style={{
                        padding: '14px 16px',
                        color: 'var(--text-secondary)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                      }}
                      title={c.comments}
                    >
                      {c.comments || '—'}
                    </td>

                    {/* 13. Booking Confirmed */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {renderStatusBadge(c.bookingConfirmed)}
                    </td>

                    {/* 14. Booking Amount */}
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(c.bookingAmount)}
                    </td>

                    {/* 15. Mode of Payment */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.modeOfPayment || '—'}
                    </td>

                    {/* 16. Project Value */}
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(c.projectValue)}
                    </td>

                    {/* 17. Add-on 1 */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.addOn1 || '—'}
                    </td>

                    {/* 18. Add-on 2 */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.addOn2 || '—'}
                    </td>

                    {/* 19. Add-on 3 */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', whiteSpace: 'nowrap' }}>
                      {c.addOn3 || '—'}
                    </td>

                    {/* 20. Actions */}
                    <td
                      className="sticky-right-actions"
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        backgroundColor: 'var(--surface)',
                        borderBottom: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Dispatch Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={FiArrowUpRight}
                          onClick={() => handleCreateDispatch(c)}
                          title="Generate Stock Out / Dispatch for this customer"
                          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                        >
                          Dispatch
                        </Button>

                        {/* View 360 */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsDetailModalOpen(true);
                          }}
                          title="View 360° Profile"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '5px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <FiEye size={15} />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '5px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <FiEdit2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Customer"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '5px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== MODAL: ADD / EDIT CUSTOMER ===================== */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={isEditing ? 'Edit Customer & Project Particulars' : 'Add New Customer (BD Update)'}
        subtitle="Register customer details, system capacity, site location, and commercials"
        maxWidth="850px"
      >
        <form onSubmit={handleSubmitCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: CUSTOMER & SITE LOCATION */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FiUser size={16} color="var(--primary-light)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                1. Customer & Site Particulars
              </h4>
            </div>

            <div className="form-grid">
              <Input
                label="Customer / Client Name"
                placeholder="e.g. Rajesh Sharma"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />

              <Input
                label="Contact Number"
                placeholder="e.g. +91 98765 43210"
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                icon={FiPhone}
              />

              <div className="full-width">
                <Input
                  label="Place / Project Site / Installation Address"
                  placeholder="e.g. Plot 104, RIICO Industrial Area, Mansarovar, Jaipur"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  icon={FiMapPin}
                />
              </div>

              <Input
                label="Reference / Lead Source"
                placeholder="e.g. Direct Referral / Architect / Website"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />

              <Input
                label="Unique ID / BD Code"
                placeholder="e.g. BD/2026-27/0001 (auto-generated if blank)"
                value={formData.uniqueId}
                onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 2: SYSTEM TYPE & TECHNICAL CAPACITY */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FiZap size={16} color="#3b82f6" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                2. Solar Technical Specifications
              </h4>
            </div>

            <div className="form-grid">
              <Input
                as="select"
                label="System Type"
                value={formData.systemType}
                onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
              >
                {SYSTEM_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Input>

              <Input
                label="System Capacity (kW / HP)"
                placeholder="e.g. 10kW or 50kW Rooftop"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />

              <Input
                label="Add-on 1"
                placeholder="e.g. 10kWh Lithium Battery / Smart Meter"
                value={formData.addOn1}
                onChange={(e) => setFormData({ ...formData, addOn1: e.target.value })}
              />

              <Input
                label="Add-on 2"
                placeholder="e.g. Elevated Structure / 10-Yr Warranty"
                value={formData.addOn2}
                onChange={(e) => setFormData({ ...formData, addOn2: e.target.value })}
              />

              <Input
                label="Add-on 3"
                placeholder="e.g. Inverter Monitoring / Surge Protection / AMC"
                value={formData.addOn3}
                onChange={(e) => setFormData({ ...formData, addOn3: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 3: BD & SITE VISIT PARTICULARS */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FiCalendar size={16} color="#f59e0b" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                3. Business Development & Visit Details
              </h4>
            </div>

            <div className="form-grid">
              <Input
                label="BDE Executive Name"
                placeholder="e.g. Abhishek Kumar"
                value={formData.bdeName}
                onChange={(e) => setFormData({ ...formData, bdeName: e.target.value })}
              />

              <Input
                label="BDE Email Address"
                placeholder="e.g. bde@company.com"
                value={formData.bdeEmail}
                onChange={(e) => setFormData({ ...formData, bdeEmail: e.target.value })}
                icon={FiMail}
              />

              <Input
                label="Date of Visit"
                type="date"
                value={formData.dateOfVisit}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    dateOfVisit: val,
                    financialYear: getFinancialYear(val),
                  });
                }}
              />

              <Input
                label="Time of Visit"
                placeholder="e.g. 11:30 AM"
                value={formData.timeOfVisit}
                onChange={(e) => setFormData({ ...formData, timeOfVisit: e.target.value })}
                icon={FiClock}
              />
            </div>
          </div>

          {/* SECTION 4: COMMERCIALS & BOOKING */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FiDollarSign size={16} color="var(--success)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                4. Commercials & Booking Details
              </h4>
            </div>

            <div className="form-grid">
              <Input
                as="select"
                label="Booking Confirmed"
                value={formData.bookingConfirmed}
                onChange={(e) => setFormData({ ...formData, bookingConfirmed: e.target.value })}
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Input>

              <Input
                as="select"
                label="Mode of Payment"
                value={formData.modeOfPayment}
                onChange={(e) => setFormData({ ...formData, modeOfPayment: e.target.value })}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Input>

              <Input
                label="Booking Amount (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={formData.bookingAmount}
                onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
              />

              <Input
                label="Total Project Value (₹)"
                type="number"
                placeholder="e.g. 450000"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
              />

              <div className="full-width">
                <Input
                  as="textarea"
                  label="Comments / Discussion Notes"
                  placeholder="Roof structure conditions, grid synchronization remarks, payment terms..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsAddEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: 360° CUSTOMER PROFILE ===================== */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedCustomer.customerName}
          subtitle={`Unique ID: ${selectedCustomer.uniqueId || 'N/A'} • FY: ${selectedCustomer.financialYear || '—'}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Top Badge Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ marginTop: '2px' }}>{renderStatusBadge(selectedCustomer.bookingConfirmed)}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Capacity</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedCustomer.systemType} ({selectedCustomer.capacity || 'N/A'})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project Value</span>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatCurrency(selectedCustomer.projectValue)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Amount</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                  {formatCurrency(selectedCustomer.bookingAmount)}
                </div>
              </div>
            </div>

            {/* Contact & Location Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Contact</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiPhone size={14} color="var(--primary-light)" />
                  {selectedCustomer.contactNo || '—'}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lead Reference</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedCustomer.reference || 'Direct'}
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Installation / Site Address
              </span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <FiMapPin size={15} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                {selectedCustomer.address || 'No address provided'}
              </div>
            </div>

            {/* BD Particulars */}
            <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Business Development Executive & Site Visit
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCustomer.bdeName || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCustomer.bdeEmail || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedCustomer.dateOfVisit ? formatDate(selectedCustomer.dateOfVisit) : '—'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedCustomer.timeOfVisit || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Add-ons & Comments */}
            {(selectedCustomer.addOn1 || selectedCustomer.addOn2 || selectedCustomer.addOn3 || selectedCustomer.comments) && (
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                {selectedCustomer.addOn1 && (
                  <div style={{ fontSize: '0.8125rem', marginBottom: '4px' }}>
                    <strong>Add-on 1:</strong> {selectedCustomer.addOn1}
                  </div>
                )}
                {selectedCustomer.addOn2 && (
                  <div style={{ fontSize: '0.8125rem', marginBottom: '4px' }}>
                    <strong>Add-on 2:</strong> {selectedCustomer.addOn2}
                  </div>
                )}
                {selectedCustomer.addOn3 && (
                  <div style={{ fontSize: '0.8125rem', marginBottom: '4px' }}>
                    <strong>Add-on 3:</strong> {selectedCustomer.addOn3}
                  </div>
                )}
                {selectedCustomer.comments && (
                  <div style={{ fontSize: '0.8125rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                    <strong>Remarks:</strong> {selectedCustomer.comments}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <Button
                variant="primary"
                icon={FiArrowUpRight}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleCreateDispatch(selectedCustomer);
                }}
              >
                Create Stock Outward Dispatch
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  icon={FiEdit2}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedCustomer);
                  }}
                >
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== MODAL: BULK IMPORT FROM EXCEL & GOOGLE SHEET ===================== */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={async (items) => {
          setImporting(true);
          try {
            const res = await customerService.bulkImport(items);
            toast.success(res.message || `Successfully imported ${items.length} customers`);
            setIsImportModalOpen(false);
            fetchCustomers();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to import customers');
          } finally {
            setImporting(false);
          }
        }}
        loading={importing}
      />

      {/* ===================== MODAL: DELETE CONFIRMATION ===================== */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Customer Record"
        maxWidth="450px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to delete customer{' '}
            <strong>{selectedCustomer?.customerName}</strong> ({selectedCustomer?.uniqueId})? This action cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={FiTrash2} onClick={handleDeleteCustomer} loading={submitting}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
