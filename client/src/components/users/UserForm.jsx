import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { ROLES } from '../../utils/constants';

const UserForm = ({ initialData = {}, onSubmit, loading = false, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.STAFF,
    ...initialData,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
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
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'var(--danger)' };
    if (score <= 4) return { score, text: 'Moderate', color: '#f59e0b' };
    return { score, text: 'Strong', color: 'var(--success)' };
  };

  const strength = calculateStrength(formData.password);
  const isAccountLocked = Boolean(initialData?.lockUntil && new Date(initialData.lockUntil) > new Date());

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Full name is required';
    if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!isEdit || (isEdit && formData.password)) {
      const pwd = formData.password;
      if (!pwd || pwd.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(pwd)) {
        newErrors.password = 'Must contain at least 1 uppercase letter (A-Z)';
      } else if (!/[a-z]/.test(pwd)) {
        newErrors.password = 'Must contain at least 1 lowercase letter (a-z)';
      } else if (!/[0-9]/.test(pwd)) {
        newErrors.password = 'Must contain at least 1 number (0-9)';
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)) {
        newErrors.password = 'Must contain at least 1 special character (!@#$%^&*)';
      }
    }

    if (!formData.role) newErrors.role = 'Role selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
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
          placeholder="e.g. Jane Doe"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="jane@inventory.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div>
          <Input
            label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={!isEdit}
            helperText="Requires min 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 symbol"
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

        <Input
          as="select"
          label="System Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          error={errors.role}
          required
        >
          <option value={ROLES.STAFF}>Staff (Manage inventory, transactions, reports)</option>
          <option value={ROLES.ADMIN}>Admin (Full access + user management)</option>
        </Input>

        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default UserForm;
