async function sendWhatsApp(message) {
  if (process.env.ENABLE_WHATSAPP !== 'true') {
    console.log(`[WhatsApp] (disabled) ${message.substring(0,60)}`);
    return;
  }
  // Using Twilio for WhatsApp
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    body: message,
    from: process.env.WHATSAPP_FROM,
    to:   process.env.WHATSAPP_GROUP_ID, // WhatsApp broadcast number
  });
}

module.exports = { sendWhatsApp };
