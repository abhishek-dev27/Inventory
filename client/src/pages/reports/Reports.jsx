import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiBarChart2, FiTrendingUp, FiArrowRight, FiUsers } from 'react-icons/fi';

const Reports = () => {
  const reportCards = [
    {
      to: '/reports/daily',
      title: 'Daily Stock Movement Report',
      description: 'Review day-by-day transactional ledgers, inbound receipts, outbound dispatches, and daily net stock variance.',
      icon: FiCalendar,
      color: 'primary',
      tag: 'Ledger Audit',
    },
    {
      to: '/reports/monthly',
      title: 'Monthly Summary & Analytics',
      description: 'Aggregate monthly inflow vs outflow metrics, bar distribution breakdowns, and trend trajectories.',
      icon: FiBarChart2,
      color: 'success',
      tag: 'Aggregated Trends',
    },
    {
      to: '/reports/usage',
      title: 'Product Usage & Consumption Report',
      description: 'Rank highest-velocity items, fast-moving SKUs, material depletion rates, and restock frequency rankings.',
      icon: FiTrendingUp,
      color: 'warning',
      tag: 'Demand Insights',
    },
    {
      to: '/reports/customers',
      title: 'Customer Dossier & Dispatch Details',
      description: 'Track all customer deliveries, project sites, equipment dispatch bills, unit serials, and client order valuations.',
      icon: FiUsers,
      color: 'info',
      tag: 'Client Dossier',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics Hub</h1>
          <p className="page-subtitle">Access comprehensive inventory reporting, audit trails, and data visualizers</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <Link key={rc.to} to={rc.to} style={{ textDecoration: 'none' }}>
              <div className="report-hub-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        background: rc.color === 'success' ? 'var(--success-bg)' : rc.color === 'warning' ? 'var(--warning-bg)' : 'var(--primary-bg)',
                        color: rc.color === 'success' ? 'var(--success)' : rc.color === 'warning' ? 'var(--warning)' : 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="badge badge-primary">{rc.tag}</span>
                  </div>

                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {rc.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rc.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--primary-light)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span>Open Report</span>
                  <FiArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
