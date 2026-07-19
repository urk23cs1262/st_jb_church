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
const qrcode = require('qrcode-terminal');
const { handleIncomingMessage } = require('./botHandler');
const { useMongoDBAuthState } = require('./mongoAuthState');

let sock = null; // Active socket instance
let isConnected = false;

// ─── Connect to WhatsApp ────────────────────────────────────────────────────

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMongoDBAuthState();
  const { version } = await fetchLatestBaileysVersion();


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
      console.log('\n📲 Scan this QR code with your WhatsApp (Linked Devices → Link a Device):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`\n⚠️  WhatsApp disconnected. Code: ${statusCode}. Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        console.log('🔄 Reconnecting in 5 seconds...');
        setTimeout(connectToWhatsApp, 5000);
      } else {
        console.log('🚫 Logged out. Delete the session/ folder and restart to re-scan.');
      }
    }

    if (connection === 'open') {
      isConnected = true;
      console.log('\n✅ WhatsApp connected! SJDB Connect bot is live.\n');
    }
  });

  // ── Save credentials on update ────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Incoming Messages ──────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Ignore: status updates, broadcast lists
      if (msg.key.remoteJid === 'status@broadcast') continue;

      if (msg.key.fromMe) {
        const myJid = sock?.user?.id ? sock.user.id.split(':')[0].replace(/\D/g, '') : '';
        const remoteJidNum = msg.key.remoteJid ? msg.key.remoteJid.replace(/\D/g, '') : '';

        // If it's an outgoing message sent to someone else, ignore
        if (!myJid || myJid !== remoteJidNum) continue;

        // If messaging self (testing), ignore automated bot responses to prevent loops
        const textContent =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          '';

        if (
          textContent.includes('Welcome to SJDB Connect') ||
          textContent.includes('Choose your preferred language') ||
          textContent.includes("You're all set!") ||
          textContent.includes('Please reply with valid numbers') ||
          textContent.includes('Please reply with *1*') ||
          textContent.includes('unsubscribed from SJDB Connect')
        ) {
          continue;
        }
      }

      const from = msg.key.remoteJid; // e.g. "919876543210@s.whatsapp.net"
      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '';

      if (!body) continue;

      const phone = from.replace('@s.whatsapp.net', '').replace('@g.us', '');

      console.log(`📨 Incoming from ${phone}: "${body.slice(0, 80)}"`);

      // Route to bot handler
      try {
        await handleIncomingMessage(phone, body, from);
      } catch (err) {
        console.error('❌ Bot handler error:', err.message);
      }
    }
  });

  return sock;
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

// ─── Connection Status ────────────────────────────────────────────────────────

function getConnectionStatus() {
  return { connected: isConnected, sock: !!sock };
}

module.exports = { connectToWhatsApp, sendWhatsAppMessage, sendWhatsAppMedia, getConnectionStatus };
