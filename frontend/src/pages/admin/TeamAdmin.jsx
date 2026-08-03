import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiArrowUp, FiArrowDown,
  FiSearch, FiX, FiCheck, FiUser, FiMail, FiPhone, FiTag, FiImage, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { getMediaUrl } from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import { useForm } from 'react-hook-form';

const DEPARTMENTS = [
  'Leadership', 
  'Administration', 
  'Ministries', 
  // 'Choir Team', 
  // 'St. Vincent de Paul Sabai', 
  'Parish Council', 
  'Volunteers'
];

export default function TeamAdmin() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team/admin');
      setMembers(res.data.members || []);
    } catch (err) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setPhotoFile(null);
    setPhotoPreview('');
    reset({
      name: '',
      role: '',
      department: 'Leadership',
      badge: '',
      description: '',
      email: '',
      phone: '',
      order: members.length + 1,
      isActive: true,
      facebook: '',
      instagram: '',
      linkedin: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setPhotoFile(null);
    setPhotoPreview(member.image ? getMediaUrl(member.image) : '');
    reset({
      name: member.name || '',
      role: member.role || '',
      department: member.department || 'Leadership',
      badge: member.badge || '',
      description: member.description || '',
      email: member.email || '',
      phone: member.phone || '',
      order: member.order || 1,
      isActive: member.isActive !== false,
      facebook: member.socialLinks?.facebook || '',
      instagram: member.socialLinks?.instagram || '',
      linkedin: member.socialLinks?.linkedin || ''
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingMember(null);
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('role', data.role);
    formData.append('department', data.department);
    formData.append('badge', data.badge || '');
    formData.append('description', data.description || '');
    formData.append('email', data.email || '');
    formData.append('phone', data.phone || '');
    formData.append('order', data.order || 1);
    formData.append('isActive', data.isActive);

    const socialLinks = {
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      linkedin: data.linkedin || ''
    };
    formData.append('socialLinks', JSON.stringify(socialLinks));

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      if (editingMember) {
        await api.put(`/team/${editingMember._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Team member updated successfully');
      } else {
        await api.post('/team', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Team member added successfully');
      }
      closeModal();
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save team member');
    }
  };

  const toggleActive = async (member) => {
    try {
      const res = await api.put(`/team/${member._id}/toggle`);
      setMembers(prev => prev.map(m => m._id === member._id ? { ...m, isActive: res.data.member.isActive } : m));
      toast.success(`Member ${res.data.member.isActive ? 'activated' : 'hidden'}`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const deleteMember = async (id) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    try {
      await api.delete(`/team/${id}`);
      setMembers(prev => prev.filter(m => m._id !== id));
      toast.success('Team member deleted');
    } catch {
      toast.error('Failed to delete member');
    }
  };

  const moveMember = async (index, direction) => {
    const newMembers = [...members];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newMembers.length) return;

    const temp = newMembers[index];
    newMembers[index] = newMembers[targetIndex];
    newMembers[targetIndex] = temp;

    // Recalculate orders
    const items = newMembers.map((m, idx) => ({ id: m._id, order: idx + 1 }));
    setMembers(newMembers.map((m, idx) => ({ ...m, order: idx + 1 })));

    try {
      await api.post('/team/reorder', { items });
      toast.success('Display order updated');
    } catch {
      toast.error('Failed to update order');
      fetchMembers();
    }
  };

  const filteredMembers = members.filter(m => {
    const matchDept = selectedDept === 'All' || m.department === selectedDept;
    const matchSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.role.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-church-royal-blue">Manage Team Members ({members.length})</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Configure parish leadership, administrative staff, and ministry heads</p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-gold px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-gold self-start lg:self-auto"
        >
          <FiPlus className="text-base" /> Add Team Member
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-4 scrollbar-none">
          {['All', ...DEPARTMENTS].map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-church-gold text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="church-input pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* Team Members List */}
      {loading ? (
        <SectionLoader />
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Member Info</th>
                  <th className="py-3.5 px-4">Department & Badge</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredMembers.map((m, idx) => (
                  <tr key={m._id} className="hover:bg-gold-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-700">#{m.order}</span>
                        <div className="flex flex-col">
                          <button onClick={() => moveMember(idx, -1)} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-church-gold disabled:opacity-30"><FiArrowUp size={12} /></button>
                          <button onClick={() => moveMember(idx, 1)} disabled={idx === filteredMembers.length - 1} className="p-0.5 text-gray-400 hover:text-church-gold disabled:opacity-30"><FiArrowDown size={12} /></button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-church-royal-blue text-white font-bold flex items-center justify-center flex-shrink-0 border border-church-gold/40">
                          {m.image ? (
                            <img src={getMediaUrl(m.image)} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{m.name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                          <p className="text-church-gold text-xs font-semibold">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 font-bold text-[10px] rounded-md uppercase">
                          {m.department}
                        </span>
                        {m.badge && (
                          <span className="block text-[10px] font-bold text-amber-700">
                            🏷️ {m.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 space-y-0.5">
                      {m.email && <div className="flex items-center gap-1"><FiMail className="text-gray-400" /> {m.email}</div>}
                      {m.phone && <div className="flex items-center gap-1"><FiPhone className="text-gray-400" /> {m.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleActive(m)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          m.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}
                      >
                        {m.isActive ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                        <span>{m.isActive ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gold-100 text-gray-700 hover:text-church-gold transition-colors"
                          title="Edit Member"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteMember(m._id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete Member"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={closeModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-church-royal-blue">
                    {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                  </h2>
                  <p className="text-xs text-gray-500">Configure profile, contact, role and department</p>
                </div>
                <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs sm:text-sm">
                
                {/* Photo Preview & File Input */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-church-royal-blue text-white font-bold flex items-center justify-center flex-shrink-0 border border-church-gold">
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <FiImage size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="church-label">Profile Photo</label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-church-gold file:text-white hover:file:bg-church-gold-light" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="church-label">Full Name *</label>
                    <input {...register('name', { required: 'Name is required' })} className="church-input" placeholder="e.g. Rev. Fr. John Peter" />
                  </div>

                  <div>
                    <label className="church-label">Role / Title *</label>
                    <input {...register('role', { required: 'Role is required' })} className="church-input" placeholder="e.g. Parish Priest, Secretary" />
                  </div>

                  <div>
                    <label className="church-label">Department *</label>
                    <select {...register('department', { required: true })} className="church-select">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="church-label">Badge Label (Optional)</label>
                    <input {...register('badge')} className="church-input" placeholder="e.g. Parish Priest, Coordinator" />
                  </div>

                  <div>
                    <label className="church-label">Email Address</label>
                    <input type="email" {...register('email')} className="church-input" placeholder="e.g. email@sjdbchurch.org" />
                  </div>

                  <div>
                    <label className="church-label">Phone Number</label>
                    <input {...register('phone')} className="church-input" placeholder="e.g. +91 98765 43210" />
                  </div>

                  <div>
                    <label className="church-label">Display Order Index</label>
                    <input type="number" {...register('order')} className="church-input" placeholder="1" />
                  </div>

                  <div>
                    <label className="church-label">Visibility Status</label>
                    <select {...register('isActive')} className="church-select">
                      <option value="true">Active (Visible on Website)</option>
                      <option value="false">Hidden (Draft / Internal)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="church-label">Description / Bio Quote</label>
                    <textarea {...register('description')} rows={3} className="church-input py-2 resize-none" placeholder="Short bio or quote describing responsibilities..." />
                  </div>
                </div>

                {/* Social Links Accordion */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <p className="font-bold text-gray-700 text-xs flex items-center gap-1.5"><FiSliders /> Social Media Profiles (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input {...register('facebook')} className="church-input text-xs" placeholder="Facebook URL" />
                    <input {...register('instagram')} className="church-input text-xs" placeholder="Instagram URL" />
                    <input {...register('linkedin')} className="church-input text-xs" placeholder="LinkedIn URL" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="btn-ghost flex-1 justify-center py-2.5 text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-gold flex-1 justify-center py-2.5 text-xs font-bold shadow-gold">
                    {isSubmitting ? 'Saving...' : (editingMember ? 'Save Changes' : 'Add Team Member')}
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
