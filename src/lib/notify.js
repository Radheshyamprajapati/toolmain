// Email / SMS / WhatsApp adapter. Each channel logs and no-ops when its
// credentials are missing, so the app runs fine unconfigured and starts
// sending as soon as env vars are added. Email: any SMTP server (nodemailer).
// SMS + WhatsApp: Twilio.
let transport = null;
function getTransport() {
  if (transport) return transport;
  if (!process.env.SMTP_HOST) return null;
  const nodemailer = require("nodemailer");
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

let twilioClient = null;
function getTwilio() {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID) return null;
  twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransport();
  if (!to || !t) {
    console.log(`[notify:email skipped] to=${to} subject="${subject}"`);
    return { ok: false };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || "no-reply@example.com", to, subject, html });
    return { ok: true };
  } catch (e) {
    console.error("sendEmail failed:", e.message);
    return { ok: false };
  }
}

export async function sendSms({ to, body }) {
  const c = getTwilio();
  if (!to || !c || !process.env.TWILIO_SMS_FROM) {
    console.log(`[notify:sms skipped] to=${to}`);
    return { ok: false };
  }
  try {
    await c.messages.create({ from: process.env.TWILIO_SMS_FROM, to, body });
    return { ok: true };
  } catch (e) {
    console.error("sendSms failed:", e.message);
    return { ok: false };
  }
}

export async function sendWhatsApp({ to, body }) {
  const c = getTwilio();
  if (!to || !c || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log(`[notify:whatsapp skipped] to=${to}`);
    return { ok: false };
  }
  try {
    await c.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body,
    });
    return { ok: true };
  } catch (e) {
    console.error("sendWhatsApp failed:", e.message);
    return { ok: false };
  }
}

// Best-effort fan-out; never throws.
export async function notifyAllChannels(user, { subject, html, smsBody }) {
  if (!user) return;
  const jobs = [];
  if (user.email) jobs.push(sendEmail({ to: user.email, subject, html }));
  if (user.phone) {
    jobs.push(sendSms({ to: user.phone, body: smsBody || subject }));
    jobs.push(sendWhatsApp({ to: user.phone, body: smsBody || subject }));
  }
  await Promise.allSettled(jobs);
}
