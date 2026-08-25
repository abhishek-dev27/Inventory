import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { godownService } from '../../services/godownService';
import toast from 'react-hot-toast';
import { FiMapPin, FiPlus, FiPhone, FiUser } from 'react-icons/fi';

const GodownModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: 'Jharkhand',
    address: '',
    contactPerson: '',
    contactPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    setLoading(true);
    try {
      const response = await godownService.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || formData.name.trim().substring(0, 3).toUpperCase(),
        city: formData.city.trim() || formData.name.trim(),
        state: formData.state.trim() || 'Jharkhand',
        address: formData.address.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
        contactPhone: formData.contactPhone.trim() || null,
      });

      toast.success(response.message || `Godown "${formData.name}" added successfully!`);
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
        onCreated(response.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create new godown';
      toast.error(msg);
      setErrors({ name: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Godown / Branch"
      subtitle="Register a new warehouse depot or branch location for inventory management"
      size="md"
    >
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
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} icon={FiPlus}>
              Create Godown
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default GodownModal;
