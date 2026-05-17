import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiPhone, FiMail } from 'react-icons/fi';
import { GiChurch, GiCrucifix } from 'react-icons/gi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import churchLogo from '../../assets/image.png';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const [stage, setStage] = useState('login'); // login | otp | reset
  const [userId, setUserId] = useState(null);

  const onLogin = async (data) => {
    try {
      const res = await api.post('/auth/login', { login: data.login, password: data.password });
      login(res.data.user, res.data.token);
      toast.success(t('auth.loginSuccess'));
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || (res.data.user.role === 'admin' ? '/admin' : '/');
      navigate(redirect);
    } catch (e) {
      const msg = e.response?.data?.message;
      if (e.response?.data?.userId) { setUserId(e.response.data.userId); setStage('otp'); toast.error('Please verify your OTP'); }
      else toast.error(msg || 'Login failed');
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: data.otp });
      login(res.data.user, res.data.token);
      toast.success('Verified! Welcome.');
      navigate('/');
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid OTP'); }
  };

  const onForgotPassword = async (data) => {
    try {
      const res = await api.post('/auth/forgot-password', { login: data.login });
      setUserId(res.data.userId);
      setStage('resetOtp');
      toast.success('OTP sent!');
      // if (res.data.devOtp) {
      //   toast('Dev Mode: Your OTP is ' + res.data.devOtp, { duration: 10000, icon: '🛠️' });
      // }
    } catch (e) { toast.error(e.response?.data?.message || 'User not found'); }
  };

  const onResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await api.post('/auth/reset-password', { userId, otp: data.otp, newPassword: data.newPassword });
      toast.success('Password reset successfully! Please login.');
      setStage('login');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to reset password'); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-cover bg-[center_30%] bg-no-repeat"
      style={{ backgroundImage: `url(${churchLogo})` }}
    >
      <div className="absolute inset-0 bg-church-gradient opacity-80 " />
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute text-white/5 font-display text-8xl select-none"
            style={{ left: `${i * 15}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [-20, 20, -20] }} transition={{ duration: 4 + i, repeat: Infinity }}>✝</motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-gold-lg animate-float overflow-hidden border border-gold-400/50">
              <img src={churchLogo} alt="Logo" className="w-full h-full object-cover object-[center_20%] transform" />
            </div>
            <h1 className="font-display text-2xl font-bold text-church-royal-blue ">{t('auth.login')}</h1>
            <p className="text-gray-500 text-sm mt-1">St. John de Britto's Church</p>
          </div>

          {/* Login Form */}
          {stage === 'login' && (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="church-label">{t('auth.phone')} / {t('auth.email')}</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input {...register('login', { required: 'Required' })} className="church-input pl-10" placeholder="Phone or Email" />
                </div>
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
              </div>
              <div>
                <label className="church-label">{t('auth.password')}</label>
                <div className="relative">
                  <input {...register('password', { required: 'Required' })} type={showPass ? 'text' : 'password'} className="church-input pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setStage('forgot')} className="text-church-gold text-sm hover:underline">{t('auth.forgotPassword')}</button>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3.5 text-base">
                {isSubmitting ? '⏳ Logging in...' : t('auth.login')}
              </button>
              <p className="text-center text-gray-500 text-sm">
                {t('auth.registerPrompt')}{' '}
                <Link to="/register" className="text-church-gold font-semibold hover:underline">{t('nav.register')}</Link>
              </p>
            </form>
          )}

          {/* OTP Verification */}
          {stage === 'otp' && (
            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4">
              <p className="text-center text-gray-600  text-sm mb-4">{t('auth.otpSent')}</p>
              <div>
                <label className="church-label">{t('auth.otp')}</label>
                <input {...register('otp', { required: true, minLength: 6, maxLength: 6 })} className="church-input text-center text-2xl tracking-widest font-bold" placeholder="000000" maxLength={6} />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3.5">{t('auth.verifyOtp')}</button>
              <button type="button" onClick={async () => { 
                const res = await api.post('/auth/resend-otp', { userId }); 
                toast.success('OTP resent!'); 
                if (res.data.devOtp) toast('Dev Mode: Your OTP is ' + res.data.devOtp, { duration: 10000, icon: '🛠️' });
              }} className="btn-ghost w-full justify-center text-sm">Resend OTP</button>
            </form>
          )}

          {/* Forgot Password */}
          {stage === 'forgot' && (
            <form onSubmit={handleSubmit(onForgotPassword)} className="space-y-4">
              <p className="text-center text-gray-600  text-sm mb-4">Enter your registered phone/email to receive an OTP</p>
              <div>
                <label className="church-label">{t('auth.phone')} / {t('auth.email')}</label>
                <input {...register('login', { required: true })} className="church-input" placeholder="Phone without country code or Email" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3.5">Send OTP</button>
              <button type="button" onClick={() => setStage('login')} className="btn-ghost w-full justify-center text-sm">← Back to Login</button>
            </form>
          )}

          {/* Reset Password Stage */}
          {stage === 'resetOtp' && (
            <form onSubmit={handleSubmit(onResetPassword)} className="space-y-4">
              <p className="text-center text-gray-600 text-sm mb-4">Enter the OTP sent to you and your new password.</p>
              <div>
                <label className="church-label">{t('auth.otp')}</label>
                <input {...register('otp', { required: true, minLength: 6, maxLength: 6 })} className="church-input text-center text-2xl tracking-widest font-bold mb-2" placeholder="000000" maxLength={6} />
              </div>
              <div>
                <label className="church-label">New Password</label>
                <div className="relative">
                  <input {...register('newPassword', { required: true, minLength: 6 })} type={showPass ? 'text' : 'password'} className="church-input pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="church-label">Confirm Password</label>
                <input {...register('confirmPassword', { required: true })} type={showPass ? 'text' : 'password'} className="church-input" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3.5">Reset Password</button>
              <button type="button" onClick={() => setStage('login')} className="btn-ghost w-full justify-center text-sm">← Back to Login</button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
