import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiBox, FiLayers, FiDollarSign, FiArrowRight, FiShield, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/formatCurrency';

const GODOWN_THEMES = {
  Ranchi: {
    color: '#6c5ce7',
    bgLight: 'rgba(108, 92, 231, 0.1)',
    border: 'rgba(108, 92, 231, 0.25)',
    iconBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    tag: 'Central Hub',
  },
  Jamshedpur: {
    color: '#00b894',
    bgLight: 'rgba(0, 184, 148, 0.1)',
    border: 'rgba(0, 184, 148, 0.25)',
    iconBg: 'linear-gradient(135deg, #00b894, #55efc4)',
    tag: 'Industrial Hub',
  },
  Hazaribagh: {
    color: '#0984e3',
    bgLight: 'rgba(9, 132, 227, 0.1)',
    border: 'rgba(9, 132, 227, 0.25)',
    iconBg: 'linear-gradient(135deg, #0984e3, #74b9ff)',
    tag: 'Regional Depot',
  },
  Patna: {
    color: '#e17055',
    bgLight: 'rgba(225, 112, 85, 0.1)',
    border: 'rgba(225, 112, 85, 0.25)',
    iconBg: 'linear-gradient(135deg, #e17055, #fab1a0)',
    tag: 'State Capital Hub',
  },
  Daltonganj: {
    color: '#fdcb6e',
    bgLight: 'rgba(253, 203, 110, 0.15)',
    border: 'rgba(253, 203, 110, 0.35)',
    iconBg: 'linear-gradient(135deg, #e1b12c, #f5cd79)',
    tag: 'Western Depot',
  },
};

const GodownDistributionCard = ({ godownBreakdown = [], totalStock = 0 }) => {
  const navigate = useNavigate();

  const handleNavigateToGodown = (godownName) => {
    navigate(`/products?location=${encodeURIComponent(godownName)}`, {
      state: { location: godownName },
    });
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '28px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
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
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(108, 92, 231, 0.25)',
            }}
          >
            <FiMapPin size={22} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Godown & Branch Stock Groups
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                margin: '2px 0 0 0',
              }}
            >
              Multi-location inventory distribution across Ranchi, Jamshedpur, Hazaribagh, Patna & Daltonganj
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/products')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-light)';
              e.currentTarget.style.color = 'var(--primary-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            View All Godowns <FiArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5 Godown Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {godownBreakdown.map((g) => {
          const theme = GODOWN_THEMES[g.name] || {
            color: '#6c5ce7',
            bgLight: 'rgba(108, 92, 231, 0.1)',
            border: 'rgba(108, 92, 231, 0.25)',
            iconBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            tag: 'Branch Godown',
          };

          const percentage = totalStock > 0 ? ((g.totalQuantity / totalStock) * 100).toFixed(1) : '0';

          return (
            <div
              key={g.name}
              onClick={() => handleNavigateToGodown(g.name)}
              style={{
                borderRadius: '14px',
                border: `1px solid ${theme.border}`,
                backgroundColor: 'var(--surface-elevated)',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${theme.bgLight}, var(--shadow-md)`;
                e.currentTarget.style.borderColor = theme.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              {/* Top Row: Godown Name & Badge */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: theme.iconBg,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: `0 3px 8px ${theme.bgLight}`,
                      }}
                    >
                      🏢
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {g.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: theme.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {theme.tag}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: theme.bgLight,
                      color: theme.color,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {percentage}%
                  </span>
                </div>

                {/* Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      In-Stock Units
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {g.totalQuantity} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>pcs</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      Distinct SKUs
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {g.productCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>items</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Valuation & Action link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border)',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ color: 'var(--text-secondary)' }}>
                  Valuation: <strong style={{ color: 'var(--text-primary)' }}>{CURRENCY_SYMBOL}{formatCurrency(g.totalValuation || 0)}</strong>
                </div>

                <div
                  style={{
                    color: theme.color,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  View <FiArrowRight size={12} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GodownDistributionCard;
