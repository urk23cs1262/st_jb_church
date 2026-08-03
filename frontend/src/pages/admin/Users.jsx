import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrash2, FiEdit, FiUserCheck, FiUserX, FiX, FiSliders, FiShield, FiClock, FiCheckCircle, FiXCircle, FiFileText, FiTag, FiMaximize, FiLoader } from 'react-icons/fi';
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

  // Member QR Scan & Lookup State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanCodeInput, setScanCodeInput] = useState('');
  const [scannedUserResult, setScannedUserResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Member ID Format State
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [formatData, setFormatData] = useState({ prefix: 'SJDB_M', padLength: 2, sample: 'SJDB_M01' });
  const [newPrefix, setNewPrefix] = useState('SJDB_M');
  const [newPadLength, setNewPadLength] = useState(2);
  const [isUpdatingFormat, setIsUpdatingFormat] = useState(false);

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

  const fetchFormatInfo = async () => {
    try {
      const res = await api.get('/users/member-id-format');
      if (res.data.success) {
        setFormatData(res.data);
        setNewPrefix(res.data.prefix || 'SJDB_M');
        setNewPadLength(res.data.padLength || 2);
      }
    } catch (e) {
      console.error('Failed to fetch format info:', e);
    }
  };

  const openFormatModal = () => {
    fetchFormatInfo();
    setShowFormatModal(true);
  };

  const handleUpdateFormat = async (e) => {
    e.preventDefault();
    if (!newPrefix || !newPrefix.trim()) {
      return toast.error('Please enter a valid Member ID prefix');
    }
    setIsUpdatingFormat(true);
    const toastId = toast.loading('Regenerating Member IDs for all users...');
    try {
      const res = await api.post('/users/update-member-id-format', {
        prefix: newPrefix.trim(),
        padLength: Number(newPadLength)
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Member IDs regenerated successfully!', { id: toastId });
        setShowFormatModal(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update format', { id: toastId });
    } finally {
      setIsUpdatingFormat(false);
    }
  };

  const handleScanLookup = async (codeToSearch) => {
    const code = codeToSearch || scanCodeInput;
    if (!code || !code.trim()) {
      return toast.error('Please enter or scan a Member ID / QR code');
    }
    setIsScanning(true);
    setScannedUserResult(null);
    try {
      const res = await api.get(`/users/lookup/scan?code=${encodeURIComponent(code.trim())}`);
      if (res.data.success) {
        setScannedUserResult(res.data.user);
        toast.success(`Member found: ${res.data.user.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'No member found matching scanned code');
    } finally {
      setIsScanning(false);
    }
  };

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
    setValue('gender', user.gender || '');
    setValue('dob', user.dob ? new Date(user.dob).toISOString().slice(0, 10) : '');
    setValue('address', user.address || '');
    setValue('subStation', user.subStation || '');
    setValue('familyName', user.familyName || '');
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
    } catch { toast.error('Failed'); }
  };

  const downloadUserPdf = async (userId, userName) => {
    const toastId = toast.loading(`Generating PDF for ${userName}...`);
    try {
      const res = await api.get(`/users/${userId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `User_${(userName || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to download PDF report', { id: toastId });
    }
  };

  const downloadAllUsersPdf = async () => {
    const toastId = toast.loading('Generating All Users PDF Report...');
    try {
      const res = await api.get('/users/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `All_Users_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Master Users PDF exported successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to export master PDF report', { id: toastId });
    }
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
          
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
            {/* <button
              onClick={() => { setShowScanModal(true); setScannedUserResult(null); setScanCodeInput(''); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
              title="Scan QR code or search member to view text & PDF"
            >
              <FiMaximize className="text-sm" /> 📷 Scan Member QR
            </button> */}

            <button
              onClick={downloadAllUsersPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
              title="Export All Users PDF Report"
            >
              <FiFileText className="text-sm" /> Export All PDF
            </button>

            <button
              onClick={openFormatModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
              title="Modify Member ID Prefix & Number Format"
            >
              <FiTag className="text-sm" /> Modify Member ID Format
            </button>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl whitespace-nowrap">
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
                      <th className="text-left py-3 px-4">Member ID</th>
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
                              <p className="text-gray-400 text-xs">{u.email || u.subStation || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                            {u.parishMemberId || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.phone}</td>
                        <td className="py-3 px-4"><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'} capitalize`}>{u.role}</span></td>
                        <td className="py-3 px-4">
                          <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => downloadUserPdf(u._id, u.name)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Download PDF Report">
                              <FiFileText />
                            </button>
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingUser(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-church-royal-blue">Edit User Details</h2>
                  <p className="text-xs text-gray-500">Update member personal profile, church & role information</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><FiX size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit(onUpdateUser)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="church-label">Full Name *</label>
                    <input {...register('name', { required: true })} className="church-input" placeholder="Full Name" />
                  </div>

                  <div>
                    <label className="church-label">Gender</label>
                    <select {...register('gender')} className="church-select">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="church-label">Date of Birth</label>
                    <input type="date" {...register('dob')} className="church-input" />
                  </div>

                  <div>
                    <label className="church-label">Phone Number *</label>
                    <input {...register('phone', { required: true })} className="church-input" placeholder="Phone Number" />
                  </div>

                  <div>
                    <label className="church-label">Email Address</label>
                    <input {...register('email')} type="email" className="church-input" placeholder="Email Address" />
                  </div>

                  <div>
                    <label className="church-label">Parish Member ID (Editable)</label>
                    <input {...register('parishMemberId')} className="church-input font-mono font-bold text-church-royal-blue bg-amber-50/50 border-amber-300" placeholder="e.g. SJDB_M01" />
                  </div>

                  <div>
                    <label className="church-label">Family Name</label>
                    <input {...register('familyName')} className="church-input" placeholder="Family Name" />
                  </div>

                  <div>
                    <label className="church-label">Sub-Station</label>
                    <input {...register('subStation')} className="church-input" placeholder="Sub-station (e.g. Kalayarkoil)" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="church-label">User Role *</label>
                    <select {...register('role', { required: true })} className="church-select">
                      <option value="user">User (Parish Member)</option>
                      <option value="admin">Admin (Full System Access)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="church-label">Residential Address</label>
                    <textarea {...register('address')} rows={2} className="church-input py-2.5 resize-none" placeholder="Enter full address" />
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button" 
                    onClick={() => downloadUserPdf(editingUser._id, editingUser.name)} 
                    className="btn-outline-gold flex-1 justify-center py-2.5 flex items-center gap-2 text-xs font-bold shadow-sm"
                  >
                    <FiFileText size={16} /> Download User PDF Report
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-gold flex-1 justify-center py-2.5">
                    {isSubmitting ? 'Saving...' : 'Save & Update Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modify Member ID Format Modal */}
        {showFormatModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowFormatModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-church-royal-blue flex items-center gap-2">
                    <FiTag className="text-church-gold" /> Modify Member ID Format
                  </h2>
                  <p className="text-xs text-gray-500">Configure global member ID structure for all current & future members</p>
                </div>
                <button onClick={() => setShowFormatModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><FiX size={20} /></button>
              </div>

              <form onSubmit={handleUpdateFormat} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5"><FiTag /> Format Comparison Overview:</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-300/60 shadow-2xs">
                      <span className="text-gray-500 block font-sans text-[10px] font-semibold mb-0.5">Previous Format:</span>
                      <span className="font-bold text-gray-800 break-all">{formatData.prefix || 'SJDB_M'}01, {formatData.prefix || 'SJDB_M'}02...</span>
                    </div>
                    <div className="bg-amber-100/90 p-2.5 rounded-lg border border-amber-400 font-bold text-amber-950 shadow-2xs">
                      <span className="text-amber-800 block font-sans text-[10px] font-semibold mb-0.5">New Format Preview:</span>
                      <span className="break-all">{newPrefix.trim() || 'SJDB_M'}{String(1).padStart(Number(newPadLength), '0')}, {newPrefix.trim() || 'SJDB_M'}{String(2).padStart(Number(newPadLength), '0')}...</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="church-label">Member ID Prefix *</label>
                  <input 
                    value={newPrefix} 
                    onChange={e => setNewPrefix(e.target.value.toUpperCase())} 
                    className="church-input font-mono font-bold tracking-wider uppercase text-church-royal-blue" 
                    placeholder="e.g. SJDB_M, STJDB_, PARISH_"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Letters, numbers, and underscores (e.g. SJDB_M &rarr; SJDB_M01)</p>
                </div>

                <div>
                  <label className="church-label">Number Digits Format *</label>
                  <select 
                    value={newPadLength} 
                    onChange={e => setNewPadLength(Number(e.target.value))} 
                    className="church-select font-mono"
                  >
                    <option value={2}>2 Digits (01, 02, 03... 99)</option>
                    <option value={3}>3 Digits (001, 002, 003... 999)</option>
                    <option value={4}>4 Digits (0001, 0002, 0003... 9999)</option>
                  </select>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    <strong>Note:</strong> Saving will immediately re-generate and re-assign Member IDs for all {total} existing members in sequential order of registration date, and apply this format to all new user registrations.
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowFormatModal(false)} className="btn-ghost flex-1 justify-center py-2.5 text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdatingFormat} className="btn-gold flex-1 justify-center py-2.5 text-xs font-bold shadow-gold">
                    {isUpdatingFormat ? 'Regenerating IDs...' : 'Apply Format to All Users'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member QR Scan & Profile Lookup Modal */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative border border-church-gold/20"
            >
              <button
                onClick={() => setShowScanModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
                  <FiMaximize />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-church-royal-blue">Member QR Scan & Profile Lookup</h2>
                  <p className="text-gray-500 text-xs">Scan a member's PDF report QR code or enter Member ID / Phone / Email</p>
                </div>
              </div>

              {/* Search / Scan Input */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Scan QR Code Text or Enter Member ID / Phone / Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={scanCodeInput}
                      onChange={e => setScanCodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScanLookup()}
                      placeholder="Scan QR text, or enter SJDB_M03 / User ID..."
                      className="church-input pl-10 pr-4 py-2.5 text-xs sm:text-sm w-full font-mono"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => handleScanLookup()}
                    disabled={isScanning}
                    className="btn-gold px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-gold whitespace-nowrap"
                  >
                    {isScanning ? <FiLoader className="animate-spin" /> : <FiSearch />}
                    {isScanning ? 'Searching...' : 'Scan / Lookup'}
                  </button>
                </div>
              </div>

              {/* Scanned Result Text & Download PDF Card */}
              {scannedUserResult ? (
                <div className="space-y-5 border-t border-gray-100 pt-5">
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 font-mono text-xs leading-relaxed space-y-2 border border-slate-700 shadow-inner">
                    <div className="text-amber-400 font-bold text-sm pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span>ST. JOHN DE BRITTO'S CHURCH</span>
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-sans">
                        {scannedUserResult.statusText}
                      </span>
                    </div>
                    <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
                      <p><span className="text-slate-400 font-sans">Full Name:</span> <strong className="text-white">{scannedUserResult.name}</strong></p>
                      <p><span className="text-slate-400 font-sans">Member ID:</span> <strong className="text-amber-300 font-mono">{scannedUserResult.parishMemberId}</strong></p>
                      <p><span className="text-slate-400 font-sans">Phone:</span> {scannedUserResult.phone}</p>
                      <p><span className="text-slate-400 font-sans">Email:</span> {scannedUserResult.email}</p>
                      <p><span className="text-slate-400 font-sans">Date of Birth:</span> {scannedUserResult.dob}</p>
                      <p><span className="text-slate-400 font-sans">Gender:</span> {scannedUserResult.gender}</p>
                      <p><span className="text-slate-400 font-sans">Role:</span> {scannedUserResult.role}</p>
                      <p><span className="text-slate-400 font-sans">Last Login:</span> {scannedUserResult.lastLogin}</p>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-sans">
                      <p>📍 Address: {scannedUserResult.address}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadUserPdf(scannedUserResult._id, scannedUserResult.name)}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <FiFileText className="text-lg" /> Download Member PDF Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FiMaximize className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No member scanned yet</p>
                  <p className="text-[11px] text-gray-400 mt-1">Scan a printed report QR code with your scanner, or type a Member ID above to display text details and download PDF</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
