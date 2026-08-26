import React, { useState, useEffect, useMemo } from 'react';
import {
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiPlus,
  FiDownload,
  FiUploadCloud,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCreditCard,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiActivity,
  FiRepeat,
} from 'react-icons/fi';
import { LuIndianRupee } from 'react-icons/lu';
import { accountService } from '../../services/accountService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, getFinancialYear, getFinancialYearsList } from '../../utils/formatDate';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import CustomerPaymentPendingCard from '../../components/dashboard/CustomerPaymentPendingCard';
import ProjectPerformanceAndNPMCard from '../../components/dashboard/ProjectPerformanceAndNPMCard';
import toast from 'react-hot-toast';

export const WORK_STATUSES = [
  { value: 'Not Started', label: 'Not Started (0%)', percent: 0, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { value: 'Material Delivery', label: 'Material Delivery (20%)', percent: 20, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'Civil Work', label: 'Civil Work (40%)', percent: 40, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'Electrical Work', label: 'Electrical Work (70%)', percent: 70, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'Testing', label: 'Testing (90%)', percent: 90, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  { value: 'Handover', label: 'Handover (100%)', percent: 100, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
];

export const PAYMENT_MODES = ['UPI', 'NEFT / RTGS', 'Cheque', 'Cash', 'Net Banking', 'Bank Transfer'];

export const RECURRING_FREQUENCIES = [
  { value: 'Monthly', label: 'Monthly (EMI / Maintenance)' },
  { value: 'Quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'Half-Yearly', label: 'Half-Yearly (Every 6 Months)' },
  { value: 'Annual', label: 'Annual (Yearly AMC)' },
];

const Accounts = () => {
  const { user } = useAuth();

  // Data & Loading States
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalProjectValue: 0,
    totalCollected: 0,
    totalRemaining: 0,
    totalCompletedProjects: 0,
    avgCompletion: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fyFilter, setFyFilter] = useState('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQuickPayModalOpen, setIsQuickPayModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const initialForm = {
    uniqueId: '',
    customerName: '',
    contactNo: '',
    address: '',
    bookingAmount: '',
    modeOfPayment: 'UPI',
    projectValue: '',
    statusOfWork: 'Not Started',
    completionPercentage: 0,
    payment1Amount: '',
    payment1Date: '',
    payment1Mode: 'UPI',
    payment2Amount: '',
    payment2Date: '',
    payment2Mode: 'UPI',
    payment3Amount: '',
    payment3Date: '',
    payment3Mode: 'UPI',
    payment4Amount: '',
    payment4Date: '',
    payment4Mode: 'UPI',
    payment5Amount: '',
    payment5Date: '',
    payment5Mode: 'UPI',
    paymentDueDate: '',
    // Recurring Payment Fields
    isRecurring: false,
    recurringFrequency: 'Monthly',
    recurringAmount: '',
    recurringStartDate: '',
    recurringNextDueDate: '',
    recurringTotalCycles: 12,
    recurringCompletedCycles: 0,
    recurringStatus: 'Active',
    financialYear: getFinancialYear(new Date()),
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // Quick Payment Form State
  const [quickPayData, setQuickPayData] = useState({
    milestone: '1',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    mode: 'UPI',
  });

  // Recurring Payment Installment Record State
  const [recurringPayData, setRecurringPayData] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    mode: 'UPI',
  });

  // Import State
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const availableFYs = useMemo(() => getFinancialYearsList(5, 2), []);

  // Helper to auto-generate sequential unique ID for accounts
  const generateAccountUniqueId = (fy, currentList = accounts) => {
    const targetFY = fy || getFinancialYear(new Date());
    const matching = (currentList || []).filter(
      (a) => a.uniqueId && (a.uniqueId.startsWith(`ACC/${targetFY}/`) || a.uniqueId.startsWith(`BD/${targetFY}/`))
    );
    let maxSeq = 0;
    matching.forEach((a) => {
      const parts = (a.uniqueId || '').split('/');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    if (maxSeq === 0) {
      const countInFY = (currentList || []).filter((a) => a.financialYear === targetFY).length;
      maxSeq = countInFY;
    }
    return `ACC/${targetFY}/${String(maxSeq + 1).padStart(4, '0')}`;
  };

  // Fetch Accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountService.getAll({
        search: search.trim() || undefined,
        statusOfWork: statusFilter !== 'all' ? statusFilter : undefined,
        financialYear: fyFilter !== 'all' ? fyFilter : undefined,
        limit: 300,
      });

      setAccounts(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, fyFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAccounts();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Real-time remaining balance calculation in form
  const computedFormRemaining = useMemo(() => {
    const pVal = parseFloat(formData.projectValue) || 0;
    const bAmt = parseFloat(formData.bookingAmount) || 0;
    const p1 = parseFloat(formData.payment1Amount) || 0;
    const p2 = parseFloat(formData.payment2Amount) || 0;
    const p3 = parseFloat(formData.payment3Amount) || 0;
    const p4 = parseFloat(formData.payment4Amount) || 0;
    const p5 = parseFloat(formData.payment5Amount) || 0;
    const totalRec = bAmt + p1 + p2 + p3 + p4 + p5;
    return {
      totalRec,
      remaining: Math.max(0, pVal - totalRec),
    };
  }, [formData]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    const curFY = getFinancialYear(new Date());
    const autoId = generateAccountUniqueId(curFY, accounts);
    setFormData({
      ...initialForm,
      uniqueId: autoId,
      financialYear: curFY,
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (acc) => {
    setIsEditing(true);
    setSelectedAccount(acc);
    setFormData({
      uniqueId: acc.uniqueId || '',
      customerName: acc.customerName || '',
      contactNo: acc.contactNo || '',
      address: acc.address || '',
      bookingAmount: acc.bookingAmount || '',
      modeOfPayment: acc.modeOfPayment || 'UPI',
      projectValue: acc.projectValue || '',
      statusOfWork: acc.statusOfWork || 'Not Started',
      completionPercentage: acc.completionPercentage || 0,
      payment1Amount: acc.payment1Amount || '',
      payment1Date: acc.payment1Date || '',
      payment1Mode: acc.payment1Mode || 'UPI',
      payment2Amount: acc.payment2Amount || '',
      payment2Date: acc.payment2Date || '',
      payment2Mode: acc.payment2Mode || 'UPI',
      payment3Amount: acc.payment3Amount || '',
      payment3Date: acc.payment3Date || '',
      payment3Mode: acc.payment3Mode || 'UPI',
      payment4Amount: acc.payment4Amount || '',
      payment4Date: acc.payment4Date || '',
      payment4Mode: acc.payment4Mode || 'UPI',
      payment5Amount: acc.payment5Amount || '',
      payment5Date: acc.payment5Date || '',
      payment5Mode: acc.payment5Mode || 'UPI',
      paymentDueDate: acc.paymentDueDate || '',
      // Recurring Fields
      isRecurring: Boolean(acc.isRecurring),
      recurringFrequency: acc.recurringFrequency || 'Monthly',
      recurringAmount: acc.recurringAmount || '',
      recurringStartDate: acc.recurringStartDate || '',
      recurringNextDueDate: acc.recurringNextDueDate || '',
      recurringTotalCycles: acc.recurringTotalCycles || 12,
      recurringCompletedCycles: acc.recurringCompletedCycles || 0,
      recurringStatus: acc.recurringStatus || 'Active',
      financialYear: acc.financialYear || getFinancialYear(new Date()),
    });
    setIsAddEditModalOpen(true);
  };

  // Save Account
  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const cleanDate = (d) => {
      if (!d || d === '' || d === 'Invalid date') return null;
      return d;
    };

    const isRec = Boolean(formData.isRecurring);

    const cleanPayload = {
      ...formData,
      payment1Date: cleanDate(formData.payment1Date),
      payment2Date: cleanDate(formData.payment2Date),
      payment3Date: cleanDate(formData.payment3Date),
      payment4Date: cleanDate(formData.payment4Date),
      payment5Date: cleanDate(formData.payment5Date),
      paymentDueDate: cleanDate(formData.paymentDueDate),
      // Recurring fields
      isRecurring: isRec,
      recurringFrequency: formData.recurringFrequency || 'Monthly',
      recurringAmount: parseFloat(formData.recurringAmount) || 0,
      recurringStartDate: cleanDate(formData.recurringStartDate),
      recurringNextDueDate: cleanDate(formData.recurringNextDueDate),
      recurringTotalCycles: parseInt(formData.recurringTotalCycles) || 12,
      recurringCompletedCycles: parseInt(formData.recurringCompletedCycles) || 0,
      recurringStatus: isRec ? (formData.recurringStatus || 'Active') : 'None',
    };

    try {
      setSubmitting(true);
      if (isEditing && selectedAccount) {
        await accountService.update(selectedAccount.id, cleanPayload);
        toast.success(`Account for ${formData.customerName} updated successfully`);
      } else {
        await accountService.create(cleanPayload);
        toast.success(`Account for ${formData.customerName} created successfully`);
      }
      setIsAddEditModalOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    try {
      await accountService.delete(selectedAccount.id);
      toast.success('Account record deleted successfully');
      setIsDeleteModalOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  // Open Quick Record Payment Modal
  const handleOpenQuickPay = (acc) => {
    setSelectedAccount(acc);
    // Find next unpaid milestone
    let nextMilestone = '1';
    if (parseFloat(acc.payment1Amount) > 0) nextMilestone = '2';
    if (parseFloat(acc.payment2Amount) > 0) nextMilestone = '3';
    if (parseFloat(acc.payment3Amount) > 0) nextMilestone = '4';
    if (parseFloat(acc.payment4Amount) > 0) nextMilestone = '5';

    setQuickPayData({
      milestone: nextMilestone,
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      mode: 'UPI',
    });
    setIsQuickPayModalOpen(true);
  };

  // Submit Quick Payment
  const handleSubmitQuickPay = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const amt = parseFloat(quickPayData.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const m = quickPayData.milestone;
    const updatePayload = {
      [`payment${m}Amount`]: amt,
      [`payment${m}Date`]: quickPayData.date,
      [`payment${m}Mode`]: quickPayData.mode,
    };

    try {
      setSubmitting(true);
      await accountService.update(selectedAccount.id, updatePayload);
      toast.success(`Recorded Payment ${m} of ${formatCurrency(amt)} successfully!`);
      setIsQuickPayModalOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Record Recurring Payment Modal
  const handleOpenRecordRecurring = (acc) => {
    setSelectedAccount(acc);
    setRecurringPayData({
      amount: acc.recurringAmount || '',
      date: new Date().toISOString().slice(0, 10),
      mode: 'UPI',
    });
    setIsRecurringModalOpen(true);
  };

  // Submit Record Recurring Installment
  const handleSubmitRecurringPay = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      setSubmitting(true);
      await accountService.recordRecurring(selectedAccount.id, recurringPayData);
      toast.success(`Recurring payment installment recorded for ${selectedAccount.customerName}!`);
      setIsRecurringModalOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record recurring payment');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Sync from BD Customers DB
  const handleSyncCustomers = async () => {
    try {
      setSyncing(true);
      const res = await accountService.syncFromCustomers();
      toast.success(res.message || 'Synced accounts with Customers DB!');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync customers');
    } finally {
      setSyncing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (accounts.length === 0) {
      toast.error('No accounts to export');
      return;
    }

    const headers = [
      'Unique ID',
      'Customer Name',
      'Contact No.',
      'Address',
      'Booking Amount',
      'Mode of Payment',
      'Project Value',
      'Status of Work',
      'Completion Percentage',
      'Remaining Amount',
      'Payment 1 Amount',
      'Payment 1 Date',
      'Payment 1 Mode',
      'Payment 2 Amount',
      'Payment 2 Date',
      'Payment 2 Mode',
      'Payment 3 Amount',
      'Payment 3 Date',
      'Payment 3 Mode',
      'Payment 4 Amount',
      'Payment 4 Date',
      'Payment 4 Mode',
      'Payment 5 Amount',
      'Payment 5 Date',
      'Payment 5 Mode',
    ];

    const rows = accounts.map((a) => [
      `"${a.uniqueId || ''}"`,
      `"${a.customerName || ''}"`,
      `"${a.contactNo || ''}"`,
      `"${(a.address || '').replace(/"/g, '""')}"`,
      a.bookingAmount || 0,
      `"${a.modeOfPayment || ''}"`,
      a.projectValue || 0,
      `"${a.statusOfWork || ''}"`,
      a.completionPercentage || 0,
      a.remainingAmount || 0,
      a.payment1Amount || 0,
      `"${a.payment1Date || ''}"`,
      `"${a.payment1Mode || ''}"`,
      a.payment2Amount || 0,
      `"${a.payment2Date || ''}"`,
      `"${a.payment2Mode || ''}"`,
      a.payment3Amount || 0,
      `"${a.payment3Date || ''}"`,
      `"${a.payment3Mode || ''}"`,
      a.payment4Amount || 0,
      `"${a.payment4Date || ''}"`,
      `"${a.payment4Mode || ''}"`,
      a.payment5Amount || 0,
      `"${a.payment5Date || ''}"`,
      `"${a.payment5Mode || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Accounts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Accounts ledger exported as CSV');
  };

  // Bulk Import Parser
  const handleBulkImport = async () => {
    if (!pasteData.trim()) {
      toast.error('Please paste table or CSV data from Google Sheet');
      return;
    }

    try {
      setImporting(true);
      const lines = pasteData.trim().split('\n');
      const items = [];

      lines.forEach((line) => {
        const separator = line.includes('\t') ? '\t' : ',';
        const cols = line.split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ''));

        // Skip header
        if (cols[0] && (cols[0].toLowerCase().includes('unique id') || cols[1]?.toLowerCase().includes('customer name'))) return;

        if (cols[0] || cols[1]) {
          items.push({
            uniqueId: cols[0] || '',
            customerName: cols[1] || '',
            contactNo: cols[2] || '',
            address: cols[3] || '',
            bookingAmount: parseFloat(cols[4]) || 0,
            modeOfPayment: cols[5] || 'UPI',
            projectValue: parseFloat(cols[6]) || 0,
            statusOfWork: cols[7] || 'Not Started',
            completionPercentage: parseInt(cols[8]) || 0,
            payment1Amount: parseFloat(cols[10]) || 0,
            payment1Date: cols[11] || null,
            payment1Mode: cols[12] || '',
            payment2Amount: parseFloat(cols[13]) || 0,
            payment2Date: cols[14] || null,
            payment2Mode: cols[15] || '',
            payment3Amount: parseFloat(cols[16]) || 0,
            payment3Date: cols[17] || null,
            payment3Mode: cols[18] || '',
            payment4Amount: parseFloat(cols[19]) || 0,
            payment4Date: cols[20] || null,
            payment4Mode: cols[21] || '',
            payment5Amount: parseFloat(cols[22]) || 0,
            payment5Date: cols[23] || null,
            payment5Mode: cols[24] || '',
          });
        }
      });

      if (items.length === 0) {
        toast.error('No valid account rows recognized in pasted data');
        return;
      }

      const res = await accountService.bulkImport(items);
      toast.success(res.message || `Successfully imported ${res.importedCount} accounts`);
      setIsImportModalOpen(false);
      setPasteData('');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk import accounts');
    } finally {
      setImporting(false);
    }
  };

  // Helper to render status badge
  const renderStatusBadge = (status) => {
    const config = WORK_STATUSES.find((s) => s.value === status) || {
      color: '#64748b',
      bg: 'rgba(100, 116, 139, 0.12)',
    };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 9px',
          borderRadius: '12px',
          fontSize: '0.72rem',
          fontWeight: 700,
          backgroundColor: config.bg,
          color: config.color,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.color }} />
        {status || 'Not Started'}
      </span>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: '100%', width: '100%' }}>
      {/* 1. TOP HEADER */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Accounts & Financial Ledger
          </h1>
          <p className="page-subtitle">
            Manage project commercials, 5-stage milestone payments, collections received, and site completion status
          </p>
        </div>

        <div className="mobile-full-width-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Sync from Customers DB */}
          <Button
            variant="secondary"
            icon={FiRefreshCw}
            onClick={handleSyncCustomers}
            loading={syncing}
            title="Pull and sync confirmed customer projects from BD directory"
          >
            Sync Customers
          </Button>

          {/* Import Sheet */}
          <Button
            variant="secondary"
            icon={FiUploadCloud}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Sheet
          </Button>

          {/* Export CSV */}
          <Button
            variant="secondary"
            icon={FiDownload}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          {/* Add Account */}
          <Button
            variant="primary"
            icon={FiPlus}
            onClick={handleOpenAdd}
          >
            + Add Account
          </Button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="stats-grid" style={{ marginBottom: '22px' }}>
        {/* Total Project Pipeline Value */}
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
              Total Billed Project Value
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {formatCurrency(stats.totalProjectValue)}
            </h3>
          </div>
        </div>

        {/* Total Collections Received */}
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Collections Received
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--success)' }}>
              {formatCurrency(stats.totalCollected)}
            </h3>
          </div>
        </div>

        {/* Outstanding Receivables */}
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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
            }}
          >
            <FiAlertCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Outstanding Balance Due
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--danger)' }}>
              {formatCurrency(stats.totalRemaining)}
            </h3>
          </div>
        </div>

        {/* Average Work Completion */}
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
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b5cf6',
            }}
          >
            <FiActivity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Avg Work Completion
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: '#8b5cf6',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {stats.totalCompletedProjects} Handed Over
              </span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              {stats.avgCompletion}%
            </h3>
          </div>
        </div>
      </div>

      {/* 3. CIRCULAR GRAPH & TILES: CUSTOMER & PAYMENT PENDING OVERVIEW */}
      <CustomerPaymentPendingCard
        onRecordPayment={handleOpenQuickPay}
        onViewCustomer={(acc) => {
          setSelectedAccount(acc);
          setIsDetailModalOpen(true);
        }}
      />

      {/* 4. NPM 3+ MONTHS STAGNANT, ON-TIME PAYMENT SETTLEMENTS & PROJECT VELOCITY */}
      <ProjectPerformanceAndNPMCard />

      {/* 5. FILTERS & SEARCH TOOLBAR */}
      <div className="responsive-filter-toolbar">
        {/* Search */}
        <div className="search-box">
          <Input
            icon={FiSearch}
            placeholder="Search by customer name, unique ID, phone, site address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="filters-group">
          {/* Status of Work Filter */}
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
            <option value="all">All Work Statuses</option>
            {WORK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
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

          {/* Reset button */}
          {(search || statusFilter !== 'all' || fyFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setFyFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* 4. SPREADSHEET TABLE WITH ALL 25 SEPARATE COLUMNS */}
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
            <Loader message="Loading accounts ledger..." />
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={FiCreditCard}
            title="No Accounts Found"
            message={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Get started by syncing with Customers or creating your first account.'
            }
            actionLabel="Add Account"
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
                minWidth: '2450px',
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
                    Customer & Project ID
                  </th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Contact No.</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', minWidth: '180px' }}>Address / Site</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Booking Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Mode of Payment</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Project Value</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Status of Work</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Completion %</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Remaining Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Payment Due Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Aging / Days Crossed</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Last Payment Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P1 Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P1 Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P1 Mode</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P2 Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P2 Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P2 Mode</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P3 Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P3 Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P3 Mode</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P4 Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P4 Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>P4 Mode</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P5 Amount</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P5 Date</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)', whiteSpace: 'nowrap' }}>P5 Mode</th>
                  <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(139, 92, 246, 0.08)', whiteSpace: 'nowrap' }}>Recurring / EMI Schedule</th>
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
                {accounts.map((a, index) => {
                  const isNpmAccount = a.aging?.isNPM;
                  const rowBg = isNpmAccount ? '#fff1f2' : 'var(--surface)';
                  const hoverBg = isNpmAccount ? '#fee2e2' : 'var(--surface-hover)';

                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: rowBg,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        const tds = e.currentTarget.querySelectorAll('td');
                        tds.forEach((td) => (td.style.backgroundColor = hoverBg));
                      }}
                      onMouseLeave={(e) => {
                        const tds = e.currentTarget.querySelectorAll('td');
                        tds.forEach((td) => (td.style.backgroundColor = rowBg));
                      }}
                    >
                      {/* Sticky Customer Details & Project ID */}
                      <td
                        className="sticky-left-column"
                        style={{
                          padding: '12px 14px',
                          backgroundColor: rowBg,
                          borderBottom: '1px solid var(--border)',
                          borderLeft: isNpmAccount ? '4px solid #dc2626' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: isNpmAccount ? '#dc2626' : 'var(--text-muted)',
                                backgroundColor: isNpmAccount ? '#fee2e2' : 'var(--bg-secondary)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              #{index + 1}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {a.customerName}
                            </span>
                            {isNpmAccount && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                NPM
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: isNpmAccount ? '#dc2626' : 'var(--primary-light)', fontWeight: 600 }}>
                              {a.uniqueId || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Contact No. */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {a.contactNo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <FiPhone size={12} color="var(--primary-light)" />
                            <span>{a.contactNo}</span>
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
                          maxWidth: '220px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: rowBg,
                        }}
                      >
                        {a.address ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                            <FiMapPin size={13} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.address}>
                              {a.address}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 5. Booking Amount */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--success)', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {formatCurrency(a.bookingAmount)}
                      </td>

                      {/* 6. Mode of Payment */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {a.modeOfPayment || '—'}
                      </td>

                      {/* 7. Project Value */}
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {formatCurrency(a.projectValue)}
                      </td>

                      {/* 8. Status of Work */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {renderStatusBadge(a.statusOfWork)}
                      </td>

                      {/* 9. Completion % */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '45px',
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--border)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, a.completionPercentage || 0))}%`,
                                height: '100%',
                                backgroundColor: (a.completionPercentage || 0) >= 100 ? 'var(--success)' : '#3b82f6',
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            {a.completionPercentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* 10. Remaining Amount */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {parseFloat(a.remainingAmount) <= 0 ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: 'var(--success)',
                            }}
                          >
                            ✓ Cleared (₹0)
                          </span>
                        ) : (
                          <span style={{ fontWeight: 800, color: 'var(--danger)' }}>
                            {formatCurrency(a.remainingAmount)}
                          </span>
                        )}
                      </td>

                      {/* 10a. Payment Due Date */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {a.aging?.dueDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: a.aging?.isOverdue ? '#dc2626' : 'var(--text-primary)' }}>
                            <FiCalendar size={12} color={a.aging?.isOverdue ? '#dc2626' : 'var(--primary-light)'} />
                            <span>{formatDate(a.aging.dueDate)}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 10b. Aging / Days Crossed & NPM Highlight */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {isNpmAccount ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '4px 9px',
                              borderRadius: '6px',
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: '1px solid #b91c1c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                            }}
                            title={`NPM: Pending payment with ${a.aging?.daysSinceLastPayment || 90}+ days without payment`}
                          >
                            🚨 NPM ({a.aging?.daysSinceLastPayment || 90}d Unpaid)
                          </span>
                        ) : a.aging?.isOverdue ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            🚨 {a.aging.daysOverdue} Days Crossed
                          </span>
                        ) : a.aging?.isDueSoon ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#d97706',
                            }}
                          >
                            ⏰ Due in {a.aging.daysRemaining}d
                          </span>
                        ) : parseFloat(a.remainingAmount) <= 0 ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>✓ Settled</span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600 }}>🟢 On Track</span>
                        )}
                      </td>

                      {/* 10c. Last Payment Date */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {a.aging?.lastPaymentDate ? (
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>{formatDate(a.aging.lastPaymentDate)}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({a.aging.lastPaymentMode})</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None yet</span>
                        )}
                      </td>

                      {/* 11-13. Milestone 1 */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', fontWeight: 600, color: parseFloat(a.payment1Amount) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {parseFloat(a.payment1Amount) > 0 ? formatCurrency(a.payment1Amount) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {a.payment1Date ? formatDate(a.payment1Date) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {a.payment1Mode || '—'}
                      </td>

                      {/* 14-16. Milestone 2 */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', fontWeight: 600, color: parseFloat(a.payment2Amount) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {parseFloat(a.payment2Amount) > 0 ? formatCurrency(a.payment2Amount) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {a.payment2Date ? formatDate(a.payment2Date) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {a.payment2Mode || '—'}
                      </td>

                      {/* 17-19. Milestone 3 */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', fontWeight: 600, color: parseFloat(a.payment3Amount) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {parseFloat(a.payment3Amount) > 0 ? formatCurrency(a.payment3Amount) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {a.payment3Date ? formatDate(a.payment3Date) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {a.payment3Mode || '—'}
                      </td>

                      {/* 20-22. Milestone 4 */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', fontWeight: 600, color: parseFloat(a.payment4Amount) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {parseFloat(a.payment4Amount) > 0 ? formatCurrency(a.payment4Amount) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {a.payment4Date ? formatDate(a.payment4Date) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {a.payment4Mode || '—'}
                      </td>

                      {/* 23-25. Milestone 5 */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', fontWeight: 600, color: parseFloat(a.payment5Amount) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {parseFloat(a.payment5Amount) > 0 ? formatCurrency(a.payment5Amount) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {a.payment5Date ? formatDate(a.payment5Date) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {a.payment5Mode || '—'}
                      </td>

                      {/* 26. RECURRING / EMI SCHEDULE COLUMN */}
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', backgroundColor: rowBg, whiteSpace: 'nowrap' }}>
                        {a.isRecurring ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                  color: '#8b5cf6',
                                  border: '1px solid rgba(139, 92, 246, 0.3)',
                                }}
                              >
                                🔄 {a.recurringFrequency || 'Monthly'}
                              </span>
                              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                {formatCurrency(a.recurringAmount)}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Cycle {a.recurringCompletedCycles || 0}/{a.recurringTotalCycles || 12} • {a.recurringStatus || 'Active'}
                            </div>
                            {a.recurringNextDueDate && (
                              <div style={{ fontSize: '0.6875rem', color: '#f59e0b', fontWeight: 600 }}>
                                Next Due: {formatDate(a.recurringNextDueDate)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>One-Time Project</span>
                        )}
                      </td>

                      {/* 27. Actions Column */}
                      <td
                        className="sticky-right-actions"
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          backgroundColor: rowBg,
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Quick Record Milestone Payment */}
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={FiCreditCard}
                            onClick={() => handleOpenQuickPay(a)}
                            title="Record next milestone payment"
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          >
                            + Pay
                          </Button>

                          {/* Quick Record Recurring EMI Installment */}
                          {a.isRecurring && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={FiRepeat}
                              onClick={() => handleOpenRecordRecurring(a)}
                              title="Record recurring EMI / AMC installment"
                              style={{ padding: '5px 8px', fontSize: '0.75rem', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                            >
                              + EMI
                            </Button>
                          )}

                          {/* View 360 Ledger */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccount(a);
                              setIsDetailModalOpen(true);
                            }}
                            title="View 360° Account Ledger"
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
                            onClick={() => handleOpenEdit(a)}
                            title="Edit Account Record"
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
                              setSelectedAccount(a);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Account Record"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT ACCOUNT MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={isEditing ? `Edit Account: ${formData.customerName}` : 'Add New Account Record'}
        size="lg"
      >
        <form onSubmit={handleSubmitAccount} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* SECTION 1: CUSTOMER IDENTIFICATION & PROJECT CONTRACT */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <LuIndianRupee size={16} color="var(--primary-light)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                1. Customer Particulars & Commercials
              </h4>
            </div>

            <div className="form-grid">
              <Input
                label="Customer Name *"
                placeholder="e.g. Pawan Kumar"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />

              <Input
                label="Contact Number"
                placeholder="e.g. 9876543210"
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                icon={FiPhone}
              />

              <Input
                label="Installation / Site Address"
                placeholder="e.g. Sector 62, Noida"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                icon={FiMapPin}
              />

              <Input
                label="Unique ID"
                placeholder="e.g. BD/2026-27/0001 (auto if blank)"
                value={formData.uniqueId}
                onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
              />

              <Input
                label="Project Value (₹) *"
                type="number"
                step="0.01"
                placeholder="e.g. 450000"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                required
              />

              <Input
                label="Booking Amount (₹)"
                type="number"
                step="0.01"
                placeholder="e.g. 50000"
                value={formData.bookingAmount}
                onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
              />

              <Input
                as="select"
                label="Booking Payment Mode"
                value={formData.modeOfPayment}
                onChange={(e) => setFormData({ ...formData, modeOfPayment: e.target.value })}
              >
                {PAYMENT_MODES.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </Input>

              <Input
                as="select"
                label="Financial Year"
                value={formData.financialYear}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
              >
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy}
                  </option>
                ))}
              </Input>

              <div>
                <Input
                  label="Payment Due Date"
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData({ ...formData, paymentDueDate: e.target.value })}
                  icon={FiCalendar}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setFormData({ ...formData, paymentDueDate: d.toISOString().slice(0, 10) });
                    }}
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 15);
                      setFormData({ ...formData, paymentDueDate: d.toISOString().slice(0, 10) });
                    }}
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    +15 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setFormData({ ...formData, paymentDueDate: d.toISOString().slice(0, 10) });
                    }}
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    +30 Days
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORK EXECUTION & PROGRESS (AUTO-GENERATED & SYNCED) */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiActivity size={16} color="#3b82f6" />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  2. Site Execution & Completion Status
                </h4>
              </div>

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ⚡ Auto-Synchronized
              </span>
            </div>

            {/* Quick Auto-Fill Preset Stages */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Quick Stage Presets (Click to auto-generate both Status & %):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { label: '0% Not Started', status: 'Not Started', percent: 0, color: '#64748b' },
                  { label: '20% Material Delivery', status: 'Material Delivery', percent: 20, color: '#3b82f6' },
                  { label: '40% Civil Work', status: 'Civil Work', percent: 40, color: '#f59e0b' },
                  { label: '70% Electrical Work', status: 'Electrical Work', percent: 70, color: '#8b5cf6' },
                  { label: '90% Testing', status: 'Testing', percent: 90, color: '#06b6d4' },
                  { label: '100% Handover', status: 'Handover', percent: 100, color: '#10b981' },
                ].map((st) => (
                  <button
                    key={st.status}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        statusOfWork: st.status,
                        completionPercentage: st.percent,
                      }));
                    }}
                    style={{
                      border: formData.statusOfWork === st.status ? `1.5px solid ${st.color}` : '1px solid var(--border)',
                      background: formData.statusOfWork === st.status ? `${st.color}22` : 'var(--surface)',
                      color: formData.statusOfWork === st.status ? st.color : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <Input
                as="select"
                label="Status of Work (Auto-fills %)"
                value={formData.statusOfWork}
                onChange={(e) => {
                  const val = e.target.value;
                  let autoPct = formData.completionPercentage;
                  if (val === 'Not Started' || val.includes('NPM')) autoPct = 0;
                  else if (val === 'Material Delivery' || val.includes('Material')) autoPct = 20;
                  else if (val === 'Civil Work' || val.includes('Civil')) autoPct = 40;
                  else if (val === 'Electrical Work' || val.includes('Electrical')) autoPct = 70;
                  else if (val === 'Testing' || val.includes('Testing')) autoPct = 90;
                  else if (val === 'Handover' || val.includes('Handover') || val === 'Completed') autoPct = 100;

                  setFormData({
                    ...formData,
                    statusOfWork: val,
                    completionPercentage: autoPct,
                  });
                }}
              >
                {WORK_STATUSES.map((ws) => (
                  <option key={ws.value} value={ws.value}>
                    {ws.label}
                  </option>
                ))}
              </Input>

              <Input
                label="Completion Percentage (%) (Auto-fills Status)"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 70"
                value={formData.completionPercentage}
                onChange={(e) => {
                  const pct = parseInt(e.target.value) || 0;
                  let autoStatus = formData.statusOfWork;
                  if (pct <= 0) autoStatus = 'Not Started';
                  else if (pct > 0 && pct <= 25) autoStatus = 'Material Delivery';
                  else if (pct > 25 && pct <= 50) autoStatus = 'Civil Work';
                  else if (pct > 50 && pct <= 80) autoStatus = 'Electrical Work';
                  else if (pct > 80 && pct < 100) autoStatus = 'Testing';
                  else if (pct >= 100) autoStatus = 'Handover';

                  setFormData({
                    ...formData,
                    completionPercentage: Math.min(100, Math.max(0, pct)),
                    statusOfWork: autoStatus,
                  });
                }}
              />
            </div>
          </div>

          {/* SECTION 3: 5 MILESTONE PAYMENT SCHEDULES */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCreditCard size={16} color="var(--success)" />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  3. Milestone Payments (Payments 1 to 5)
                </h4>
              </div>

              {/* Dynamic Balance Indicator */}
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Remaining Balance:{' '}
                <span style={{ color: computedFormRemaining.remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {formatCurrency(computedFormRemaining.remaining)}
                </span>
              </div>
            </div>

            {/* Payments 1 to 5 Grid */}
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '6px' }}>
                  Milestone Payment {num}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <Input
                    label={`Payment ${num} Amount (₹)`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData[`payment${num}Amount`]}
                    onChange={(e) => setFormData({ ...formData, [`payment${num}Amount`]: e.target.value })}
                  />
                  <Input
                    label={`Payment ${num} Date`}
                    type="date"
                    value={formData[`payment${num}Date`]}
                    onChange={(e) => setFormData({ ...formData, [`payment${num}Date`]: e.target.value })}
                  />
                  <Input
                    as="select"
                    label={`Payment ${num} Mode`}
                    value={formData[`payment${num}Mode`]}
                    onChange={(e) => setFormData({ ...formData, [`payment${num}Mode`]: e.target.value })}
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </Input>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 4: 🔄 RECURRING PAYMENT / EMI / AMC SCHEDULE */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: formData.isRecurring ? '1.5px solid #8b5cf6' : '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiRepeat size={16} color="#8b5cf6" />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  4. Recurring Payment & EMI / AMC Schedule
                </h4>
              </div>

              {/* Enable / Disable Toggle Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: formData.isRecurring ? '#8b5cf6' : 'var(--surface)',
                  color: formData.isRecurring ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: formData.isRecurring ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                }}
              >
                {formData.isRecurring ? '✓ Recurring Active' : '+ Enable Recurring / EMI'}
              </button>
            </div>

            {formData.isRecurring ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Presets for total cycles */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Quick Tenor / Cycle Presets:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: '3 Months (Quarterly)', cycles: 3 },
                      { label: '6 Months (Bi-Annual)', cycles: 6 },
                      { label: '12 Months (1 Year)', cycles: 12 },
                      { label: '24 Months (2 Years)', cycles: 24 },
                      { label: '36 Months (3 Years)', cycles: 36 },
                      { label: '60 Months (5 Years)', cycles: 60 },
                    ].map((tenor) => (
                      <button
                        key={tenor.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, recurringTotalCycles: tenor.cycles })}
                        style={{
                          border: parseInt(formData.recurringTotalCycles) === tenor.cycles ? '1.5px solid #8b5cf6' : '1px solid var(--border)',
                          backgroundColor: parseInt(formData.recurringTotalCycles) === tenor.cycles ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface)',
                          color: parseInt(formData.recurringTotalCycles) === tenor.cycles ? '#8b5cf6' : 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {tenor.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <Input
                    as="select"
                    label="Recurring Frequency *"
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                  >
                    {RECURRING_FREQUENCIES.map((rf) => (
                      <option key={rf.value} value={rf.value}>
                        {rf.label}
                      </option>
                    ))}
                  </Input>

                  <Input
                    label="Installment Amount per Cycle (₹) *"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={formData.recurringAmount}
                    onChange={(e) => setFormData({ ...formData, recurringAmount: e.target.value })}
                  />

                  <Input
                    label="Schedule Start Date"
                    type="date"
                    value={formData.recurringStartDate}
                    onChange={(e) => setFormData({ ...formData, recurringStartDate: e.target.value })}
                  />

                  <Input
                    label="Next Billing Due Date"
                    type="date"
                    value={formData.recurringNextDueDate}
                    onChange={(e) => setFormData({ ...formData, recurringNextDueDate: e.target.value })}
                  />

                  <Input
                    label="Total Tenor Cycles (No. of installments)"
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={formData.recurringTotalCycles}
                    onChange={(e) => setFormData({ ...formData, recurringTotalCycles: e.target.value })}
                  />

                  <Input
                    label="Completed Cycles (Paid so far)"
                    type="number"
                    min="0"
                    placeholder="e.g. 0"
                    value={formData.recurringCompletedCycles}
                    onChange={(e) => setFormData({ ...formData, recurringCompletedCycles: e.target.value })}
                  />

                  <Input
                    as="select"
                    label="Recurring Status"
                    value={formData.recurringStatus}
                    onChange={(e) => setFormData({ ...formData, recurringStatus: e.target.value })}
                  >
                    <option value="Active">Active (Ongoing Schedule)</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed (Fully Paid)</option>
                  </Input>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enable recurring payments for clients on monthly EMI schemes, quarterly maintenance retainer, or annual solar AMC contracts.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsAddEditModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. QUICK RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isQuickPayModalOpen}
        onClose={() => setIsQuickPayModalOpen(false)}
        title={`Record Payment for ${selectedAccount?.customerName || 'Customer'}`}
        size="sm"
      >
        {selectedAccount && (
          <form onSubmit={handleSubmitQuickPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Value: <strong>{formatCurrency(selectedAccount.projectValue)}</strong></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '2px' }}>Remaining Balance: <strong>{formatCurrency(selectedAccount.remainingAmount)}</strong></div>
            </div>

            <Input
              as="select"
              label="Select Milestone Payment Stage"
              value={quickPayData.milestone}
              onChange={(e) => setQuickPayData({ ...quickPayData, milestone: e.target.value })}
            >
              <option value="1">Payment 1 {parseFloat(selectedAccount.payment1Amount) > 0 ? `(Paid: ${formatCurrency(selectedAccount.payment1Amount)})` : '(Pending)'}</option>
              <option value="2">Payment 2 {parseFloat(selectedAccount.payment2Amount) > 0 ? `(Paid: ${formatCurrency(selectedAccount.payment2Amount)})` : '(Pending)'}</option>
              <option value="3">Payment 3 {parseFloat(selectedAccount.payment3Amount) > 0 ? `(Paid: ${formatCurrency(selectedAccount.payment3Amount)})` : '(Pending)'}</option>
              <option value="4">Payment 4 {parseFloat(selectedAccount.payment4Amount) > 0 ? `(Paid: ${formatCurrency(selectedAccount.payment4Amount)})` : '(Pending)'}</option>
              <option value="5">Payment 5 {parseFloat(selectedAccount.payment5Amount) > 0 ? `(Paid: ${formatCurrency(selectedAccount.payment5Amount)})` : '(Pending)'}</option>
            </Input>

            <Input
              label="Payment Amount (₹) *"
              type="number"
              step="0.01"
              placeholder="e.g. 100000"
              value={quickPayData.amount}
              onChange={(e) => setQuickPayData({ ...quickPayData, amount: e.target.value })}
              required
            />

            <Input
              label="Payment Received Date *"
              type="date"
              value={quickPayData.date}
              onChange={(e) => setQuickPayData({ ...quickPayData, date: e.target.value })}
              required
            />

            <Input
              as="select"
              label="Payment Mode"
              value={quickPayData.mode}
              onChange={(e) => setQuickPayData({ ...quickPayData, mode: e.target.value })}
            >
              {PAYMENT_MODES.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </Input>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setIsQuickPayModalOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                Save Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 6B. QUICK RECORD RECURRING EMI / AMC INSTALLMENT MODAL */}
      <Modal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        title={`Record Recurring Installment: ${selectedAccount?.customerName || 'Customer'}`}
        size="sm"
      >
        {selectedAccount && (
          <form onSubmit={handleSubmitRecurringPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Recurring Plan:</span>
                <strong style={{ color: '#8b5cf6' }}>{selectedAccount.recurringFrequency} Schedule</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Progress:</span>
                <strong>Cycle {(selectedAccount.recurringCompletedCycles || 0) + 1} of {selectedAccount.recurringTotalCycles || 12}</strong>
              </div>
              {selectedAccount.recurringNextDueDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cycle Due Date:</span>
                  <strong style={{ color: '#f59e0b' }}>{formatDate(selectedAccount.recurringNextDueDate)}</strong>
                </div>
              )}
            </div>

            <Input
              label="Installment Amount (₹) *"
              type="number"
              step="0.01"
              placeholder="e.g. 5000"
              value={recurringPayData.amount}
              onChange={(e) => setRecurringPayData({ ...recurringPayData, amount: e.target.value })}
              required
            />

            <Input
              label="Payment Received Date *"
              type="date"
              value={recurringPayData.date}
              onChange={(e) => setRecurringPayData({ ...recurringPayData, date: e.target.value })}
              required
            />

            <Input
              as="select"
              label="Payment Mode"
              value={recurringPayData.mode}
              onChange={(e) => setRecurringPayData({ ...recurringPayData, mode: e.target.value })}
            >
              {PAYMENT_MODES.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </Input>

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ⚡ Recording this installment will automatically increment the completed cycle count and advance the next billing due date by 1 period.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setIsRecurringModalOpen(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                Record Installment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. 360° ACCOUNT LEDGER MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Financial Ledger: ${selectedAccount?.customerName || 'Account'}`}
        size="md"
      >
        {selectedAccount && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Work Status</span>
                <div style={{ marginTop: '2px' }}>{renderStatusBadge(selectedAccount.statusOfWork)}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Completion</span>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedAccount.completionPercentage || 0}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Project Value</span>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatCurrency(selectedAccount.projectValue)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Remaining Balance</span>
                <div style={{ fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>
                  {formatCurrency(selectedAccount.remainingAmount)}
                </div>
              </div>
            </div>

            {/* Timeline Breakdown */}
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 700 }}>
                Milestone Collections Breakdown
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Booking */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                  <span>Token / Booking Advance ({selectedAccount.modeOfPayment || 'UPI'})</span>
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(selectedAccount.bookingAmount)}</strong>
                </div>

                {/* Payments 1 to 5 */}
                {[1, 2, 3, 4, 5].map((num) => {
                  const amt = parseFloat(selectedAccount[`payment${num}Amount`]) || 0;
                  const date = selectedAccount[`payment${num}Date`];
                  const mode = selectedAccount[`payment${num}Mode`];

                  return (
                    <div
                      key={num}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: amt > 0 ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary)',
                        border: amt > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                      }}
                    >
                      <div>
                        <strong>Milestone Payment {num}</strong>
                        {date && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({formatDate(date)} via {mode})</span>}
                      </div>
                      <span style={{ fontWeight: 700, color: amt > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {amt > 0 ? formatCurrency(amt) : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. IMPORT MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Accounts from Google Sheets / CSV"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Copy columns (A to Y) from your <strong>BD UPDATES / Accounts</strong> Google Sheet and paste below:
          </p>

          <textarea
            rows={10}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="Unique ID	Customer Name	Contact No.	Address	Booking Amount	Mode of Payment	Project Value	Status of Work	Completion Percentage	Remaining Amount	Payment 1 Amount	Payment 1 Date	Payment 1 Mode	Payment 2 Amount..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkImport} loading={importing}>
              Import Rows to Database
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Account"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Are you sure you want to delete the account record for <strong>{selectedAccount?.customerName}</strong> ({selectedAccount?.uniqueId})?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Accounts;
