import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiSearch, FiTrash2, FiCheckCircle, FiFilter,
  FiRefreshCw, FiSend, FiMoreVertical, FiCheck, FiAlertCircle, FiX, FiArrowLeft, FiArrowRight
} from 'react-icons/fi';
import { MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🔔' },
  { key: 'account', label: 'Registrations', emoji: '👤' },
  { key: 'bookings', label: 'Bookings', emoji: '🗓️' },
  { key: 'donations', label: 'Donations', emoji: '💰' },
  { key: 'documents', label: 'Documents', emoji: '📄' },
  { key: 'tickets', label: 'Tickets', emoji: '🎫' },
  { key: 'prayer', label: 'Prayers', emoji: '🙏' },
  { key: 'events', label: 'Events', emoji: '📅' },
  { key: 'announcements', label: 'Announcements', emoji: '📢' },
  { key: 'system', label: 'System', emoji: '⚠️' },
];

const CATEGORY_COLORS = {
  account: 'bg-blue-100 text-blue-700 border-blue-200',
  bookings: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  donations: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  documents: 'bg-teal-100 text-teal-700 border-teal-200',
  tickets: 'bg-rose-100 text-rose-700 border-rose-200',
  prayer: 'bg-purple-100 text-purple-700 border-purple-200',
  events: 'bg-blue-100 text-blue-700 border-blue-200',
  announcements: 'bg-orange-100 text-orange-700 border-orange-200',
  system: 'bg-red-100 text-red-700 border-red-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200',
};

function timeAgo(date) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; }
}

function AdminNotifCard({ notif, onMarkRead, onDelete, onTogglePin, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = notif.category || notif.type || 'general';
  const catConfig = CATEGORIES.find(c => c.key === cat) || CATEGORIES[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`relative flex gap-4 p-4 rounded-2xl border transition-all group ${notif.isRead
        ? 'bg-white border-gray-100'
        : 'bg-gradient-to-r from-blue-50/60 to-white border-l-4 border-church-royal-blue shadow-sm'
        } ${notif.priority === 'high' ? 'ring-1 ring-red-200' : ''}`}
    >
      {/* Category icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
        }`}>
        {catConfig.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {notif.title}
            </p>
            {!notif.isRead && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse ring-2 ring-red-200" title="Unread notification" />
            )}
            {notif.priority === 'high' && (
              <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <FiAlertCircle size={8} /> High Priority
              </span>
            )}
            {notif.isPinned && <MdPushPin className="text-church-gold text-sm flex-shrink-0" />}
          </div>

          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
              <FiMoreVertical />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border z-20 min-w-[150px] overflow-hidden"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {!notif.isRead && (
                    <button onClick={() => { onMarkRead(notif._id); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium">
                      <FiCheck className="text-green-500" /> Mark Read
                    </button>
                  )}
                  <button onClick={() => { onTogglePin(notif._id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium">
                    <MdOutlinePushPin className="text-church-gold" />
                    {notif.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => { onAction(notif); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium">
                    <FiAlertCircle className="text-blue-500" /> View Details
                  </button>
                  <button onClick={() => { onDelete(notif._id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium border-t">
                    <FiTrash2 /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-2">{notif.message}</p>

        {/* Sender info if available */}
        {notif.userId?.name && (
          <p className="text-[10px] text-church-royal-blue font-semibold mt-1">
            From: {notif.userId.name} ({notif.userId.email || notif.userId.phone})
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
            }`}>
            {catConfig.label}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
          <button
            onClick={() => onAction(notif)}
            className="text-[10px] text-church-royal-blue hover:text-church-royal-blue/80 font-bold underline ml-auto cursor-pointer"
          >
            View →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Notification Detail Modal ────────────────────────────────────────────────
function NotificationDetailModal({ notif, onClose, onMarkRead, onDelete }) {
  if (!notif) return null;
  const cat = notif.category || notif.type || 'general';
  const catConfig = CATEGORIES.find(c => c.key === cat) || CATEGORIES[0];
  const isSecurityAlert = notif.title?.includes('Security') || notif.relatedModel === 'SecurityIncident';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-gray-100 relative overflow-hidden"
      >
        {/* Top Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${
          isSecurityAlert ? 'bg-red-500' : 'bg-church-royal-blue'
        }`} />

        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border ${
              CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
            }`}>
              {catConfig.emoji}
            </div>
            <div>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                CATEGORY_COLORS[cat] || CATEGORY_COLORS.general
              }`}>
                {catConfig.label}
              </span>
              <h2 className="font-display font-extrabold text-gray-900 text-lg mt-1 leading-snug">
                {notif.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <FiX size={18} />
          </button>
        </div>

        {/* Priority & Timestamp */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          {notif.priority === 'high' && (
            <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FiAlertCircle size={10} /> High Priority
            </span>
          )}
          <span>Received {timeAgo(notif.createdAt)}</span>
        </div>

        {/* Sender details */}
        {notif.userId?.name && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 mb-4 text-xs space-y-1">
            <div className="text-gray-400 font-bold uppercase text-[10px]">User / Sender Details</div>
            <div className="font-bold text-gray-900 text-sm">{notif.userId.name}</div>
            <div className="text-gray-600 font-medium">{notif.userId.email || notif.userId.phone}</div>
          </div>
        )}

        {/* Full Message */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5 text-sm text-gray-800 leading-relaxed font-normal">
          {notif.message}
        </div>

        {/* Security Incident Specific Box */}
        {isSecurityAlert && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 text-xs text-red-900 space-y-2">
            <div className="font-bold text-red-700 flex items-center gap-1.5 text-sm">
              <FiAlertCircle /> Security Incident Protection Status
            </div>
            <ul className="space-y-1 text-red-800 list-disc list-inside">
              <li>Active user login sessions across all devices terminated.</li>
              <li>Emergency password reset verification OTP issued to user.</li>
              <li>Incident logged in parish security registry for admin review.</li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => { onDelete(notif._id); onClose(); }}
            className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <FiTrash2 size={14} /> Delete
          </button>

          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <button
                onClick={() => { onMarkRead(notif._id); onClose(); }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <FiCheck className="text-green-600" size={14} /> Mark Read
              </button>
            )}

            {notif.actionUrl && (
              <Link
                to={notif.actionUrl}
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-church-royal-blue hover:bg-church-royal-blue/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                Go to Module <FiArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Broadcast Modal ──────────────────────────────────────────────────────────
function BroadcastModal({ onClose, onSent }) {
  const [form, setForm] = useState({ title: '', message: '', category: 'announcements', priority: 'medium' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.title || !form.message) return toast.error('Title and message are required');
    setSending(true);
    try {
      await api.post('/notifications/broadcast', form);
      toast.success('Broadcast sent to all users!');
      onSent();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-church-royal-blue text-lg flex items-center gap-2">
            <FiSend className="text-church-gold" /> Broadcast Notification
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-church-gold/30"
              placeholder="Notification title..."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-church-gold/30 resize-none"
              placeholder="Message for all users..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none font-medium"
              >
                <option value="announcements">Announcements</option>
                <option value="events">Events</option>
                <option value="general">General</option>
                {/* <option value="bookings">🗓️ Mass / Bookings</option>
                <option value="documents">📄 Documents</option>
                <option value="donations">💰 Donations</option>
                <option value="prayer">🙏 Prayers</option> */}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex-[2] py-2.5 rounded-xl bg-church-royal-blue text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-church-royal-blue/90 disabled:opacity-60">
            <FiSend size={14} /> {sending ? 'Sending...' : 'Send to All Users'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Admin Notifications Page ────────────────────────────────────────────
export default function AdminNotifications() {
  const { adminNotifications, adminUnreadCount, loading, markRead, markAllAdminRead, deleteNotification, togglePin, refetch } = useNotifications();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const filtered = useMemo(() => {
    return adminNotifications.filter(n => {
      const cat = n.category || n.type || 'general';
      const matchCat = activeCategory === 'all' || cat === activeCategory;
      const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase());
      const matchUnread = !showUnreadOnly || !n.isRead;
      return matchCat && matchSearch && matchUnread;
    });
  }, [adminNotifications, activeCategory, search, showUnreadOnly]);

  const handleDelete = async (id) => {
    await deleteNotification(id);
    toast.success('Notification deleted');
  };

  const handleMarkAllRead = async () => {
    await markAllAdminRead();
    toast.success('All marked as read');
  };

  const handleAction = (notif) => {
    if (!notif.isRead) markRead(notif._id);
    setSelectedNotif(notif);
  };

  // Stats
  const highPriorityCount = adminNotifications.filter(n => n.priority === 'high' && !n.isRead).length;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-church-cream">
      {/* Back to Admin Panel Link */}
      {/* <Link to="/admin" className="text-church-gold font-bold text-xs sm:text-sm hover:underline inline-flex items-center gap-1.5 mb-4">
        <FiArrowLeft /> Back to Admin Panel
      </Link> */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-church-royal-blue text-2xl flex items-center gap-2">
            Admin Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {adminUnreadCount > 0 ? `${adminUnreadCount} unread` : 'All caught up!'}
            {highPriorityCount > 0 && (
              <span className="ml-2 text-red-500 font-bold">• {highPriorityCount} urgent</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowBroadcast(true)}
          className="flex items-center gap-2 bg-church-royal-blue text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-church-royal-blue/90 shadow-md transition-all"
        >
          <FiSend size={14} /> Notify Users

        </button>
      </div>

      {/* Stats row */}
      {highPriorityCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
        >
          <FiAlertCircle className="text-red-500 text-xl flex-shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-sm">{highPriorityCount} high-priority notification{highPriorityCount > 1 ? 's' : ''} require your attention</p>
            <p className="text-red-500 text-xs mt-0.5">Review donations, bookings, or system alerts</p>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-church-royal-blue/20"
          />
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showUnreadOnly ? 'bg-church-royal-blue text-white border-church-royal-blue' : 'bg-white text-gray-600 border-gray-200'
            }`}
        >
          <FiFilter size={14} /> Unread Only
        </button>
        <button onClick={refetch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-church-royal-blue transition-all">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all'
            ? adminNotifications.length
            : adminNotifications.filter(n => (n.category || n.type || 'general') === cat.key).length;
          if (count === 0 && cat.key !== 'all') return null;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat.key
                ? 'bg-church-royal-blue text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-church-royal-blue/40'
                }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk actions */}
      {adminNotifications.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Showing {filtered.length} notifications</p>
          {adminUnreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs text-church-royal-blue font-bold hover:opacity-80">
              <FiCheckCircle size={12} /> Mark All Read
            </button>
          )}
        </div>
      )}

      {/* List */}
      {loading && adminNotifications.length === 0 ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="font-display font-bold text-gray-700 text-lg mb-2">No notifications</h3>
          <p className="text-gray-400 text-sm">New alerts will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned */}
          {filtered.some(n => n.isPinned) && (
            <div className="space-y-2">
              <p className="text-xs font-black text-church-gold uppercase tracking-widest flex items-center gap-1.5">
                <MdPushPin /> Pinned
              </p>
              <AnimatePresence mode="popLayout">
                {filtered.filter(n => n.isPinned).map(notif => (
                  <AdminNotifCard key={notif._id} notif={notif}
                    onMarkRead={markRead} onDelete={handleDelete} onTogglePin={togglePin} onAction={handleAction} />
                ))}
              </AnimatePresence>
            </div>
          )}
          {/* Regular */}
          <AnimatePresence mode="popLayout">
            {filtered.filter(n => !n.isPinned).map(notif => (
              <AdminNotifCard key={notif._id} notif={notif}
                onMarkRead={markRead} onDelete={handleDelete} onTogglePin={togglePin} onAction={handleAction} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialogue Box Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <NotificationDetailModal
            notif={selectedNotif}
            onClose={() => setSelectedNotif(null)}
            onMarkRead={markRead}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <BroadcastModal onClose={() => setShowBroadcast(false)} onSent={refetch} />
        )}
      </AnimatePresence>
    </div>
  );
}
