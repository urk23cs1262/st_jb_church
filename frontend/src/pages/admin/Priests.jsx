import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit, FiX } from 'react-icons/fi';
import { GiChurch } from 'react-icons/gi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';

export default function AdminPriests() {
  const [priests, setPriests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  useEffect(() => { api.get('/priests').then(r => setPriests(r.data.priests || [])).finally(() => setLoading(false)); }, []);

  const openAdd = () => { setEditing(null); reset(); setModal(true); };
  const openEdit = (priest) => { setEditing(priest); Object.entries(priest).forEach(([k, v]) => setValue(k, v)); setModal(true); };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => v !== undefined && v !== '' && formData.append(k, v));
      if (data.photoFile?.[0]) formData.append('photo', data.photoFile[0]);
      if (editing) {
        const res = await api.put(`/priests/${editing._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPriests(prev => prev.map(p => p._id === editing._id ? res.data.priest : p));
        toast.success('Priest updated');
      } else {
        const res = await api.post('/priests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPriests(prev => [res.data.priest, ...prev]);
        toast.success('Priest added');
      }
      setModal(false);
    } catch { toast.error('Failed to save'); }
  };

  const deletePriest = async (id) => {
    if (!confirm('Delete this priest?')) return;
    await api.delete(`/priests/${id}`);
    setPriests(prev => prev.filter(p => p._id !== id));
    toast.success('Deleted');
  };

  return (
    <div className="min-h-screen bg-church-cream  pt-20 lg:pl-64">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-church-royal-blue ">Manage Priests</h1>
          <button onClick={openAdd} className="btn-gold text-sm py-2"><FiPlus /> Add Priest</button>
        </div>

        {loading ? <SectionLoader /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {priests.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="church-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-church-gradient flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <GiChurch className="text-white text-2xl" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800  text-sm">{p.name}</h3>
                    <p className="text-church-gold text-xs">{p.designation}</p>
                    {p.isCurrent && <span className="badge badge-green text-xs">Current</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-blue-50  text-blue-600 hover:bg-blue-100 transition-colors"><FiEdit /></button>
                  <button onClick={() => deletePriest(p._id)} className="p-2 rounded-lg bg-red-50  text-red-600 hover:bg-red-100 transition-colors"><FiTrash2 /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white  rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-church-royal-blue ">{editing ? 'Edit Priest' : 'Add Priest'}</h2>
                <button onClick={() => setModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="church-label">Name *</label>
                  <input {...register('name', { required: true })} className="church-input" placeholder="Rev. Fr. Name" />
                </div>
                <div>
                  <label className="church-label">Designation *</label>
                  <select {...register('designation', { required: true })} className="church-select">
                    <option value="">Select</option>
                    <option value="Parish Priest">Parish Priest</option>
                    <option value="Assistant Priest">Assistant Priest</option>
                    <option value="Former Parish Priest">Former Parish Priest</option>
                    <option value="Deacon">Deacon</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="church-label">Start Date</label>
                    <input {...register('startDate')} type="date" className="church-input" />
                  </div>
                  <div>
                    <label className="church-label">End Date</label>
                    <input {...register('endDate')} type="date" className="church-input" />
                  </div>
                </div>
                <div>
                  <label className="church-label">Phone</label>
                  <input {...register('phone')} className="church-input" />
                </div>
                <div>
                  <label className="church-label">Email</label>
                  <input {...register('email')} type="email" className="church-input" />
                </div>
                <div>
                  <label className="church-label">Biography</label>
                  <textarea {...register('bio')} rows={3} className="church-input resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('isCurrent')} type="checkbox" className="rounded text-church-gold" />
                  <span className="text-sm text-gray-600 ">Current priest</span>
                </label>
                <div>
                  <label className="church-label">Photo</label>
                  <input {...register('photoFile')} type="file" accept="image/*" className="church-input" />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3">
                  {isSubmitting ? 'Saving...' : editing ? 'Update Priest' : 'Add Priest'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
