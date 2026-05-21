/**
 * Dev-only offline credential verification (SHA-256 via Web Crypto).
 * Not bundled in production builds — imported only when import.meta.env.DEV is true.
 *
 * Configure in .env (local dev when Express is down):
 *   VITE_DEV_AUTH_USER_HASH     — sha256 hex of userId
 *   VITE_DEV_AUTH_PASSWORD_HASH — sha256 hex of password
 */

const CREDENTIAL_STORE = {
  userId: import.meta.env.VITE_DEV_AUTH_USER_HASH || '',
  password: import.meta.env.VITE_DEV_AUTH_PASSWORD_HASH || '',
};

const SESSION_KEY = '__dos_session__';

async function sha256(str) {
  const data = new TextEncoder().encode(str.slice(0, 512));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isDevAuthConfigured() {
  return Boolean(CREDENTIAL_STORE.userId && CREDENTIAL_STORE.password);
}

export async function validateCredentials(userId, password) {
  if (!isDevAuthConfigured()) {
    return {
      ok: false,
      error: 'Offline dev auth is not configured. Start the API server or set VITE_DEV_AUTH_* in .env.',
    };
  }
  if (!userId.trim() || !password.trim()) {
    return { ok: false, error: 'Credentials cannot be empty.' };
  }
  try {
    const [uidHash, pwdHash] = await Promise.all([sha256(userId), sha256(password)]);
    const valid =
      safeEqual(uidHash, CREDENTIAL_STORE.userId) &&
      safeEqual(pwdHash, CREDENTIAL_STORE.password);

    if (!valid) return { ok: false, error: 'Invalid NODE_ID or PASSKEY.' };
    return { ok: true, user: userId };
  } catch {
    return { ok: false, error: 'Verification subsystem error. Retry.' };
  }
}

/** @deprecated Use AuthContext persistSession — kept for dev fallback compatibility */
export function persistSession(user) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user, ts: Date.now() })
    );
  } catch { /* storage blocked */ }
}

export function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw);
    if (Date.now() - ts > 8 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    return { user };
  } catch {
    return null;
  }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}
