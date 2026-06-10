/**
 * Auth middleware.
 *
 * Preferred path: Firebase ID tokens or Firebase session cookies.
 * Legacy JWTs are accepted only as a compatibility fallback.
 */
import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase.js';

const LEGACY_SECRET = process.env.JWT_SECRET;

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

function toUser(decoded, provider = 'firebase') {
  return {
    userId: decoded.uid || decoded.user_id || decoded.sub,
    email: decoded.email || null,
    provider,
  };
}

// Prevent browsers and proxies from caching protected API responses.
function setNoCacheHeaders(res) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma':        'no-cache',
    'Expires':       '0',
    'Surrogate-Control': 'no-store',
  });
}

export async function requireAuth(req, res, next) {
  setNoCacheHeaders(res);

  const sessionCookie = req.cookies?.dos_session;
  const bearerToken = getBearerToken(req);
  const legacyCookie = req.cookies?.dos_token;

  try {
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      req.user = toUser(decoded);
      return next();
    }

    if (bearerToken) {
      const decoded = await adminAuth.verifyIdToken(bearerToken, true);
      req.user = toUser(decoded);
      return next();
    }
  } catch (err) {
    if (!legacyCookie && !LEGACY_SECRET) {
      const msg = err.code === 'auth/id-token-expired' ? 'Session expired.' : 'Invalid session.';
      return res.status(401).json({ error: msg });
    }
  }

  const legacyToken = legacyCookie || bearerToken;
  if (!legacyToken || !LEGACY_SECRET) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const payload = jwt.verify(legacyToken, LEGACY_SECRET);
    req.user = { userId: payload.userId, provider: 'legacy-jwt' };
    return next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid token.';
    return res.status(401).json({ error: msg });
  }
}

export function signToken(userId) {
  if (!LEGACY_SECRET) return null;
  return jwt.sign(
    { userId },
    LEGACY_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}
