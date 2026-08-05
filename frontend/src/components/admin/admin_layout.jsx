import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiUsers, FiBriefcase, FiBookOpen, FiCalendar, FiFileText, FiMessageSquare, FiVolume2, FiDollarSign, FiImage, FiBell, FiMenu, FiX, FiLogOut, FiArrowLeft, FiSettings, FiTool } from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import { GiChurch, GiCrucifix, GiPrayer } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/context_auth_context';
import { useNotifications } from '../../context/context_notification_context';
import PreMaintenanceBanner from '../common/common_pre_maintenance_banner';
import churchLogo from '../../assets/image copy.png';

const NAV_ITEMS = [
  { icon: <FiUsers />, label: 'Users', path: '/admin/users', color: 'bg-blue-500' },
  { icon: <GiChurch />, label: 'Anbiyams', path: '/admin/anbiyam', color: 'bg-indigo-700' },
  { icon: <FiBriefcase />, label: 'Manage Team', path: '/admin/team', color: 'bg-emerald-600'},
  { icon: <GiChurch />, label: 'Priests', path: '/admin/priests', color: 'bg-amber-600' },
  { icon: <FiCalendar />, label: 'Events', path: '/admin/events', color: 'bg-green-600' },
  { icon: <FiVolume2 />, label: 'Announcements', path: '/admin/announcements', color: 'bg-orange-500' },
  { icon: <FiImage />, label: 'Gallery', path: '/admin/gallery', color: 'bg-purple-600' },
  { icon: <FiBookOpen    />, label: 'Bookings', path: '/admin/bookings', color: 'bg-indigo-600' },
  { icon: <FiFileText />, label: 'Documents', path: '/admin/documents', color: 'bg-teal-600' },
  { icon: <FiDollarSign />, label: 'Donations', path: '/admin/donations', color: 'bg-yellow-600' },
  { icon: <FiMessageSquare />, label: 'Tickets', path: '/admin/tickets', color: 'bg-rose-600' },
  { icon: <GiPrayer />, label: 'Prayers', path: '/admin/prayers', color: 'bg-church-gold' },
  { icon: <SiWhatsapp />, label: 'WhatsApp Bot', path: '/admin/whatsapp', color: 'bg-[#25D366]' },
  { icon: <FiSettings />, label: 'Site Settings', path: '/admin/settings', color: 'bg-gray-600' },
];

export default function AdminLayout() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState(null); // { label: string, top: number }
  const { logout } = useAuth();
  const { adminUnreadCount } = useNotifications();
  const location = useLocation();

  const handleMouseEnter = (label, e) => {
    if (desktopOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({ label, top: rect.top + rect.height / 2 });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

  return (
    <div className="min-h-screen bg-church-cream flex">
      {/* Dynamic Sidebar Hover Tooltip */}
      {!desktopOpen && hoveredTooltip && (
        <div 
          style={{ top: `${hoveredTooltip.top}px` }} 
          className="fixed left-20 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xl border border-white/20 z-[999] pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
        >
          {hoveredTooltip.label}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex fixed inset-y-0 left-0 ${desktopOpen ? 'w-64' : 'w-20'} bg-church-royal-blue z-50 transform transition-all duration-300 flex-col`}>
        <div className={`px-3 py-2.5 border-b border-white/10 flex items-center ${desktopOpen ? 'justify-between' : 'justify-center'} relative bg-white/5`}>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-white ring-2 ring-church-gold/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              <img src={churchLogo} alt="Logo" className="w-full h-full object-cover object-[center_15%] rounded-full" />
            </div>
            {desktopOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-white font-bold text-sm leading-tight">St. John de Britto Church</p>
                <p className="text-church-gold text-[10px] leading-tight font-medium">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button 
          onClick={() => { setDesktopOpen(!desktopOpen); setHoveredTooltip(null); }} 
          className="hidden lg:flex absolute top-4 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-church-royal-blue z-50 hover:bg-gray-50 shadow-md"
        >
          <FiArrowLeft className={`transition-transform duration-300 ${!desktopOpen ? 'rotate-180' : ''}`} size={12} />
        </button>
        
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1.5 admin-sidebar-scroll">
          <Link 
            to="/admin" 
            onMouseEnter={(e) => handleMouseEnter('Dashboard', e)}
            onMouseLeave={handleMouseLeave}
            className={`flex items-center ${desktopOpen ? 'gap-2.5 px-3' : 'justify-center'} py-2 rounded-xl font-bold text-xs transition-all ${location.pathname === '/admin' ? 'bg-church-gold text-white shadow-md' : 'text-gray-200 hover:bg-white/10 hover:text-white'} group relative`}
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 ${location.pathname === '/admin' ? 'bg-white/20' : 'bg-church-gold'}`}>
              <GiCrucifix className="text-sm" />
            </span>
            {desktopOpen && <span>Dashboard</span>}
          </Link>

          {NAV_ITEMS.map((item, i) => (
            <Link 
              key={i} 
              to={item.path} 
              onMouseEnter={(e) => handleMouseEnter(item.label, e)}
              onMouseLeave={handleMouseLeave}
              className={`flex items-center ${desktopOpen ? 'gap-2.5 px-3' : 'justify-center'} py-2 rounded-xl font-bold text-xs transition-all ${location.pathname === item.path ? 'bg-church-gold text-white shadow-md' : 'text-gray-200 hover:bg-white/10 hover:text-white'} group relative`}
            >
              <span className={`w-7 h-7 rounded-lg ${location.pathname === item.path ? 'bg-white/20' : item.color} flex items-center justify-center text-white text-xs flex-shrink-0`}>{item.icon}</span>
              {desktopOpen && <span>{item.label}</span>}
            </Link>
          ))}

          {/* Notifications Nav Item with Badge */}
          <Link
            to="/admin/notifications"
            onMouseEnter={(e) => handleMouseEnter(`Notifications${adminUnreadCount > 0 ? ` (${adminUnreadCount})` : ''}`, e)}
            onMouseLeave={handleMouseLeave}
            className={`flex items-center ${desktopOpen ? 'gap-2.5 px-3' : 'justify-center'} py-2 rounded-xl font-bold text-xs transition-all ${
              location.pathname === '/admin/notifications' ? 'bg-church-gold text-white shadow-md' : 'text-gray-200 hover:bg-white/10 hover:text-white'
            } group relative`}
          >
            <span className={`w-7 h-7 rounded-lg ${location.pathname === '/admin/notifications' ? 'bg-white/20' : 'bg-red-500'} flex items-center justify-center text-white text-xs flex-shrink-0 relative`}>
              <FiBell />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-church-gold text-white text-[7px] rounded-full flex items-center justify-center font-black border border-church-royal-blue">
                  {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                </span>
              )}
            </span>
            {desktopOpen && (
              <span className="flex items-center gap-2">
                Notifications
                {adminUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{adminUnreadCount}</span>
                )}
              </span>
            )}
          </Link>
        </nav>
        
        <div className={`px-2 py-2 border-t border-white/10 flex flex-col gap-1.5 ${!desktopOpen && 'items-center'} flex-shrink-0`}>
          <Link 
            to="/" 
            onMouseEnter={(e) => handleMouseEnter('Back to Website', e)}
            onMouseLeave={handleMouseLeave}
            className={`flex items-center ${desktopOpen ? 'gap-2 px-3' : 'justify-center'} bg-church-gold hover:brightness-110 text-white text-xs font-bold transition-all py-2 rounded-lg w-full shadow-gold-sm group relative`}
          >
            <FiArrowLeft className="flex-shrink-0 text-sm" />
            {desktopOpen && <span>Back to Website</span>}
          </Link>
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            onMouseEnter={(e) => handleMouseEnter('Logout', e)}
            onMouseLeave={handleMouseLeave}
            className={`flex items-center ${desktopOpen ? 'gap-2 px-3' : 'justify-center'} bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors py-2 rounded-lg w-full shadow-sm group relative`}
          >
            <FiLogOut className="flex-shrink-0 text-sm" />
            {desktopOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${desktopOpen ? 'lg:ml-64' : 'lg:ml-20'} flex flex-col min-h-screen relative w-full`}>
        {/* Mobile Header Navbar */}
        <div className="lg:hidden bg-church-royal-blue text-white p-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          {/* Top Left: Church logo image linking to Admin Dashboard */}
          <Link to="/admin" className="w-10 h-10 rounded-full bg-white ring-2 ring-church-gold/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
            <img src={churchLogo} alt="Admin Dashboard" className="w-full h-full object-cover object-[center_15%]" />
          </Link>

          {/* Top Right: Back to Website & Logout */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 bg-church-gold hover:brightness-110 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all">
              <FiArrowLeft className="text-sm" /> Back to Website
            </Link>
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all">
              <FiLogOut className="text-sm" /> Logout
            </button>
          </div>
        </div>

        {/* Scheduled Maintenance Notice Banner for Admin Panel */}
        <PreMaintenanceBanner />
        
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
