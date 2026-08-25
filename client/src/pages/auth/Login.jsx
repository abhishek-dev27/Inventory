import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiLayers,
  FiArrowRight,
  FiShield,
  FiSun,
  FiUser,
  FiCheckCircle,
  FiBox,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'staff'
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier?.trim() || !formData.password) {
      setError('Please enter your username or mobile number and password');
      return;
    }

    setLoading(true);
    try {
      await login(formData.identifier.trim(), formData.password);
      toast.success(
        selectedRole === 'admin'
          ? 'Welcome to Administrator Portal'
          : 'Welcome to Staff & Operations Portal'
      );
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username, mobile number, or password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = selectedRole === 'admin';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #fef3e2 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Radiant Background Ambient Gradient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: isAdmin
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(70px)',
          transition: 'all 0.5s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Geometric Dot Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(99, 102, 241, 0.12) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow:
            '0 20px 60px rgba(79, 70, 229, 0.14), 0 4px 16px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          position: 'relative',
          zIndex: 1,
          animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Solar ERP Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '0.76rem',
              fontWeight: 800,
              color: '#d97706',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)',
              letterSpacing: '0.04em',
            }}
          >
            <FiSun size={14} color="#f59e0b" />
            <span>SOLAR & INDUSTRIAL ERP</span>
          </div>
        </div>

        {/* Branding & Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <img
            src="/logo.png"
            alt="Sologix Energy"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              padding: '3px',
              margin: '0 auto 12px',
              display: 'block',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '2px solid rgba(255,255,255,0.9)',
            }}
          />
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Sologix <span style={{ color: isAdmin ? '#4f46e5' : '#059669' }}>Energy</span>
          </h1>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isAdmin ? '#4f46e5' : '#059669',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '3px',
            }}
          >
            Private Limited
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: '#64748b',
              marginTop: '6px',
            }}
          >
            {isAdmin
              ? 'Administrator security portal with full governance'
              : 'Staff & Technician operational ledger portal'}
          </p>
        </div>

        {/* SEPARATE LOGIN BUTTONS / ROLE SELECTOR TABS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '22px',
          }}
        >
          {/* Admin Tab Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isAdmin ? '#ffffff' : 'transparent',
              color: isAdmin ? '#4f46e5' : '#64748b',
              fontWeight: isAdmin ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: isAdmin ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <FiShield size={15} color={isAdmin ? '#4f46e5' : '#64748b'} />
            <span>Admin Portal</span>
          </button>

          {/* Staff Tab Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch('staff')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: !isAdmin ? '#ffffff' : 'transparent',
              color: !isAdmin ? '#059669' : '#64748b',
              fontWeight: !isAdmin ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: !isAdmin ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <FiUser size={15} color={!isAdmin ? '#059669' : '#64748b'} />
            <span>Staff Portal</span>
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Input
              label={isAdmin ? 'Administrator Username or Mobile No' : 'Staff Username or Mobile No'}
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Enter username or mobile number"
              value={formData.identifier}
              onChange={handleChange}
              icon={FiUser}
              autoComplete="username"
              style={{
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
              }}
              required
            />
          </div>

          <div>
            <Input
              label="Account Password"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              icon={FiLock}
              showPasswordToggle={true}
              autoComplete="current-password"
              style={{
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
              }}
              required
            />
          </div>

          {/* DEDICATED ROLE SIGN IN BUTTON */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={FiArrowRight}
            iconPosition="right"
            style={{
              width: '100%',
              marginTop: '4px',
              padding: '13px',
              fontSize: '0.95rem',
              fontWeight: 800,
              background: isAdmin
                ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)'
                : 'linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: isAdmin
                ? '0 6px 20px rgba(79, 70, 229, 0.35)'
                : '0 6px 20px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.3s ease',
            }}
          >
            {loading
              ? 'Authenticating...'
              : isAdmin
              ? 'Sign In as Administrator'
              : 'Sign In as Staff / Technician'}
          </Button>
        </form>

        {/* Feature Badges Highlight */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '6px 4px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', display: 'block' }}>
              ⚡ Solar Tech
            </span>
            <span style={{ fontSize: '0.65rem', color: '#65a30d' }}>Inverters & Panels</span>
          </div>

          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 4px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', display: 'block' }}>
              🔩 Materials
            </span>
            <span style={{ fontSize: '0.65rem', color: '#3b82f6' }}>Consumable & Spare</span>
          </div>

          <div
            style={{
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              padding: '6px 4px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9333ea', display: 'block' }}>
              🛡️ Audit
            </span>
            <span style={{ fontSize: '0.65rem', color: '#a855f7' }}>Activity Logs</span>
          </div>
        </div>

        {/* Security Footer Assurance */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '0.74rem',
            fontWeight: 500,
          }}
        >
          <FiShield size={13} color="#16a34a" />
          <span>256-Bit Encrypted Session & Login Tracking Active</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
