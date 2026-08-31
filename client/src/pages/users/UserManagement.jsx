import React, { useState, useEffect } from 'react';
import { FiPlus, FiUsers, FiSearch, FiMapPin, FiKey, FiClock, FiCopy, FiCheck } from 'react-icons/fi';
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
import { formatDateTime } from '../../utils/formatDate';
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
  const [historyUser, setHistoryUser] = useState(null);
  const [copiedPwdIdx, setCopiedPwdIdx] = useState(null);
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
          onViewHistory={(u) => setHistoryUser(u)}
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

      {/* Password History Modal */}
      <Modal
        isOpen={Boolean(historyUser)}
        onClose={() => {
          setHistoryUser(null);
          setCopiedPwdIdx(null);
        }}
        title={`Password History: ${historyUser?.name || 'User'}`}
        subtitle={`Audit log of current and previously saved passwords for @${historyUser?.username || historyUser?.email}`}
        maxWidth="520px"
      >
        {historyUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(108, 92, 231, 0.08)',
                border: '1px solid rgba(108, 92, 231, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Saved Password
                </span>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
                  {historyUser.savedPassword || 'Not available'}
                </div>
              </div>
              {historyUser.savedPassword && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={copiedPwdIdx === 'current' ? FiCheck : FiCopy}
                  onClick={() => {
                    navigator.clipboard.writeText(historyUser.savedPassword);
                    setCopiedPwdIdx('current');
                    toast.success('Current password copied');
                    setTimeout(() => setCopiedPwdIdx(null), 2000);
                  }}
                >
                  {copiedPwdIdx === 'current' ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock color="var(--primary-light)" /> Historical Password Changes ({Array.isArray(historyUser.passwordHistory) ? historyUser.passwordHistory.length : 0})
              </h4>

              {Array.isArray(historyUser.passwordHistory) && historyUser.passwordHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {[...historyUser.passwordHistory].reverse().map((entry, idx) => {
                    const isLatest = idx === 0;
                    const pwdText = typeof entry === 'string' ? entry : entry.password;
                    const dateText = entry.changedAt ? formatDateTime(entry.changedAt) : 'Initial Registration';
                    const isCopied = copiedPwdIdx === idx;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: isLatest ? 'var(--surface)' : 'var(--bg-secondary)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {pwdText || '—'}
                            </span>
                            {isLatest && (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                Current
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Set: {dateText}
                          </div>
                        </div>

                        {pwdText && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={isCopied ? FiCheck : FiCopy}
                            onClick={() => {
                              navigator.clipboard.writeText(pwdText);
                              setCopiedPwdIdx(idx);
                              toast.success('Historical password copied');
                              setTimeout(() => setCopiedPwdIdx(null), 2000);
                            }}
                          >
                            {isCopied ? 'Copied' : 'Copy'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  No previous password change records found.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button variant="secondary" onClick={() => setHistoryUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
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
