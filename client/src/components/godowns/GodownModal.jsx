import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Loader from '../common/Loader';
import ConfirmDialog from '../common/ConfirmDialog';
import { useGodowns } from '../../context/GodownContext';
import { FiMapPin, FiPlus, FiPhone, FiUser, FiTrash2, FiLayers, FiSearch, FiCheckCircle } from 'react-icons/fi';

const GodownModal = ({ isOpen, onClose, onCreated, defaultTab = 'list' }) => {
  const { godowns, loading, fetchGodowns, addGodown, deleteGodown } = useGodowns();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: 'Jharkhand',
    address: '',
    contactPerson: '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchGodowns();
      setActiveTab(defaultTab);
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen, defaultTab, fetchGodowns]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) {
      errs.name = 'Godown name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || formData.name.trim().substring(0, 3).toUpperCase(),
        city: formData.city.trim() || formData.name.trim(),
        state: formData.state.trim() || 'Jharkhand',
        address: formData.address.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        contactPhone: formData.contactPhone.trim() || null,
      };

      const res = await addGodown(payload);
      setFormData({
        name: '',
        code: '',
        city: '',
        state: 'Jharkhand',
        address: '',
        contactPerson: '',
        contactPhone: '',
      });

      if (onCreated) {
        onCreated(res.data);
      }
      // Switch back to list to see the newly added godown
      setActiveTab('list');
    } catch (err) {
      // Handled by toast in addGodown
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGodown = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await deleteGodown(deleteCandidate.id || deleteCandidate.name, deleteCandidate.name);
      setDeleteCandidate(null);
    } catch (err) {
      // Error toast is handled in deleteGodown
    } finally {
      setDeleting(false);
    }
  };

  const filteredGodowns = (godowns || []).filter((g) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.name?.toLowerCase().includes(term) ||
      g.code?.toLowerCase().includes(term) ||
      g.city?.toLowerCase().includes(term) ||
      g.state?.toLowerCase().includes(term) ||
      g.contactPerson?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Godown & Branch Management"
        subtitle="Manage warehouse godowns, depots, and storage locations across the entire project"
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Tabs Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'list' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'list' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <FiLayers size={14} />
                <span>All Godowns ({godowns?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('add')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'add' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'add' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <FiPlus size={14} />
                <span>Add New Godown</span>
              </button>
            </div>

            {activeTab === 'list' && (
              <Button
                variant="primary"
                size="sm"
                icon={FiPlus}
                onClick={() => setActiveTab('add')}
              >
                New Godown
              </Button>
            )}
          </div>

          {/* TAB 1: LIST OF GODOWNS */}
          {activeTab === 'list' && (
            <div>
              {/* Search filter */}
              <div style={{ marginBottom: '12px' }}>
                <Input
                  icon={FiSearch}
                  placeholder="Filter godowns by name, city, state, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading && (!godowns || godowns.length === 0) ? (
                <div style={{ padding: '28px 0', textAlign: 'center' }}>
                  <Loader text="Loading registered godowns..." />
                </div>
              ) : filteredGodowns.length === 0 ? (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-elevated)',
                  }}
                >
                  <FiMapPin size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {searchTerm ? 'No godowns match your search' : 'No godowns registered yet'}
                  </p>
                  <p style={{ margin: '4px 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Add a new warehouse branch or depot to make it available across all forms and reports.
                  </p>
                  <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setActiveTab('add')}>
                    Add Godown Now
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingRight: '4px',
                  }}
                >
                  {filteredGodowns.map((g) => (
                    <div
                      key={g.id || g.name}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(108, 92, 231, 0.12)',
                            color: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                            border: '1px solid rgba(108, 92, 231, 0.25)',
                          }}
                        >
                          {g.code || g.name.substring(0, 3).toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {g.name}
                            </span>
                            {g.code && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--bg-secondary)',
                                  color: 'var(--text-secondary)',
                                  fontFamily: 'monospace',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {g.code}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)',
                                fontWeight: 600,
                              }}
                            >
                              Active
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              flexWrap: 'wrap',
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FiMapPin size={12} color="var(--primary-light)" />
                              {g.city || g.name}{g.state ? `, ${g.state}` : ''}
                            </span>

                            {g.contactPerson && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FiUser size={12} />
                                {g.contactPerson}
                              </span>
                            )}

                            {g.contactPhone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FiPhone size={12} />
                                {g.contactPhone}
                              </span>
                            )}
                          </div>

                          {g.address && (
                            <p
                              style={{
                                margin: '4px 0 0',
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={g.address}
                            >
                              📍 {g.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Delete action button */}
                      <div>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={FiTrash2}
                          onClick={() => setDeleteCandidate(g)}
                          title={`Delete Godown "${g.name}"`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total registered locations: <strong>{godowns?.length || 0}</strong>
                </span>
                <Button variant="secondary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: ADD NEW GODOWN FORM */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <Input
                    label="Godown / Branch Name"
                    name="name"
                    placeholder="e.g. Bokaro, Dhanbad, Delhi Hub"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    autoFocus
                  />

                  <Input
                    label="Branch Code"
                    name="code"
                    placeholder="e.g. BKR, DHN"
                    value={formData.code}
                    onChange={handleChange}
                    helperText="Short code for SKU & vouchers"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="City"
                    name="city"
                    placeholder="e.g. Bokaro Steel City"
                    value={formData.city}
                    onChange={handleChange}
                  />

                  <Input
                    label="State"
                    name="state"
                    placeholder="e.g. Jharkhand, Bihar"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    icon={FiUser}
                    label="Branch In-Charge / Person"
                    name="contactPerson"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />

                  <Input
                    icon={FiPhone}
                    label="Contact Phone"
                    name="contactPhone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.contactPhone}
                    onChange={handleChange}
                  />
                </div>

                <Input
                  as="textarea"
                  label="Physical Warehouse Address"
                  name="address"
                  placeholder="Plot No., Industrial Area, Landmark, Pincode..."
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setActiveTab('list')}
                    disabled={submitting}
                  >
                    ← Back to List
                  </Button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={submitting} icon={FiPlus}>
                      Create Godown
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Godown Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteGodown}
        title={`Delete Godown "${deleteCandidate?.name}"?`}
        message={`Are you sure you want to permanently delete "${deleteCandidate?.name}" from the system? Any existing products assigned to this location will be safely moved to Unassigned.`}
        confirmText="Yes, Delete Godown"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
};

export default GodownModal;
