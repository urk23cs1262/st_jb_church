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
const { sendMail } = require('../config/mailer');

// Lazy-load to avoid circular: whatsapp.js → botHandler.js → whatsapp.js
function getWA() {
  return require('./whatsapp');
}

// Helper to email admins when an unregistered visitor uses the WhatsApp bot
async function notifyAdminsUnregisteredBotUser(session, phone, rawJid) {
  try {
    const admins = await User.find({ role: 'admin', email: { $exists: true, $ne: '' } });
    if (!admins.length) return;

    const prefText = (session.preferences || []).map(p => {
      const labels = { verse: 'Bible Verse', saint: 'Saint of the Day', mass: 'Mass Readings', events: 'Events', announcements: 'Announcements', birthday: 'Birthday Wishes' };
      return labels[p] || p;
    }).join(', ');

    const langText = { en: 'English', ta: 'Tamil', both: 'English & Tamil' }[session.language] || session.language || 'Default';
    const phoneDisplay = phone || rawJid || session.phoneNumber;

    const emailHtml = `
<div style="background:#f1f5f9; padding:20px 12px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:550px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#7c2d12,#92400e); padding:25px 18px; text-align:center;">
      <h1 style="margin:0; color:#fbbf24; font-size:22px; font-weight:700;">St. John de Britto's Church</h1>
      <p style="margin:4px 0 0; color:#ffffff; opacity:0.85; font-size:13px;">WhatsApp Bot Activity Alert</p>
    </div>
    <div style="padding:24px 20px;">
      <div style="display:inline-block; background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-size:12px; font-weight:700; padding:4px 12px; border-radius:9999px; text-transform:uppercase; margin-bottom:12px;">
        Unregistered Visitor Activity
      </div>
      <h2 style="color:#1e3a8a; margin-top:0; font-size:18px;">New WhatsApp Bot Visitor Alert</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">Hello Administrator,</p>
      <p style="color:#475569; font-size:14px; line-height:1.5;">An unregistered visitor has just interacted with or configured preferences on the <strong>SJDB Connect WhatsApp Bot</strong>.</p>
      
      <div style="background:#f8fafc; border-left:4px solid #d4a017; padding:16px; border-radius:8px; margin:18px 0;">
        <p style="margin:0 0 6px; color:#1e293b; font-size:13px;"><strong>📱 Phone / WhatsApp ID:</strong> <span style="font-family:monospace; color:#1e3a8a; background:#e2e8f0; padding:2px 6px; border-radius:4px;">${phoneDisplay}</span></p>
        <p style="margin:6px 0; color:#1e293b; font-size:13px;"><strong>📋 Subscribed Services:</strong> ${prefText || 'Configuring'}</p>
        <p style="margin:6px 0 0; color:#1e293b; font-size:13px;"><strong>🌐 Selected Language:</strong> ${langText}</p>
        <p style="margin:6px 0 0; color:#64748b; font-size:11px;">Time: ${new Date().toLocaleString('en-IN')}</p>
      </div>

      <div style="margin-top:25px; text-align:center;">
        <a href="${CLIENT_URL}/admin/users" style="background:#1e3a8a; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:13px 22px; border-radius:12px; display:block; box-shadow:0 4px 12px rgba(30,58,138,0.3);">
          Open Admin Users Portal
        </a>
      </div>
    </div>
    <div style="background:#0f172a; padding:16px; text-align:center; color:#94a3b8; font-size:11px;">
      <p style="margin:0;">St. John de Britto's Church, Kalayarkoil</p>
    </div>
  </div>
</div>`;

    for (const admin of admins) {
      sendMail({
        to: admin.email,
        subject: `📱 Unregistered Visitor Bot Activity — ${phoneDisplay}`,
        html: emailHtml
      }).catch(err => console.warn(`Admin email alert error for ${admin.email}:`, err.message));
    }
  } catch (err) {
    console.error('❌ Error notifying admins about unregistered bot user:', err.message);
  }
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
    let linkedUser = null;
    if (phone && phone.length >= 10) {
      linkedUser = await User.findOne({ phone: { $regex: phone.slice(-10) } });
      if (linkedUser) {
        session.linkedUserId = linkedUser._id;
        await session.save();
        linkedUser.whatsappOptIn = true;
        linkedUser.botPreferences = session.preferences;
        linkedUser.preferredLanguage = lang;
        await linkedUser.save();
      }
    }

    const prefLabels = session.preferences.map(p => {
      const labels = { verse: 'Bible Verse', saint: 'Saint of the Day', mass: 'Mass Readings', events: 'Events', announcements: 'Announcements', birthday: 'Birthday Wishes' };
      return `✅ ${labels[p]}`;
    }).join('\n');

    const langLabel = { en: 'English', ta: 'Tamil', both: 'English & Tamil' }[lang];

    let confirmMsg = `🎉 *You're all set!*

You will receive:
${prefLabels}

🌐 Language: *${langLabel}*

Daily messages are sent at *6:00 AM IST* every morning.

🔗 *Visit Our Parish Portal:*
${CLIENT_URL}`;

    if (!linkedUser) {
      confirmMsg += `\n\n💡 *Create Your Parish Account:*
To access personalized parish services (family registration, event bookings, mass requests & donations), create your free account:
👉 ${CLIENT_URL}/register`;

      // Email all admins about this unregistered visitor activity
      notifyAdminsUnregisteredBotUser(session, phone, replyTarget).catch(e => console.warn('Admin bot activity email error:', e.message));
    }


    confirmMsg += `\n\n✝️ May God bless you!
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

