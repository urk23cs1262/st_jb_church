import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

import {
  FiMenu, FiX, FiUser, FiLogOut,
  FiSettings, FiBell, FiGlobe, FiVolume2, FiVolumeX, FiMusic, FiHeadphones
} from 'react-icons/fi';
import { GiChurch, GiCrucifix } from 'react-icons/gi';
import churchLogo from '../../assets/image copy.png';
import rosaryAudio from '../../assets/rosary.mp3';
import DailySaintTicker from './DailySaintTicker';
import RosaryModal from './RosaryModal';

const navLinks = [
  { key: 'rosary', path: '/rosary' },
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'priests', path: '/priests' },
  { key: 'gallery', path: '/gallery' },
  { key: 'live', path: '/live' },
  { key: 'contact', path: '/contact' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin, isAuthenticated } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(window.scrollY > 20);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showRosaryModal, setShowRosaryModal] = useState(false);
  const [isTamil, setIsTamil] = useState(
    document.cookie.includes('googtrans=/en/ta')
  );

  const toggleGoogleTranslate = () => {
    const nextLang = isTamil ? 'en' : 'ta';
    setIsTamil(!isTamil);

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = nextLang;
      select.dispatchEvent(new Event('change'));
    } else {
      sessionStorage.setItem('scrollPos', window.scrollY);
      document.cookie = `googtrans=/en/${nextLang}; path=/`;
      document.cookie = `googtrans=/en/${nextLang}; domain=${window.location.hostname}; path=/`;
      window.location.reload();
    }
  };

  useEffect(() => {
    if (showRosaryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRosaryModal]);

  useEffect(() => {
    const savedPos = sessionStorage.getItem('scrollPos');
    if (savedPos) {
      window.scrollTo(0, parseInt(savedPos));
      sessionStorage.removeItem('scrollPos');
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const toggleRosaryAudio = () => {
    setShowRosaryModal(true);
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || !isHome
          ? 'bg-church-royal-blue/95 backdrop-blur-xl shadow-royal py-2'
          : 'bg-transparent py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-400/50 flex items-center justify-center shadow-gold group-hover:shadow-gold-lg transition-all duration-300">
                <img src={churchLogo} alt="Church Logo" className="w-full h-full object-cover object-[center_20%]" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-display text-sm font-bold leading-tight">St. John de Britto</p>
                <p className="text-gold-400 text-xs font-tamil">புனித அருளானந்தர்</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <div key={link.key} className="relative group">
                  {link.key === 'rosary' ? (
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-gray-200 hover:text-gold-300 hover:bg-white/10`}
                      onClick={toggleRosaryAudio}
                    >
                      <FiHeadphones />
                      {t(`nav.${link.key}`)}
                    </button>
                  ) : (
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive
                          ? 'bg-church-gold text-white shadow-gold'
                          : 'text-gray-200 hover:text-gold-300 hover:bg-white/10'
                        }`
                      }
                    >
                      {t(`nav.${link.key}`)}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Rosary Button Mobile/Tablets */}
              <button
                onClick={toggleRosaryAudio}
                className="lg:hidden flex items-center gap-1 text-gray-200 hover:text-gold-300 transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Rosary"
              >
                <FiHeadphones className="text-base" />
              </button>

              {/* Google Translate Hidden Widget */}
              <div id="google_translate_element" style={{ display: 'none' }}></div>

              <button
                onClick={toggleGoogleTranslate}
                className="flex items-center gap-1 text-gray-200 hover:text-gold-300 transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <FiGlobe className="text-base" />
                <span className="text-xs font-bold whitespace-nowrap">
                  {isTamil ? 'View in English' : 'தமிழில்'}
                </span>
              </button>

              {/* Auth buttons */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-church-gold flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{user?.name}</span>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100]"
                      >
                        <div className="p-3 border-b border-gray-100 ">
                          <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gold-50 transition-colors">
                            <FiSettings className="text-church-gold" /> {t('nav.admin')}
                          </Link>
                        )}
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gold-50 transition-colors">
                          <FiUser className="text-church-gold" /> {t('nav.dashboard')}
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <FiLogOut /> {t('nav.logout')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/login" className="text-gray-200 hover:text-gold-300 text-[10px] sm:text-sm font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/10 transition-all border border-white/10">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn-gold text-[10px] sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 whitespace-nowrap">
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden text-gray-200 hover:text-gold-300 p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-church-royal-blue/98 backdrop-blur-xl border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(link => (
                  <div key={link.key} className="flex items-center">
                    {link.key === 'rosary' ? (
                      <button
                        onClick={() => { toggleRosaryAudio(); setMobileOpen(false); }}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer text-gray-200 hover:bg-white/10`}
                      >
                        <FiHeadphones />
                        {t(`nav.${link.key}`)}
                      </button>
                    ) : (
                      <NavLink
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex-1 block px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-church-gold text-white' : 'text-gray-200 hover:bg-white/10'
                          }`
                        }
                      >
                        {t(`nav.${link.key}`)}
                      </NavLink>
                    )}
                  </div>
                ))}
                <div className="h-px bg-white/10 my-2" />

                {/* Google Translate Mobile Hidden */}
                <div id="google_translate_element_mobile" style={{ display: 'none' }}></div>

                {!isAuthenticated ? null : (
                  <div className="pt-2 flex flex-col gap-2">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all">
                      <FiLogOut /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!mobileOpen && !location.pathname.includes('/dashboard') && !location.pathname.startsWith('/admin') && <DailySaintTicker />}
      </motion.nav>

      {/* Rosary Audio Modal */}
      <RosaryModal 
        isOpen={showRosaryModal} 
        onClose={() => setShowRosaryModal(false)} 
        t={t} 
        rosaryAudio={rosaryAudio} 
      />
    </>
  );
}
