/**
 * SJDB Connect WhatsApp Bot Handler
 * Uses Twilio WhatsApp (credentials already in .env)
 * 
 * Conversation flow:
 * 1. User sends "HI" → Welcome + preference menu
 * 2. User replies with numbers (1,2,3...) → Save preferences, ask language
 * 3. User replies with language choice → Save language, confirm + done
 */
const BotSession = require('../models/BotSession');
const User = require('../models/User');

// Lazy-load to avoid circular: whatsapp.js → botHandler.js → whatsapp.js
function getWA() {
  return require('./whatsapp');
}

// ─── Message Templates ─────────────────────────────────────────────────────

const CLIENT_URL = process.env.CLIENT_URL?.replace('http://localhost:5173', 'https://st-jb-church.vercel.app') || 'https://st-jb-church.vercel.app';


const WELCOME_MSG = `🙏 *Welcome to SJDB Connect*
_Connecting Faith & Community_

Dear friend, thank you for reaching out to *St. John de Britto's Church, Kalayarkoil*!

🔗 *Visit Our Parish Portal:*
${CLIENT_URL}

Please select what you would like to receive daily:

1️⃣ Daily Bible Verse
2️⃣ Saint of the Day
3️⃣ Daily Mass Readings
4️⃣ Church Events
5️⃣ Announcements
6️⃣ Birthday Wishes

📝 Reply with numbers separated by commas.
_Example: 1,2,3_

✝️ God bless you!`;

const LANGUAGE_MSG = `🌐 *Choose your preferred language:*

1️⃣ English
2️⃣ Tamil (தமிழ்)
3️⃣ Both (இரண்டும்)

Reply with 1, 2, or 3.`;

const prefMap = {
  '1': 'verse',
  '2': 'saint',
  '3': 'mass',
  '4': 'events',
  '5': 'announcements',
  '6': 'birthday',
};

const langMap = {
  '1': 'en',
  '2': 'ta',
  '3': 'both',
};

// ─── Handle Incoming Message ─────────────────────────────────────────────────

async function handleIncomingMessage(fromNumber, body, rawJid) {
  const text = (body || '').trim().toUpperCase();

  // Destination JID for sending replies back (e.g. "13430564061424@lid" or "919876543210@s.whatsapp.net")
  const replyTarget = rawJid || fromNumber;

  // Clean phone number / session key
  const phone = (fromNumber || '').replace('whatsapp:', '').replace(/\D/g, '');
  const sessionKey = (fromNumber && fromNumber.includes('@lid')) ? fromNumber : (phone || fromNumber);

  // Get or create session
  let session = await BotSession.findOne({
    $or: [
      { phoneNumber: sessionKey },
      { phoneNumber: phone },
      ...(rawJid ? [{ phoneNumber: rawJid }] : [])
    ]
  });

  if (!session) {
    session = new BotSession({ phoneNumber: sessionKey, step: 'welcome' });
    await session.save();
  }

  // Update last message time
  session.lastMessage = new Date();

  // Helper to check if incoming text is a HI / greeting / reset trigger
  const isHiTrigger =
    /\b(HI|HELLO|START|RESET|MENU)\b/i.test(text) ||
    text.includes('SJDB CONNECT');

  // ── Step: Welcome / trigger ──────────────────────────────────────────────
  if (session.step === 'welcome' || isHiTrigger) {
    session.step = 'preferences';
    await session.save();
    await getWA().sendWhatsAppMessage(replyTarget, WELCOME_MSG);
    return;
  }

  // ── Step: Preferences selection ──────────────────────────────────────────
  if (session.step === 'preferences') {
    const parts = body.split(',').map(s => s.trim());
    const prefs = parts.map(p => prefMap[p]).filter(Boolean);

    if (prefs.length === 0) {
      await getWA().sendWhatsAppMessage(replyTarget,
        `⚠️ Please reply with valid numbers (1-6) separated by commas.\nExample: *1,2,3*\n\n🔗 Website: ${CLIENT_URL}`
      );
      return;
    }

    session.preferences = prefs;
    session.step = 'language';
    await session.save();
    await getWA().sendWhatsAppMessage(replyTarget, LANGUAGE_MSG);
    return;
  }

  // ── Step: Language selection ─────────────────────────────────────────────
  if (session.step === 'language') {
    const lang = langMap[body.trim()];
    if (!lang) {
      await getWA().sendWhatsAppMessage(replyTarget, `⚠️ Please reply with *1* (English), *2* (Tamil), or *3* (Both).\n\n🔗 Website: ${CLIENT_URL}`);
      return;
    }

    session.language = lang;
    session.step = 'done';
    await session.save();

    // Try to link to existing User by phone if phone is a valid number
    if (phone && phone.length >= 10) {
      const user = await User.findOne({ phone: { $regex: phone.slice(-10) } });
      if (user) {
        session.linkedUserId = user._id;
        await session.save();
        user.whatsappOptIn = true;
        user.botPreferences = session.preferences;
        user.preferredLanguage = lang;
        await user.save();
      }
    }

    const prefLabels = session.preferences.map(p => {
      const labels = { verse: 'Bible Verse', saint: 'Saint of the Day', mass: 'Mass Readings', events: 'Events', announcements: 'Announcements', birthday: 'Birthday Wishes' };
      return `✅ ${labels[p]}`;
    }).join('\n');

    const langLabel = { en: 'English', ta: 'Tamil', both: 'English & Tamil' }[lang];

    const confirmMsg = `🎉 *You're all set!*

You will receive:
${prefLabels}

🌐 Language: *${langLabel}*

Daily messages are sent at *6:00 AM IST* every morning.

🔗 *Visit Our Parish Portal:*
${CLIENT_URL}

✝️ May God bless you!
— *SJDB Connect*
_St. John de Britto's Church_

📱 Reply *STOP* to unsubscribe or *HI* to change preferences.`;

    await getWA().sendWhatsAppMessage(replyTarget, confirmMsg);
    return;
  }

  // ── Step: Done — handle STOP / HELP ─────────────────────────────────────
  if (session.step === 'done') {
    if (text === 'STOP' || text === 'UNSUBSCRIBE') {
      session.step = 'welcome';
      session.preferences = [];
      await session.save();
      if (session.linkedUserId) {
        await User.findByIdAndUpdate(session.linkedUserId, { whatsappOptIn: false, botPreferences: [] });
      }
      await getWA().sendWhatsAppMessage(replyTarget, `🔕 You have been unsubscribed from SJDB Connect.\n\n🔗 Website: ${CLIENT_URL}\n\nReply *HI* anytime to re-subscribe. God bless! 🙏`);
      return;
    }
    if (isHiTrigger || text === 'CHANGE') {
      session.step = 'preferences';
      await session.save();
      await getWA().sendWhatsAppMessage(replyTarget, WELCOME_MSG);
      return;
    }
    // Any other message
    await getWA().sendWhatsAppMessage(replyTarget,
      `🙏 *SJDB Connect — St. John de Britto's Church*\n\n🔗 *Visit Our Parish Portal:*
${CLIENT_URL}

Reply *HI* to change your preferences or *STOP* to unsubscribe.\n\nGod bless you! ✝️`
    );
  }
}


module.exports = { handleIncomingMessage };

