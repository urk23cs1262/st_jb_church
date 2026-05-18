require('dotenv').config({ path: './src/../.env' });
const twilio = require('twilio');

const SID   = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM  = process.env.TWILIO_PHONE_NUMBER;
const TO    = '+917639520006'; // ← change this to the number you want to test

console.log('🔑 SID  :', SID);
console.log('🔑 TOKEN:', TOKEN ? TOKEN.slice(0, 6) + '…' : 'MISSING');
console.log('📞 FROM :', FROM);
console.log('📞 TO   :', TO);

if (!SID || !TOKEN || !FROM) {
  console.error('❌ Missing env vars – check your .env file');
  process.exit(1);
}

const client = twilio(SID, TOKEN);

(async () => {
  try {
    // 1. Verify credentials by fetching account info
    const account = await client.api.accounts(SID).fetch();
    console.log('\n✅ Credentials OK!');
    console.log('   Account name  :', account.friendlyName);
    console.log('   Account status:', account.status);
    console.log('   Account type  :', account.type); // "Trial" or "Full"

    // 2. Try sending a real test SMS
    console.log('\n📤 Sending test SMS…');
    const msg = await client.messages.create({
      body: 'Test OTP from St. John de Britto Church: 123456',
      from: FROM,
      to: TO,
    });
    console.log('✅ SMS sent! SID:', msg.sid, '| Status:', msg.status);
  } catch (err) {
    console.error('\n❌ Twilio Error');
    console.error('   Code   :', err.code);
    console.error('   Message:', err.message);
    console.error('   Status :', err.status);

    // Explain the most common error codes
    const hints = {
      20003: '→ Wrong ACCOUNT_SID or AUTH_TOKEN. Get them from twilio.com/console',
      21608: '→ TRIAL ACCOUNT: You must verify this number at twilio.com/console/phone-numbers/verified',
      21211: '→ Invalid "To" phone number format',
      21212: '→ Invalid "From" (TWILIO_PHONE_NUMBER) number',
      21614: '→ Number is not SMS-capable',
    };
    if (hints[err.code]) console.error('   Hint   :', hints[err.code]);
  }
})();
