/**
 * SJDB Connect — Baileys WhatsApp Connection
 * 
 * Manages the persistent WhatsApp Web session using Baileys.
 * On first start: prints QR code to terminal for scanning.
 * After scan: session saved to bot/session/ — no re-scan needed until session expires.
 *
 * Usage (import anywhere):
 *   const { sendWhatsAppMessage, sendWhatsAppMedia } = require('./whatsapp');
 */

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const { handleIncomingMessage } = require('./botHandler');
const { useMongoDBAuthState, clearMongoDBAuthState } = require('./mongoAuthState');

let sock = null; // Active socket instance
let isConnected = false;
let currentQr = null; // Stored QR Code data URL
let isConnecting = false;

// ─── Reset / Clear Session ──────────────────────────────────────────────────

async function resetWhatsAppSession() {
  console.log('🔄 Resetting WhatsApp session & clearing MongoDB auth keys...');
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }
  isConnected = false;
  currentQr = null;
  await clearMongoDBAuthState();
  setTimeout(connectToWhatsApp, 1000);
}

// ─── Connect to WhatsApp ────────────────────────────────────────────────────

async function connectToWhatsApp() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMongoDBAuthState();
    
    let version = [2, 3000, 1015901307];
    try {
      const vRes = await fetchLatestBaileysVersion();
      if (vRes?.version) version = vRes.version;
    } catch (vErr) {
      console.warn('⚠️ Could not fetch remote Baileys version, using default version.');
    }

    console.log(`\n📱 SJDB Connect — Connecting to WhatsApp Web (Baileys v${version.join('.')})`);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false, // We handle QR ourselves
      browser: ['SJDB Connect', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    // ── QR Code ────────────────────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📲 New WhatsApp QR Code generated for Admin Dashboard.');
        try {
          currentQr = await QRCode.toDataURL(qr);
          console.log('📸 QR Code Data URL ready for Web Dashboard!');
        } catch (e) {
          currentQr = null;
        }
      }

      if (connection === 'close') {
        isConnected = false;
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

        console.log(`\n⚠️ WhatsApp disconnected. Code: ${statusCode}. Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          console.log('🔄 Reconnecting in 5 seconds...');
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('🚫 Logged out or session invalid. Resetting auth state for fresh QR...');
          resetWhatsAppSession();
        }
      }

      if (connection === 'open') {
        isConnected = true;
        isConnecting = false;
        currentQr = null; // Clear QR once connected
        console.log('\n✅ WhatsApp connected! SJDB Connect bot is live.\n');
      }
    });

    // ── Save credentials on update ────────────────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ── Incoming Messages ──────────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // ONLY process 'notify' — this is a real new incoming message.
      // 'append' fires when the user simply opens the chat — we do NOT respond to that.
      if (type !== 'notify') return;

      for (const msg of messages) {
        // Skip: status updates, broadcast lists, group chats
        if (!msg.key.remoteJid) continue;
        if (msg.key.remoteJid === 'status@broadcast') continue;
        if (msg.key.remoteJid.endsWith('@g.us')) continue;

        // Skip: messages sent by us (the bot / church number)
        if (msg.key.fromMe) continue;

        // Extract text body — only process if user actually typed something
        const body =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';

        // Skip: empty body (reactions, stickers, voice notes, media with no caption, etc.)
        if (!body || !body.trim()) continue;

        const from = msg.key.remoteJid;

        console.log("=================================");
        console.log("📩 NEW MESSAGE RECEIVED");
        console.log("Type:", type);
        console.log("From:", from);
        console.log("Body:", body);
        console.log("=================================");

        // Route to bot handler
        try {
          await handleIncomingMessage(from, body, from, msg.pushName);
        } catch (err) {
          console.error('❌ Bot handler error:', err.message);
        }

      }
    });



    return sock;
  } catch (err) {
    isConnecting = false;
    console.error('❌ Error during connectToWhatsApp:', err.message);
  }
}

// ─── Send Text Message ────────────────────────────────────────────────────────

function formatJid(phone) {
  if (!phone) return null;
  if (phone.includes('@')) return phone;
  let number = String(phone).replace(/\D/g, '');
  while (number.startsWith('0')) {
    number = number.substring(1);
  }
  if (!number.startsWith('91')) {
    number = '91' + number;
  }
  return `${number}@s.whatsapp.net`;
}

const { getUrlInfo } = require('link-preview-js');

async function sendWhatsAppMessage(phone, text) {
  if (!sock || !isConnected) {
    console.warn(`⚠️  WhatsApp not connected. Message to ${phone} skipped.`);
    return false;
  }

  const jid = formatJid(phone);
  if (!jid) return false;

  try {
    const hasUrl = text.includes('http://') || text.includes('https://');
    const options = { text };

    if (hasUrl) {
      try {
        // Extract first URL in text
        const match = text.match(/https?:\/\/[^\s]+/);
        if (match && !match[0].includes('localhost')) {
          const urlInfo = await getUrlInfo(match[0]);
          options.linkPreview = urlInfo;
        }
      } catch (e) {
        // If link preview generation fails, fall back to standard text message
      }
    }

    // 15-second timeout safety wrapper
    await Promise.race([
      sock.sendMessage(jid, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp send timeout (15s)')), 15000))
    ]);
    console.log(`✅ WhatsApp sent to ${jid}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp to ${jid}:`, err.message);
    return false;
  }
}





// ─── Send Media (Image / PDF / Audio) ─────────────────────────────────────────

async function sendWhatsAppMedia(phone, { url, caption = '', mimetype, fileName }) {
  if (!sock || !isConnected) {
    console.warn(`⚠️  WhatsApp not connected. Media to ${phone} skipped.`);
    return;
  }

  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

  try {
    if (mimetype?.startsWith('image')) {
      await sock.sendMessage(jid, { image: { url }, caption });
    } else if (mimetype === 'application/pdf') {
      await sock.sendMessage(jid, { document: { url }, mimetype, fileName: fileName || 'document.pdf', caption });
    } else if (mimetype?.startsWith('audio')) {
      await sock.sendMessage(jid, { audio: { url }, mimetype: 'audio/mp4', ptt: false });
    } else {
      await sock.sendMessage(jid, { document: { url }, mimetype, fileName, caption });
    }
    console.log(`✅ WhatsApp media sent to ${phone}`);
  } catch (err) {
    console.error(`❌ Failed to send media to ${phone}:`, err.message);
    throw err;
  }
}

async function sendWhatsAppToUser(userObjOrId, text) {
  try {
    const BotSession = require('../models/BotSession');
    const User = require('../models/User');

    let user = userObjOrId;
    if (typeof userObjOrId === 'string') {
      user = await User.findById(userObjOrId);
    }

    if (!user) return false;

    // Find BotSession by linkedUserId or phone number regex
    const phoneDigits = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    const queryList = [{ linkedUserId: user._id }];
    if (phoneDigits) {
      queryList.push({ phoneNumber: { $regex: phoneDigits } });
    }

    let session = await BotSession.findOne({ $or: queryList });
    let targetJid = session?.phoneNumber || user.phone;

    // Fallback for admin if specific phone/session isn't linked
    if (!targetJid && (user.role === 'admin' || user.isAdmin)) {
      const adminUsers = await User.find({ role: 'admin', phone: { $exists: true, $ne: '' } });
      for (const adm of adminUsers) {
        if (adm.phone) {
          targetJid = adm.phone;
          break;
        }
      }
    }

    if (!targetJid) {
      console.warn(`⚠️ No WhatsApp number or session found for user ${user.name}`);
      return false;
    }

    return await sendWhatsAppMessage(targetJid, text);
  } catch (err) {
    console.error('❌ Error sending WhatsApp to user:', err.message);
    return false;
  }
}


// ─── Connection Status ────────────────────────────────────────────────────────

function getConnectionStatus() {
  return { connected: isConnected, sock: !!sock };
}

function getQR() {
  return currentQr;
}

module.exports = { connectToWhatsApp, resetWhatsAppSession, sendWhatsAppMessage, sendWhatsAppMedia, sendWhatsAppToUser, getConnectionStatus, getQR };

