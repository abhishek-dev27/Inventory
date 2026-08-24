import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  FiClock,
  FiAlertTriangle,
  FiActivity,
  FiCheckCircle,
  FiArrowRight,
  FiTrendingUp,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
} from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Button from '../common/Button';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';

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
          Count: <strong style={{ color: '#ffffff' }}>{data.value} Accounts</strong>
        </div>
        {data.amount > 0 && (
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Value: <strong style={{ color: '#ffffff' }}>{formatCurrency(data.amount)}</strong>
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: data.color, fontWeight: 700, marginTop: '2px' }}>
          {data.percentage ? `${data.percentage.toFixed(1)}% Share` : ''}
        </div>
      </div>
    );
  }
  return null;
};

const ProjectPerformanceAndNPMCard = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'npm', 'ontime', 'ongoing'
  const [movingNPM, setMovingNPM] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountService.getAll({ limit: 500 });
      setAccounts(res.data || []);
    } catch (err) {
      console.error('Failed to load project performance accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Compute On-Time, NPM, and Ongoing Metrics
  const analytics = useMemo(() => {
    let totalAccounts = accounts.length;
    let onTimeSettled = 0;
    let onTimeAmount = 0;
    let lateSettled = 0;
    let lateAmount = 0;
    let overdueActive = 0;
    let overdueAmount = 0;
    let upcomingActive = 0;
    let upcomingAmount = 0;

    let npmList = [];
    let ongoingList = [];
    let completedList = [];

    accounts.forEach((a) => {
      const pVal = parseFloat(a.projectValue) || 0;
      const rem = parseFloat(a.remainingAmount) || 0;
      const comp = parseInt(a.completionPercentage) || 0;
      const statusStr = (a.statusOfWork || '').toLowerCase();
      const ag = a.aging || {};

      // 1. On-Time Payment Settlement Breakdown
      if (ag.isCleared) {
        if (ag.paidOnTime) {
          onTimeSettled++;
          onTimeAmount += pVal;
        } else {
          lateSettled++;
          lateAmount += pVal;
        }
      } else if (ag.isOverdue) {
        overdueActive++;
        overdueAmount += rem;
      } else {
        upcomingActive++;
        upcomingAmount += rem;
      }

      // 2. NPM (No Progress in 3+ Months / 90+ Days)
      if (ag.isNPM) {
        npmList.push(a);
      } else if (ag.isOngoing) {
        ongoingList.push(a);
      } else if (comp >= 100 || statusStr.includes('complete') || statusStr.includes('handover')) {
        completedList.push(a);
      }
    });

    const totalSettled = onTimeSettled + lateSettled;
    const onTimeRate = totalSettled > 0 ? (onTimeSettled / totalSettled) * 100 : 0;

    return {
      totalAccounts,
      onTimeSettled,
      onTimeAmount,
      lateSettled,
      lateAmount,
      overdueActive,
      overdueAmount,
      upcomingActive,
      upcomingAmount,
      totalSettled,
      onTimeRate,
      npmList,
      ongoingList,
      completedList,
    };
  }, [accounts]);

  // On-Time Payment Donut Chart Data
  const onTimeChartData = useMemo(() => {
    const total = analytics.totalAccounts || 1;
    const slices = [];

    if (analytics.onTimeSettled > 0) {
      slices.push({
        name: 'Settled On-Time ⚡',
        value: analytics.onTimeSettled,
        amount: analytics.onTimeAmount,
        color: '#10b981',
        percentage: (analytics.onTimeSettled / total) * 100,
      });
    }

    if (analytics.lateSettled > 0) {
      slices.push({
        name: 'Settled with Delay',
        value: analytics.lateSettled,
        amount: analytics.lateAmount,
        color: '#f59e0b',
        percentage: (analytics.lateSettled / total) * 100,
      });
    }

    if (analytics.overdueActive > 0) {
      slices.push({
        name: 'Overdue Dues',
        value: analytics.overdueActive,
        amount: analytics.overdueAmount,
        color: '#dc2626',
        percentage: (analytics.overdueActive / total) * 100,
      });
    }

    if (analytics.upcomingActive > 0) {
      slices.push({
        name: 'On-Schedule Dues',
        value: analytics.upcomingActive,
        amount: analytics.upcomingAmount,
        color: '#3b82f6',
        percentage: (analytics.upcomingActive / total) * 100,
      });
    }

    if (slices.length === 0) {
      slices.push({
        name: 'No Payment Records',
        value: 1,
        amount: 0,
        color: '#64748b',
        percentage: 100,
      });
    }

    return slices;
  }, [analytics]);

  // Move project to NPM status
  const handleMoveToNPM = async (accountId, custName) => {
    try {
      setMovingNPM(accountId);
      await accountService.update(accountId, {
        statusOfWork: 'NPM (No Progress in 3+ Months)',
      });
      toast.success(`Project for ${custName} moved to NPM status`);
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to update project status');
    } finally {
      setMovingNPM(null);
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
      {/* 1. Header & Navigation Tabs */}
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <FiActivity size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Project Velocity, NPM (3+ Months Inactive) & On-Time Settlements
              {analytics.npmList.length > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.15)',
                    color: '#dc2626',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FiAlertTriangle size={12} />
                  {analytics.npmList.length} Stagnant (NPM)
                </span>
              )}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Identify 3+ months stagnant sites (NPM), on-time customer collections compliance, and ongoing progress velocity
            </p>
          </div>
        </div>

        {/* Filter Chips & View All Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
          <div
            className="scrollable-tabs-bar"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                border: 'none',
                background: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              All Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('npm')}
              style={{
                border: 'none',
                background: activeTab === 'npm' ? '#dc2626' : 'transparent',
                color: activeTab === 'npm' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              🚨 NPM Inactive ({analytics.npmList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ontime')}
              style={{
                border: 'none',
                background: activeTab === 'ontime' ? 'var(--success)' : 'transparent',
                color: activeTab === 'ontime' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              🟢 On-Time Settled ({analytics.onTimeSettled})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ongoing')}
              style={{
                border: 'none',
                background: activeTab === 'ongoing' ? '#3b82f6' : 'transparent',
                color: activeTab === 'ongoing' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Live Sites ({analytics.ongoingList.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0' }}>
          <Loader message="Analyzing project milestones and payment timeliness..." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* TOP SECTION: 2 ANALYTICS CHARTS (ON-TIME SETTLEMENTS & PROJECT VELOCITY) */}
          {(activeTab === 'all' || activeTab === 'ontime') && (
            <div className="performance-charts-grid">
              {/* CHART 1: ON-TIME PAYMENT SETTLEMENT COMPLIANCE */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiClock size={16} color="var(--success)" />
                      On-Time Payment Settlement Rate
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Clients settling full milestone dues on or before due date
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--success)',
                    }}
                  >
                    {analytics.onTimeRate.toFixed(1)}% On-Time
                  </span>
                </div>

                {/* Donut Chart */}
                <div style={{ width: '100%', height: '210px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={onTimeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={90}
                        paddingAngle={3}
                        cornerRadius={5}
                        dataKey="value"
                        stroke="var(--surface)"
                        strokeWidth={2}
                      >
                        {onTimeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                        content={<CustomTooltip />}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      backgroundColor: 'var(--surface)',
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      On-Time Rate
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                      {analytics.onTimeRate.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {analytics.onTimeSettled} of {analytics.totalSettled} Settled
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.78rem' }}>
                  <div style={{ padding: '8px 10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 700 }}>🟢 On-Time Settled</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {analytics.onTimeSettled} Accounts ({formatCurrency(analytics.onTimeAmount)})
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700 }}>🟡 Delayed Settled</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {analytics.lateSettled} Accounts ({formatCurrency(analytics.lateAmount)})
                    </div>
                  </div>
                </div>
              </div>

              {/* CHART 2: ONGOING PROJECT COMPLETION VELOCITY */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiTrendingUp size={16} color="#3b82f6" />
                      Live Ongoing Project Execution & Velocity
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Active sites undergoing dispatch, installation, and commissioning
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                    }}
                  >
                    {analytics.ongoingList.length} Active Sites
                  </span>
                </div>

                {/* Ongoing Projects Progress Bars */}
                {analytics.ongoingList.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <FiCheckCircle size={28} color="var(--success)" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0 }}>All active projects are fully handed over!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {analytics.ongoingList.map((a) => {
                      const comp = parseInt(a.completionPercentage) || 0;
                      const ag = a.aging || {};

                      return (
                        <div
                          key={a.id}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: 'var(--surface)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.customerName}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: '6px', fontFamily: 'monospace' }}>
                                {a.uniqueId}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>
                              {comp}% Done
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '4px' }}>
                            <div
                              style={{
                                width: `${comp}%`,
                                height: '100%',
                                backgroundColor: comp >= 75 ? 'var(--success)' : comp >= 40 ? '#3b82f6' : '#f59e0b',
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span>Stage: <strong style={{ color: 'var(--text-secondary)' }}>{a.statusOfWork || 'In Progress'}</strong></span>
                            <span>{ag.daysSinceStart ? `${ag.daysSinceStart} days active` : 'Active'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: 🚨 NPM STAGNANT PROJECTS DASHBOARD (3+ MONTHS INACTIVE) */}
          {(activeTab === 'all' || activeTab === 'npm') && (
            <div
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.04)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAlertTriangle size={18} />
                    NPM (Non-Performing Milestones / 3+ Months Inactive Projects)
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                      }}
                    >
                      {analytics.npmList.length} Action Needed
                    </span>
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Projects initiated over 90 days (3 months) ago with 0% progress, stalled material dispatch, or dormant milestone payments
                  </p>
                </div>
              </div>

              {analytics.npmList.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <FiCheckCircle size={32} color="var(--success)" style={{ marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Zero Stagnant Projects! 🎉
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No projects have remained stalled or inactive for 3+ months without progress.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {analytics.npmList.map((a) => {
                    const ag = a.aging || {};
                    const pVal = parseFloat(a.projectValue) || 0;
                    const rem = parseFloat(a.remainingAmount) || 0;

                    return (
                      <div
                        key={a.id}
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid rgba(220, 38, 38, 0.35)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
                        }}
                      >
                        {/* Title & Stalled Counter */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{a.customerName}</strong>
                            <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 700, marginTop: '2px' }}>
                              {a.uniqueId}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(220, 38, 38, 0.15)',
                              color: '#dc2626',
                              border: '1px solid rgba(220, 38, 38, 0.3)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⚠️ {ag.daysSinceStart} Days Stalled
                          </span>
                        </div>

                        {/* Contact & Location */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {a.contactNo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiPhone size={11} color="var(--primary-light)" />
                              <span>{a.contactNo}</span>
                            </div>
                          )}
                          {a.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <FiMapPin size={11} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Start Date & Inactivity Reason */}
                        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <div>Started: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(a.createdAt)}</strong></div>
                          <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                            0% work executed since contract initiation
                          </div>
                        </div>

                        {/* Commercials & 1-Click Move to NPM Button */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contract:</span>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {formatCurrency(pVal)}
                            </div>
                          </div>

                          <Button
                            variant="danger"
                            size="sm"
                            loading={movingNPM === a.id}
                            onClick={() => handleMoveToNPM(a.id, a.customerName)}
                            title="Officially tag this project as NPM (No Progress Milestone)"
                          >
                            Mark as NPM
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPerformanceAndNPMCard;
