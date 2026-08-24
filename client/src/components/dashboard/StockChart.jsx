import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { reportService } from '../../services/reportService';
import Loader from '../common/Loader';
import {
  FiTrendingUp,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCalendar,
  FiActivity,
  FiBarChart2,
  FiLayers,
} from 'react-icons/fi';

// Deluxe Floating Tooltip
const CustomTooltip = ({ active, payload, label, fullDateMap }) => {
  if (active && payload && payload.length) {
    const stockInVal = payload.find((p) => p.dataKey === 'stockIn')?.value || 0;
    const stockOutVal = payload.find((p) => p.dataKey === 'stockOut')?.value || 0;
    const netFlow = stockInVal - stockOutVal;
    const fullDate = fullDateMap?.[label] || label;

    return (
      <div
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
          minWidth: '200px',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '6px',
          }}
        >
          <FiCalendar size={13} color="#a29bfe" />
          <span>{fullDate}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#34d399',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              Inward Stock:
            </span>
            <strong style={{ fontWeight: 700 }}>+{stockInVal} units</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#f87171',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f43f5e',
                  boxShadow: '0 0 6px #f43f5e',
                }}
              />
              Outward Stock:
            </span>
            <strong style={{ fontWeight: 700 }}>-{stockOutVal} units</strong>
          </div>

          <div
            style={{
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Net Daily Flow:</span>
            <span
              style={{
                fontWeight: 800,
                color: netFlow > 0 ? '#34d399' : netFlow < 0 ? '#f87171' : '#94a3b8',
              }}
            >
              {netFlow > 0 ? `+${netFlow}` : netFlow} units
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const StockChart = () => {
  const [chartData, setChartData] = useState([]);
  const [fullDateMap, setFullDateMap] = useState({});
  const [days, setDays] = useState(7);
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, net: 0 });

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await reportService.getChartData(days);
        const raw = response.data || [];

        // Generate complete date timeline for selected period
        const dateMap = {};
        const fullDates = {};
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const isoKey = d.toISOString().split('T')[0];
          const shortLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          const fullLabel = d.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          dateMap[isoKey] = {
            dateKey: isoKey,
            displayDate: shortLabel,
            stockIn: 0,
            stockOut: 0,
          };
          fullDates[shortLabel] = fullLabel;
        }

        // Aggregate actual transaction records into the timeline
        let totalIn = 0;
        let totalOut = 0;

        raw.forEach((row) => {
          const dKey = row.date;
          const qty = parseInt(row.totalQuantity, 10) || 0;
          if (dateMap[dKey]) {
            if (row.type === 'in') {
              dateMap[dKey].stockIn += qty;
              totalIn += qty;
            } else {
              dateMap[dKey].stockOut += qty;
              totalOut += qty;
            }
          }
        });

        const timelineList = Object.values(dateMap).map((item) => ({
          displayDate: item.displayDate,
          stockIn: item.stockIn,
          stockOut: item.stockOut,
          net: item.stockIn - item.stockOut,
        }));

        setChartData(timelineList);
        setFullDateMap(fullDates);
        setSummary({ totalIn, totalOut, net: totalIn - totalOut });
      } catch (err) {
        console.error('Failed to load chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [days]);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header with Title, Summary Pills & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6c5ce7 0%, #00d68f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 10px rgba(108, 92, 231, 0.3)',
              }}
            >
              <FiActivity size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                Stock Movement & Flow Dynamics
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time inward replenishment vs outward site dispatch trend
              </span>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <FiArrowDownLeft size={13} />
              Inflow: +{summary.totalIn} units
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#f43f5e',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <FiArrowUpRight size={13} />
              Outflow: -{summary.totalOut} units
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                border: '1px solid rgba(108, 92, 231, 0.25)',
                color: 'var(--primary-light)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <FiTrendingUp size={13} />
              Net: {summary.net >= 0 ? `+${summary.net}` : summary.net} units
            </span>
          </div>
        </div>

        {/* View Toggle & Range Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Chart View Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setChartType('area')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: chartType === 'area' ? 'var(--primary)' : 'transparent',
                color: chartType === 'area' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all var(--transition-fast)',
              }}
              title="Smooth Wave Area Chart"
            >
              <FiLayers size={13} />
              Wave
            </button>

            <button
              type="button"
              onClick={() => setChartType('bar')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: chartType === 'bar' ? 'var(--primary)' : 'transparent',
                color: chartType === 'bar' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all var(--transition-fast)',
              }}
              title="Comparison Bar Chart"
            >
              <FiBarChart2 size={13} />
              Bars
            </button>
          </div>

          {/* Timeframe selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: days === d ? 'var(--primary)' : 'transparent',
                  color: days === d ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: '310px' }}>
        {loading ? (
          <Loader text="Rendering movement dynamics..." />
        ) : chartData.length === 0 ? (
          <div className="empty-state" style={{ padding: '50px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No transaction movements found for this period</p>
          </div>
        ) : chartType === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 15, left: -15, bottom: 0 }}>
              <defs>
                {/* Glowing Emerald Gradient for Stock In */}
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.55} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>

                {/* Glowing Coral/Rose Gradient for Stock Out */}
                <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--border)"
                opacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="displayDate"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                dy={6}
              />

              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip fullDateMap={fullDateMap} />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.78rem', paddingBottom: '12px', fontWeight: 600 }}
              />

              <Area
                type="monotone"
                dataKey="stockIn"
                name="Stock In (Inward)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#emeraldGradient)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />

              <Area
                type="monotone"
                dataKey="stockOut"
                name="Stock Out (Dispatch)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#roseGradient)"
                activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 15, left: -15, bottom: 0 }} barGap={4}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--border)"
                opacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="displayDate"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                dy={6}
              />

              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip fullDateMap={fullDateMap} />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.78rem', paddingBottom: '12px', fontWeight: 600 }}
              />

              <Bar
                dataKey="stockIn"
                name="Stock In (Inward)"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />

              <Bar
                dataKey="stockOut"
                name="Stock Out (Dispatch)"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StockChart;
