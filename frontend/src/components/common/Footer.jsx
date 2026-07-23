import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GiChurch, GiCrucifix, GiDove } from 'react-icons/gi';
import { FiFacebook, FiYoutube, FiInstagram, FiMapPin, FiPhone, FiMail, FiClock, FiShield, FiFileText, FiLock } from 'react-icons/fi';
import churchLogo from '../../assets/image.png';
import PolicyModal from './PolicyModal';

const quickLinks = [
  { label: 'nav.home', path: '/' },
  { label: 'nav.about', path: '/about' },
  { label: 'nav.priests', path: '/priests' },
  { label: 'nav.mass', path: '/mass-timings' },
  { label: 'nav.events', path: '/events' },
  { label: 'nav.gallery', path: '/gallery' },
  { label: 'nav.faq', path: '/faq' },
];

const serviceLinks = [
  { label: 'booking.title', path: '/dashboard/booking' },
  { label: 'document.title', path: '/dashboard/documents' },
  { label: 'prayer.title', path: '/prayer-requests' },
  { label: 'nav.announcements', path: '/announcements' },
  { label: 'nav.donate', path: '/donate' },
  { label: 'nav.live', path: '/live' },
  { label: 'nav.rosary', path: '/rosary' },
];

export default function Footer() {
  const { t } = useTranslation();
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState('terms');

  const openPolicyModal = (tab) => {
    setPolicyTab(tab);
    setPolicyModalOpen(true);
  };

  return (
    <footer className="bg-church-dark text-white">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold-400/30 shadow-gold flex items-center justify-center bg-white/5">
                <img src={churchLogo} alt="Church Logo" className="w-full h-full object-cover object-[center_20%]" />
              </div>
              <div>
                <h3 className="font-display text-gold-300 font-bold text-lg leading-tight">St. John de Britto's</h3>
                <p className="text-gold-400 text-sm font-tamil">புனித அருளானந்தர்</p>
              </div>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed text-justify">
              A Roman Catholic parish serving the faithful community of Kalayarkoil with love, faith, and devotion. Protected with enterprise-grade security, encrypted credentials, and transparent privacy policies.
            </p>
            <div className="flex items-center gap-3.5 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-church-gold hover:text-white hover:scale-110 transition-all duration-300 shadow-md">
                <FiFacebook className="text-xl" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-md">
                <FiYoutube className="text-xl" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-md">
                <FiInstagram className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
              <GiCrucifix className="text-gold-400" /> {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-300 hover:text-gold-300 transition-colors duration-200 hover:translate-x-1 inline-block">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
              <GiDove className="text-gold-400" /> {t('footer.services')}
            </h4>
            <ul className="space-y-2 text-xs">
              {serviceLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-300 hover:text-gold-300 transition-colors duration-200 hover:translate-x-1 inline-block">
                     {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Trust Policies */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
              <FiShield className="text-gold-400" /> Legal & Security
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => openPolicyModal('terms')} className="text-gray-300 hover:text-gold-300 transition-colors text-left">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => openPolicyModal('privacy')} className="text-gray-300 hover:text-gold-300 transition-colors text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => openPolicyModal('security')} className="text-gray-300 hover:text-gold-300 transition-colors text-left">
                  Security & Trust Policy
                </button>
              </li>
              <li>
                <button onClick={() => openPolicyModal('cookies')} className="text-gray-300 hover:text-gold-300 transition-colors text-left">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => openPolicyModal('guidelines')} className="text-gray-300 hover:text-gold-300 transition-colors text-left">
                  Community Guidelines
                </button>
              </li>
              <li className="pt-1">
                {/* <button
                  onClick={() => openPolicyModal('security')}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors text-left flex items-center gap-1"
                >
                  🚨 Report Security Issue
                </button> */}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/15 bg-black/30 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-white font-medium text-xs sm:text-sm tracking-wide">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          
          <p className="text-gold-300 font-bold text-xs flex items-center justify-center gap-1.5">
            <span className="italic">"Made with God's Glory"</span>
            {/* <span className="text-white"></span> */}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/90 pt-1">
            <button onClick={() => openPolicyModal('privacy')} className="hover:text-gold-300 transition-colors">Privacy Policy</button>
            <span className="text-white">•</span>
            <button onClick={() => openPolicyModal('terms')} className="hover:text-gold-300 transition-colors">Terms & Conditions</button>
            <span className="text-white">•</span>
            <button onClick={() => openPolicyModal('security')} className="hover:text-gold-300 transition-colors">Security Policy</button>
          </div>
        </div>
      </div>

      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialTab={policyTab}
      />
    </footer>
  );
}
