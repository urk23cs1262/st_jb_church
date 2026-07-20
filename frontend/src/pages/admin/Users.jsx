import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrash2, FiEdit, FiUserCheck, FiUserX, FiX, FiSliders, FiShield, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import { useForm } from 'react-hook-form';
import MemberSettingsModal from '../../components/admin/MemberSettingsModal';

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [settingsMember, setSettingsMember] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'requests' ? 'requests' : 'users'); // 'users' | 'requests'
  const [requestHistory, setRequestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search && { search }) });
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const fetchRequestHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/permission-requests/admin/history');
      setRequestHistory(res.data.requests || []);
    } catch { toast.error('Failed to fetch permission request audit log'); }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'requests') fetchRequestHistory();
  }, [page, search, activeTab]);

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setValue('name', user.name || '');
    setValue('email', user.email || '');
    setValue('phone', user.phone || '');
    setValue('parishMemberId', user.parishMemberId || '');
    setValue('role', user.role || 'user');
  };

  const onUpdateUser = async (data) => {
    try {
      await api.put(`/users/${editingUser._id}`, data);
      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, ...data } : u));
      toast.success('User details updated');
      setEditingUser(null);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="w-full">
      <div className="p-4 sm:p-6">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-church-royal-blue">Manage Users ({total})</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Parish members registry & enterprise privacy governance</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-church-gold text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Members List
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'requests' ? 'bg-church-gold text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FiShield /> Permission Requests Log
            </button>
          </div>
        </div>

        {activeTab === 'users' ? (
          <>
            <div className="flex justify-end mb-4">
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="church-input pl-10 w-full text-sm" placeholder="Search users..." />
              </div>
            </div>

            {loading ? <SectionLoader /> : (
              <div className="glass-card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase text-gray-400">
                      <th className="text-left py-3 px-4">Member</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-gray-50 hover:bg-gold-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                              <p className="text-gray-400 text-xs">{u.email || u.parishMemberId || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.phone}</td>
                        <td className="py-3 px-4"><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'} capitalize`}>{u.role}</span></td>
                        <td className="py-3 px-4">
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSettingsMember(u)} className="p-1.5 rounded-lg hover:bg-gold-100 text-church-gold transition-colors" title="View / Request Member Settings">
                              <FiSliders />
                            </button>
                            <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title={u.isActive ? 'Deactivate' : 'Activate'}>
                              {u.isActive ? <FiUserX className="text-red-500" /> : <FiUserCheck className="text-green-500" />}
                            </button>
                            <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Edit User">
                              <FiEdit className="text-gray-400 hover:text-church-royal-blue" />
                            </button>
                            <button onClick={() => deleteUser(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && <p className="text-center py-10 text-gray-400">No users found</p>}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Showing {users.length} of {total}</p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-40">← Prev</button>
                    <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-40">Next →</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Permission Requests Audit Log Tab */
          <div className="glass-card p-4">
            <h2 className="font-bold text-base text-church-royal-blue mb-4 flex items-center gap-2">
              <FiShield className="text-church-gold" /> Permission Request Audit Log
            </h2>
            {loadingHistory ? <SectionLoader /> : requestHistory.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">No permission requests recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-500 uppercase border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Requested By</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Requested Changes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requestHistory.map(req => (
                      <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {req.userId?.name} <span className="text-gray-400 block text-[10px] font-normal">{req.userId?.phone}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">{req.adminId?.name || 'Admin'}</td>
                        <td className="py-3 px-4 text-gray-700 italic max-w-xs truncate">{req.reason}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {Object.entries(req.requestedChanges || {}).map(([key, diff]) => (
                              <p key={key} className="text-[11px] text-gray-600">
                                <span className="font-semibold text-gray-800">{diff.label}:</span>{' '}
                                <span className="line-through text-gray-400">{String(diff.old)}</span> →{' '}
                                <span className="font-bold text-church-royal-blue">{String(diff.new)}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {req.status === 'approved' && <FiCheckCircle />}
                            {req.status === 'rejected' && <FiXCircle />}
                            {req.status === 'pending' && <FiClock />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Settings Modal */}
      {settingsMember && (
        <MemberSettingsModal member={settingsMember} onClose={() => setSettingsMember(null)} />
      )}


      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-church-royal-blue">Edit User Details</h2>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit(onUpdateUser)} className="space-y-4">
                <div>
                  <label className="church-label">Full Name *</label>
                  <input {...register('name', { required: true })} className="church-input" placeholder="Name" />
                </div>
                <div>
                  <label className="church-label">Phone Number *</label>
                  <input {...register('phone', { required: true })} className="church-input" placeholder="Phone" />
                </div>
                <div>
                  <label className="church-label">Email Address</label>
                  <input {...register('email')} type="email" className="church-input" placeholder="Email" />
                </div>
                <div>
                  <label className="church-label">Parish Member ID</label>
                  <input {...register('parishMemberId')} className="church-input" placeholder="e.g. M-12345" />
                </div>
                <div>
                  <label className="church-label">User Role *</label>
                  <select {...register('role', { required: true })} className="church-select">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3">
                    {isSubmitting ? 'Saving...' : 'Update Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
