let twilioClient = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio initialized');
  } else {
    console.log('⚠️  Twilio not configured — SMS/WhatsApp disabled');
  }
} catch (err) {
  console.error('❌ Twilio init error:', err.message);
}

const sendSMS = async (to, body, mediaUrl) => {
  if (!twilioClient) return { success: false, error: 'Twilio not configured' };
  try {
    const payload = { body, from: process.env.TWILIO_PHONE, to };
    if (mediaUrl) payload.mediaUrl = [mediaUrl];
    const msg = await twilioClient.messages.create(payload);
    console.log(`📡 Twilio SMS SID: ${msg.sid}`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendWhatsApp = async (to, body, mediaUrl) => {
  if (!twilioClient) return { success: false, error: 'Twilio not configured' };
  try {
    const payload = { 
      body, 
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, 
      to: `whatsapp:${to}` 
    };
    if (mediaUrl) payload.mediaUrl = [mediaUrl];
    const msg = await twilioClient.messages.create(payload);
    return { success: true, sid: msg.sid };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { sendSMS, sendWhatsApp };
