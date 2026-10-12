import React, { useState, useEffect } from 'react';
import { FiPlus, FiUsers, FiSearch, FiMapPin, FiKey, FiClock, FiCopy, FiCheck, FiTrash2, FiLayers, FiPhone, FiUser } from 'react-icons/fi';
import UserTable from '../../components/users/UserTable';
import UserForm from '../../components/users/UserForm';
import GodownModal from '../../components/godowns/GodownModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { userService } from '../../services/userService';
import { useGodowns } from '../../context/GodownContext';
import { useAuth } from '../../hooks/useAuth';
import { GODOWN_LOCATIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const { godowns, godownNames, fetchGodowns, deleteGodown } = useGodowns();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // 'users' or 'godowns'
  const [godownSearchTerm, setGodownSearchTerm] = useState('');
  const [godownDeleteCandidate, setGodownDeleteCandidate] = useState(null);
  const [deletingGodown, setDeletingGodown] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [godownModalOpen, setGodownModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [copiedPwdIdx, setCopiedPwdIdx] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user: currentUser, isAdmin } = useAuth();

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

  const handleDeleteGodown = async () => {
    if (!godownDeleteCandidate) return;
    setDeletingGodown(true);
    try {
      await deleteGodown(godownDeleteCandidate.id || godownDeleteCandidate.name, godownDeleteCandidate.name);
      setGodownDeleteCandidate(null);
      fetchGodowns();
    } catch (err) {
      // error handled in deleteGodown
    } finally {
      setDeletingGodown(false);
    }
  };

  const filteredGodowns = (godowns || []).filter((g) => {
    if (!godownSearchTerm.trim()) return true;
    const term = godownSearchTerm.toLowerCase();
    return (
      g.name?.toLowerCase().includes(term) ||
      g.code?.toLowerCase().includes(term) ||
      g.city?.toLowerCase().includes(term) ||
      g.state?.toLowerCase().includes(term) ||
      g.contactPerson?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {activeAdminTab === 'users' ? 'User & Access Management' : 'Warehouse Godowns & Depots'}
          </h1>
          <p className="page-subtitle">
            {activeAdminTab === 'users'
              ? 'Manage system operators, designated godown access, addresses, and permissions'
              : 'Add, view, and delete warehouse branches, depots, and storage hubs across the project'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeAdminTab === 'users' ? (
            <>
              {isAdmin && (
                <Button
                  variant="secondary"
                  icon={FiMapPin}
                  onClick={() => setActiveAdminTab('godowns')}
                >
                  Manage Godowns ({godowns?.length || godownNames.length})
                </Button>
              )}
              <Button variant="primary" icon={FiPlus} onClick={handleOpenCreateModal}>
                Add New User
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                icon={FiUsers}
                onClick={() => setActiveAdminTab('users')}
              >
                Back to Users
              </Button>
              <Button
                variant="primary"
                icon={FiPlus}
                onClick={() => setGodownModalOpen(true)}
              >
                Add New Godown
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveAdminTab('users')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeAdminTab === 'users' ? '1px solid var(--primary)' : '1px solid var(--border)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            backgroundColor: activeAdminTab === 'users' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeAdminTab === 'users' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeAdminTab === 'users' ? '0 2px 8px rgba(108, 92, 231, 0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <FiUsers size={16} />
          <span>System Users ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('godowns')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeAdminTab === 'godowns' ? '1px solid var(--primary)' : '1px solid var(--border)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            backgroundColor: activeAdminTab === 'godowns' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeAdminTab === 'godowns' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeAdminTab === 'godowns' ? '0 2px 8px rgba(108, 92, 231, 0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <FiMapPin size={16} />
          <span>Godown Branches & Depots ({godowns?.length || godownNames.length})</span>
        </button>
      </div>

      {/* VIEW 1: USERS TAB */}
      {activeAdminTab === 'users' && (
        <>
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
                {godownNames.map((loc) => (
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
        </>
      )}

      {/* VIEW 2: GODOWNS TAB WITH PROMINENT DELETE ANY GODOWN OPTION */}
      {activeAdminTab === 'godowns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Godown Search and Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: '280px' }}>
              <Input
                icon={FiSearch}
                placeholder="Search godowns by name, code, city, state, or in-charge..."
                value={godownSearchTerm}
                onChange={(e) => setGodownSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="primary"
                icon={FiPlus}
                onClick={() => setGodownModalOpen(true)}
              >
                + Add Godown
              </Button>
            </div>
          </div>

          {/* Godowns Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Code</th>
                    <th>Godown / Branch</th>
                    <th>Location / City</th>
                    <th>In-Charge Person</th>
                    <th>Contact Phone</th>
                    <th>Address</th>
                    <th style={{ width: '90px' }}>Status</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGodowns.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <FiMapPin size={28} style={{ marginBottom: '8px', opacity: 0.6 }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No godowns matched your search</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Click "+ Add Godown" to create a new location</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGodowns.map((g) => (
                      <tr key={g.id || g.name}>
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(108, 92, 231, 0.1)',
                              color: 'var(--primary-light)',
                              border: '1px solid rgba(108, 92, 231, 0.25)',
                              display: 'inline-block',
                            }}
                          >
                            {g.code || (g.name ? g.name.substring(0, 3).toUpperCase() : 'LOC')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                              {g.name}
                            </span>
                            {g.isDefault && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--bg-secondary)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiMapPin size={13} color="var(--primary-light)" />
                            {g.city || g.name}{g.state ? `, ${g.state}` : ''}
                          </span>
                        </td>
                        <td>
                          {g.contactPerson ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FiUser size={13} color="var(--text-muted)" />
                              {g.contactPerson}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          {g.contactPhone ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FiPhone size={13} color="var(--text-muted)" />
                              {g.contactPhone}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              maxWidth: '180px',
                              display: 'inline-block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={g.address || ''}
                          >
                            {g.address || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            Active
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={FiTrash2}
                            onClick={() => setGodownDeleteCandidate(g)}
                            title={`Delete Godown "${g.name}"`}
                            style={{
                              fontSize: '0.78rem',
                              padding: '5px 12px',
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
          godowns={godownNames}
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

      {/* Confirm Delete User Dialog */}
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

      {/* Confirm Delete Godown Dialog */}
      <ConfirmDialog
        isOpen={Boolean(godownDeleteCandidate)}
        onClose={() => setGodownDeleteCandidate(null)}
        onConfirm={handleDeleteGodown}
        title={`Delete Godown "${godownDeleteCandidate?.name}"?`}
        message={`Are you sure you want to permanently delete Godown "${godownDeleteCandidate?.name}" (${godownDeleteCandidate?.code || ''}) from the entire project? Any existing products assigned to this location will safely be updated to 'Unassigned'.`}
        confirmText="Yes, Delete Godown"
        confirmVariant="danger"
        loading={deletingGodown}
      />
    </div>
  );
};

export default UserManagement;
