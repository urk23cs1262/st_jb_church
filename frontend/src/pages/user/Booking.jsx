import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const INTENTION_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'death_anniversary', label: 'Death Anniversary' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'healing', label: 'Healing Prayer' },
  { value: 'special', label: 'Special Intention' },
  { value: 'wedding_anniversary', label: 'Wedding Anniversary' },
  { value: 'other', label: 'Other' },
];

export default function Booking() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data) => {
    try {
      await api.post('/bookings', data);
      toast.success('Mass booking submitted! Awaiting approval.');
      setSubmitted(true);
      reset();
    } catch (e) { toast.error(e.response?.data?.message || 'Booking failed'); }
  };

  return (
    <div className="min-h-screen pt-10 bg-church-cream ">
      <div className="bg-gray-600 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/dashboard" className="text-gold-400 text-sm hover:underline flex items-center gap-1 mb-3"><FiArrowLeft /> Back to Dashboard</Link>
          <h1 className="font-display text-3xl font-bold text-white">Book a Holy Mass</h1>
          <p className="text-gray-300 text-sm mt-1">Submit your mass intention for approval</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="church-card p-12 text-center">
            <div className="text-6xl mb-4">✝️</div>
            <h2 className="font-display text-2xl font-bold text-church-royal-blue  mb-2">Booking Submitted!</h2>
            <p className="text-gray-500 mb-6">Your mass booking is pending approval. You will receive a notification once confirmed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSubmitted(false)} className="btn-gold">Book Another Mass</button>
              <Link to="/dashboard" className="btn-ghost">Back to Dashboard</Link>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="church-card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="church-label">Mass Date *</label>
                  <input {...register('massDate', { required: 'Date is required' })} type="date" className="church-input" min={new Date().toISOString().split('T')[0]} />
                  {errors.massDate && <p className="text-red-500 text-xs mt-1">{errors.massDate.message}</p>}
                </div>
                <div>
                  <label className="church-label">Preferred Mass Time</label>
                  <select {...register('massTime')} className="church-select">
                    <option value="">Any time</option>
                    <option value="6:00 AM">6:00 AM</option>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="6:00 PM">6:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="church-label">Intention Type *</label>
                <select {...register('intentionType', { required: true })} className="church-select">
                  <option value="">Select intention</option>
                  {INTENTION_TYPES.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
                </select>
                {errors.intentionType && <p className="text-red-500 text-xs mt-1">Please select an intention type</p>}
              </div>
              <div>
                <label className="church-label">Family Name</label>
                <input {...register('familyName')} className="church-input" placeholder="e.g., Xavier Family / Joseph's Soul" />
              </div>
              <div>
                <label className="church-label">Intention Details</label>
                <textarea {...register('intentionDetails')} rows={3} className="church-input resize-none" placeholder="Additional details about the intention..." />
              </div>
              <div>
                <label className="church-label">Offertory Amount (₹)</label>
                <input {...register('offertory')} type="number" className="church-input" placeholder="0 (optional)" min="0" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-base">
                <FiCalendar /> {isSubmitting ? 'Submitting...' : 'Submit Mass Booking'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
