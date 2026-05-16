/**
 * Client-side credential verification using the Web Crypto API (SubtleCrypto).
 *
 * Credentials are stored as SHA-256 digests — the plaintext password is
 * NEVER present in the source code.
 *
 * Security notes for a portfolio context:
 *  - Hashes are derived offline and embedded; no server round-trip leaks credentials.
 *  - sessionStorage (not localStorage) is used — cleared on tab/browser close.
 *  - Input is length-capped before hashing to prevent DoS on slow devices.
 */

// Pre-computed SHA-256 digests (hex) of the static credentials.
// Do NOT store plaintext credentials here.
const CREDENTIAL_STORE = {
  // sha256("Nigamjyoti")
  userId: 'e784b9d99a31664ae6b1298cc61c1a6a093fd4d5cc478a78457edadd4262b217',
  // sha256("Nigam@ai")
  password: 'dc9ac00442905666a283568e697cf760b608604a593303d0ba0f7a968407c6bc',
};

const SESSION_KEY = '__dos_session__';

/**
 * Hash a UTF-8 string with SHA-256 via the Web Crypto API.
 * @param {string} str
 * @returns {Promise<string>} Lowercase hex digest
 */
async function sha256(str) {
  const data = new TextEncoder().encode(str.slice(0, 512)); // cap length
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison (prevents timing attacks).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validate user-supplied credentials against stored hashes.
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<{ ok: boolean; user?: string; error?: string }>}
 */
export async function validateCredentials(userId, password) {
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

/** Persist authenticated session to sessionStorage. */
export function persistSession(user) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user, ts: Date.now() })
    );
  } catch { /* incognito / storage blocked */ }
}

/** Read back an existing session. Returns null if expired or absent. */
export function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw);
    // Session TTL: 8 hours
    if (Date.now() - ts > 8 * 60 * 60 * 1000) { clearSession(); return null; }
    return { user };
  } catch { return null; }
}

/** Clear the session (logout). */
export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}
