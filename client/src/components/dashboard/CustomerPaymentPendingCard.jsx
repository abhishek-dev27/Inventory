import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiDollarSign,
  FiCreditCard,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiArrowUpRight,
  FiSearch,
  FiUser,
  FiZap,
  FiMail,
  FiInfo,
  FiActivity,
} from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

// Helper to compute aging details client-side if missing
const computeAging = (account) => {
  let lastPaymentDate = null;
  let lastPaymentMode = null;
  let lastPaymentAmount = 0;

  if (account.payment5Date && parseFloat(account.payment5Amount) > 0) {
    lastPaymentDate = account.payment5Date;
    lastPaymentMode = account.payment5Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment5Amount);
  } else if (account.payment4Date && parseFloat(account.payment4Amount) > 0) {
    lastPaymentDate = account.payment4Date;
    lastPaymentMode = account.payment4Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment4Amount);
  } else if (account.payment3Date && parseFloat(account.payment3Amount) > 0) {
    lastPaymentDate = account.payment3Date;
    lastPaymentMode = account.payment3Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment3Amount);
  } else if (account.payment2Date && parseFloat(account.payment2Amount) > 0) {
    lastPaymentDate = account.payment2Date;
    lastPaymentMode = account.payment2Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment2Amount);
  } else if (account.payment1Date && parseFloat(account.payment1Amount) > 0) {
    lastPaymentDate = account.payment1Date;
    lastPaymentMode = account.payment1Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment1Amount);
  } else if (parseFloat(account.bookingAmount) > 0) {
    lastPaymentDate = account.dateOfVisit || (account.createdAt ? new Date(account.createdAt).toISOString().slice(0, 10) : null);
    lastPaymentMode = account.modeOfPayment || 'Token';
    lastPaymentAmount = parseFloat(account.bookingAmount);
  }

  // Due Date
  let dueDate = account.paymentDueDate;
  if (!dueDate) {
    const baseDate = lastPaymentDate ? new Date(lastPaymentDate) : (account.createdAt ? new Date(account.createdAt) : new Date());
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 30);
    dueDate = d.toISOString().slice(0, 10);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDue = new Date(dueDate);
  targetDue.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDue.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const pVal = parseFloat(account.projectValue) || 0;
  const rem = parseFloat(account.remainingAmount) || 0;
  const isCleared = rem <= 0 && pVal > 0;
  const isOverdue = !isCleared && rem > 0 && diffDays > 0;
  const isDueSoon = !isCleared && rem > 0 && diffDays <= 0 && diffDays >= -7;

  // Logic-Based NPM: Pending payment with 90+ days (3 months) since last payment
  const lastActiveDate = lastPaymentDate ? new Date(lastPaymentDate) : (account.createdAt ? new Date(account.createdAt) : new Date());
  lastActiveDate.setHours(0, 0, 0, 0);
  const daysSinceLastPayment = Math.max(0, Math.round((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)));
  const isNPM = rem > 0 && daysSinceLastPayment >= 90;

  return {
    lastPaymentDate,
    lastPaymentMode,
    lastPaymentAmount,
    dueDate,
    diffDays,
    daysOverdue: isOverdue ? diffDays : 0,
    daysRemaining: diffDays < 0 ? Math.abs(diffDays) : 0,
    daysSinceLastPayment,
    isOverdue,
    isDueSoon,
    isCleared,
    isNPM,
  };
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div
        style={{
          backgroundColor: '#090d16',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          border: `1px solid ${data.color || '#3b82f6'}`,
          fontFamily: 'var(--font-sans)',
          minWidth: '170px',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.color }} />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>
            {data.name}
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Amount: <strong style={{ color: '#ffffff' }}>{formatCurrency(data.value)}</strong>
        </div>
        <div style={{ fontSize: '0.72rem', color: data.color, fontWeight: 700, marginTop: '2px' }}>
          {data.percentage ? `${data.percentage.toFixed(1)}% of Pipeline` : ''}
        </div>
      </div>
    );
  }
  return null;
};

const CustomerPaymentPendingCard = ({ onViewCustomer, onRecordPayment }) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('overdue'); // 'overdue', 'due_soon', 'pending', 'all', 'cleared'
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Customer Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Quick Pay Modal State
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);
  const [quickPayData, setQuickPayData] = useState({
    milestone: '1',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    mode: 'UPI',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const accRes = await accountService.getAll({ limit: 500 });
      let accList = accRes.data || [];

      // Fallback to customer DB if accounts empty
      if (accList.length === 0) {
        const custRes = await customerService.getAll({ limit: 500 });
        const custs = custRes.data || [];
        accList = custs.map((c) => {
          const pVal = parseFloat(c.projectValue) || 0;
          const bAmt = parseFloat(c.bookingAmount) || 0;
          return {
            id: c.id,
            uniqueId: c.uniqueId,
            customerName: c.customerName,
            contactNo: c.contactNo,
            address: c.address,
            systemType: c.systemType,
            capacity: c.capacity,
            dateOfVisit: c.dateOfVisit,
            timeOfVisit: c.timeOfVisit,
            reference: c.reference,
            bdeEmail: c.bdeEmail,
            bdeName: c.bdeName,
            comments: c.comments,
            projectValue: pVal,
            bookingAmount: bAmt,
            remainingAmount: Math.max(0, pVal - bAmt),
            statusOfWork: c.bookingConfirmed === 'Confirmed' ? 'In Progress' : 'Pending',
            completionPercentage: c.bookingConfirmed === 'Confirmed' ? 25 : 0,
          };
        });
      }

      // Attach aging
      const enriched = accList.map((a) => ({
        ...a,
        aging: a.aging || computeAging(a),
      }));

      setAccounts(enriched);

      // If active tab is overdue but no overdue accounts, default to 'all' or 'pending'
      const hasOverdue = enriched.some((a) => a.aging?.isOverdue);
      if (!hasOverdue && filterTab === 'overdue') {
        setFilterTab('all');
      }
    } catch (err) {
      console.error('Failed to load pending customer accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  // Compute Total Financial Metrics & Overdue Stats
  const summary = useMemo(() => {
    let totalProjectVal = 0;
    let totalPendingVal = 0;
    let totalCollectedVal = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let pendingCount = 0;
    let clearedCount = 0;
    let totalOverdueVal = 0;

    accounts.forEach((a) => {
      const pVal = parseFloat(a.projectValue) || 0;
      const rem = parseFloat(a.remainingAmount) || 0;
      const collected = Math.max(0, pVal - rem);
      const ag = a.aging || computeAging(a);

      totalProjectVal += pVal;
      totalPendingVal += rem;
      totalCollectedVal += collected;

      if (rem > 0) {
        pendingCount++;
        if (ag.isOverdue) {
          overdueCount++;
          totalOverdueVal += rem;
        } else if (ag.isDueSoon) {
          dueSoonCount++;
        }
      } else if (pVal > 0) {
        clearedCount++;
      }
    });

    const recoveryRate = totalProjectVal > 0 ? (totalCollectedVal / totalProjectVal) * 100 : 0;
    const pendingRate = totalProjectVal > 0 ? (totalPendingVal / totalProjectVal) * 100 : 0;

    return {
      totalProjectVal,
      totalPendingVal,
      totalCollectedVal,
      overdueCount,
      dueSoonCount,
      pendingCount,
      clearedCount,
      totalOverdueVal,
      recoveryRate,
      pendingRate,
    };
  }, [accounts]);

  // Donut Chart Data
  const chartData = useMemo(() => {
    if (summary.totalProjectVal === 0) {
      return [{ name: 'No Commercial Records', value: 1, color: '#64748b', percentage: 100, key: 'all' }];
    }

    const slices = [];
    if (summary.totalOverdueVal > 0) {
      slices.push({
        name: 'Overdue Dues',
        value: summary.totalOverdueVal,
        color: '#dc2626',
        percentage: (summary.totalOverdueVal / summary.totalProjectVal) * 100,
        key: 'overdue',
      });
    }

    const regularPending = Math.max(0, summary.totalPendingVal - summary.totalOverdueVal);
    if (regularPending > 0) {
      slices.push({
        name: 'Pending On-Schedule',
        value: regularPending,
        color: '#f59e0b',
        percentage: (regularPending / summary.totalProjectVal) * 100,
        key: 'pending',
      });
    }

    if (summary.totalCollectedVal > 0) {
      slices.push({
        name: 'Collected Amount',
        value: summary.totalCollectedVal,
        color: '#10b981',
        percentage: summary.recoveryRate,
        key: 'cleared',
      });
    }

    return slices;
  }, [summary]);

  // Filtered customer list based on Tab & Search
  const filteredCustomers = useMemo(() => {
    return accounts
      .filter((a) => {
        const rem = parseFloat(a.remainingAmount) || 0;
        const ag = a.aging || computeAging(a);

        if (filterTab === 'overdue' && !ag.isOverdue) return false;
        if (filterTab === 'due_soon' && !ag.isDueSoon) return false;
        if (filterTab === 'pending' && rem <= 0) return false;
        if (filterTab === 'cleared' && rem > 0) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = (a.customerName || '').toLowerCase().includes(q);
          const matchId = (a.uniqueId || '').toLowerCase().includes(q);
          const matchPhone = (a.contactNo || '').toLowerCase().includes(q);
          const matchAddr = (a.address || '').toLowerCase().includes(q);
          return matchName || matchId || matchPhone || matchAddr;
        }
        return true;
      })
      .sort((a, b) => {
        const agA = a.aging || computeAging(a);
        const agB = b.aging || computeAging(b);
        if (agB.daysOverdue !== agA.daysOverdue) {
          return agB.daysOverdue - agA.daysOverdue;
        }
        return (parseFloat(b.remainingAmount) || 0) - (parseFloat(a.remainingAmount) || 0);
      });
  }, [accounts, filterTab, searchTerm]);

  // Open Customer Detail Modal
  const handleOpenCustomerDetail = (cust) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
  };

  // Submit Quick Payment
  const handleSubmitQuickPay = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!quickPayData.amount || parseFloat(quickPayData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setSavingPayment(true);
      const m = quickPayData.milestone;
      const updatePayload = {
        [`payment${m}Amount`]: parseFloat(quickPayData.amount),
        [`payment${m}Date`]: quickPayData.date,
        [`payment${m}Mode`]: quickPayData.mode,
      };

      await accountService.update(selectedCustomer.id, updatePayload);
      toast.success(`Payment Milestone ${m} recorded for ${selectedCustomer.customerName}!`);
      setIsQuickPayOpen(false);
      setIsDetailModalOpen(false);
      fetchCustomerData();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      {/* 1. Header with Title & Action Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <FiCreditCard size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Customer & Payment Pending Overview
              {summary.overdueCount > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FiAlertTriangle size={12} />
                  {summary.overdueCount} Overdue ({formatCurrency(summary.totalOverdueVal)})
                </span>
              )}
              {summary.dueSoonCount > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FiClock size={12} />
                  {summary.dueSoonCount} Due This Week
                </span>
              )}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click on any customer or chart segment to inspect full dossier, site particulars, and milestone payments
            </p>
          </div>
        </div>

        {/* Filter Chips & View All Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            {/* Overdue */}
            <button
              type="button"
              onClick={() => setFilterTab('overdue')}
              style={{
                border: 'none',
                background: filterTab === 'overdue' ? '#dc2626' : 'transparent',
                color: filterTab === 'overdue' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🚨 Overdue ({summary.overdueCount})
            </button>

            {/* Due Soon */}
            <button
              type="button"
              onClick={() => setFilterTab('due_soon')}
              style={{
                border: 'none',
                background: filterTab === 'due_soon' ? '#f59e0b' : 'transparent',
                color: filterTab === 'due_soon' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ⏰ Due Soon ({summary.dueSoonCount})
            </button>

            {/* All Pending */}
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              style={{
                border: 'none',
                background: filterTab === 'pending' ? 'var(--primary)' : 'transparent',
                color: filterTab === 'pending' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Pending ({summary.pendingCount})
            </button>

            {/* All */}
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              style={{
                border: 'none',
                background: filterTab === 'all' ? 'var(--surface-hover)' : 'transparent',
                color: filterTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All ({accounts.length})
            </button>

            {/* Cleared */}
            <button
              type="button"
              onClick={() => setFilterTab('cleared')}
              style={{
                border: 'none',
                background: filterTab === 'cleared' ? 'var(--success)' : 'transparent',
                color: filterTab === 'cleared' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cleared ({summary.clearedCount})
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={FiArrowUpRight}
            onClick={() => navigate('/accounts')}
          >
            Accounts Ledger
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0' }}>
          <Loader message="Loading financial receivables..." />
        </div>
      ) : (
        /* 2. Main Content: Donut Chart on Left + Customer Cards Grid on Right */
        <div className="payment-overview-grid">
          {/* LEFT PANEL: DONUT FINANCIAL CHART */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Collection vs Pending Ratio
            </span>

            {/* Donut Chart with Center Text */}
            <div style={{ width: '100%', height: '220px', position: 'relative', margin: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={96}
                    paddingAngle={3}
                    cornerRadius={5}
                    dataKey="value"
                    stroke="var(--surface)"
                    strokeWidth={2}
                    onClick={(entry) => {
                      if (entry && entry.key) {
                        setFilterTab(entry.key);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                    content={<CustomTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Pill inside Donut */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'auto',
                  width: '116px',
                  height: '116px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  border: '1px solid var(--border)',
                  zIndex: 2,
                  textAlign: 'center',
                  padding: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => setFilterTab('all')}
                title="Click to view all customer accounts"
              >
                {summary.totalPendingVal <= 0 ? (
                  <>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)' }}>
                      All Settled
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px', lineHeight: 1.1 }}>
                      {formatCurrency(summary.totalCollectedVal)}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      100% Cleared
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Total Pending
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: summary.overdueCount > 0 ? '#dc2626' : '#f59e0b',
                        marginTop: '2px',
                        lineHeight: 1.1,
                      }}
                    >
                      {formatCurrency(summary.totalPendingVal)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: summary.overdueCount > 0 ? '#dc2626' : 'var(--text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {summary.overdueCount > 0 ? `${summary.overdueCount} Overdue` : `${summary.pendingCount} Pending`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Metrics Breakdown Box */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Contract Value:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.totalProjectVal)}</strong>
              </div>

              {summary.totalOverdueVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>🚨 Overdue Crossed:</span>
                  <strong style={{ color: '#dc2626' }}>{formatCurrency(summary.totalOverdueVal)} ({summary.overdueCount} clients)</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Total Collected:</span>
                <strong style={{ color: 'var(--success)' }}>{formatCurrency(summary.totalCollectedVal)} ({summary.recoveryRate.toFixed(1)}%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Total Outstanding:</span>
                <strong style={{ color: '#f59e0b' }}>{formatCurrency(summary.totalPendingVal)} ({summary.pendingRate.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CUSTOMER PENDING CARDS GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Quick Search */}
            <div style={{ marginBottom: '2px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter customer name, unique ID, phone, site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                <FiCheckCircle size={32} color="var(--success)" style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700 }}>
                  {filterTab === 'overdue'
                    ? 'No Overdue Payments! 🎉'
                    : filterTab === 'due_soon'
                    ? 'No Payments Due This Week'
                    : filterTab === 'pending'
                    ? 'All Customer Accounts Cleared!'
                    : 'No Matching Customer Records'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {filterTab === 'overdue'
                    ? 'All active customer collections are currently on schedule.'
                    : 'Try switching filters to view other accounts.'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
                  gap: '12px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {filteredCustomers.map((c) => {
                  const pVal = parseFloat(c.projectValue) || 0;
                  const rem = parseFloat(c.remainingAmount) || 0;
                  const paid = Math.max(0, pVal - rem);
                  const paidPercent = pVal > 0 ? Math.min(100, Math.round((paid / pVal) * 100)) : 0;
                  const ag = c.aging || computeAging(c);

                  return (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: ag.isNPM ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
                        border: ag.isNPM
                          ? '1.5px solid #dc2626'
                          : ag.isOverdue
                          ? '1px solid rgba(239, 68, 68, 0.45)'
                          : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
                        transform: 'translate3d(0,0,0)',
                        willChange: 'transform, box-shadow',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: ag.isNPM
                          ? '0 4px 14px rgba(220, 38, 38, 0.18)'
                          : ag.isOverdue
                          ? '0 2px 8px rgba(239, 68, 68, 0.08)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate3d(0, -2px, 0)';
                        e.currentTarget.style.borderColor = ag.isNPM ? '#b91c1c' : ag.isOverdue ? '#ef4444' : 'var(--primary-light)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate3d(0, 0, 0)';
                        e.currentTarget.style.borderColor = ag.isNPM
                          ? '#dc2626'
                          : ag.isOverdue
                          ? 'rgba(239, 68, 68, 0.45)'
                          : 'var(--border)';
                        e.currentTarget.style.boxShadow = ag.isNPM
                          ? '0 4px 14px rgba(220, 38, 38, 0.18)'
                          : ag.isOverdue
                          ? '0 2px 8px rgba(239, 68, 68, 0.08)'
                          : 'none';
                      }}
                      onClick={() => handleOpenCustomerDetail(c)}
                    >
                      {/* Customer Name, Unique ID & Aging Status Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{c.customerName}</span>
                            {ag.isNPM && (
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                }}
                              >
                                NPM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: ag.isNPM ? '#dc2626' : 'var(--primary-light)', marginTop: '2px' }}>
                            {c.uniqueId || '—'}
                          </div>
                        </div>

                        {/* NPM / Overdue / Aging Badge */}
                        {ag.isNPM ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '8px',
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: '1px solid #b91c1c',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
                            }}
                          >
                            <FiAlertTriangle size={11} />
                            🚨 NPM ({ag.daysSinceLastPayment}d Unpaid)
                          </span>
                        ) : ag.isOverdue ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.18)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <FiAlertCircle size={11} />
                            {ag.daysOverdue} Days Crossed
                          </span>
                        ) : ag.isDueSoon ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#d97706',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Due in {ag.daysRemaining} days
                          </span>
                        ) : rem > 0 ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(59, 130, 246, 0.12)',
                              color: '#3b82f6',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            On Schedule
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--success)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✓ Cleared
                          </span>
                        )}
                      </div>

                      {/* Contact & Location */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {c.contactNo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FiPhone size={11} color="var(--primary-light)" />
                            <span>{c.contactNo}</span>
                          </div>
                        )}
                        {c.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.address}>
                            <FiMapPin size={11} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Due Date & Last Payment Date Details */}
                      <div
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '0.72rem',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {/* Due Date & Days Crossed */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiCalendar size={11} color={ag.isOverdue ? '#dc2626' : 'var(--text-muted)'} />
                            Payment Due Date:
                          </span>
                          <strong style={{ color: ag.isOverdue ? '#dc2626' : 'var(--text-primary)' }}>
                            {ag.dueDate ? formatDate(ag.dueDate) : '—'}
                          </strong>
                        </div>

                        {/* Last Payment Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiClock size={11} color="var(--primary-light)" />
                            Last Payment Date:
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {ag.lastPaymentDate ? `${formatDate(ag.lastPaymentDate)} (${ag.lastPaymentMode})` : 'None yet'}
                          </span>
                        </div>
                      </div>

                      {/* Commercial Details & Progress */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Project Amount:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(pVal)}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                          <span style={{ color: ag.isOverdue ? '#dc2626' : 'var(--danger)', fontWeight: 700 }}>
                            {ag.isOverdue ? '🚨 Overdue Amount:' : 'Amount Pending:'}
                          </span>
                          <strong style={{ color: ag.isOverdue ? '#dc2626' : 'var(--danger)', fontWeight: 800 }}>
                            {formatCurrency(rem)}
                          </strong>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${paidPercent}%`,
                              height: '100%',
                              backgroundColor: paidPercent >= 100 ? 'var(--success)' : '#3b82f6',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          <span>Paid: {formatCurrency(paid)} ({paidPercent}%)</span>
                          <span>Due: {formatCurrency(rem)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. POPUP MODAL: COMPLETE 360° CUSTOMER & PAYMENT PARTICULARS */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Customer Ledger Dossier: ${selectedCustomer.customerName}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Financial KPI Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Project Value</span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(selectedCustomer.projectValue)}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>Total Collected</span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(
                    (parseFloat(selectedCustomer.projectValue) || 0) - (parseFloat(selectedCustomer.remainingAmount) || 0)
                  )}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: selectedCustomer.aging?.isOverdue ? '#dc2626' : 'var(--danger)', fontWeight: 600 }}>
                  {selectedCustomer.aging?.isOverdue ? '🚨 Overdue Amount' : 'Remaining Balance Due'}
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: selectedCustomer.aging?.isOverdue ? '#dc2626' : 'var(--danger)' }}>
                  {formatCurrency(selectedCustomer.remainingAmount)}
                </h4>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Due Date</span>
                <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 700, color: selectedCustomer.aging?.isOverdue ? '#dc2626' : 'var(--text-primary)' }}>
                  {selectedCustomer.aging?.dueDate ? formatDate(selectedCustomer.aging.dueDate) : '—'}
                </h4>
                {selectedCustomer.aging?.isOverdue && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#dc2626' }}>
                    🚨 {selectedCustomer.aging.daysOverdue} Days Crossed
                  </span>
                )}
              </div>
            </div>

            {/* Customer & Site Details */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUser size={16} color="var(--primary-light)" />
                Client Profile & Site Particulars
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Unique ID:</span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                    {selectedCustomer.uniqueId || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Contact Number:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedCustomer.contactNo ? (
                      <a href={`tel:${selectedCustomer.contactNo}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        📞 {selectedCustomer.contactNo}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Site / Installation Address:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    📍 {selectedCustomer.address || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Work Execution Status:</span>
                  <div style={{ fontWeight: 700, color: '#3b82f6' }}>
                    {selectedCustomer.statusOfWork || 'In Progress'} ({selectedCustomer.completionPercentage || 0}% Done)
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>BDE Executive Name:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedCustomer.bdeName || selectedCustomer.creator?.name || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Last Recorded Payment:</span>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {selectedCustomer.aging?.lastPaymentDate
                      ? `${formatDate(selectedCustomer.aging.lastPaymentDate)} (${selectedCustomer.aging.lastPaymentMode})`
                      : 'None yet'}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Milestone Payment Schedule */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCreditCard size={16} color="var(--success)" />
                  Milestone Collections Ledger (Token + P1 to P5)
                </h4>

                <Button
                  variant="primary"
                  size="sm"
                  icon={FiPlus}
                  onClick={() => {
                    // Set next empty milestone
                    let nextM = '1';
                    if (parseFloat(selectedCustomer.payment1Amount) > 0) nextM = '2';
                    if (parseFloat(selectedCustomer.payment2Amount) > 0) nextM = '3';
                    if (parseFloat(selectedCustomer.payment3Amount) > 0) nextM = '4';
                    if (parseFloat(selectedCustomer.payment4Amount) > 0) nextM = '5';

                    setQuickPayData({
                      milestone: nextM,
                      amount: '',
                      date: new Date().toISOString().slice(0, 10),
                      mode: 'UPI',
                    });
                    setIsQuickPayOpen(true);
                  }}
                >
                  + Record Milestone Payment
                </Button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px' }}>Milestone Stage</th>
                      <th style={{ padding: '8px' }}>Amount (₹)</th>
                      <th style={{ padding: '8px' }}>Date Received</th>
                      <th style={{ padding: '8px' }}>Payment Mode</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Booking Token */}
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>Token / Booking Advance</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--success)' }}>
                        {formatCurrency(selectedCustomer.bookingAmount)}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        {selectedCustomer.dateOfVisit ? formatDate(selectedCustomer.dateOfVisit) : 'Booking Date'}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{selectedCustomer.modeOfPayment || 'UPI'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 700 }}>
                          ✓ Received
                        </span>
                      </td>
                    </tr>

                    {/* Milestones 1 to 5 */}
                    {[1, 2, 3, 4, 5].map((m) => {
                      const amt = parseFloat(selectedCustomer[`payment${m}Amount`]) || 0;
                      const date = selectedCustomer[`payment${m}Date`];
                      const mode = selectedCustomer[`payment${m}Mode`];
                      const hasPaid = amt > 0;

                      return (
                        <tr key={m} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>Payment Milestone {m}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: hasPaid ? 'var(--success)' : 'var(--text-muted)' }}>
                            {hasPaid ? formatCurrency(amt) : '—'}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                            {date ? formatDate(date) : '—'}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{mode || '—'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            {hasPaid ? (
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 700 }}>
                                ✓ Received
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(100, 116, 139, 0.12)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <Button
                variant="secondary"
                icon={FiArrowUpRight}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate('/accounts');
                }}
              >
                Open Full Accounts Spreadsheet
              </Button>

              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. QUICK RECORD PAYMENT SUB-MODAL */}
      {selectedCustomer && (
        <Modal
          isOpen={isQuickPayOpen}
          onClose={() => setIsQuickPayOpen(false)}
          title={`Record Payment for ${selectedCustomer.customerName}`}
          size="sm"
        >
          <form onSubmit={handleSubmitQuickPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Project Value:</span>
                <strong>{formatCurrency(selectedCustomer.projectValue)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--danger)' }}>Outstanding Balance:</span>
                <strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedCustomer.remainingAmount)}</strong>
              </div>
            </div>

            <Input
              as="select"
              label="Select Payment Milestone *"
              value={quickPayData.milestone}
              onChange={(e) => setQuickPayData({ ...quickPayData, milestone: e.target.value })}
            >
              <option value="1">Payment 1 (First Milestone)</option>
              <option value="2">Payment 2 (Second Milestone)</option>
              <option value="3">Payment 3 (Third Milestone)</option>
              <option value="4">Payment 4 (Fourth Milestone)</option>
              <option value="5">Payment 5 (Final Milestone)</option>
            </Input>

            <Input
              label="Amount Received (₹) *"
              type="number"
              step="0.01"
              placeholder="e.g. 50000"
              value={quickPayData.amount}
              onChange={(e) => setQuickPayData({ ...quickPayData, amount: e.target.value })}
              required
            />

            <Input
              label="Payment Date *"
              type="date"
              value={quickPayData.date}
              onChange={(e) => setQuickPayData({ ...quickPayData, date: e.target.value })}
              required
            />

            <Input
              as="select"
              label="Payment Mode *"
              value={quickPayData.mode}
              onChange={(e) => setQuickPayData({ ...quickPayData, mode: e.target.value })}
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="NEFT">NEFT / RTGS / Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </Input>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsQuickPayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingPayment}>
                Save Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CustomerPaymentPendingCard;
