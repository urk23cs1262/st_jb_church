import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GiChurch, GiCrucifix, GiDove } from 'react-icons/gi';
import { FiFacebook, FiYoutube, FiInstagram, FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import churchLogo from '../../assets/image.png';

const quickLinks = [
  { label: 'nav.home', path: '/' },
  { label: 'nav.about', path: '/about' },
  { label: 'nav.priests', path: '/priests' },
  { label: 'nav.mass', path: '/mass-timings' },
  { label: 'nav.events', path: '/events' },
  { label: 'nav.gallery', path: '/gallery' },
];

const serviceLinks = [
  { label: 'booking.title', path: '/dashboard/booking' },
  { label: 'document.title', path: '/dashboard/documents' },
  { label: 'prayer.title', path: '/prayer-requests' },
  { label: 'nav.announcements', path: '/announcements' },
  { label: 'nav.donate', path: '/donate' },
  { label: 'nav.live', path: '/live' },
  { label: 'nav.rosary', path: '/rosary' },
  { label: 'nav.calendar', path: '/calendar' },
  { label: 'nav.faq', path: '/faq' },
  { label: 'nav.parish-council', path: '/parish-council' },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
      
    <footer className="bg-church-dark  text-white">
      
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-400/30 shadow-gold flex items-center justify-center bg-white/5">
                <img src={churchLogo} alt="Church Logo" className="w-full h-full object-cover object-[center_20%]" />
              </div>
              <div>
                <h3 className="font-display text-gold-300 font-bold text-lg leading-tight">St. John de Britto's</h3>
                <p className="text-gold-400 text-sm font-tamil">புனித அருளானந்தர்</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              A Roman Catholic parish serving the faithful community of Kalayarkoil with love, faith, and devotion.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-church-gold hover:scale-110 transition-all duration-300">
                <FiFacebook className="text-sm" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-300">
                <FiYoutube className="text-sm" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 hover:scale-110 transition-all duration-300">
                <FiInstagram className="text-sm" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
              <GiCrucifix className="text-gold-400" /> {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-300 hover:text-gold-300 text-sm transition-colors duration-200 hover:translate-x-1 inline-block">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
              <GiDove className="text-gold-400" /> {t('footer.services')}
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-300 hover:text-gold-300 text-sm transition-colors duration-200 hover:translate-x-1 inline-block">
                     {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gold-300 mb-4 uppercase tracking-wider text-sm">{t('nav.contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FiMapPin className="text-gold-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">Murthi Nagar, Kalayarkoil,<br />Tamil Nadu 630551, India</p>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-gold-400 flex-shrink-0" />
                <a href="tel:+91" className="text-gray-300 hover:text-gold-300 text-sm transition-colors">+91 04577 XXXXXX</a>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gold-400 flex-shrink-0" />
                <a href="mailto:sjdbchurch@gmail.com" className="text-gray-300 hover:text-gold-300 text-sm transition-colors">sjdbchurch@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <FiClock className="text-gold-400 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{t('footer.officeTiming')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-400 text-xs">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="text-gray-400 text-xs">{t('footer.madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}
