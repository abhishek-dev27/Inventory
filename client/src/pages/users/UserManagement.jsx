import React, { useState, useEffect } from 'react';
import { FiPlus, FiUsers, FiSearch } from 'react-icons/fi';
import UserTable from '../../components/users/UserTable';
import UserForm from '../../components/users/UserForm';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({
        search: searchTerm,
        role: roleFilter,
      });
      setUsers(response.data || []);
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
  }, [searchTerm, roleFilter]);

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
        toast.success('User updated successfully');
      } else {
        await userService.create(formData);
        toast.success('User created successfully');
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
          <p className="page-subtitle">Manage system operators, role credentials, and permissions</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenCreateModal}>
          Add New User
        </Button>
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
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '180px' }}>
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
        title={editingUser ? 'Edit User Details' : 'Create New System User'}
        subtitle={editingUser ? `Editing ${editingUser.name}` : 'Assign staff or admin permissions'}
        maxWidth="480px"
      >
        <UserForm
          initialData={editingUser || {}}
          onSubmit={handleFormSubmit}
          loading={formSubmitting}
          isEdit={Boolean(editingUser)}
        />
      </Modal>

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
