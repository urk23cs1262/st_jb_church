import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GiPrayer } from 'react-icons/gi';
import { FiHeart, FiLock, FiUnlock, FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import PageHero from '../../components/common/PageHero';

export default function PrayerRequests() {
  const { t, i18n } = useTranslation();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      isPublic: true,
      prayerLocation: 'personal'
    }
  });
  const prayerLocation = watch('prayerLocation');

  const SUB_STATIONS = [
    "Kalayarkoil (Main Parish)",
    "Pallithammam",
    "Nedungulam",
    "Kalluvazhy",
    "Natarajapuram",
    "Susaiapparpattinam",
    "Maravamangalam",
    "Other"
  ];

  useEffect(() => { 
    api.get('/prayers/public')
      .then(r => setPrayers(r.data.prayers || []))
      .catch(() => { })
      .finally(() => setLoading(false)); 
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/prayers', { ...data, language: i18n.language });
      toast.success('Prayer request submitted! It will appear after review.');
      reset({ isPublic: true });
    } catch { toast.error('Failed to submit. Please try again.'); }
  };

  const prayFor = async (id) => {
    try {
      await api.post(`/prayers/${id}/pray`);
      setPrayers(prev => prev.map(p => p._id === id ? { ...p, prayerCount: (p.prayerCount || 0) + 1 } : p));
      toast.success('🙏 Prayer counted!');
    } catch { toast.error('Failed to record prayer.'); }
  };

  return (
    <>
      <div className="bg-gray-600 pt-32 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/dashboard" className="text-gold-400 text-sm hover:underline flex items-center gap-1 mb-3">
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">{t('prayer.title')}</h1>
        </div>
      </div>

      <div className="min-h-screen bg-church-cream ">
        {/* <PageHero title={<>{t('prayer.title')}</>} subtitle={<>Community Prayer</>} /> */}

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Submit form */}
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="section-title mb-6">{t('prayer.submit')}</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="church-card p-8 space-y-6">
                  <div>
                    <label className="church-label">Your Name</label>
                    <input {...register('name')} className="church-input" placeholder="Full Name" />
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-2xl space-y-3 mb-4">
                    <label className="church-label">Where should the prayer be offered?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input {...register('prayerLocation')} type="radio" value="personal" className="text-church-gold" />
                        <span className="text-sm font-medium">Home Prayer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input {...register('prayerLocation')} type="radio" value="church" className="text-church-gold" />
                        <span className="text-sm font-medium">In Church (Mass Intention)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="church-label">Request Type</label>
                    <select {...register('type')} className="church-input bg-white text-gray-800">
                      {prayerLocation === 'personal' ? (
                        <>
                          <option value="General Prayer Request">General Prayer Request</option>
                          <option value="Confession Request">Confession Request</option>
                          <option value="Home Blessing Prayer">Home Blessing Prayer</option>
                          <option value="Housewarming">Special Occasion: Housewarming</option>
                          <option value="Wedding Anniversary">Special Occasion: Wedding Anniversary</option>
                          <option value="Birthday Anniversary">Special Occasion: Birthday Anniversary</option>
                          <option value="Others">Others</option>
                        </>
                      ) : (
                        <>
                          <option value="Thanksgiving Mass">Thanksgiving Mass</option>
                          <option value="Mass for Departed Soul">Mass for Departed Soul (RIP)</option>
                          <option value="Special Intention Mass">Special Intention Mass</option>  
                          <option value="Healing Mass">Healing Mass</option>
                          <option value="Success in Exams/Work">Success in Exams/Business/Work</option>
                          <option value="Other Mass Intention">Others</option>
                        </>
                      )}
                    </select>
                  </div>

                  {prayerLocation === 'church' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="church-label">Select Church / Sub-station</label>
                        <select {...register('churchLocation')} className="church-input bg-white text-gray-800">
                          {SUB_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="church-label">Preferred Date for Prayer</label>
                        <input type="date" {...register('preferredDate')} className="church-input" />
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="church-label">{t('prayer.intention')} *</label>
                    <textarea {...register('intention', { required: true })} rows={5} className="church-input resize-none" placeholder="Share your prayer intention here..." />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input {...register('isPublic')} type="checkbox" className="w-5 h-5 rounded text-church-gold" />
                    <div className="flex items-center gap-2">
                      {watch('isPublic') ? <FiUnlock className="text-church-gold" /> : <FiLock className="text-gray-400" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{watch('isPublic') ? t('prayer.public') : t('prayer.private')}</p>
                        <p className="text-xs text-gray-400">Public prayers appear on the prayer wall</p>
                      </div>
                    </div>
                  </label>

                  <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-base">
                    <GiPrayer /> {isSubmitting ? 'Submitting...' : t('prayer.submit')}
                  </button>
                </form>
              </motion.div>

              {/* Prayer Wall */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="section-title mb-6">{t('prayer.wall')}</h2>
                {loading ? <SectionLoader /> : prayers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <GiPrayer className="text-5xl mx-auto mb-3 opacity-30" />
                    <p>No prayer requests yet. Be the first to share.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {prayers.map((p, i) => (
                      <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="church-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-9 h-9 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0">
                            <GiPrayer className="text-white text-sm" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              {p.name || 'Anonymous'}
                              {p.type && p.type !== 'General Prayer Request' && <span className="ml-2 text-xs bg-gold-100 text-church-gold px-2 py-0.5 rounded-full">{p.type}</span>}
                            </p>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{p.intention}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(p.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => prayFor(p._id)} className="flex items-center gap-1.5 text-xs text-church-maroon hover:text-church-maroon-light font-semibold transition-colors">
                            <FiHeart className="fill-current" /> {p.prayerCount || 0} Praying
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
