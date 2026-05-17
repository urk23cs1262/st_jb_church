import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit, FiX } from 'react-icons/fi';
import api, { UPLOADS_URL } from '../../services/api';
import { SectionLoader } from '../common/Loader';

export default function AdminCRUD({ resource, title, fields, hasImage }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${resource}?page=${page}&limit=20`);
      setItems(res.data[Object.keys(res.data).find(k => Array.isArray(res.data[k]))] || []);
      setTotal(res.data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [page, resource]);

  const openAdd = () => { setEditing(null); reset(); setModal(true); };
  const openEdit = (item) => { setEditing(item); fields.forEach(f => setValue(f.name, item[f.name])); setModal(true); };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'imageFile' && v?.[0]) formData.append('image', v[0]);
        else if (v !== undefined && v !== '') formData.append(k, v);
      });
      const config = hasImage ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      if (editing) {
        await api.put(`/${resource}/${editing._id}`, hasImage ? formData : data, config);
        toast.success(`${title.slice(0,-1)} updated`);
      } else {
        await api.post(`/${resource}`, hasImage ? formData : data, config);
        toast.success(`${title.slice(0,-1)} added`);
      }
      setModal(false);
      fetchItems();
    } catch { toast.error('Save failed'); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/${resource}/${id}`); setItems(prev => prev.filter(i => i._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const displayValue = (item) => item.title || item.name || item.subject || item._id;

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-church-royal-blue ">Manage {title} ({total})</h1>
          <button onClick={openAdd} className="btn-gold text-sm py-2"><FiPlus /> Add {title.slice(0, -1)}</button>
        </div>

        {loading ? <SectionLoader /> : (
          <>
            <div className="glass-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200  text-xs uppercase text-gray-400">
                    <th className="text-left py-3 px-4">Item</th>
                    {fields.slice(0, 2).filter(f => !['checkbox'].includes(f.type)).map(f => (
                      <th key={f.name} className="text-left py-3 px-4">{f.label}</th>
                    ))}
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50  hover:bg-gold-50  transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {(hasImage && (item.imageUrl || item.photo || item.image)) && (
                            <img 
                              src={(item.imageUrl || item.photo || item.image).startsWith('http') 
                                ? (item.imageUrl || item.photo || item.image) 
                                : `${UPLOADS_URL.replace('/uploads', '')}${(item.imageUrl || item.photo || item.image).startsWith('/') ? '' : '/'}${item.imageUrl || item.photo || item.image}`
                              } 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover" 
                            />
                          )}
                          <p className="font-semibold text-gray-800  text-sm truncate max-w-xs">{displayValue(item)}</p>
                        </div>
                      </td>
                      {fields.slice(0, 2).filter(f => !['checkbox'].includes(f.type)).map(f => (
                        <td key={f.name} className="py-3 px-4 text-sm text-gray-500 truncate max-w-[180px]">
                          {f.type === 'date' ? (item[f.name] ? new Date(item[f.name]).toLocaleDateString() : '—') : item[f.name] || '—'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-blue-50  text-blue-600 hover:bg-blue-100 transition-colors"><FiEdit /></button>
                          <button onClick={() => deleteItem(item._id)} className="p-2 rounded-lg bg-red-50  text-red-600 hover:bg-red-100 transition-colors"><FiTrash2 /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="text-center py-10 text-gray-400">No {title.toLowerCase()} found</p>}

              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 ">
                <p className="text-sm text-gray-500">Showing {items.length} of {total}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-100  text-sm disabled:opacity-40">← Prev</button>
                  <button disabled={items.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-100  text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white  rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-church-royal-blue ">{editing ? `Edit ${title.slice(0,-1)}` : `Add ${title.slice(0,-1)}`}</h2>
              <button onClick={() => setModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {fields.map(f => (
                <div key={f.name}>
                  {f.type !== 'checkbox' && <label className="church-label">{f.label}{f.required && ' *'}</label>}
                  {f.type === 'textarea' ? (
                    <textarea {...register(f.name, { required: f.required })} rows={3} className="church-input resize-none" placeholder={f.placeholder} />
                  ) : f.type === 'select' ? (
                    <select {...register(f.name)} className="church-select">
                      <option value="">Select {f.label.toLowerCase()}</option>
                      {f.options?.map(o => <option key={o} value={o} className="capitalize">{o.replace('_', ' ')}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input {...register(f.name)} type="checkbox" className="rounded text-church-gold" />
                      <span className="text-sm text-gray-600 ">{f.label}</span>
                    </label>
                  ) : (
                    <input {...register(f.name, { required: f.required })} type={f.type || 'text'} className="church-input" placeholder={f.placeholder} />
                  )}
                </div>
              ))}
              {hasImage && (
                <div>
                  <label className="church-label">Image{editing ? ' (leave blank to keep existing)' : ''}</label>
                  <input {...register('imageFile')} type="file" accept="image/*" className="church-input" />
                </div>
              )}
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3">
                {isSubmitting ? 'Saving...' : editing ? `Update ${title.slice(0,-1)}` : `Add ${title.slice(0,-1)}`}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
