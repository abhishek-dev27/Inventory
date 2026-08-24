import React, { useState, useEffect, useMemo } from 'react';
import Input from '../common/Input';
import Loader from '../common/Loader';
import StatCard from '../dashboard/StatCard';
import { reportService } from '../../services/reportService';
import { FiCalendar, FiArrowDownLeft, FiArrowUpRight, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const MonthlyReport = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyData = async (y, m) => {
    setLoading(true);
    try {
      const response = await reportService.getMonthlyReport(y, m);
      setReport(response.data);
    } catch (err) {
      toast.error('Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(year, month);
  }, [year, month]);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Format dailyBreakdown into charting data with useMemo
  const chartData = useMemo(() => {
    if (!report?.dailyBreakdown) return [];
    const chartDataMap = {};
    report.dailyBreakdown.forEach((row) => {
      const day = row.date;
      if (!chartDataMap[day]) {
        chartDataMap[day] = { date: day, stockIn: 0, stockOut: 0 };
      }
      if (row.type === 'in') {
        chartDataMap[day].stockIn += parseInt(row.totalQuantity, 10);
      } else {
        chartDataMap[day].stockOut += parseInt(row.totalQuantity, 10);
      }
    });
    return Object.values(chartDataMap);
  }, [report?.dailyBreakdown]);

  return (
    <div>
      {/* Month & Year Filter Bar */}
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
        <div style={{ width: '180px' }}>
          <Input
            as="select"
            label="Month"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Input>
        </div>

        <div style={{ width: '140px' }}>
          <Input
            as="select"
            label="Year"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Input>
        </div>
      </div>

      {loading ? (
        <Loader text="Compiling monthly aggregates..." />
      ) : (
        <>
          {/* Summary KPI Grid */}
          <div className="stats-grid">
            <StatCard
              title="Total Transactions"
              value={report?.totalTransactions || 0}
              subtitle="Events during month"
              icon={FiLayers}
              color="primary"
            />
            <StatCard
              title="Total Inflow"
              value={`+${report?.totalIn || 0}`}
              subtitle="Units added to warehouse"
              icon={FiArrowDownLeft}
              color="success"
            />
            <StatCard
              title="Total Outflow"
              value={`-${report?.totalOut || 0}`}
              subtitle="Units deducted / sold"
              icon={FiArrowUpRight}
              color="danger"
            />
            <StatCard
              title="Net Delta"
              value={`${report?.netChange >= 0 ? '+' : ''}${report?.netChange || 0}`}
              subtitle="Monthly net stock growth"
              icon={FiLayers}
              color={report?.netChange >= 0 ? 'success' : 'danger'}
            />
          </div>

          {/* Bar Chart Breakdown */}
          <div className="card" style={{ height: '380px', marginTop: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">Day-by-Day Volume Distribution</h3>
            </div>
            {chartData.length === 0 ? (
              <div className="empty-state">
                <p>No activity logged for this selected month</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border-hover)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '0.75rem', paddingBottom: '10px' }} />
                  <Bar dataKey="stockIn" name="Stock In" fill="#00d68f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stockOut" name="Stock Out" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyReport;
