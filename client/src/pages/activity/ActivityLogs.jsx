import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiGlobe,
  FiMapPin,
  FiLogIn,
  FiLogOut,
  FiAlertCircle,
  FiInfo,
  FiX,
} from 'react-icons/fi';
import StatCard from '../../components/dashboard/StatCard';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { activityLogService } from '../../services/activityLogService';
import { formatDateTime, formatRelative } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    todayLogins: 0,
    uniqueUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 15,
  });

  // Modals
  const [selectedLog, setSelectedLog] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearDays, setClearDays] = useState('all');
  const [clearing, setClearing] = useState(false);

  // Calculate start date based on date preset
  const getDateRange = (preset) => {
    const today = new Date();
    if (preset === 'TODAY') {
      const d = today.toISOString().split('T')[0];
      return { startDate: d, endDate: d };
    }
    if (preset === 'WEEK') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      return {
        startDate: past.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    }
    if (preset === 'MONTH') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return {
        startDate: past.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    }
    return {};
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await activityLogService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const dateParams = getDateRange(dateFilter);
      const res = await activityLogService.getAll({
        page,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        ...dateParams,
      });

      if (res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { total: 0, page: 1, totalPages: 1, limit: 15 });
      }
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, actionFilter, statusFilter, roleFilter, dateFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLogs(true), fetchStats()]);
    toast.success('Logs updated');
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const params = clearDays === 'all' ? {} : { days: parseInt(clearDays, 10) };
      await activityLogService.clearLogs(params);
      toast.success('Logs cleared successfully');
      setClearDialogOpen(false);
      setPage(1);
      fetchLogs();
      fetchStats();
    } catch (err) {
      toast.error('Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = [
      'ID',
      'User Name',
      'Email',
      'Role',
      'Action',
      'Status',
      'IP Address',
      'Location',
      'Device',
      'Browser',
      'OS',
      'Details',
      'Date & Time',
    ];

    const rows = logs.map((log) => [
      log.id,
      `"${log.userName || 'Unknown'}"`,
      `"${log.userEmail}"`,
      log.role || '—',
      log.action,
      log.status,
      log.ipAddress || '—',
      `"${log.location || '—'}"`,
      log.device || '—',
      `"${log.browser || '—'}"`,
      `"${log.os || '—'}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      `"${formatDateTime(log.createdAt)}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `login_activity_logs_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const getDeviceIcon = (device = '') => {
    const d = (device || '').toLowerCase();
    if (d.includes('mobile')) return <FiSmartphone size={16} />;
    if (d.includes('tablet')) return <FiTablet size={16} />;
    return <FiMonitor size={16} />;
  };

  const getActionBadge = (action = '', status = 'SUCCESS') => {
    const act = (action || '').toUpperCase();
    const stat = (status || '').toUpperCase();

    if (stat === 'FAILED' || act === 'LOGIN_FAILED') {
      return (
        <span className="badge badge-danger" style={{ gap: '6px' }}>
          <FiAlertCircle size={13} />
          {act === 'LOGIN_FAILED' ? 'Failed Login' : `Failed ${act.replace(/_/g, ' ')}`}
        </span>
      );
    }
    if (act === 'LOGOUT') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(100, 116, 139, 0.1)',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(100, 116, 139, 0.25)',
            gap: '6px',
          }}
        >
          <FiLogOut size={13} />
          Logout
        </span>
      );
    }
    if (act === 'LOGIN') {
      return (
        <span className="badge badge-success" style={{ gap: '6px' }}>
          <FiLogIn size={13} />
          Login
        </span>
      );
    }
    if (act.includes('DELETE')) {
      return (
        <span className="badge badge-danger" style={{ gap: '6px' }}>
          <FiTrash2 size={13} />
          {act.replace(/_/g, ' ')}
        </span>
      );
    }
    return (
      <span className="badge badge-primary" style={{ gap: '6px' }}>
        <FiCheckCircle size={13} />
        {act.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Login & Activity Audit Logs</h1>
          <p className="page-subtitle">
            Track when, where, who, and from which device users access the inventory system
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
            disabled={logs.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="danger"
            icon={FiTrash2}
            onClick={() => setClearDialogOpen(true)}
          >
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Logins Recorded"
          value={stats.totalLogins}
          subtitle="All login attempts"
          icon={FiShield}
          color="primary"
        />
        <StatCard
          title="Successful Logins"
          value={stats.successfulLogins}
          subtitle="Authenticated sessions"
          icon={FiCheckCircle}
          color="success"
        />
        <StatCard
          title="Failed Attempts"
          value={stats.failedLogins}
          subtitle="Invalid credentials"
          icon={FiAlertTriangle}
          color="danger"
        />
        <StatCard
          title="Logins Today"
          value={stats.todayLogins}
          subtitle="Activity since 12:00 AM"
          icon={FiClock}
          color="primary"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <Input
              icon={FiSearch}
              placeholder="Search by user, email, IP, location, device..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Action Filter */}
          <div>
            <Input
              as="select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="LOGIN_FAILED">Failed Login</option>
              <option value="CREATE_PROPOSAL">Create Proposal</option>
              <option value="DELETE_PROPOSAL">Delete Proposal</option>
            </Input>
          </div>

          {/* Status Filter */}
          <div>
            <Input
              as="select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </Input>
          </div>

          {/* Date Filter */}
          <div>
            <Input
              as="select"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </Input>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      {loading ? (
        <Loader text="Loading login records..." />
      ) : logs.length === 0 ? (
        <div className="card empty-state">
          <FiShield size={48} />
          <h3>No activity logs found</h3>
          <p>No records match your search or filter criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Audit Trail ({pagination.total} total events)
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>User / Account</th>
                <th>Event / Status</th>
                <th>Location & IP Address</th>
                <th>Device & Browser</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  {/* User Profile */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor:
                            log.status === 'FAILED'
                              ? 'var(--danger-bg)'
                              : 'var(--primary-bg)',
                          border:
                            log.status === 'FAILED'
                              ? '1px solid var(--danger-border)'
                              : '1px solid var(--primary-border)',
                          color:
                            log.status === 'FAILED'
                              ? 'var(--danger)'
                              : 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          flexShrink: 0,
                        }}
                      >
                        {(
                          log.userName ||
                          (log.userEmail ? log.userEmail.split('@')[0] : '') ||
                          'U'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'System')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.userEmail || '—'}
                        </div>
                        {log.role && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color:
                                log.role === 'admin'
                                  ? 'var(--primary-light)'
                                  : 'var(--text-muted)',
                              marginTop: '2px',
                              display: 'inline-block',
                            }}
                          >
                            {log.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Event & Status */}
                  <td>{getActionBadge(log.action, log.status)}</td>

                  {/* Location & IP */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        <FiMapPin size={14} color="var(--primary-light)" />
                        <span>{log.location || 'Local Device / Network'}</span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          width: 'fit-content',
                        }}
                      >
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                    </div>
                  </td>

                  {/* Device & Browser */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        {getDeviceIcon(log.device)}
                        <span>{log.os || 'Unknown OS'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {log.device || 'Desktop'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {log.browser || 'Web Browser'}
                      </div>
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {formatDateTime(log.createdAt)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        {formatRelative(log.createdAt)}
                      </div>
                    </div>
                  </td>

                  {/* Details Action Button */}
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FiInfo}
                      onClick={() => setSelectedLog(log)}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - page) <= 2
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>
                        ...
                      </span>
                    )}
                    <button
                      className={p === page ? 'active' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Log Inspection Detail Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Inspector"
        subtitle={
          selectedLog
            ? `Event ID #${selectedLog.id} • ${formatDateTime(selectedLog.createdAt)}`
            : ''
        }
        maxWidth="600px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main status alert banner */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  selectedLog.status === 'FAILED'
                    ? 'var(--danger-bg)'
                    : 'var(--success-bg)',
                border:
                  selectedLog.status === 'FAILED'
                    ? '1px solid var(--danger-border)'
                    : '1px solid var(--success-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedLog.status === 'FAILED' ? (
                  <FiAlertCircle size={18} color="var(--danger)" />
                ) : (
                  <FiCheckCircle size={18} color="var(--success)" />
                )}
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      selectedLog.status === 'FAILED'
                        ? 'var(--danger)'
                        : 'var(--success)',
                  }}
                >
                  {selectedLog.action} — {selectedLog.status}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {formatRelative(selectedLog.createdAt)}
              </span>
            </div>

            {/* Grid properties */}
            <div className="grid-2" style={{ gap: '12px' }}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  User Name
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedLog.userName || '—'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Email Address
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedLog.userEmail || '—'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Role
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedLog.role || '—'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  IP Address
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>
                  {selectedLog.ipAddress || '—'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Location / Network
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedLog.location || 'Local Device / Network'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Device & OS
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedLog.device || 'Desktop'} ({selectedLog.os || 'Unknown OS'})
                </div>
              </div>
            </div>

            {/* Browser info */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Browser
              </div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {selectedLog.browser || '—'}
              </div>
            </div>

            {/* Details / Message */}
            {selectedLog.details && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Details / Notes
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.875rem' }}>
                  {selectedLog.details}
                </div>
              </div>
            )}

            {/* Raw User-Agent */}
            {selectedLog.userAgent && (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Raw User-Agent Header
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedLog.userAgent}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Logs Dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearLogs}
        title="Clear Activity Audit Logs"
        message="Choose how much audit log history you would like to purge:"
        confirmText="Confirm Purge"
        confirmVariant="danger"
        loading={clearing}
      >
        <div style={{ marginTop: '16px' }}>
          <Input
            as="select"
            value={clearDays}
            onChange={(e) => setClearDays(e.target.value)}
          >
            <option value="all">Purge All Logs (Permanent)</option>
            <option value="30">Purge Logs Older Than 30 Days</option>
            <option value="60">Purge Logs Older Than 60 Days</option>
            <option value="90">Purge Logs Older Than 90 Days</option>
          </Input>
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default ActivityLogs;
