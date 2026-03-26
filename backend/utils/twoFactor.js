const crypto = require('crypto');
const TwoFactorCode = require('../models/TwoFactorCode');
const { sendMail } = require('./mailer');
const { sendSms, normalizePhoneNumber } = require('./sms');

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtpCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

function maskPhone(phone = '') {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length <= 4) return normalized;
  return `${'*'.repeat(Math.max(2, normalized.length - 4))}${normalized.slice(-4)}`;
}

function getDestinationHint(channel, destination) {
  return channel === 'sms' ? maskPhone(destination) : maskEmail(destination);
}

async function dispatchTwoFactorCode(user, { purpose, channel, destination }) {
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await TwoFactorCode.deleteMany({ userId: user._id, purpose, channel, usedAt: null });
  await TwoFactorCode.create({
    userId: user._id,
    purpose,
    channel,
    destination,
    codeHash,
    expiresAt,
  });

  const text = `${code} is your Adopt A Book verification code. It expires in 10 minutes.`;

  if (channel === 'sms') {
    await sendSms({ to: destination, message: text });
  } else {
    await sendMail({
      to: destination,
      subject: 'Your Adopt A Book verification code',
      text,
      html: `<p><strong>${code}</strong> is your Adopt A Book verification code.</p><p>It expires in 10 minutes.</p>`,
    });
  }

  return {
    expiresAt,
    destinationHint: getDestinationHint(channel, destination),
  };
}

async function verifyTwoFactorCode(userId, { purpose, channel, code }) {
  const record = await TwoFactorCode.findOne({
    userId,
    purpose,
    channel,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    const error = new Error('No active verification code found. Please request a new code.');
    error.status = 400;
    throw error;
  }

  if (record.attempts >= 5) {
    const error = new Error('Too many incorrect attempts. Please request a new code.');
    error.status = 429;
    throw error;
  }

  const matches = hashOtpCode(code) === record.codeHash;
  if (!matches) {
    record.attempts += 1;
    await record.save();
    const error = new Error('Incorrect verification code.');
    error.status = 400;
    throw error;
  }

  record.usedAt = new Date();
  await record.save();

  return record;
}

module.exports = {
  dispatchTwoFactorCode,
  verifyTwoFactorCode,
  getDestinationHint,
  maskEmail,
  maskPhone,
};
