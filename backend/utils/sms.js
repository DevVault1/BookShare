function normalizePhoneNumber(value = '') {
  return String(value).replace(/[^\d+]/g, '');
}

async function sendSms({ to, message }) {
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) {
    const error = new Error('A valid phone number is required for SMS delivery.');
    error.status = 400;
    throw error;
  }

  if (process.env.SMS_PROVIDER === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      const error = new Error('Twilio SMS is not configured.');
      error.status = 500;
      throw error;
    }

    const body = new URLSearchParams({
      To: normalizedTo,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(text || 'Failed to send SMS.');
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  if (process.env.SMS_WEBHOOK_URL) {
    const response = await fetch(process.env.SMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: normalizedTo, message }),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(text || 'Failed to send SMS.');
      error.status = response.status;
      throw error;
    }

    return response.json().catch(() => ({ ok: true }));
  }

  const error = new Error('SMS delivery is not configured. Add SMS_WEBHOOK_URL or Twilio credentials to use SMS 2FA.');
  error.status = 500;
  throw error;
}

module.exports = { sendSms, normalizePhoneNumber };
