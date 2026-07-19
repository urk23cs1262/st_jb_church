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

const WELCOME_MSG = `🙏 *Welcome to SJDB Connect*
_Connecting Faith & Community_

Dear friend, thank you for reaching out to *St. John de Britto's Church*!

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

async function handleIncomingMessage(fromNumber, body) {
  const text = (body || '').trim().toUpperCase();

  // Normalize phone number (remove whatsapp: prefix, +, spaces)
  const phone = fromNumber.replace('whatsapp:', '').replace(/\D/g, '');

  // Get or create session
  let session = await BotSession.findOne({ phoneNumber: phone });
  if (!session) {
    session = new BotSession({ phoneNumber: phone, step: 'welcome' });
    await session.save();
  }

  // Update last message time
  session.lastMessage = new Date();

  // ── Step: Welcome / trigger ──────────────────────────────────────────────
  if (session.step === 'welcome' || text === 'HI' || text === 'HELLO' || text === 'START') {
    session.step = 'preferences';
    await session.save();
    await getWA().sendWhatsAppMessage(phone, WELCOME_MSG);
    return;
  }

  // ── Step: Preferences selection ──────────────────────────────────────────
  if (session.step === 'preferences') {
    const parts = body.split(',').map(s => s.trim());
    const prefs = parts.map(p => prefMap[p]).filter(Boolean);

    if (prefs.length === 0) {
      await getWA().sendWhatsAppMessage(phone,
        `⚠️ Please reply with valid numbers (1-6) separated by commas.\nExample: *1,2,3*`
      );
      return;
    }

    session.preferences = prefs;
    session.step = 'language';
    await session.save();
    await getWA().sendWhatsAppMessage(phone, LANGUAGE_MSG);
    return;
  }

  // ── Step: Language selection ─────────────────────────────────────────────
  if (session.step === 'language') {
    const lang = langMap[body.trim()];
    if (!lang) {
      await getWA().sendWhatsAppMessage(phone, `⚠️ Please reply with *1* (English), *2* (Tamil), or *3* (Both).`);
      return;
    }

    session.language = lang;
    session.step = 'done';
    await session.save();

    // Try to link to existing User by phone
    const user = await User.findOne({ phone: { $regex: phone.slice(-10) } });
    if (user) {
      session.linkedUserId = user._id;
      await session.save();
      user.whatsappOptIn = true;
      user.botPreferences = session.preferences;
      user.preferredLanguage = lang;
      await user.save();
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

✝️ May God bless you!
— *SJDB Connect*
_St. John de Britto's Church_

📱 Reply *STOP* to unsubscribe or *HI* to change preferences.`;

    await getWA().sendWhatsAppMessage(phone, confirmMsg);
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
      await getWA().sendWhatsAppMessage(phone, `🔕 You have been unsubscribed from SJDB Connect.\n\nReply *HI* anytime to re-subscribe. God bless! 🙏`);
      return;
    }
    if (text === 'HI' || text === 'HELLO' || text === 'CHANGE') {
      session.step = 'preferences';
      await session.save();
      await getWA().sendWhatsAppMessage(phone, WELCOME_MSG);
      return;
    }
    // Any other message
    await getWA().sendWhatsAppMessage(phone,
      `🙏 *SJDB Connect*\n\nReply *HI* to change your preferences or *STOP* to unsubscribe.\n\nGod bless you! ✝️`
    );
  }
}

module.exports = { handleIncomingMessage };
