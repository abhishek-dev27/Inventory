import React, { useState, useEffect } from 'react';
import { FiPlus, FiUsers, FiSearch, FiMapPin } from 'react-icons/fi';
import UserTable from '../../components/users/UserTable';
import UserForm from '../../components/users/UserForm';
import GodownModal from '../../components/godowns/GodownModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { userService } from '../../services/userService';
import { godownService } from '../../services/godownService';
import { useAuth } from '../../hooks/useAuth';
import { GODOWN_LOCATIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [godowns, setGodowns] = useState(GODOWN_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [godownModalOpen, setGodownModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user: currentUser, isAdmin } = useAuth();

  const fetchGodowns = async () => {
    try {
      const response = await godownService.getAll();
      if (response.data && response.data.length > 0) {
        setGodowns(response.data.map((g) => g.name));
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({
        search: searchTerm,
        role: roleFilter,
      });
      let result = response.data || [];
      if (locationFilter) {
        result = result.filter((u) => u.assignedLocation === locationFilter);
      }
      setUsers(result);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(debounce);
  }, [searchTerm, roleFilter, locationFilter]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        toast.success('User details & place access updated');
      } else {
        await userService.create(formData);
        toast.success('User created with designated access');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await userService.delete(deleteCandidate.id);
      toast.success('User deleted successfully');
      setDeleteCandidate(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User & Access Management</h1>
          <p className="page-subtitle">Manage system operators, designated godown access, addresses, and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <Button
              variant="secondary"
              icon={FiMapPin}
              onClick={() => setGodownModalOpen(true)}
            >
              Add New Godown
            </Button>
          )}
          <Button variant="primary" icon={FiPlus} onClick={handleOpenCreateModal}>
            Add New User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <Input
            icon={FiSearch}
            placeholder="Search by name, username, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '160px' }}>
          <Input
            as="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admins</option>
            <option value="staff">Staff</option>
          </Input>
        </div>

        <div style={{ width: '190px' }}>
          <Input
            as="select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All Godown Places</option>
            <option value="All Locations">All Locations</option>
            {godowns.map((loc) => (
              <option key={loc} value={loc}>
                🏢 {loc}
              </option>
            ))}
          </Input>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loader text="Loading user accounts..." />
      ) : (
        <UserTable
          users={users}
          onEdit={handleOpenEditModal}
          onDelete={(u) => setDeleteCandidate(u)}
          currentUserId={currentUser?.id}
        />
      )}

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User & Godown Access' : 'Create New System User'}
        subtitle={editingUser ? `Editing profile & place access for ${editingUser.name}` : 'Assign staff or admin permissions and godown location'}
        maxWidth="540px"
      >
        <UserForm
          initialData={editingUser || {}}
          onSubmit={handleFormSubmit}
          loading={formSubmitting}
          isEdit={Boolean(editingUser)}
          godowns={godowns}
        />
      </Modal>

      {/* Add New Godown Modal */}
      <GodownModal
        isOpen={godownModalOpen}
        onClose={() => setGodownModalOpen(false)}
        onCreated={(newGodown) => {
          fetchGodowns();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteCandidate?.name}" (${deleteCandidate?.email})? They will lose all access.`}
        confirmText="Delete User"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default UserManagement;
