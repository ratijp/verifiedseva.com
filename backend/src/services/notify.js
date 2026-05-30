const nodemailer = require('nodemailer');
const twilio = require('twilio');

const emailTransport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const smsClient = twilio(process.env.SMS_ACCOUNT_SID, process.env.SMS_AUTH_TOKEN);

async function sendEmail(to, subject, text) {
  if (!process.env.EMAIL_USER) return;
  await emailTransport.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  });
}

async function sendSms(to, body) {
  if (!process.env.SMS_ACCOUNT_SID) return;
  await smsClient.messages.create({
    from: process.env.SMS_FROM,
    to,
    body
  });
}

module.exports = { sendEmail, sendSms };
