import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Loader from '../common/Loader';
import TransactionTable from '../stock/TransactionTable';
import StatCard from '../dashboard/StatCard';
import { reportService } from '../../services/reportService';
import { getTodayISO } from '../../utils/formatDate';
import { FiCalendar, FiArrowDownLeft, FiArrowUpRight, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DailyReport = () => {
  const [date, setDate] = useState(getTodayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyData = async (selectedDate) => {
    setLoading(true);
    try {
      const response = await reportService.getDailyReport(selectedDate);
      setReport(response.data);
    } catch (err) {
      toast.error('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData(date);
  }, [date]);

  return (
    <div>
      {/* Date Picker Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ width: '220px' }}>
          <Input
            label="Select Statement Date"
            type="date"
            icon={FiCalendar}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader text="Generating daily ledger statement..." />
      ) : (
        <>
          {/* Summary KPI Grid */}
          <div className="stats-grid">
            <StatCard
              title="Transactions"
              value={report?.totalTransactions || 0}
              subtitle="Logged on this date"
              icon={FiLayers}
              color="primary"
            />
            <StatCard
              title="Total Inbound"
              value={`+${report?.totalIn || 0}`}
              subtitle="Stock units received"
              icon={FiArrowDownLeft}
              color="success"
            />
            <StatCard
              title="Total Outbound"
              value={`-${report?.totalOut || 0}`}
              subtitle="Stock units deducted"
              icon={FiArrowUpRight}
              color="danger"
            />
            <StatCard
              title="Net Stock Delta"
              value={`${report?.netChange >= 0 ? '+' : ''}${report?.netChange || 0}`}
              subtitle="Inbound minus Outbound"
              icon={FiLayers}
              color={report?.netChange >= 0 ? 'success' : 'danger'}
            />
          </div>

          {/* Transactions Details */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Daily Transactions Breakdown ({date})</h3>
            </div>
            <TransactionTable transactions={report?.transactions || []} />
          </div>
        </>
      )}
    </div>
  );
};

export default DailyReport;
