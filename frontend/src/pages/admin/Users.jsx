import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiTrash2, FiEdit, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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

  useEffect(() => { fetchUsers(); }, [page, search]);

  const toggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const promoteAdmin = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { role: user.role === 'admin' ? 'user' : 'admin' });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed'); }
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
    <div className="min-h-screen bg-church-cream  pt-20 lg:pl-64">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-church-royal-blue ">Manage Users ({total})</h1>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="church-input pl-10 w-64" placeholder="Search users..." />
          </div>
        </div>

        {loading ? <SectionLoader /> : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200  text-xs uppercase text-gray-400">
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
                    className="border-b border-gray-50  hover:bg-gold-50  transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800  text-sm">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.email || u.parishMemberId || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 ">{u.phone}</td>
                    <td className="py-3 px-4"><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'} capitalize`}>{u.role}</span></td>
                    <td className="py-3 px-4">
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-gray-100  text-gray-500 transition-colors" title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive ? <FiUserX className="text-red-500" /> : <FiUserCheck className="text-green-500" />}
                        </button>
                        <button onClick={() => promoteAdmin(u)} className="p-1.5 rounded-lg hover:bg-gray-100  text-gray-500 transition-colors" title="Toggle admin">
                          <FiEdit className={u.role === 'admin' ? 'text-church-gold' : 'text-gray-400'} />
                        </button>
                        <button onClick={() => deleteUser(u._id)} className="p-1.5 rounded-lg hover:bg-red-50  text-red-500 transition-colors" title="Delete">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 ">
              <p className="text-sm text-gray-500">Showing {users.length} of {total}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-100  text-sm disabled:opacity-40">← Prev</button>
                <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-100  text-sm disabled:opacity-40">Next →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
