const twilio = require('twilio');

console.log('SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TOKEN:', process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.slice(0, 6) + '…' : 'undefined');
console.log('PHONE:', process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE);

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE;
  try {
    const response = await client.messages.create({ body: message, from, to });
    console.log('SMS SENT:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('FULL ERROR:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

const sendWhatsApp = async (to, body, mediaUrl) => {
  const from = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_WHATSAPP_FROM;
  try {
    const payload = { body, from: `whatsapp:${from}`, to: `whatsapp:${to}` };
    if (mediaUrl) payload.mediaUrl = [mediaUrl];
    const msg = await client.messages.create(payload);
    return { success: true, sid: msg.sid };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
};

module.exports = { sendSMS, sendWhatsApp };
