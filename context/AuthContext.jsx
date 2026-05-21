/**
 * AuthContext — enhanced with:
 *  • Idle timeout auto-logout (30 min, via sessionManager)
 *  • Cross-tab logout sync (BroadcastChannel + localStorage)
 *  • Firebase onAuthStateChanged listener (catches external token revocation)
 *  • Tab-focus session revalidation (catches expired-while-hidden)
 *  • Full storage sweep on logout (sessionStorage + localStorage + cookies)
 *  • History guard on protected pages (prevents Back after logout)
 *  • sessionExpired state + reason surfaced to ProtectedRoute / LoginPage
 *  • No UI changes — same login flow, same error messages
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { signInWithCustomToken, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import api, { setAuthTokenProvider } from '../lib/api';
import { auth } from '../lib/firebase';
import { trackLogin, trackLogout } from '../lib/events';
import {
  SESSION_KEY,
  clearAllAuthStorage,
  startIdleTimer,
  stopIdleTimer,
  refreshSessionTimestamp,
  initCrossTabSync,
  broadcastLogout,
  watchVisibility,
  auditLog,
  isSessionValid,
} from '../lib/sessionManager';

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 h — must match sessionManager

// ── Session storage helpers ───────────────────────────────────────────────────
function persistSession(user, token) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, ts: Date.now() }));
  } catch { /* incognito / blocked */ }
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > SESSION_TTL) {
      clearAllAuthStorage();
      return null;
    }
    return parsed;
  } catch { return null; }
}

// ── Provide token to API client ───────────────────────────────────────────────
setAuthTokenProvider(() => readSession()?.token || null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [expiredReason, setExpiredReason]   = useState(null); // 'idle' | 'expired' | 'cross_tab'

  // Track whether we've completed the initial auth check
  const authResolved = useRef(false);

  // ── Internal force-logout (reason surfaced to UI) ─────────────────────────
  const forceLogout = useCallback(async (reason) => {
    // Guard against double-fire
    if (!authResolved.current || (!user && !readSession())) return;

    auditLog('session_expired', { reason });

    stopIdleTimer();
    broadcastLogout();
    clearAllAuthStorage();
    setUser(null);
    setSessionExpired(true);
    setExpiredReason(reason);

    try { await firebaseSignOut(auth); } catch {}
    try { await api.auth.logout(); }    catch {}
  }, [user]);

  // ── Validate stored session (called on mount & tab-focus) ─────────────────
  const revalidateSession = useCallback(async () => {
    const session = readSession();

    // Session has expired in storage (TTL elapsed)
    if (!session) {
      if (user) forceLogout('expired');
      return;
    }

    // Session is valid — ensure user state is hydrated
    if (!user && session.user) {
      setUser(session.user);
    }

    // Refresh the timestamp so TTL rolls forward on activity
    refreshSessionTimestamp();
  }, [user, forceLogout]);

  // ── Bootstrap: rehydrate from storage → try /api/auth/me ─────────────────
  useEffect(() => {
    const session = readSession();

    if (session?.user) {
      setUser(session.user);
      setLoading(false);
      authResolved.current = true;
      return;
    }

    // Try API-backed session (httpOnly cookie)
    api.auth.me()
      .then(({ user: u }) => {
        setUser(u);
        persistSession(u, null);
      })
      .catch(() => { /* no server session — remains logged out */ })
      .finally(() => {
        setLoading(false);
        authResolved.current = true;
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firebase auth state listener ──────────────────────────────────────────
  // Catches external token revocation (e.g., Firebase console → revoke tokens)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      // If Firebase says "logged out" but we think we're logged in → force logout
      if (!firebaseUser && user && authResolved.current) {
        auditLog('firebase_auth_revoked');
        forceLogout('expired');
      }
    });
    return unsub;
  }, [user, forceLogout]);

  // ── Start security features once user is authenticated ────────────────────
  useEffect(() => {
    if (!user) return;

    // Idle timer — auto-logout on inactivity
    startIdleTimer((reason) => forceLogout(reason));

    // Tab-focus revalidation
    const cleanupVisible = watchVisibility(revalidateSession);

    // Cross-tab logout sync
    const cleanupCrossTab = initCrossTabSync((reason) => forceLogout(reason));

    auditLog('session_started', { user });

    return () => {
      stopIdleTimer();
      cleanupVisible();
      cleanupCrossTab();
    };
  }, [user, forceLogout, revalidateSession]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (userId, password) => {
    // Reset any prior expired state
    setSessionExpired(false);
    setExpiredReason(null);

    try {
      const data = await api.auth.login(userId, password);
      if (!data.ok) return { ok: false, error: data.error || 'Login failed.' };

      let idToken = data.token || null;
      if (data.firebaseCustomToken) {
        const credential = await signInWithCustomToken(auth, data.firebaseCustomToken);
        idToken = await credential.user.getIdToken();
        await api.auth.session(idToken);
      }

      persistSession(data.user, idToken);
      setUser(data.user);
      auditLog('login_success', { user: data.user, method: 'api' });
      trackLogin();
      return { ok: true, user: data.user };

    } catch (apiErr) {
      if (!import.meta.env.DEV) {
        auditLog('login_error', { reason: 'api_unavailable', detail: apiErr?.message });
        return {
          ok: false,
          error: 'Unable to reach the authentication server. Please try again later.',
        };
      }

      // Dev only: optional offline login when Express is not running
      try {
        const { validateCredentials } = await import('../lib/auth');
        const result = await validateCredentials(userId, password);
        if (result.ok) {
          persistSession(result.user, null);
          setUser(result.user);
          auditLog('login_success', { user: result.user, method: 'dev_offline' });
          trackLogin();
        } else {
          auditLog('login_failed', { reason: result.error });
        }
        return result;
      } catch {
        auditLog('login_error', { reason: 'exception' });
        return { ok: false, error: 'Authentication failed. Please try again.' };
      }
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    auditLog('logout', { user });
    trackLogout();

    stopIdleTimer();
    broadcastLogout();   // tell other tabs
    clearAllAuthStorage(); // wipe sessionStorage, localStorage, cookies
    setUser(null);
    setSessionExpired(false);
    setExpiredReason(null);

    // Firebase + server-side cleanup (non-blocking)
    try { await firebaseSignOut(auth); } catch {}
    try { await api.auth.logout(); }    catch {}
  }, [user]);

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      sessionExpired,
      expiredReason,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
