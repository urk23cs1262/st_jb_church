import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiSend, FiZap, FiMessageSquare, FiCheck, FiInfo } from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PREF_LABELS = {
  verse: '📖 Bible Verse',
  saint: '✝️ Saint of the Day',
  mass: '⛪ Mass Readings',
  events: '📅 Events',
  announcements: '🔔 Announcements',
  birthday: '🎂 Birthday Wishes',
};

const LANG_LABELS = { en: 'English', ta: 'Tamil', both: 'Both' };

export default function AdminWhatsApp() {
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [waStatus, setWaStatus] = useState({ connected: false });
  const [qrCode, setQrCode] = useState(null);

  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchData();

    // Poll status & QR code every 2 seconds if not connected
    const interval = setInterval(async () => {
      try {
        const [statusRes, qrRes] = await Promise.all([
          api.get('/bot/status').catch(() => ({ data: { connected: false } })),
          api.get('/bot/qr').catch(() => ({ data: { qr: null } }))
        ]);
        setWaStatus(statusRes.data);
        setQrCode(qrRes.data?.qr || null);
      } catch {
        // Silent catch during polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleResetSession = async () => {
    if (!confirm('Reset WhatsApp session and generate a fresh QR code?')) return;
    setResetting(true);
    setQrCode(null);
    try {
      const res = await api.post('/bot/reset');
      toast.success(res.data.message || 'Session reset! Generating fresh QR code...');
    } catch {
      toast.error('Failed to reset session');
    } finally {
      setResetting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, statusRes, qrRes] = await Promise.all([
        api.get('/bot/stats'),
        api.get('/bot/subscribers'),
        api.get('/bot/status').catch(() => ({ data: { connected: false } })),
        api.get('/bot/qr').catch(() => ({ data: { qr: null } }))
      ]);
      setStats(statsRes.data.stats);
      setSubscribers(subsRes.data.subscribers || []);
      setWaStatus(statusRes.data);
      setQrCode(qrRes.data?.qr || null);
    } catch {
      toast.error('Failed to load bot data');
    } finally {
      setLoading(false);
    }
  };

  const triggerBroadcast = async () => {
    if (!confirm('Send today\'s spiritual content to all subscribers now?')) return;
    setBroadcasting(true);
    try {
      await api.post('/bot/broadcast/now');
      toast.success('✅ Broadcast triggered! Messages sending.');
    } catch {
      toast.error('Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const sendCustom = async () => {
    if (!customMsg.trim()) return toast.error('Enter a message');
    if (!confirm(`Send to ALL ${stats?.active || 0} subscribers?`)) return;
    setSending(true);
    try {
      const res = await api.post('/bot/send', { message: customMsg });
      toast.success(res.data.message || 'Sent!');
      setCustomMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp message. Please check connection.');
    } finally {
      setSending(false);
    }
  };


  const statCards = [
    { label: 'Total Conversations', value: stats?.total ?? '—', icon: <FiMessageSquare />, color: 'bg-blue-500' },
    { label: 'Active Subscribers', value: stats?.active ?? '—', icon: <FiUsers />, color: 'bg-green-500' },
    { label: 'Opted-in Users', value: stats?.optedIn ?? '—', icon: <FiCheck />, color: 'bg-church-gold' },
  ];

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg">
            <SiWhatsapp className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-church-royal-blue">WhatsApp Bot</h1>
            <p className="text-sm text-gray-500">SJDB Connect — Manage subscribers & broadcasts</p>
          </div>
        </div>
        <button
          onClick={triggerBroadcast}
          disabled={broadcasting}
          className="btn-gold text-sm py-2.5 flex items-center gap-2"
        >
          <FiZap />
          {broadcasting ? 'Broadcasting...' : 'Broadcast Now'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white text-xl shadow-md`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-church-royal-blue">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preference Breakdown */}
      {stats?.prefCounts?.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-bold text-church-royal-blue mb-4 flex items-center gap-2">
            <FiInfo /> Subscription Preferences
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.prefCounts.map(p => (
              <div key={p._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-700">{PREF_LABELS[p._id] || p._id}</span>
                <span className="font-bold text-church-royal-blue text-sm">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['dashboard', 'subscribers', 'send'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-church-royal-blue text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {tab === 'dashboard' ? '📊 Overview' : tab === 'subscribers' ? '👥 Subscribers' : '📨 Send Message'}
          </button>
        ))}
      </div>

      {/* Subscribers Table */}
      {activeTab === 'subscribers' && (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Source</th>
                <th className="text-left py-3 px-4">Preferences</th>
                <th className="text-left py-3 px-4">Language</th>
                <th className="text-left py-3 px-4">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub, i) => (
                <motion.tr
                  key={sub._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-green-50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-sm text-church-royal-blue">{sub.name || 'Member'}</td>
                  <td className="py-3 px-4 font-mono text-sm text-gray-700">+{sub.phoneNumber}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${sub.source === 'Website User' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {sub.source || 'Website User'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(sub.preferences || []).map(p => (
                        <span key={p} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {PREF_LABELS[p] || p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{LANG_LABELS[sub.language] || sub.language}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {new Date(sub.updatedAt).toLocaleDateString('en-IN')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {subscribers.length === 0 && (
            <p className="text-center py-10 text-gray-400">No subscribers yet. Share your WhatsApp number!</p>
          )}
        </div>
      )}

      {/* Custom Send */}
      {activeTab === 'send' && (
        <div className="glass-card p-6 max-w-2xl">
          <h2 className="font-bold text-church-royal-blue mb-1 flex items-center gap-2">
            <FiSend /> Send Custom Broadcast
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            This will send your message to <strong>all {stats?.active ?? 0} active subscribers</strong> via WhatsApp.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-700">
            ⚠️ <strong>Note:</strong> Your church branding will be appended automatically. Write only the main message content.
          </div>
          <textarea
            value={customMsg}
            onChange={e => setCustomMsg(e.target.value)}
            rows={5}
            placeholder="Type your announcement, event notice, or spiritual message here..."
            className="church-input resize-none mb-4 w-full"
          />
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500">
            <strong>Preview:</strong><br />
            🙏 <strong>SJDB Connect</strong><br /><br />
            {customMsg || '<your message>'}<br /><br />
            ✝️ <em>St. John de Britto's Church</em>
          </div>
          <button
            onClick={sendCustom}
            disabled={sending || !customMsg.trim()}
            className="btn-gold w-full justify-center py-3"
          >
            <FiSend className="mr-2" />
            {sending ? 'Sending message...' : 'Send to All Subscribers'}
          </button>
        </div>
      )}

      {/* Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="glass-card p-6">
          <h2 className="font-bold text-church-royal-blue mb-4">📡 Bot Configuration (Baileys)</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">WhatsApp Connection</span>
              <span className={`font-semibold flex items-center gap-1.5 ${waStatus.connected ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${waStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                {waStatus.connected ? 'Connected ✅' : 'Disconnected — QR needed'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Bot Engine</span>
              <span className="font-mono text-gray-700">Baileys (WhatsApp Web)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Daily Broadcast</span>
              <span className="text-green-600 font-semibold">⏰ 6:00 AM IST</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Birthday Wishes</span>
              <span className="text-green-600 font-semibold">🎂 12:00 AM IST</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Supported Languages</span>
              <span className="text-gray-700">English · Tamil · Both</span>
            </div>
          </div>
          {!waStatus.connected && (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-900 flex flex-col md:flex-row items-center gap-6">
              {qrCode ? (
                <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-md border border-amber-200 min-w-[200px]">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 rounded-lg" />
                  <span className="text-[11px] font-semibold text-green-700 mt-2 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Live QR — Ready to scan
                  </span>
                </div>
              ) : (
                <div className="w-48 h-48 bg-amber-100/50 rounded-2xl flex items-center justify-center text-amber-600 text-center p-4 border border-amber-200">
                  Initializing WhatsApp QR code...
                </div>
              )}

              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <SiWhatsapp className="text-green-600 text-lg" /> Link WhatsApp Bot Device
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Scan this QR code using the church's official WhatsApp account to connect the bot to your web server:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700 font-medium pt-1">
                  <li>Open <strong>WhatsApp</strong> on your phone</li>
                  <li>Tap <strong>Settings / Menu (⋮)</strong> → <strong>Linked Devices</strong></li>
                  <li>Tap <strong>Link a Device</strong> and point camera at the QR code above</li>
                </ol>
                <p className="text-[11px] text-amber-700 pt-2">
                  ℹ️ Once scanned, your session credentials are stored securely in MongoDB so you won't need to scan again on server restarts.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleResetSession}
                    disabled={resetting}
                    className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    🔄 {resetting ? 'Resetting...' : 'Reset & Generate New QR Code'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {waStatus.connected && (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700">
              ✅ <strong>WhatsApp bot is live.</strong> Members can message your church number and type <strong>HI</strong> to start.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
