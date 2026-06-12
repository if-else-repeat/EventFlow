let twilioClient = null;

function getTwilio() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function sendSMS(to, body) {
  if (process.env.ENABLE_SMS !== 'true') {
    console.log(`[SMS] (disabled) To: ${to} | ${body.substring(0,60)}`);
    return;
  }
  const client = getTwilio();
  if (!client) throw new Error('Twilio not configured');
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

module.exports = { sendSMS };
