import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiUsers, FiCalendar, FiFileText, FiMessageSquare, FiDollarSign, FiSettings, FiImage, FiMic, FiBell } from 'react-icons/fi';
import { GiChurch, GiCrucifix, GiPrayer } from 'react-icons/gi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';

const COLORS = ['#d4a017', '#1e3a8a', '#800020', '#059669', '#7c3aed'];

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
  { icon: <FiUsers />, label: 'Registrations', path: '/admin/registrations', color: 'bg-indigo-500' },
  { icon: <GiPrayer />, label: 'Prayers', path: '/admin/prayers', color: 'bg-church-gold' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { icon: <FiUsers />, label: 'Total Members', value: stats?.stats?.totalUsers || 0, color: 'from-blue-600 to-blue-800' },
    { icon: <FiCalendar />, label: 'Pending Bookings', value: stats?.stats?.pendingBookings || 0, color: 'from-amber-500 to-amber-700', urgent: true },
    { icon: <FiFileText />, label: 'Pending Documents', value: stats?.stats?.pendingDocuments || 0, color: 'from-green-600 to-green-800', urgent: true },
    { icon: <FiMessageSquare />, label: 'Open Tickets', value: stats?.stats?.openTickets || 0, color: 'from-purple-600 to-purple-800', urgent: true },
    { icon: <FiDollarSign />, label: 'Total Donations', value: `₹${(stats?.stats?.totalDonations || 0).toLocaleString()}`, color: 'from-church-gold to-amber-700' },
    { icon: <FiCalendar />, label: 'Published Events', value: stats?.stats?.totalEvents || 0, color: 'from-church-royal-blue to-blue-900' },
  ];

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-church-royal-blue">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
        </div>
      </div>

          <div className="p-6">
            {loading ? <SectionLoader /> : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                  {STAT_CARDS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-card ${s.urgent && parseInt(s.value) > 0 ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="text-2xl font-bold font-display">{s.value}</div>
                      <p className="text-white/80 text-xs mt-1">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Nav */}
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mb-8 lg:hidden">
                  {NAV_ITEMS.map((item, i) => (
                    <Link key={i} to={item.path} className={`${item.color} text-white flex flex-col items-center gap-1.5 p-3 rounded-xl hover:scale-105 transition-all text-center`}>
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                  {/* Bookings by Status */}
                  {stats?.bookingsByStatus?.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="font-display text-lg font-bold text-gray-800  mb-4">Bookings by Status</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={stats.bookingsByStatus.map(b => ({ name: b._id, value: b.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                            {stats.bookingsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Donations by Type */}
                  {stats?.donationsByType?.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="font-display text-lg font-bold text-gray-800  mb-4">Donations by Type</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stats.donationsByType.map(d => ({ name: d._id, amount: d.total, count: d.count }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => `₹${v}`} />
                          <Bar dataKey="amount" fill="#d4a017" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Recent Users & Upcoming Events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-gray-800 ">Recent Members</h3>
                      <Link to="/admin/users" className="text-church-gold text-sm hover:underline">View all</Link>
                    </div>
                    <div className="space-y-3">
                      {stats?.recentUsers?.map((u, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800  text-sm truncate">{u.name}</p>
                            <p className="text-gray-400 text-xs truncate">{u.phone}</p>
                          </div>
                          <p className="text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-gray-800 ">Upcoming Events</h3>
                      <Link to="/admin/events" className="text-church-gold text-sm hover:underline">Manage</Link>
                    </div>
                    <div className="space-y-3">
                      {stats?.upcomingEvents?.map((ev, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="min-w-10 h-10 rounded-xl bg-church-gradient flex flex-col items-center justify-center text-center">
                            <span className="text-white font-bold text-sm leading-none">{new Date(ev.date).getDate()}</span>
                            <span className="text-gold-300 text-[10px]">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800  text-sm truncate">{ev.title}</p>
                            <p className="text-gray-400 text-xs capitalize">{ev.category}</p>
                          </div>
                        </div>
                      ))}
                      {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && <p className="text-gray-400 text-sm">No upcoming events</p>}
                    </div>
                    </div>
                  </div>
              </>
            )}
          </div>
    </div>
  );
}
