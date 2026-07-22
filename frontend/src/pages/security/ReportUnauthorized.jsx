import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiLock, FiLogOut, FiMail, FiArrowRight, FiKey } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ReportUnauthorized() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Execution states
  const [submitting, setSubmitting] = useState(false);
  const [secured, setSecured] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Password reset inline form
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetDone, setPasswordResetDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('No security token provided in link.');
      return;
    }

    api.get(`/security/verify-token?token=${token}`)
      .then(res => {
        if (res.data.success) {
          setValid(true);
          setUserInfo(res.data.user);
        } else {
          setErrorMsg(res.data.message || 'Invalid or expired security token.');
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Invalid or expired security token.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirmSecure = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/security/confirm-unauthorized', { token });
      if (res.data.success) {
        setSecured(true);
        if (res.data.resetOtp) setOtp(res.data.resetOtp);
        toast.success('Account secured! All sessions logged out.');
      } else {
        toast.error(res.data.message || 'Failed to secure account');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred securing account');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('OTP and new password are required');
    setResettingPassword(true);
    try {
      const res = await api.post('/auth/reset-password', {
        userId: userInfo._id,
        otp,
        newPassword
      });
      if (res.data.success) {
        setPasswordResetDone(true);
        toast.success('Password updated successfully!');
      } else {
        toast.error(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP or password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-3">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-slate-300">Verifying security token...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <FiAlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Invalid or Expired Security Link</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {errorMsg || 'This security link is no longer valid or has already been used. If you suspect unauthorized access, please log in and change your password immediately.'}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg"
          >
            Go to Login <FiArrowRight />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-600" />

        {dismissed ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <FiCheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black">No Action Taken</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Thank you for confirming. If the login was made by you, no further changes were made to your account. You can safely close this page.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all border border-slate-700 mt-4"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : secured ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <FiShield size={28} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/50">
                  Account Secured
                </span>
                <h2 className="text-xl font-black text-white mt-1">Your Account is Now Protected</h2>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Actions Executed</h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <FiLogOut className="text-red-400 flex-shrink-0" size={16} />
                  <span><strong>Logged out all active sessions</strong> across all devices & browsers.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiLock className="text-amber-400 flex-shrink-0" size={16} />
                  <span><strong>Invalidated security token session</strong> for the reported device.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiMail className="text-blue-400 flex-shrink-0" size={16} />
                  <span><strong>Password Reset Initiated:</strong> Verification OTP emailed to <strong>{userInfo?.email || 'your email'}</strong>.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FiShield className="text-purple-400 flex-shrink-0" size={16} />
                  <span><strong>Parish Administrator Notified:</strong> Incident logged in parish security portal.</span>
                </li>
              </ul>
            </div>

            {/* Inline Password Reset Section */}
            {!passwordResetDone ? (
              <form onSubmit={handlePasswordReset} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FiKey size={18} /> Reset Your Password Now
                </div>
                <p className="text-xs text-slate-300">
                  Enter the 6-digit OTP sent to your registered email/phone and your new password below:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Verification OTP Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">New Secure Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {resettingPassword ? 'Updating Password...' : 'Set New Password & Log In'}
                </button>
              </form>
            ) : (
              <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-5 text-center space-y-3">
                <div className="text-emerald-400 font-black text-lg">✨ Password Updated Successfully!</div>
                <p className="text-xs text-slate-300">You can now log in safely using your new password.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all"
                >
                  Proceed to Login <FiArrowRight />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                <FiAlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-black text-white">Report Unauthorized Access</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                We received a report that a recent login to your Parish Account wasn't made by you.
              </p>
            </div>

            {/* Target Account Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Account Details</div>
              <div className="font-bold text-white text-sm">{userInfo?.name}</div>
              <div className="text-slate-400">{userInfo?.email || userInfo?.phone}</div>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed">
              <strong className="block mb-1 text-amber-300">Are you sure you want to secure your account?</strong>
              Clicking <strong>"Yes, Secure My Account"</strong> will immediately terminate all active sessions on all devices, block the suspicious login session, force a password reset, and notify the Parish Administrator.
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleConfirmSecure}
                disabled={submitting}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiShield /> {submitting ? 'Securing Account...' : '🚨 Yes, Secure My Account'}
              </button>

              <button
                onClick={() => setDismissed(true)}
                disabled={submitting}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700"
              >
                No, It Was Me
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
