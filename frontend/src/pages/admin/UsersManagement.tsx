import React, { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';
import { User } from '@/types/auth';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, toast, removeToast } = useToast();

  // Confirm modal state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', variant: 'danger', onConfirm: () => {} });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Skill chip state
  const [skillInput, setSkillInput] = useState('');
  const skillInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    department: '',
    designation: '',
    role: 'employee',
    bio: '',
    isActive: true,
    isAvailable: true,
    skillset: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    confirmLabel: string,
    variant: 'danger' | 'warning' | 'info',
    onConfirm: () => void
  ) => {
    setConfirm({ open: true, title, message, confirmLabel, variant, onConfirm });
  };

  const handleDelete = (id: string) => {
    confirmAction(
      'Deactivate User',
      'Are you sure you want to deactivate this user? They will lose access to the platform.',
      'Deactivate',
      'danger',
      async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await userService.deleteUser(id);
          toast.success('User deactivated', 'The user has been deactivated successfully.');
          fetchUsers();
        } catch (err: any) {
          toast.error('Failed to deactivate user', err.message);
        }
      }
    );
  };

  const handleRestore = (id: string) => {
    confirmAction(
      'Restore User',
      'This will re-enable the user\'s access to the platform.',
      'Restore',
      'info',
      async () => {
        setConfirm((c) => ({ ...c, open: false }));
        try {
          await userService.restoreUser(id);
          toast.success('User restored', 'The user account has been restored successfully.');
          fetchUsers();
        } catch (err: any) {
          toast.error('Failed to restore user', err.message);
        }
      }
    );
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        phone: (user as any).phone || '',
        department: (user as any).department || '',
        designation: (user as any).designation || '',
        role: user.role,
        bio: (user as any).bio || '',
        isActive: user.isActive ?? true,
        isAvailable: user.isAvailable ?? true,
        skillset: user.skillset ? [...user.skillset] : [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        department: '',
        designation: '',
        role: 'employee',
        bio: '',
        isActive: true,
        isAvailable: true,
        skillset: [],
      });
    }
    setSkillInput('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Skill chip management
  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skillset.includes(skill)) {
      setFormData((f) => ({ ...f, skillset: [...f.skillset, skill] }));
    }
    setSkillInput('');
    skillInputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    setFormData((f) => ({ ...f, skillset: f.skillset.filter((s) => s !== skill) }));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    } else if (e.key === 'Backspace' && !skillInput && formData.skillset.length > 0) {
      setFormData((f) => ({ ...f, skillset: f.skillset.slice(0, -1) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        bio: formData.bio,
        isActive: formData.isActive,
      };

      if (formData.role === 'employee') {
        payload.isAvailable = formData.isAvailable;
        payload.skillset = formData.skillset;
      }

      if (editingUser) {
        await userService.updateUser(editingUser.uid, payload);
        toast.success('User updated', 'User information has been saved successfully.');
      } else {
        await authService.signup({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role as 'admin' | 'employee' | 'client',
          phone: formData.phone || undefined,
          department: formData.department || undefined,
          designation: formData.designation || undefined,
          bio: formData.bio || undefined,
          skillset: formData.role === 'employee' ? formData.skillset : undefined,
        });
        toast.success('User created', `${formData.full_name} has been added to the platform.`);
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to save user', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'employee': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'client': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">User Management</h1>
          <p className="text-white/70 font-navbar mt-2">Manage roles, availability, and access across the platform.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-10 px-4 py-2 font-navbar"
        >
          <i className="fas fa-plus"></i> Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>{error}
        </div>
      )}

      <div className="bg-[#0f181a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs uppercase tracking-wider font-navbar">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Skills</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2 text-primary"></i>
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-navbar text-sm text-white font-medium">{user.full_name}</div>
                      {(user as any).designation && (
                        <div className="text-xs text-white/40 font-navbar">{(user as any).designation}</div>
                      )}
                    </td>
                    <td className="p-4 font-navbar text-sm text-white/70">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)} uppercase tracking-wider`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.skillset?.slice(0, 3).map((s) => (
                          <span key={s} className="bg-white/10 text-white/70 text-xs px-1.5 py-0.5 rounded font-navbar">{s}</span>
                        ))}
                        {(user.skillset?.length ?? 0) > 3 && (
                          <span className="text-white/40 text-xs font-navbar">+{(user.skillset?.length ?? 0) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {(user as any).isDeleted ? (
                        <span className="inline-flex items-center text-red-400 text-sm"><i className="fas fa-ban mr-1.5 text-xs"></i> Deactivated</span>
                      ) : user.isActive ? (
                        <span className="inline-flex items-center text-success text-sm"><i className="fas fa-check-circle mr-1.5 text-xs"></i> Active</span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-400 text-sm"><i className="fas fa-clock mr-1.5 text-xs"></i> Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(user)} className="p-2 text-white/50 hover:text-primary transition-colors rounded-lg hover:bg-white/10" title="Edit User">
                          <i className="fas fa-edit"></i>
                        </button>
                        {(user as any).isDeleted ? (
                          <button onClick={() => handleRestore(user.uid)} className="p-2 text-white/50 hover:text-success transition-colors rounded-lg hover:bg-white/10" title="Restore User">
                            <i className="fas fa-trash-restore"></i>
                          </button>
                        ) : (
                          <button onClick={() => handleDelete(user.uid)} className="p-2 text-white/50 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10" title="Deactivate User">
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Enhanced User Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121c1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold font-navbar">{editingUser ? 'Edit User Profile' : 'Add New User'}</h2>
                <p className="text-sm text-white/50 font-navbar mt-0.5">{editingUser ? 'Update user information and permissions.' : 'Create a new platform user with role and details.'}</p>
              </div>
              <button onClick={closeModal} className="text-white/50 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

              {/* ─── Account Credentials (new users only) ─── */}
              {!editingUser && (
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 font-navbar">Account Credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Email <span className="text-red-400">*</span></label>
                      <input
                        type="email" required
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="user@company.com"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Password <span className="text-red-400">*</span></label>
                      <input
                        type="password" required minLength={6}
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 6 characters"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Personal Information ─── */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 font-navbar">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text" required
                      value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Role & Organization ─── */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 font-navbar">Role & Organization</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Role <span className="text-red-400">*</span></label>
                    <select
                      value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="employee">Employee</option>
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Department</label>
                    <input
                      type="text"
                      value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Engineering"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Designation</label>
                    <input
                      type="text"
                      value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Developer"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Skills (Employee only) ─── */}
              {formData.role === 'employee' && (
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 font-navbar">Skills & Availability</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Skills</label>
                    <div className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 focus-within:border-primary transition-colors min-h-[44px] flex flex-wrap gap-1.5 items-center">
                      {formData.skillset.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 text-xs px-2 py-1 rounded-full font-navbar">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition-colors ml-0.5">
                            <i className="fas fa-times text-[10px]"></i>
                          </button>
                        </span>
                      ))}
                      <input
                        ref={skillInputRef}
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder={formData.skillset.length === 0 ? 'Type a skill and press Enter or comma…' : 'Add more…'}
                        className="flex-1 min-w-[140px] bg-transparent outline-none text-white text-sm font-navbar placeholder:text-white/30"
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-1 font-navbar">Press <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Enter</kbd> or <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">,</kbd> to add a skill. <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Backspace</kbd> to remove last.</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox" id="isAvailable"
                      checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-black accent-primary"
                    />
                    <label htmlFor="isAvailable" className="text-sm font-medium text-white/70 font-navbar">
                      Available for new task assignments
                    </label>
                  </div>
                </div>
              )}

              {/* ─── Bio ─── */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1 font-navbar">Bio / Notes</label>
                <textarea
                  rows={2}
                  value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Short description or admin notes about this user…"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-navbar focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* ─── Account Status (edit only) ─── */}
              {editingUser && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <input
                    type="checkbox" id="isActive"
                    checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-black/50 accent-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-white/70 font-navbar">Account Active</label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors font-navbar">
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-black transition-colors font-navbar disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting && <i className="fas fa-spinner fa-spin text-xs"></i>}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
