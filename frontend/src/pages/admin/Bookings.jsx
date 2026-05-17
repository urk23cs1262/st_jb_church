import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings?status=${status}&limit=50`).then(r => setBookings(r.data.bookings || [])).finally(() => setLoading(false));
  }, [status]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.filter(b => b._id !== id));
      toast.success(`Booking ${newStatus}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-church-royal-blue ">Manage Bookings</h1>
          <div className="flex gap-2">
            {['pending', 'approved', 'completed', 'rejected'].map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${status === s ? 'bg-church-gold text-white' : 'bg-white  text-gray-500'}`}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? <SectionLoader /> : bookings.length === 0 ? <p className="text-center text-gray-400 py-10">No {status} bookings</p> : (
          <div className="space-y-4">
            {bookings.map((b, i) => (
              <motion.div key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="min-w-14 h-14 rounded-xl bg-church-gradient flex flex-col items-center justify-center">
                      <span className="text-white font-bold">{new Date(b.massDate).getDate()}</span>
                      <span className="text-gold-300 text-xs">{new Date(b.massDate).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 ">{b.userId?.name || 'Member'}</p>
                      <p className="text-church-gold text-sm capitalize">{b.intentionType?.replace('_', ' ')}</p>
                      {b.familyName && <p className="text-gray-400 text-xs">{b.familyName}</p>}
                      {b.intentionDetails && <p className="text-gray-500 text-xs mt-1">{b.intentionDetails}</p>}
                      <p className="text-gray-400 text-xs mt-0.5">{b.userId?.phone}</p>
                    </div>
                  </div>
                  {status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(b._id, 'approved')} className="p-2 rounded-xl bg-green-100 text-green-600 hover:bg-green-200 transition-colors"><FiCheck /></button>
                      <button onClick={() => updateStatus(b._id, 'rejected')} className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><FiX /></button>
                    </div>
                  )}
                  {status === 'approved' && (
                    <button onClick={() => updateStatus(b._id, 'completed')} className="btn-gold text-xs py-2 px-3">Mark Completed</button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
