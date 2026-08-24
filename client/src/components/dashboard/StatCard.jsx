import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';

const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'primary', // primary | success | warning | danger
  to,
  onClick,
}) => {
  const colorMap = {
    primary: {
      border: 'var(--primary-border)',
      bg: 'var(--primary-bg)',
      color: 'var(--primary-light)',
      glow: 'rgba(108, 92, 231, 0.12)',
    },
    success: {
      border: 'var(--success-border)',
      bg: 'var(--success-bg)',
      color: 'var(--success)',
      glow: 'rgba(16, 185, 129, 0.12)',
    },
    warning: {
      border: 'var(--warning-border)',
      bg: 'var(--warning-bg)',
      color: 'var(--warning)',
      glow: 'rgba(245, 158, 11, 0.12)',
    },
    danger: {
      border: 'var(--danger-border)',
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      glow: 'rgba(244, 63, 94, 0.12)',
    },
  };

  const scheme = colorMap[color] || colorMap.primary;
  const isClickable = Boolean(to || onClick);

  const cardContent = (
    <div
      className={`card ${isClickable ? 'stat-card-clickable' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        textDecoration: 'none',
        height: '100%',
        minHeight: '124px',
        padding: '18px 20px',
        borderRadius: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {isClickable && (
            <FiArrowUpRight size={12} color={scheme.color} style={{ opacity: 0.8 }} />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '5px',
            marginTop: '4px',
          }}
        >
          <span
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {subtitle && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          backgroundColor: scheme.bg,
          border: `1px solid ${scheme.border}`,
          color: scheme.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: '12px',
        }}
      >
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} style={{ cursor: 'pointer', height: '100%' }}>
        {cardContent}
      </div>
    );
  }

  return cardContent;
};

export default StatCard;
