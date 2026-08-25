import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import GodownModal from '../godowns/GodownModal';
import { ROLES, GODOWN_LOCATIONS, ALL_LOCATIONS_OPTION } from '../../utils/constants';
import { FiPlus } from 'react-icons/fi';

const UserForm = ({ initialData = {}, onSubmit, loading = false, isEdit = false, godowns = [] }) => {
  const [godownList, setGodownList] = useState(godowns && godowns.length > 0 ? godowns : GODOWN_LOCATIONS);
  const [showGodownModal, setShowGodownModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    role: ROLES.STAFF,
    assignedLocation: ALL_LOCATIONS_OPTION,
    address: '',
    ...initialData,
  });

  useEffect(() => {
    if (godowns && godowns.length > 0) {
      setGodownList(godowns);
    }
  }, [godowns]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        name: initialData.name || '',
        username: initialData.username || (initialData.name ? initialData.name.toLowerCase().replace(/[^a-z0-9]/g, '') : ''),
        phone: initialData.phone || '',
        assignedLocation: initialData.assignedLocation || ALL_LOCATIONS_OPTION,
        address: initialData.address || '',
        password: '', // keep blank on edit unless intentionally changing
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const [unlockAccount, setUnlockAccount] = useState(false);

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'var(--danger)' };
    if (score <= 3) return { score, text: 'Moderate', color: '#f59e0b' };
    return { score, text: 'Strong', color: 'var(--success)' };
  };

  const strength = calculateStrength(formData.password);
  const isAccountLocked = Boolean(initialData?.lockUntil && new Date(initialData.lockUntil) > new Date());

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.username?.trim() && !formData.phone?.trim()) {
      newErrors.username = 'Either Username or Mobile Number is required for login';
    }

    if (!isEdit || (isEdit && formData.password)) {
      const pwd = formData.password;
      if (!pwd || pwd.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (!formData.role) newErrors.role = 'Role selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanUsername = (formData.username || formData.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPhone = (formData.phone || '').trim();

    const payload = {
      name: formData.name.trim(),
      username: cleanUsername,
      phone: cleanPhone || null,
      email: initialData.email || `${cleanUsername || cleanPhone}@sologix.local`,
      role: formData.role,
      assignedLocation: formData.assignedLocation,
      address: formData.address ? formData.address.trim() : null,
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    if (unlockAccount) {
      payload.unlockAccount = true;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isAccountLocked && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong style={{ color: '#dc2626', fontSize: '0.85rem' }}>🔒 Account is Locked</strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#991b1b' }}>
                User exceeded maximum failed login attempts.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
              <input
                type="checkbox"
                checked={unlockAccount}
                onChange={(e) => setUnlockAccount(e.target.checked)}
              />
              Unlock Now
            </label>
          </div>
        )}

        <Input
          label="Full Name"
          name="name"
          placeholder="Enter person's name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Username (Login ID)"
            name="username"
            type="text"
            placeholder="e.g. palji, dilip, user1"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            helperText="User can use this username to sign in"
          />

          <Input
            label="Mobile Number"
            name="phone"
            type="tel"
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            helperText="User can also use this mobile number to sign in"
          />
        </div>

        <div>
          <Input
            label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            name="password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={!isEdit}
            helperText="Minimum 6 characters"
          />

          {formData.password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Password Strength:</span>
                <span style={{ color: strength.color }}>{strength.text}</span>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: strength.color,
                    transition: 'width 0.3s ease, background-color 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            as="select"
            label="System Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            error={errors.role}
            required
          >
            <option value={ROLES.STAFF}>Staff (Location restricted)</option>
            <option value={ROLES.ADMIN}>Admin (Full access to all godowns)</option>
          </Input>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Designated Godown / Location Access <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGodownModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <FiPlus size={12} /> Add New Godown
              </button>
            </div>
            <select
              name="assignedLocation"
              value={formData.assignedLocation}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
              required
            >
              <option value={ALL_LOCATIONS_OPTION}>All Locations (Full Access)</option>
              {godownList.map((loc) => (
                <option key={loc} value={loc}>
                  🏢 {loc} Godown
                </option>
              ))}
            </select>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formData.role === ROLES.ADMIN
                ? 'Admins have access to all, but can set a home branch'
                : 'Staff will only see inventory & records for this place'}
            </p>
          </div>
        </div>

        <Input
          as="textarea"
          label="Person / Staff Address"
          name="address"
          placeholder="Enter physical address, branch office, or residential address..."
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          rows={2}
          helperText="Admin can view & modify address to adjust place access at any time"
        />

        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </div>

      {showGodownModal && (
        <GodownModal
          isOpen={showGodownModal}
          onClose={() => setShowGodownModal(false)}
          onCreated={(newGodown) => {
            setGodownList((prev) => [...new Set([...prev, newGodown.name])]);
            setFormData((prev) => ({ ...prev, assignedLocation: newGodown.name }));
          }}
        />
      )}
    </form>
  );
};

export default UserForm;
