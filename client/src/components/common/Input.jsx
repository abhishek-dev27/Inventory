import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Input = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  rightElement,
  disabled = false,
  required = false,
  className = '',
  style = {},
  rows,
  as = 'input', // 'input' | 'textarea' | 'select'
  children,
  showPasswordToggle = false,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const Component = as;

  const isPassword = type === 'password' || showPasswordToggle;
  const effectiveType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  };

  const labelStyle = {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.01em',
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: as === 'textarea' ? 'flex-start' : 'center',
    width: '100%',
  };

  const hasRightPadding = isPassword || rightElement;

  const baseInputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-secondary)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: Icon ? '38px' : '14px',
    paddingRight: hasRightPadding ? '42px' : '14px',
    outline: 'none',
    transition: 'all var(--transition-fast)',
    boxSizing: 'border-box',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: as === 'textarea' ? '12px' : '50%',
    transform: as === 'textarea' ? 'none' : 'translateY(-50%)',
    color: error ? 'var(--danger)' : 'var(--text-muted)',
    pointerEvents: 'none',
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: 'var(--danger)',
    marginTop: '2px',
  };

  const helperStyle = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  };

  return (
    <div style={wrapperStyle} className={`input-group ${className}`}>
      {label && (
        <label htmlFor={id || name} style={labelStyle}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div style={inputContainerStyle}>
        {Icon && <Icon size={16} style={iconStyle} />}
        <Component
          id={id || name}
          name={name}
          type={as === 'input' ? effectiveType : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={as === 'textarea' ? rows || 3 : undefined}
          style={{ ...baseInputStyle, ...style }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(108, 92, 231, 0.2)';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        >
          {children}
        </Component>

        {/* Eye icon toggle for password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--transition-fast)',
            }}
            title={isPasswordVisible ? 'Hide password' : 'Show password'}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            tabIndex={-1}
          >
            {isPasswordVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        )}

        {/* Custom rightElement if not password */}
        {!isPassword && rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
      {!error && helperText && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
};

export default Input;
