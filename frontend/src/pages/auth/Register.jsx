import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiPlus, FiTrash2, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import api from '../../services/api';
import churchLogo from '../../assets/image.png';

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
const FAMILY_ROLES = ['Father', 'Mother', 'Elder Son', 'Younger Son', 'Elder Daughter', 'Younger Daughter', 'Grandfather', 'Grandmother', 'Other'];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, trigger, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      familyMembers: []
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "familyMembers"
  });

  const [showPass, setShowPass] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3 (OTP)
  const [userId, setUserId] = useState(null);

  const handleNextStep = async () => {
    let fieldsToValidate = [];
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'dob', 'familyName', 'subStation', 'phone', 'password'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['familyRole'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const watchedFamilyRole = watch('familyRole');
  const watchedMembers = watch('familyMembers');

  const onRegister = async (data) => {
    try {
      // Map custom roles if "Other" was selected
      const payload = {
        ...data,
        familyRole: data.familyRole === 'Other' ? data.familyRoleOther : data.familyRole,
        familyMembers: data.familyMembers?.map(m => ({
          name: m.name,
          role: m.role === 'Other' ? m.roleOther : m.role
        })) || []
      };

      const res = await api.post('/auth/register', payload);
      setUserId(res.data.userId);
      setCurrentStep(3); // Go to OTP step
      toast.success(t('auth.otpSent') || 'Registration successful! Please verify OTP.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: data.otp });
      toast.success('Verified! You can now log in.');
      navigate('/login');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${churchLogo})` }}
    >
      <div className="absolute inset-0 bg-church-gradient opacity-80" />
      <div className="absolute inset-0 z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute text-white/5 font-display text-8xl select-none"
            style={{ left: `${i * 15}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [-20, 20, -20] }} transition={{ duration: 4 + i, repeat: Infinity }}>✝</motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <div className="glass-card p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 shadow-gold-lg animate-float overflow-hidden border border-gold-400/50">
              <img src={churchLogo} alt="Logo" className="w-full h-full object-cover object-[center_20%] transform" />
            </div>
            <h1 className="font-display text-2xl font-bold text-church-royal-blue ">{t('auth.register') || 'Register'}</h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">Step {currentStep}/3</p>
          </div>

          <form onSubmit={handleSubmit(currentStep === 2 ? onRegister : handleNextStep)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="church-label">Full Name *</label>
                      <input {...register('name', { required: 'Name is required' })} className="church-input" placeholder="John Paul" />
                      {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="church-label">Date of Birth *</label>
                      <input type="date" {...register('dob', { required: 'DOB is required' })} className="church-input" />
                      {errors.dob && <p className="text-red-500 text-[10px] mt-1">{errors.dob.message}</p>}
                    </div>
                    <div>
                      <label className="church-label">Family Name *</label>
                      <input {...register('familyName', { required: 'Family name is required' })} className="church-input" placeholder="e.g., Joseph's Family" />
                    </div>
                    <div>
                      <label className="church-label">Sub-Station *</label>
                      <select {...register('subStation', { required: 'Sub-station is required' })} className="church-input">
                        <option value="">Select Sub-station</option>
                        {SUB_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="church-label">Phone Number *</label>
                      <input {...register('phone', { required: 'Phone is required' })} className="church-input" placeholder="9876543210" />
                      {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="church-label">Email Address</label>
                      <input {...register('email')} type="email" className="church-input" placeholder="john@example.com" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="church-label">Password *</label>
                      <div className="relative">
                        <input {...register('password', { required: 'Password is required', minLength: 6 })} type={showPass ? 'text' : 'password'} className="church-input pr-10" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password.message}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={handleNextStep} className="btn-gold w-full justify-center py-3.5 mt-6 group">
                    Next: Family Details <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="church-label">Your Role in Family *</label>
                    <select {...register('familyRole', { required: 'Role is required' })} className="church-input">
                      <option value="">Select your role</option>
                      {FAMILY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {watchedFamilyRole === 'Other' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                        <input {...register('familyRoleOther', { required: true })} className="church-input" placeholder="Please specify your role" />
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-church-royal-blue/5 rounded-2xl p-6 border border-church-royal-blue/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-church-royal-blue font-bold text-lg">Other Family Members</h3>
                        <p className="text-gray-500 text-xs">Add details for other people in your household</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => append({ name: '', role: '' })}
                        className="flex items-center gap-2 text-xs font-bold bg-church-gold text-white px-4 py-2 rounded-xl shadow-gold hover:shadow-gold-lg transition-all active:scale-95"
                      >
                        <FiPlus /> ADD MEMBER
                      </button>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {fields.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-start bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
                          <div className="col-span-6">
                            <label className="text-[11px] text-church-royal-blue font-bold mb-1.5 block uppercase tracking-wider">Member Name</label>
                            <input {...register(`familyMembers.${index}.name`, { required: true })} className="church-input py-2 text-sm border-church-royal-blue/10 shadow-inner" placeholder="Enter name" />
                          </div>
                          <div className="col-span-5">
                            <label className="text-[11px] text-church-royal-blue font-bold mb-1.5 block uppercase tracking-wider">Role</label>
                            <select {...register(`familyMembers.${index}.role`, { required: true })} className="church-input py-2 text-sm border-church-royal-blue/10 shadow-inner">
                              <option value="">Select Role</option>
                              {FAMILY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {watchedMembers[index]?.role === 'Other' && (
                              <input {...register(`familyMembers.${index}.roleOther`, { required: true })} className="church-input mt-2 py-1.5 text-xs" placeholder="Specify role" />
                            )}
                          </div>
                          <div className="col-span-1 pt-6 flex justify-center">
                            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                              <FiTrash2 className="text-lg" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {fields.length === 0 && (
                        <div className="text-center py-10 bg-white/40 rounded-2xl border border-dashed border-gray-300">
                          <p className="text-gray-500 text-sm">No other members added yet</p>
                          <p className="text-gray-400 text-[10px] mt-1">Click the "Add Member" button above</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button type="button" onClick={prevStep} className="flex-1 btn-ghost justify-center py-3.5">
                      <FiChevronLeft className="mr-2" /> Back
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] btn-gold justify-center py-3.5">
                      {isSubmitting ? '⏳ Processing...' : 'Proceed to OTP Verification'}
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <div className="space-y-6 max-w-sm mx-auto">
                    <div className="text-center space-y-2">
                      <p className="text-black font-bold">OTP Verification</p>
                      <p className="text-black-400 text-xs">An OTP has been sent to your phone/email for verification.</p>
                    </div>
                    <div>
                      <label className="church-label text-center block mb-2 font-bold text-church-gold">Enter 6-Digit OTP</label>
                      <input 
                        {...register('otp', { required: true, minLength: 6, maxLength: 6 })} 
                        className="church-input text-center text-3xl tracking-[12px] font-bold h-16" 
                        placeholder="000000" 
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <button onClick={handleSubmit(onVerifyOtp)} type="button" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-lg font-bold">
                      {isSubmitting ? '⏳ Verifying...' : 'Verify & Login'}
                    </button>
                    <button type="button" onClick={async () => { 
                      const res = await api.post('/auth/resend-otp', { userId }); 
                      toast.success('OTP resent!'); 
                    }} className="btn-ghost w-full justify-center text-xs mt-2">
                      Didn't receive OTP? Resend
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {currentStep === 1 && (
            <p className="text-center text-gray-500 text-xs mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-church-gold font-bold hover:underline">Login</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
