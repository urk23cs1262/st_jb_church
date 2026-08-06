import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiUsers, FiBriefcase, FiBookOpen, FiCalendar, FiFileText, FiMessageSquare, FiDollarSign, FiSettings, FiImage, FiBell, FiGift, FiHeart, FiClock, FiTool, FiRefreshCw } from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import { GiChurch, GiCrucifix, GiPrayer } from 'react-icons/gi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/common_loader';
import { useNotifications } from '../../context/context_notification_context';

const COLORS = ['#d4a017', '#1e3a8a', '#800020', '#059669', '#7c3aed'];

const NAV_ITEMS = [
  { icon: <FiUsers />, label: 'Users', path: '/admin/users', color: 'bg-blue-500' },
  { icon: <GiChurch />, label: 'Anbiyams', path: '/admin/anbiyam', color: 'bg-indigo-700' },
  { icon: <FiBriefcase />, label: 'Manage Team', path: '/admin/team', color: 'bg-emerald-600'},
  { icon: <GiChurch />, label: 'Priests', path: '/admin/priests', color: 'bg-amber-600' },
  { icon: <FiCalendar />, label: 'Events', path: '/admin/events', color: 'bg-green-600' },
  { icon: <FiImage />, label: 'Gallery', path: '/admin/gallery', color: 'bg-purple-600' },
  { icon: <FiBell />, label: 'Announcements', path: '/admin/announcements', color: 'bg-orange-500' },
  { icon: <FiBookOpen />, label: 'Bookings', path: '/admin/bookings', color: 'bg-indigo-600' },
  { icon: <FiFileText />, label: 'Documents', path: '/admin/documents', color: 'bg-teal-600' },
  { icon: <FiDollarSign />, label: 'Donations', path: '/admin/donations', color: 'bg-yellow-600' },
  { icon: <FiMessageSquare />, label: 'Tickets', path: '/admin/tickets', color: 'bg-rose-600' },
  { icon: <GiPrayer />, label: 'Prayers', path: '/admin/prayers', color: 'bg-church-gold' },
  { icon: <SiWhatsapp />, label: 'WhatsApp Bot', path: '/admin/whatsapp', color: 'bg-[#25D366]' },
  { icon: <FiSettings />, label: 'Site Settings', path: '/admin/settings', color: 'bg-gray-600' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingVerse, setChangingVerse] = useState(false);
  const { adminUnreadCount } = useNotifications();

  const fetchDashboardData = () => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleChangeVerse = async () => {
    setChangingVerse(true);
    try {
      const res = await api.post('/settings/daily-verses/change-today');
      if (res.data.success && res.data.verse) {
        setStats(prev => ({
          ...prev,
          todayVerse: res.data.verse
        }));
        toast.success(`Today's verse changed to ${res.data.verse.ref || res.data.verse.reference}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change verse');
    } finally {
      setChangingVerse(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const s = stats?.stats || {};

  const STAT_CARDS = [
    { 
      icon: <FiUsers className="text-xl" />, 
      label: 'Registered Members', 
      value: s.totalUsers || 0, 
      subText: `+${s.newMembersThisMonth || 0} this month`,
      color: 'from-blue-700 to-indigo-900',
      link: '/admin/users'
    },
    { 
      icon: <FiBookOpen className="text-xl" />, 
      label: "Today's Mass Bookings", 
      value: s.todayBookings || 0, 
      subText: `${s.pendingBookings || 0} pending review`,
      color: 'from-amber-600 to-amber-800',
      urgent: s.pendingBookings > 0,
      link: '/admin/bookings'
    },
    { 
      icon: <FiDollarSign className="text-xl" />, 
      label: 'Monthly Donations', 
      value: `₹${(s.donationsThisMonth || 0).toLocaleString()}`, 
      subText: `₹${(s.donationsToday || 0).toLocaleString()} today`,
      badge: currentMonthYear,
      color: 'from-emerald-600 to-teal-800',
      link: '/admin/donations'
    },
    { 
      icon: <FiCalendar className="text-xl" />, 
      label: 'Upcoming Events', 
      value: s.upcomingEventsCount || 0, 
      subText: `${s.totalEvents || 0} total published`,
      color: 'from-purple-600 to-indigo-800',
      link: '/admin/events'
    },
    { 
      icon: <FiBell className="text-xl" />, 
      label: 'Active Announcements', 
      value: s.activeAnnouncementsCount || 0, 
      subText: 'Published on portal',
      color: 'from-rose-600 to-pink-800',
      link: '/admin/announcements'
    },
    { 
      icon: <FiGift className="text-xl" />, 
      label: 'Upcoming Birthdays', 
      value: s.upcomingBirthdaysCount ?? (stats?.upcomingBirthdays?.length || 0), 
      subText: 'In current month',
      color: 'from-orange-500 to-amber-700',
      link: '/admin/users'
    },
    { 
      icon: <FiHeart className="text-xl" />, 
      label: 'Wedding Anniversaries', 
      value: s.upcomingAnniversariesCount ?? (stats?.upcomingAnniversaries?.length || 0), 
      subText: 'Parish couples this month',
      color: 'from-pink-600 to-purple-800',
      link: '/admin/users'
    },
    { 
      icon: <FiBriefcase className="text-xl" />, 
      label: 'Manage Team', 
      value: s.totalTeamMembers || 0, 
      subText: `${s.activeTeamMembers || 0} active members`,
      color: 'from-sky-600 to-blue-800',
      link: '/admin/team'
    },
    { 
      icon: <FiMessageSquare className="text-xl" />, 
      label: 'Pending Messages', 
      value: s.pendingMessages || 0, 
      subText: `${s.openTickets || 0} tickets & ${s.pendingPrayers || 0} prayers`,
      color: 'from-amber-700 to-red-800',
      urgent: s.pendingMessages > 0,
      link: '/admin/tickets'
    },
    { 
      icon: <FiDollarSign className="text-xl" />, 
      label: 'Total All-Time Donations', 
      value: `₹${(s.totalDonations || 0).toLocaleString()}`, 
      subText: `₹${(s.donationsThisYear || 0).toLocaleString()} this year`,
      color: 'from-amber-600 to-yellow-800',
      link: '/admin/donations'
    }
  ];

  const handleClearTimeline = async () => {
    try {
      await api.post('/admin/reset-timeline');
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to reset timeline:', err);
    }
  };

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-xs">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-church-royal-blue">SJDB Admin Dashboard</h1>
        <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/admin/maintenance')}
          className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 hover:from-amber-700 hover:via-red-700 hover:to-amber-800 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap group"
        >
          <FiTool className="text-lg text-amber-200 group-hover:rotate-45 transition-transform duration-300" />
          <span className="hidden sm:inline">Maintenance Mode</span>
        </button>
        
          <Link
            to="/admin/notifications"
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-church-royal-blue/5 text-church-royal-blue hover:bg-church-royal-blue/10 border border-church-royal-blue/20 transition-all text-xs sm:text-sm font-bold shadow-xs"
            title="Admin Notifications"
          >
            <span className="relative flex items-center justify-center">
              <FiBell className="text-base sm:text-lg text-church-gold" />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white" />
              )}
            </span>
            <span className="hidden sm:inline">Notifications</span>
            {adminUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {adminUnreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? <SectionLoader /> : (
          <>
            {/* Today's Scripture Banner */}
            {stats?.todayVerse && (
              <div className="bg-gradient-to-r from-church-royal-blue to-blue-900 text-white rounded-3xl p-5 shadow-xl border border-church-gold/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-church-gold text-white font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-gold">
                    📖
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-church-gold bg-white/10 px-2 py-0.5 rounded-full">
                      TODAY'S SCRIPTURE — {stats.todayVerse.ref || stats.todayVerse.reference}
                    </span>
                    <p className="text-xs sm:text-sm italic text-gray-100 font-serif mt-1">
                      "{stats.todayVerse.verseTextEn || stats.todayVerse.english || stats.todayVerse.verseTextTa || stats.todayVerse.tamil}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleChangeVerse}
                    disabled={changingVerse}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 hover:text-white text-xs py-2 px-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FiRefreshCw className={`text-sm ${changingVerse ? 'animate-spin' : ''}`} />
                    <span>{changingVerse ? 'Changing...' : 'Change Verse'}</span>
                  </button>
                  <Link to="/bible-verse" className="btn-gold text-xs py-2 px-4 whitespace-nowrap font-bold shadow-gold flex-shrink-0">
                    Read Full Verse
                  </Link>
                </div>
              </div>
            )}

            {/* Stat Cards Grid — 2 cols mobile, 3 cols tablet, 5 cols large desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 mb-8">
              {STAT_CARDS.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-gradient-to-br ${card.color} rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-white shadow-lg flex flex-col justify-between h-full border border-white/10 ${
                    card.urgent ? 'ring-2 ring-red-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-xs text-sm sm:text-base">
                      {card.icon}
                    </div>
                    {card.badge && (
                      <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-2xs">
                        {card.badge}
                      </span>
                    )}
                    {card.urgent && (
                      <span className="bg-red-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase animate-pulse">
                        Action!
                      </span>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <div className="text-2xl sm:text-3xl font-black font-display tracking-tight">{card.value}</div>
                    <p className="font-extrabold text-[11px] sm:text-sm text-white mt-0.5 sm:mt-1 leading-tight">{card.label}</p>
                    <p className="text-[10px] sm:text-[11px] italic text-white/80 mt-0.5 hidden sm:block">{card.subText}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Nav — Mobile Only (hidden on md+ where sidebar is visible) */}
            <div className="block md:hidden mb-6">
              <p className="text-[15px] font-black uppercase tracking-widest mb-3 px-1">Quick Access</p>
              <div className="grid grid-cols-3 gap-3">
                {NAV_ITEMS.map((item, i) => (
                  <Link key={i} to={item.path}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white text-2xl shadow-xs`}>
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Middle Section: Recent Activity Timeline & Calendar Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              
              {/* Recent Activity Timeline (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="font-display text-base font-extrabold text-church-royal-blue flex items-center gap-2 tracking-wide uppercase">
                    <FiClock className="text-church-gold text-lg" /> RECENT PARISH ACTIVITY TIMELINE
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleClearTimeline}
                      className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      title="Clear past activity and start logging fresh from now"
                    >
                      Clear / Start From Now
                    </button>
                    <span className="text-xs font-bold text-gray-400">Live Updates</span>
                  </div>
                </div>

                {stats?.recentActivities?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivities.map((act, idx) => (
                      <div key={act.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border-l-4 border-church-gold hover:bg-gold-50/40 transition-colors shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-church-royal-blue/10 text-church-royal-blue flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {act.icon || '📍'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{act.title}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">{act.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                          {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-8 text-center">No recent parish activity logged today.</p>
                )}
              </div>

              {/* Parish Calendar Overview (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="font-display text-base font-extrabold text-church-royal-blue flex items-center gap-2 uppercase tracking-wide">
                      <FiCalendar className="text-church-gold text-lg" /> PARISH CALENDAR OVERVIEW
                    </h3>
                    <span className="text-xs font-bold text-church-gold bg-amber-50 px-2.5 py-1 rounded-full">
                      {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 text-center mb-5">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">TODAY'S DATE</p>
                    <p className="text-4xl font-black text-church-royal-blue my-1">
                      {new Date().getDate()} {new Date().toLocaleString('default', { month: 'long' })}
                    </p>
                    <p className="text-xs font-bold text-church-gold">
                      {new Date().toLocaleDateString('default', { weekday: 'long' })}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider mb-3">UPCOMING EVENTS SPOTLIGHT</p>
                    {stats?.upcomingEvents?.length > 0 ? (
                      <div className="space-y-2.5">
                        {stats.upcomingEvents.slice(0, 3).map((ev, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-church-gold text-white font-black flex flex-col items-center justify-center text-xs flex-shrink-0">
                              <span>{new Date(ev.date).getDate()}</span>
                              <span className="text-[9px] uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-extrabold text-gray-900 text-xs truncate">{ev.title}</p>
                              <p className="text-[10px] text-gray-400 capitalize">{ev.category || 'Other'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-3">No upcoming events scheduled.</p>
                    )}
                  </div>
                </div>

                <Link to="/admin/events" className="btn-gold w-full text-xs font-extrabold py-3 text-center mt-6 shadow-gold rounded-2xl block">
                  Open Full Event Calendar
                </Link>
              </div>

            </div>

            {/* Bottom Section: Birthdays & Anniversaries Spotlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              
              {/* Birthdays this Month */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="font-display text-base font-extrabold text-church-royal-blue flex items-center gap-2 uppercase tracking-wide">
                    <FiGift className="text-pink-500" /> BIRTHDAYS THIS MONTH ({stats?.upcomingBirthdays?.length || 0})
                  </h3>
                  <Link to="/admin/users" className="text-xs text-church-gold font-bold hover:underline">View All Members</Link>
                </div>

                {stats?.upcomingBirthdays?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingBirthdays.map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-pink-500 text-white font-bold flex items-center justify-center text-xs">
                            🎂
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{u.name}</p>
                            <p className="text-[10px] text-gray-500">Parish ID: {u.parishMemberId || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-pink-700 bg-pink-100 px-2.5 py-1 rounded-full">
                          {new Date(u.dob).getDate()} {new Date(u.dob).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-6 text-center">No member birthdays recorded for this month.</p>
                )}
              </div>

              {/* Anniversaries this Month */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="font-display text-base font-extrabold text-church-royal-blue flex items-center gap-2 uppercase tracking-wide">
                    <FiHeart className="text-rose-500" /> WEDDING ANNIVERSARIES ({stats?.upcomingAnniversaries?.length || 0})
                  </h3>
                  <Link to="/admin/users" className="text-xs text-church-gold font-bold hover:underline">View All Couples</Link>
                </div>

                {stats?.upcomingAnniversaries?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingAnniversaries.map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white font-bold flex items-center justify-center text-xs">
                            💍
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{u.name}</p>
                            <p className="text-[10px] text-gray-500">Family ID: {u.familyId || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                          {new Date(u.weddingDate).getDate()} {new Date(u.weddingDate).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-6 text-center">No wedding anniversaries recorded for this month.</p>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
