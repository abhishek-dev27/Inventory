import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | danger | success | outline | ghost
  size = 'md', // sm | md | lg
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    fontSize: size === 'sm' ? '0.8125rem' : size === 'lg' ? '1rem' : '0.875rem',
    padding:
      size === 'sm'
        ? '6px 12px'
        : size === 'lg'
        ? '12px 24px'
        : '9px 18px',
    boxShadow: variant === 'primary' ? 'var(--shadow-glow)' : 'none',
  };

  const variantStyles = {
    primary: {
      background: 'var(--gradient-primary)',
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      background: 'var(--surface-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary-light)',
      border: '1px solid var(--primary-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
    },
    danger: {
      background: 'var(--danger)',
      color: '#ffffff',
      border: 'none',
    },
    success: {
      background: 'var(--success)',
      color: '#ffffff',
      border: 'none',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...(variantStyles[variant] || variantStyles.primary),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={combinedStyles}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} />}
    </button>
  );
};

export default Button;
