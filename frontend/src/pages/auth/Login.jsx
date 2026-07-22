import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiPhone, FiMail, FiShield, FiKey } from 'react-icons/fi';
import { GiChurch, GiCrucifix } from 'react-icons/gi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import churchLogo from '../../assets/image.png';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm();
  const [showPass, setShowPass] = useState(false);
  const [stage, setStage] = useState('login'); // login | otp | forgot | resetOtp
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  const getDefaultLandingRoute = (u) => {
    if (u?.role === 'admin') return '/admin';
    const pref = u?.settings?.appPreferences?.defaultHomePage;
    if (pref === 'User Dashboard' || pref === 'Dashboard') return '/dashboard';
    if (pref === 'Mass Timings' || pref === 'Mass') return '/mass-timings';
    return '/';
  };

  const [suspendedMsg, setSuspendedMsg] = useState('');

  const onLogin = async (data) => {
    try {
      const res = await api.post('/auth/login', { login: data.login, password: data.password });
      login(res.data.user, res.data.token);
      toast.success(t('auth.loginSuccess'));
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || getDefaultLandingRoute(res.data.user);
      navigate(redirect);
    } catch (e) {
      const resData = e.response?.data;
      if (resData?.isSuspended) {
        setSuspendedMsg(resData.message);
        setStage('suspended');
        toast.error('Account Suspended: Exceeded failed login attempts');
      } else if (resData?.userId) {
        setUserId(resData.userId);
        setStage('otp');
        toast.error('Please verify your OTP');
      } else {
        toast.error(resData?.message || 'Login failed');
      }
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: data.otp });
      login(res.data.user, res.data.token);
      toast.success('Verified! Welcome.');
      navigate(getDefaultLandingRoute(res.data.user));
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid OTP'); }
  };


  const onForgotPassword = async (data) => {
    try {
      const res = await api.post('/auth/forgot-password', { login: data.login });
      setUserId(res.data.userId);
      setStage('resetOtp');
      toast.success('OTP sent to your email!');
      // Dev mode: store OTP for auto-fill UI
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
        setIsOtpLoading(true);
        setTimeout(() => setIsOtpLoading(false), 5000);
      }
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
                  <input {...register('login', { required: 'Required' })} className="church-input pl-10" placeholder="Enter your Phone or Email" />
                </div>
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
              </div>
              <div>
                <label className="church-label">{t('auth.password')}</label>
                <div className="relative">
                  <input {...register('password', { required: 'Required' })} type={showPass ? 'text' : 'password'} className="church-input pr-10" placeholder="Enter your Password (8 characters)" />
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

          {/* Account Suspended Notice */}
          {stage === 'suspended' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-inner">
                <FiShield size={32} />
              </div>

              <div>
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  Account Suspended
                </span>
                <h2 className="text-lg font-bold text-church-royal-blue mt-2">Access Temporarily Suspended</h2>
              </div>

              <div className="text-xs text-gray-700 leading-relaxed bg-red-50/60 p-4 rounded-xl border border-red-200 text-left">
                {suspendedMsg || 'Your account has been automatically suspended due to multiple unsuccessful login attempts for your security. Please contact the administrator to restore access.'}
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <Link
                  to="/contact"
                  className="btn-gold w-full justify-center py-3 text-sm font-bold shadow-md flex items-center gap-2"
                >
                  <FiMail /> Contact Administrator
                </Link>

                <button
                  type="button"
                  onClick={() => setStage('forgot')}
                  className="btn-outline-gold w-full justify-center py-3 text-sm font-bold flex items-center gap-2"
                >
                  <FiKey /> Forgot Password
                </button>

                <button
                  type="button"
                  onClick={() => setStage('login')}
                  className="text-xs text-gray-500 hover:text-gray-700 underline pt-2"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {stage === 'otp' && (
            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4">
              <p className="text-center text-gray-600  text-sm mb-4">{t('auth.otpSent')}</p>
              {devOtp && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex flex-col items-center justify-center gap-2 mb-4 min-h-[76px]">
                  {isOtpLoading ? (
                    <div className="flex flex-col items-center gap-2 w-full px-4 py-1">
                      <p className="text-amber-800 text-xs font-semibold">Sending...</p>
                      <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-amber-500 h-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 5, ease: "linear" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-amber-800 text-xs font-semibold text-center">OTP sent to your number/email</p>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-900 font-mono font-bold text-xl tracking-widest">{devOtp.slice(0, 2)}xxxx</span>
                        <button
                          type="button"
                          onClick={() => setValue('otp', devOtp)}
                          className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                        >
                          Auto Fill
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="church-label">{t('auth.otp')}</label>
                <input {...register('otp', { required: true, minLength: 6, maxLength: 6 })} className="church-input text-center text-2xl tracking-widest font-bold" placeholder="000000" maxLength={6} />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-3.5">{t('auth.verifyOtp')}</button>
              <button type="button" onClick={async () => { 
                const res = await api.post('/auth/resend-otp', { userId }); 
                toast.success('OTP resent!'); 
                if (res.data.devOtp) {
                  setDevOtp(res.data.devOtp);
                  setIsOtpLoading(true);
                  setTimeout(() => setIsOtpLoading(false), 5000);
                }
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
              <p className="text-center text-gray-600 text-sm mb-4">Enter the OTP sent to your email and your new password.</p>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex flex-col items-center justify-center gap-2 mb-4 min-h-[76px]">
                  {isOtpLoading ? (
                    <div className="flex flex-col items-center gap-2 w-full px-4 py-1">
                      <p className="text-amber-800 text-xs font-semibold">Sending...</p>
                      <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-amber-500 h-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 5, ease: "linear" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-amber-800 text-xs font-semibold text-center">OTP sent to your number/email</p>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-900 font-mono font-bold text-xl tracking-widest">{devOtp.slice(0, 2)}xxxx</span>
                        <button
                          type="button"
                          onClick={() => setValue('otp', devOtp)}
                          className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                        >
                          Auto Fill
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

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
