import React, { useState, useEffect } from 'react';
import ReportFilters from './ReportFilters';
import Loader from '../common/Loader';
import { reportService } from '../../services/reportService';
import { FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';

const UsageReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('out');
  const [usageList, setUsageList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getUsageReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type,
        limit: 30,
      });
      setUsageList(response.data || []);
    } catch (err) {
      toast.error('Failed to load consumption metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [type]);

  const handleApply = () => {
    fetchUsageData();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchUsageData();
  };

  return (
    <div>
      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setType('out')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: type === 'out' ? 'var(--danger-bg)' : 'var(--surface)',
            color: type === 'out' ? 'var(--danger)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Most Consumed / Dispatched (Outflow)
        </button>
        <button
          onClick={() => setType('in')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: type === 'in' ? 'var(--success-bg)' : 'var(--surface)',
            color: type === 'in' ? 'var(--success)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Most Restocked / Received (Inflow)
        </button>
      </div>

      {loading ? (
        <Loader text="Analyzing product usage trends..." />
      ) : usageList.length === 0 ? (
        <div className="table-container">
          <div className="empty-state">
            <FiBox />
            <p>No usage records match the filter criteria</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Total Volume ({type === 'out' ? 'Consumed' : 'Received'})</th>
                <th>Frequency (Transactions)</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {usageList.map((row, index) => (
                <tr key={row.productId}>
                  <td>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: index < 3 ? 'var(--gradient-primary)' : 'var(--surface-elevated)',
                        color: index < 3 ? '#ffffff' : 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{row.product?.name || 'Unknown Product'}</strong>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {row.product?.sku}
                  </td>
                  <td>
                    <span className="badge badge-primary">{row.product?.category}</span>
                  </td>
                  <td>
                    <strong style={{ color: type === 'out' ? 'var(--danger)' : 'var(--success)', fontSize: '1rem' }}>
                      {row.totalQuantity} units
                    </strong>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {row.transactionCount} events
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{row.product?.quantity ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsageReport;
