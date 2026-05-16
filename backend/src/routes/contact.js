/**
 * Contact form route
 * POST /api/contact — validate, store submission, send email notification
 */
import { Router } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { contactLimiter } from '../middleware/rateLimit.js';
import { db } from '../config/firebase.js';

const router = Router();

const ContactSchema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

// Build transporter lazily so missing SMTP config doesn't crash startup
function getTransporter() {
  const smtpPass = process.env.SMTP_PASS;
  // Guard against missing OR placeholder value so nodemailer never attempts
  // an auth call with garbage credentials (Firestore still saves the submission).
  if (!process.env.SMTP_USER || !smtpPass || smtpPass.startsWith('PASTE_')) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── POST /api/contact ───────────────────────────────────────────────────────
router.post('/', contactLimiter, async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, subject, message } = parsed.data;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  // 1. Store in Firestore (so you have a record even if email fails)
  try {
    await db.collection('contactSubmissions').add({
      name, email, subject, message,
      submittedAt: new Date().toISOString(),
      ip: req.ip,
    });
  } catch (dbErr) {
    console.error('[contact] Firestore write failed:', dbErr.message);
  }

  // 2. Send email notification
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from:    `"Portfolio Contact" <${process.env.SMTP_USER}>`,
        to:      process.env.CONTACT_TO || process.env.SMTP_USER,
        subject: `[Portfolio] ${subject}`,
        text:    `From: ${name} <${email}>\n\n${message}`,
        html:    `
          <h2>New portfolio contact</h2>
          <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr/>
          <p>${safeMessage}</p>
        `,
        replyTo: email,
      });
    } catch (err) {
      // Email failure is non-fatal — submission is already stored in DB
      console.error('[contact] Email send failed:', err.message);
    }
  }

  return res.json({ ok: true, message: 'Message received. I\'ll get back to you soon!' });
});

export default router;
