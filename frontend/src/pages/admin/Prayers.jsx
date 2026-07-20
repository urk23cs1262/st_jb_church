import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiMessageSquare } from 'react-icons/fi';
import { GiPrayer } from 'react-icons/gi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import { Link } from 'react-router-dom';

const STATUS_COLORS = { 
  pending: 'bg-amber-100 text-amber-700', 
  approved: 'bg-green-100 text-green-700', 
  rejected: 'bg-red-100 text-red-700' 
};

export default function AdminPrayers() {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/prayers?status=${filter}`);
      setPrayers(res.data.prayers || []);
    } catch { 
      toast.error('Failed to load prayers'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/prayers/${id}/status`, { status });
      setPrayers(prev => prev.filter(p => p._id !== id));
      toast.success(`Prayer ${status}`);
    } catch { 
      toast.error('Failed to update status'); 
    }
  };

  return (
    <div className="w-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-xl sm:text-3xl font-bold text-church-royal-blue flex items-center gap-2 sm:gap-3">
              <GiPrayer className="text-church-gold text-2xl sm:text-3xl" /> Prayer Wall Requests
            </h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">Review and approve prayer intentions for the public wall</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto no-scrollbar max-w-full">
            {['pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${filter === s ? 'bg-church-gold text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>


        {loading ? <SectionLoader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prayers.map((prayer, i) => (
              <motion.div
                key={prayer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="church-card p-6 border-l-4 border-church-gold hover:shadow-gold transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-church-gradient flex items-center justify-center text-white">
                      <GiPrayer />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{prayer.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(prayer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[prayer.status]}`}>
                    {prayer.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl mb-6 italic text-gray-600 text-sm leading-relaxed relative">
                   <span className="absolute -top-2 left-4 text-3xl text-church-gold/20 font-serif">"</span>
                   {prayer.intention}
                   <span className="absolute -bottom-4 right-4 text-3xl text-church-gold/20 font-serif">"</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] mb-6">
                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="font-bold text-church-royal-blue">Location:</span> {prayer.prayerLocation || 'personal'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="font-bold text-church-royal-blue">Type:</span> {prayer.type || 'General'}
                    </div>
                    {prayer.churchLocation && (
                        <div className="col-span-2 flex items-center gap-2 text-gray-500">
                            <span className="font-bold text-church-royal-blue">Church:</span> {prayer.churchLocation}
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                  {filter !== 'approved' && (
                    <button
                      onClick={() => updateStatus(prayer._id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      <FiCheck /> Approve
                    </button>
                  )}
                  {filter !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(prayer._id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      <FiX /> Reject
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && prayers.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
            <FiMessageSquare className="text-5xl mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No {filter} prayer requests to show.</p>
          </div>
        )}
      </div>
    </div>
  );
}
