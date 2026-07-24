import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GiPrayer } from 'react-icons/gi';
import { FiHeart, FiLock, FiUnlock, FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SectionLoader } from '../../components/common/Loader';
import PageHero from '../../components/common/PageHero';

export default function PrayerRequests() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      isPublic: true,
      prayerLocation: 'personal',
      type: 'General Prayer Request'
    }
  });

  const prayerLocation = watch('prayerLocation');
  const selectedType = watch('type');
  const isConfession = prayerLocation === 'confession' || selectedType === 'Confession Request';

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
      const payload = {
        ...data,
        name: data.name || user?.name,
        email: data.email || user?.email,
        phone: data.contactPhone || data.phone || user?.phone,
        language: i18n.language
      };
      if (data.prayerLocation === 'confession' || data.type === 'Confession Request') {
        payload.isPublic = false;
        payload.type = 'Confession Request';
      }
      await api.post('/prayers', payload);
      toast.success(
        payload.isPublic === false
          ? '⛪ Confession request submitted confidentially to Parish Priest!'
          : '🙏 Prayer request submitted! It will appear after review.'
      );
      reset({ isPublic: true, prayerLocation: 'personal', type: 'General Prayer Request' });
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

                  {/* Radio Buttons Section */}
                  <div className="space-y-2 mb-6">
                    <label className="church-label">Where should the prayer be offered?</label>
                    <div className="flex flex-row items-center gap-4 sm:gap-6 flex-wrap pt-1">
                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          {...register('prayerLocation')}
                          type="radio"
                          value="personal"
                          className="w-4 h-4 text-church-gold focus:ring-church-gold"
                          onChange={(e) => {
                            register('prayerLocation').onChange(e);
                            setValue('type', 'General Prayer Request');
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">Home Prayer</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          {...register('prayerLocation')}
                          type="radio"
                          value="church"
                          className="w-4 h-4 text-church-gold focus:ring-church-gold"
                          onChange={(e) => {
                            register('prayerLocation').onChange(e);
                            setValue('type', 'Thanksgiving Mass');
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">In Church (Mass Intention)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          {...register('prayerLocation')}
                          type="radio"
                          value="confession"
                          className="w-4 h-4 text-church-gold focus:ring-church-gold"
                          onChange={(e) => {
                            register('prayerLocation').onChange(e);
                            setValue('type', 'Confession Request');
                          }}
                        />
                        <FiLock className="text-amber-700" size={13} />
                        <span className="text-sm font-medium text-gray-700">Confession Request</span>
                      </label>
                    </div>
                  </div>

                  {prayerLocation !== 'confession' && (
                    <div>
                      <label className="church-label">Request Type</label>
                      <select {...register('type')} className="church-input bg-white text-gray-800">
                        {prayerLocation === 'personal' ? (
                          <>
                            <option value="General Prayer Request">General Prayer Request</option>
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
                  )}

                  {/* Confession Specific Fields */}
                  {isConfession && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 bg-amber-50/80 border border-amber-300 p-5 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <FiLock className="text-amber-700" /> Confidential Sacrament of Reconciliation (Confession)
                      </div>

                      <div>
                        <label className="church-label">Preferred Date for Confession</label>
                        <input type="date" {...register('preferredDate')} className="church-input bg-white" />
                      </div>

                      <div>
                        <label className="church-label">Preferred Time Slot</label>
                        <select {...register('preferredTime')} className="church-input bg-white text-gray-800">
                          <option value="Before Morning Mass (6:00 AM)">Before Morning Mass (6:00 AM)</option>
                          <option value="After Morning Mass (7:00 AM)">After Morning Mass (7:00 AM)</option>
                          <option value="Evening Slot (5:00 PM - 6:00 PM)">Evening Slot (5:00 PM - 6:00 PM)</option>
                          <option value="Before Evening Mass (6:00 PM)">Before Evening Mass (6:00 PM)</option>
                          <option value="Any Time Suitable for Parish Priest">Any Time Suitable for Parish Priest</option>
                        </select>
                      </div>

                      <div>
                        <label className="church-label">Confession Location / Venue</label>
                        <select {...register('confessionLocation')} className="church-input bg-white text-gray-800">
                          <option value="Church Confessional Box">Church Confessional Box</option>
                          <option value="Parish Priest Office">Parish Priest Office</option>
                          <option value="Home Visit (Elderly / Sick / Bedridden)">Home Visit (Elderly / Sick / Bedridden)</option>
                        </select>
                      </div>

                      <div>
                        <label className="church-label">Contact Phone / WhatsApp for Priest Confirmation</label>
                        <input type="tel" {...register('contactPhone')} className="church-input bg-white" placeholder="Enter phone number for priest to confirm appointment" />
                      </div>
                    </motion.div>
                  )}

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
                    <label className="church-label">
                      {isConfession ? 'Confession Note / Intention (Optional & Private)' : `${t('prayer.intention')} *`}
                    </label>
                    <textarea
                      {...register('intention', { required: !isConfession })}
                      rows={3}
                      className="church-input resize-none"
                      placeholder={isConfession ? 'Share any confidential note for the Parish Priest (optional)...' : 'Share your prayer intention here...'}
                    />
                  </div>

                  {!isConfession && (
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
                  )}

                  <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-base">
                    <GiPrayer /> {isSubmitting ? 'Submitting...' : t('prayer.submit')}
                  </button>
                </form>
              </motion.div>

              {/* Public wall */}
              <div>
                <h2 className="section-title mb-6">{t('prayer.wall')}</h2>
                {loading ? <SectionLoader /> : prayers.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 church-card">
                    <GiPrayer className="text-6xl mx-auto mb-4 opacity-30" />
                    <p>{t('No prayer requests yet. Be the first to share.')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {prayers.map((prayer, i) => (
                      <motion.div
                        key={prayer._id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="church-card p-6 border-l-4 border-church-gold hover:shadow-gold transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-church-gradient flex items-center justify-center text-white">
                              <GiPrayer />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{prayer.name}</p>
                              <p className="text-xs text-gray-400">{new Date(prayer.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="badge badge-gold">{prayer.type || 'General'}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{prayer.intention}"</p>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">
                            🙏 {prayer.prayerCount || 0} {prayer.prayerCount === 1 ? 'person prayed' : 'people prayed'}
                          </span>
                          <button onClick={() => prayFor(prayer._id)} className="btn-outline-gold text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-xs">
                            <FiHeart className="text-red-500 fill-red-500" /> {t('prayer.prayFor', 'Pray for this')}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
