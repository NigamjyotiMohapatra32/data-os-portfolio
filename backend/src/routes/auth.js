/**
 * Auth routes.
 *
 * The existing NODE_ID/PASSKEY login screen is preserved. After the server
 * validates the passkey, it mints a Firebase custom token for the browser.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken, requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { adminAuth } from '../config/firebase.js';

const router = Router();
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const LoginSchema = z.object({
  userId: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

const SessionSchema = z.object({
  idToken: z.string().min(20),
});

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

async function ensureFirebaseUser(uid) {
  try {
    return await adminAuth.getUser(uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    return adminAuth.createUser({ uid, displayName: uid });
  }
}

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const { userId, password } = parsed.data;
  const expectedUser = process.env.ADMIN_USER_ID;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUser || !expectedHash) {
    console.error('[auth] ADMIN_USER_ID or ADMIN_PASSWORD_HASH not set in env');
    return res.status(500).json({ error: 'Server auth configuration error.' });
  }

  const userMatch = userId === expectedUser;
  const passMatch = await bcrypt.compare(password, expectedHash);

  if (!userMatch || !passMatch) {
    return res.status(401).json({ error: 'Invalid NODE_ID or PASSKEY.' });
  }

  await ensureFirebaseUser(userId);
  const firebaseCustomToken = await adminAuth.createCustomToken(userId, { role: 'admin' });
  const legacyToken = signToken(userId);

  if (legacyToken) {
    res.cookie('dos_token', legacyToken, cookieOptions());
  }

  return res.json({
    ok: true,
    user: userId,
    token: legacyToken,
    firebaseCustomToken,
  });
});

router.post('/session', async (req, res) => {
  const parsed = SessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid session payload.' });

  try {
    const sessionCookie = await adminAuth.createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    res.cookie('dos_session', sessionCookie, cookieOptions());
    return res.json({ ok: true });
  } catch (err) {
    console.error('[auth/session]', err.message);
    return res.status(401).json({ error: 'Unable to establish Firebase session.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('dos_token', cookieOptions());
  res.clearCookie('dos_session', cookieOptions());
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user.userId, provider: req.user.provider });
});

export default router;
