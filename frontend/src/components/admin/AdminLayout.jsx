import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiUsers, FiCalendar, FiFileText, FiMessageSquare, FiDollarSign, FiImage, FiBell, FiMenu, FiX, FiLogOut, FiArrowLeft, FiSettings } from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import { GiChurch, GiCrucifix, GiPrayer } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import churchLogo from '../../assets/image copy.png';

const NAV_ITEMS = [
  { icon: <FiUsers />, label: 'Users', path: '/admin/users', color: 'bg-blue-500' },
  { icon: <GiChurch />, label: 'Priests', path: '/admin/priests', color: 'bg-amber-600' },
  { icon: <FiCalendar />, label: 'Events', path: '/admin/events', color: 'bg-green-600' },
  { icon: <FiImage />, label: 'Gallery', path: '/admin/gallery', color: 'bg-purple-600' },
  { icon: <FiBell />, label: 'Announcements', path: '/admin/announcements', color: 'bg-orange-500' },
  { icon: <GiCrucifix />, label: 'Bookings', path: '/admin/bookings', color: 'bg-indigo-600' },
  { icon: <FiFileText />, label: 'Documents', path: '/admin/documents', color: 'bg-teal-600' },
  { icon: <FiDollarSign />, label: 'Donations', path: '/admin/donations', color: 'bg-yellow-600' },
  { icon: <FiMessageSquare />, label: 'Tickets', path: '/admin/tickets', color: 'bg-rose-600' },
  { icon: <GiPrayer />, label: 'Prayers', path: '/admin/prayers', color: 'bg-church-gold' },
  { icon: <SiWhatsapp />, label: 'WhatsApp Bot', path: '/admin/whatsapp', color: 'bg-[#25D366]' },
  { icon: <FiSettings />, label: 'Settings', path: '/admin/settings', color: 'bg-gray-600' },
];

export default function AdminLayout() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const { adminUnreadCount } = useNotifications();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-church-cream flex">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex fixed inset-y-0 left-0 ${desktopOpen ? 'w-64' : 'w-20'} bg-church-royal-blue z-50 transform transition-all duration-300 flex-col`}>
        <div className={`px-3 py-2.5 border-b border-white/10 flex items-center ${desktopOpen ? 'justify-between' : 'justify-center'} relative bg-white/5`}>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-white ring-2 ring-church-gold/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              <img src={churchLogo} alt="Logo" className="w-full h-full object-cover object-[center_15%] rounded-full" />
            </div>
            {desktopOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
                <p className="text-church-gold text-[10px] leading-tight font-medium">St. John de Britto</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button 
          onClick={() => setDesktopOpen(!desktopOpen)} 
          className="hidden lg:flex absolute top-4 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-church-royal-blue z-50 hover:bg-gray-50 shadow-md"
        >
          <FiArrowLeft className={`transition-transform duration-300 ${!desktopOpen ? 'rotate-180' : ''}`} size={12} />
        </button>
        
        <nav className="flex-1 px-2 py-1 flex flex-col justify-evenly">
          <Link to="/admin" className={`flex items-center ${desktopOpen ? 'gap-2.5 px-2.5' : 'justify-center'} py-1 rounded-lg font-semibold text-xs transition-all ${location.pathname === '/admin' ? 'bg-church-gold text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'} group relative`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-xs flex-shrink-0 ${location.pathname === '/admin' ? 'bg-white/20' : 'bg-church-gold'}`}>
              <GiCrucifix className="text-sm" />
            </span>
            {desktopOpen ? <span>Dashboard</span> : (
              <span className="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">Dashboard</span>
            )}
          </Link>
          {NAV_ITEMS.map((item, i) => (
            <Link key={i} to={item.path} className={`flex items-center ${desktopOpen ? 'gap-2.5 px-2.5' : 'justify-center'} py-1 rounded-lg font-semibold text-xs transition-all ${location.pathname === item.path ? 'bg-church-gold text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'} group relative`}>
              <span className={`w-6 h-6 rounded-md ${location.pathname === item.path ? 'bg-white/20' : item.color} flex items-center justify-center text-white text-xs flex-shrink-0`}>{item.icon}</span>
              {desktopOpen ? <span>{item.label}</span> : (
                <span className="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">{item.label}</span>
              )}
            </Link>
          ))}

          {/* Notifications Nav Item with Badge */}
          <Link
            to="/admin/notifications"
            className={`flex items-center ${desktopOpen ? 'gap-2.5 px-2.5' : 'justify-center'} py-1 rounded-lg font-semibold text-xs transition-all ${
              location.pathname === '/admin/notifications' ? 'bg-church-gold text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'
            } group relative`}
          >
            <span className={`w-6 h-6 rounded-md ${location.pathname === '/admin/notifications' ? 'bg-white/20' : 'bg-red-500'} flex items-center justify-center text-white text-xs flex-shrink-0 relative`}>
              <FiBell />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-church-gold text-white text-[7px] rounded-full flex items-center justify-center font-black border border-church-royal-blue">
                  {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                </span>
              )}
            </span>
            {desktopOpen ? (
              <span className="flex items-center gap-2">
                Notifications
                {adminUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{adminUnreadCount}</span>
                )}
              </span>
            ) : (
              <span className="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">Notifications</span>
            )}
          </Link>
        </nav>
        
        <div className={`px-2 py-2 border-t border-white/10 flex flex-col gap-1.5 ${!desktopOpen && 'items-center'} flex-shrink-0`}>
          <Link to="/" className={`flex items-center ${desktopOpen ? 'gap-2 px-3' : 'justify-center'} bg-church-gold hover:brightness-110 text-white text-xs font-bold transition-all py-2 rounded-lg w-full shadow-gold-sm group relative`}>
            <FiArrowLeft className="flex-shrink-0" />
            {desktopOpen ? <span>Back to Website</span> : (
              <span className="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">Back to Website</span>
            )}
          </Link>
          <button onClick={() => setShowLogoutConfirm(true)} className={`flex items-center ${desktopOpen ? 'gap-2 px-3' : 'justify-center'} bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors py-2 rounded-lg w-full shadow-sm group relative`}>
            <FiLogOut className="flex-shrink-0" />
            {desktopOpen ? <span>Logout</span> : (
              <span className="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">Logout</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${desktopOpen ? 'lg:ml-64' : 'lg:ml-20'} flex flex-col min-h-screen relative w-full`}>
        {/* Mobile Header Navbar */}
        <div className="lg:hidden bg-church-royal-blue text-white p-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          {/* Top Left: Church logo image linking to Admin Dashboard */}
          <Link to="/admin" className="w-10 h-10 rounded-full bg-white ring-2 ring-church-gold/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
            <img src={churchLogo} alt="Admin Dashboard" className="w-full h-full object-cover object-[center_15%]" />
          </Link>

          {/* Top Right: Notifications, Back to Website & Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin/notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 shadow-sm"
              title="Admin Notifications"
            >
              <FiBell className="text-base text-church-gold" />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-church-royal-blue animate-pulse flex items-center justify-center text-[8px] font-black text-white">
                  {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                </span>
              )}
            </Link>
            <Link to="/" className="flex items-center gap-1.5 bg-church-gold hover:brightness-110 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all">
              <FiArrowLeft className="text-sm" /> Back to Website
            </Link>
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all">
              <FiLogOut className="text-sm" /> Logout
            </button>
          </div>
        </div>


        
        {/* Outlet Content */}
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FiLogOut className="text-3xl -ml-1" />
              </div>
              <h2 className="font-display text-xl font-bold text-church-royal-blue mb-2">Log Out</h2>
              <p className="text-gray-500 text-sm mb-6 px-2">Are you sure you want to Log out of the Admin Panel?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowLogoutConfirm(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex-1">Cancel</button>
                <button onClick={logout} className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex-1 shadow-md">Log Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
