const { triggerBroadcastNow } = require('../services/dailyBroadcastService');
const BotSession = require('../models/BotSession');
const User = require('../models/User');

function sendWA(phone, text) {
  return require('../bot/whatsapp').sendWhatsAppMessage(phone, text);
}

// GET /api/bot/status — Connection status
const getStatus = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const { getConnectionStatus } = require('../bot/whatsapp');
    res.json({ success: true, ...getConnectionStatus() });
  } catch {
    res.json({ success: true, connected: false, sock: false });
  }
};

// GET /api/bot/qr — Get current QR code data URL
const getQR = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const { getQR, getConnectionStatus } = require('../bot/whatsapp');
    const { connected } = getConnectionStatus();
    const qr = getQR();
    res.json({ success: true, connected, qr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bot/reset — Force reset session and generate fresh QR
const resetSession = async (req, res) => {
  try {
    const { resetWhatsAppSession } = require('../bot/whatsapp');
    await resetWhatsAppSession();
    res.json({ success: true, message: 'WhatsApp session reset. Generating fresh QR code...' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bot/subscribers — Admin: view all subscribers (website registered users + bot sessions)
const getSubscribers = async (req, res) => {
  try {
    // 1. Get interactive bot sessions
    const sessions = await BotSession.find({ step: 'done' }).lean();

    // 2. Get registered website users who have a phone number
    const users = await User.find({ phone: { $exists: true, $ne: '' }, isActive: { $ne: false } })
      .select('name phone preferredLanguage botPreferences whatsappOptIn createdAt updatedAt')
      .lean();

    // Map by phone to avoid duplicates
    const subscriberMap = new Map();

    // Add website registered users
    users.forEach(u => {
      const cleanPhone = u.phone.replace(/\D/g, '');
      if (cleanPhone) {
        subscriberMap.set(cleanPhone, {
          _id: u._id,
          phoneNumber: cleanPhone,
          name: u.name,
          source: 'Website User',
          preferences: u.botPreferences?.length ? u.botPreferences : ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday'],
          language: u.preferredLanguage || 'en',
          updatedAt: u.updatedAt || u.createdAt
        });
      }
    });

    // Merge/override with interactive bot sessions
    sessions.forEach(s => {
      const cleanPhone = s.phoneNumber.replace(/\D/g, '');
      const linkedUserIdStr = s.linkedUserId ? String(s.linkedUserId) : null;
      let matchedUserKey = null;

      if (linkedUserIdStr) {
        for (const [key, value] of subscriberMap.entries()) {
          if (String(value._id) === linkedUserIdStr) {
            matchedUserKey = key;
            break;
          }
        }
      }

      if (!matchedUserKey && cleanPhone) {
        matchedUserKey = cleanPhone;
      }

      if (matchedUserKey && subscriberMap.has(matchedUserKey)) {
        const existing = subscriberMap.get(matchedUserKey);
        subscriberMap.set(matchedUserKey, {
          ...existing,
          preferences: s.preferences?.length ? s.preferences : existing.preferences,
          language: s.language || existing.language,
          updatedAt: s.updatedAt || existing.updatedAt
        });
      } else {
        const key = cleanPhone || s.phoneNumber;
        subscriberMap.set(key, {
          _id: s._id,
          phoneNumber: s.phoneNumber,
          name: 'WhatsApp Member',
          source: 'WhatsApp Bot',
          preferences: s.preferences?.length ? s.preferences : ['verse', 'saint', 'mass', 'events', 'announcements', 'birthday'],
          language: s.language || 'en',
          updatedAt: s.updatedAt
        });
      }
    });


    const subscribers = Array.from(subscriberMap.values());
    res.json({ success: true, total: subscribers.length, subscribers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bot/stats — Admin: broadcast stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ phone: { $exists: true, $ne: '' } });
    const botSessions = await BotSession.countDocuments({ step: 'done' });
    const optedIn = await User.countDocuments({ whatsappOptIn: { $ne: false } });

    // Deduplicated count
    const sessions = await BotSession.find({ step: 'done' }).select('phoneNumber').lean();
    const users = await User.find({ phone: { $exists: true, $ne: '' } }).select('phone').lean();
    const phones = new Set([
      ...sessions.map(s => s.phoneNumber.replace(/\D/g, '')),
      ...users.map(u => u.phone.replace(/\D/g, ''))
    ]);

    const prefCounts = [
      { _id: 'verse', count: phones.size },
      { _id: 'saint', count: phones.size },
      { _id: 'mass', count: phones.size },
      { _id: 'events', count: phones.size },
      { _id: 'announcements', count: phones.size },
      { _id: 'birthday', count: phones.size },
    ];
    

    res.json({ success: true, stats: { total: totalUsers + botSessions, active: phones.size, optedIn, prefCounts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bot/broadcast/now — Admin: trigger immediate broadcast
const triggerBroadcast = async (req, res) => {
  try {
    triggerBroadcastNow().catch(console.error);
    res.json({ success: true, message: 'Broadcast triggered in background' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bot/send — Admin: send custom message to all subscribers
const sendCustomMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const { getConnectionStatus } = require('../bot/whatsapp');
    const { connected } = getConnectionStatus();
    if (!connected) {
      return res.status(400).json({ success: false, message: 'WhatsApp is disconnected. Please link device in Admin Panel first.' });
    }

    // Collect all unique phone numbers from both Users & BotSessions
    const users = await User.find({ phone: { $exists: true, $ne: '' }, isActive: { $ne: false } }).select('phone').lean();
    const sessions = await BotSession.find({ step: 'done' }).select('phoneNumber').lean();

    const phones = new Set([
      ...users.map(u => u.phone.replace(/\D/g, '')),
      ...sessions.map(s => s.phoneNumber.replace(/\D/g, ''))
    ]);

    const targetList = Array.from(phones).filter(Boolean);

    // Respond immediately to UI so button doesn't hang
    res.json({ success: true, message: 'Broadcast sent successfully!' });

    // Process sending loop in background
    setImmediate(async () => {
      let sent = 0;
      let failed = 0;
      for (const phone of targetList) {
        try {
          const ok = await sendWA(
            phone,
            `🙏 *SJDB Connect*\n\n${message}\n\n✝️ _St. John de Britto's Church_`
          );
          if (ok) sent++;
          else failed++;
          await new Promise(r => setTimeout(r, 400)); // Rate limit protection
        } catch (e) {
          failed++;
          console.error(`Error sending custom message to ${phone}:`, e.message);
        }
      }
      console.log(`✅ Custom broadcast finished: ${sent} sent, ${failed} failed out of ${targetList.length} total`);
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



module.exports = { getStatus, getQR, resetSession, getSubscribers, getStats, triggerBroadcast, sendCustomMessage };
