/**
 * lib/sessionManager.js
 *
 * Centralised session lifecycle manager. Handles everything outside React:
 *  • Idle timeout   — auto-logout after configurable inactivity period
 *  • Cross-tab sync — BroadcastChannel + localStorage pulse
 *  • History guard  — prevents Back-button access to protected pages after logout
 *  • Storage sweep  — clears every auth artifact (sessionStorage, localStorage, cookies)
 *  • Tab-focus check — re-validates session when tab becomes visible again
 *
 * UI is NOT touched here. All expiry callbacks are passed in from AuthContext.
 */

// ── Config ────────────────────────────────────────────────────────────────────
export const IDLE_TIMEOUT_MS   = 30 * 60 * 1000;  // 30 min — adjust freely
export const SESSION_KEY       = '__dos_session__';
const BROADCAST_CH             = 'dos_auth_sync';
const LOGOUT_PULSE_KEY         = '__dos_logout_pulse__';
const ACTIVITY_EVENTS          = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];

// Module-level refs (survive across hook re-renders)
let _idleTimer       = null;
let _onExpire        = null;
let _channel         = null;
let _cleanupCrossTab = null;
let _cleanupVisible  = null;

// ── History guard ─────────────────────────────────────────────────────────────
/**
 * Push a duplicate history entry and intercept popstate so the user cannot
 * navigate Back to a protected page after logout.
 */
export function installHistoryGuard() {
  window.history.pushState(null, '', window.location.href);
  const handler = () => window.history.pushState(null, '', window.location.href);
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}

// ── Storage sweep ─────────────────────────────────────────────────────────────
/**
 * Wipes every client-side auth artifact. Called on logout and session expiry.
 */
export function clearAllAuthStorage() {
  // sessionStorage — our session key + any other __dos / dos_ prefixed items
  try {
    const ssKeys = Object.keys(sessionStorage).filter(
      k => k.startsWith('__dos') || k.startsWith('dos_')
    );
    ssKeys.forEach(k => sessionStorage.removeItem(k));
  } catch { /* storage blocked (incognito) */ }

  // localStorage — Firebase SDK caches tokens here
  try {
    const lsKeys = Object.keys(localStorage).filter(
      k => k.startsWith('__dos') ||
           k.startsWith('dos_') ||
           k.includes('firebase:authUser') ||
           k.includes('firebaseLocalStorage')
    );
    lsKeys.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }

  // Cookies — expire every known auth cookie across all plausible paths
  _expireCookies(['dos_token', 'dos_session']);
}

function _expireCookies(names) {
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const paths   = ['/', '/api', '/workspace'];
  const domains = [
    '',
    window.location.hostname,
    '.' + window.location.hostname,
  ];
  names.forEach(name => {
    paths.forEach(path => {
      domains.forEach(domain => {
        const domPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; ${expires}; path=${path}${domPart}; samesite=strict`;
        document.cookie = `${name}=; ${expires}; path=${path}${domPart}; samesite=strict; secure`;
      });
    });
  });
}

// ── Idle timeout ──────────────────────────────────────────────────────────────
function _resetTimer() {
  clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    if (_onExpire) _onExpire('idle');
  }, IDLE_TIMEOUT_MS);
}

/**
 * Start tracking user activity. Call when user authenticates.
 * @param {(reason: 'idle'|'expired'|'cross_tab') => void} onExpire
 */
export function startIdleTimer(onExpire) {
  _onExpire = onExpire;
  ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, _resetTimer, { passive: true }));
  _resetTimer();
}

/** Stop idle tracking. Call on logout and unmount. */
export function stopIdleTimer() {
  clearTimeout(_idleTimer);
  _idleTimer = null;
  _onExpire  = null;
  ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, _resetTimer));
}

/** Renew the session timestamp in storage (call on significant activity). */
export function refreshSessionTimestamp() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, ts: Date.now() }));
  } catch { /* noop */ }
}

// ── Cross-tab sync ────────────────────────────────────────────────────────────
/**
 * Subscribe to logout events from other tabs.
 * Returns a cleanup function — call it on unmount.
 * @param {(reason: 'cross_tab') => void} onLogout
 */
export function initCrossTabSync(onLogout) {
  // Modern: BroadcastChannel
  try {
    _channel = new BroadcastChannel(BROADCAST_CH);
    _channel.onmessage = (e) => {
      if (e.data?.type === 'LOGOUT') onLogout('cross_tab');
    };
  } catch { _channel = null; }

  // Fallback: localStorage storage event (Safari, private mode)
  const storageHandler = (e) => {
    if (e.key === LOGOUT_PULSE_KEY && e.newValue) onLogout('cross_tab');
  };
  window.addEventListener('storage', storageHandler);

  _cleanupCrossTab = () => {
    try { _channel?.close(); } catch {}
    _channel = null;
    window.removeEventListener('storage', storageHandler);
  };

  return _cleanupCrossTab;
}

/** Signal other tabs to log out. */
export function broadcastLogout() {
  try { _channel?.postMessage({ type: 'LOGOUT' }); } catch {}
  try {
    localStorage.setItem(LOGOUT_PULSE_KEY, Date.now().toString());
    setTimeout(() => { try { localStorage.removeItem(LOGOUT_PULSE_KEY); } catch {} }, 500);
  } catch {}
}

// ── Tab-focus revalidation ────────────────────────────────────────────────────
/**
 * Re-run the session validity check whenever a hidden tab becomes visible.
 * Returns cleanup.
 * @param {() => void} onVisible
 */
export function watchVisibility(onVisible) {
  const handler = () => {
    if (document.visibilityState === 'visible') onVisible();
  };
  document.addEventListener('visibilitychange', handler);
  _cleanupVisible = () => document.removeEventListener('visibilitychange', handler);
  return _cleanupVisible;
}

// ── Audit log (console only — extend to Firestore if needed) ─────────────────
const _EVENTS = [];

export function auditLog(event, detail = {}) {
  const entry = {
    event,
    ts: new Date().toISOString(),
    url: window.location.pathname,
    ua: navigator.userAgent.slice(0, 80),
    ...detail,
  };
  _EVENTS.push(entry);
  if (import.meta.env.DEV) console.info('[DOS AUDIT]', entry);
  // Keep last 50 entries in memory
  if (_EVENTS.length > 50) _EVENTS.shift();
}

export function getAuditLog() { return [..._EVENTS]; }

// ── Session validity check (pure, no side-effects) ───────────────────────────
/**
 * Returns true if the session stored in sessionStorage is still valid.
 * Mirrors the TTL logic in AuthContext for quick synchronous checks.
 */
export function isSessionValid() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < 8 * 60 * 60 * 1000; // 8 h TTL
  } catch { return false; }
}
