// Vercel serverless function backing the contact form's POST /api/messages.
// Frontend already calls this exact relative path (see App.js's API_BASE),
// so no frontend changes are needed — same request, same response shape.
//
// Sends through the site owner's own Gmail account via an App Password
// (myaccount.google.com/apppasswords) rather than a third-party email API —
// no separate service to sign up for, and deliverability is a non-issue
// since it's an authenticated send to the same account's own inbox.

const nodemailer = require("nodemailer");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body || {};

  if (
    typeof name !== "string" || !name.trim() || name.length > 120 ||
    typeof email !== "string" || !EMAIL_RE.test(email) ||
    typeof message !== "string" || !message.trim() || message.length > 4000
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const gmailUser = (process.env.GMAIL_USER || "").trim();
  // Google displays App Passwords with spaces for readability (e.g. "abcd
  // efgh ijkl mnop"); the real credential has none, so strip them here
  // regardless of how it was pasted into the environment variable.
  const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (!gmailUser || !gmailAppPassword) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD is not configured");
    return res.status(500).json({ error: "Email service not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    const html =
      '<table style="font-family:monospace;font-size:14px;line-height:1.7;color:#111">' +
      `<tr><td style="padding:4px 16px 4px 0;color:#666">From</td><td>${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>` +
      `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">Message</td><td>${escapeHtml(message)}</td></tr>` +
      "</table>";

    await transporter.sendMail({
      from: gmailUser,
      to: process.env.CONTACT_INBOX || gmailUser,
      replyTo: email,
      subject: `Portfolio enquiry from ${name}`,
      html,
    });

    return res.status(200).json({ status: "received" });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
