const nodemailer = require('nodemailer');

let transporterPromise;

async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if (process.env.SMTP_VERIFY !== 'false') {
      await transporter.verify();
    }

    return transporter;
  }

  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  return transporterPromise;
}

function getDefaultFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_FROM || 'noreply@adoptabook.local';
}

async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: getDefaultFrom(),
    to,
    subject,
    text,
    html,
  });

  if (info.message) {
    console.log('Generated email message:\n', info.message.toString());
  }

  return info;
}

module.exports = { sendMail };
