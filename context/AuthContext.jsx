/**
 * AuthContext — session lifecycle with Firebase, API, and dev-offline providers.
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { signInWithCustomToken, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import api, { setAuthTokenProvider, isAuthClientError, isApiUnreachable } from '../lib/api';
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
} from '../lib/sessionManager';

const AuthContext = createContext(null);
const SESSION_TTL = 8 * 60 * 60 * 1000;

/** @typedef {'firebase' | 'cookie' | 'dev'} AuthProvider */

function persistSession(user, token, authProvider) {
  try {
    const provider = authProvider || (token ? 'firebase' : 'dev');
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user, token, ts: Date.now(), authProvider: provider }),
    );
  } catch { /* incognito / blocked */ }
}

function sessionAuthProvider(session) {
  if (!session) return null;
  if (session.authProvider) return session.authProvider;
  return session.token ? 'firebase' : 'dev';
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

setAuthTokenProvider(() => readSession()?.token || null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [expiredReason, setExpiredReason]   = useState(null);

  const authResolved = useRef(false);
  const firebaseSignInPending = useRef(false);

  const forceLogout = useCallback(async (reason) => {
    const session = readSession();
    if (!authResolved.current || (!user && !session)) return;

    const provider = sessionAuthProvider(session);
    auditLog('session_expired', { reason });

    stopIdleTimer();
    broadcastLogout();
    clearAllAuthStorage();
    setUser(null);
    setSessionExpired(true);
    setExpiredReason(reason);

    if (provider === 'firebase' && auth) {
      try { await firebaseSignOut(auth); } catch {}
    }
    try { await api.auth.logout(); } catch { /* backend may be offline */ }
  }, [user]);

  const revalidateSession = useCallback(async () => {
    const session = readSession();

    if (!session) {
      if (user) forceLogout('expired');
      return;
    }

    if (!user && session.user) {
      setUser(session.user);
    }

    refreshSessionTimestamp();
  }, [user, forceLogout]);

  useEffect(() => {
    const session = readSession();

    if (session?.user) {
      setUser(session.user);
      setLoading(false);
      authResolved.current = true;
      return;
    }

    api.auth.me()
      .then(({ user: u }) => {
        setUser(u);
        persistSession(u, null, 'cookie');
      })
      .catch(() => { /* no server session */ })
      .finally(() => {
        setLoading(false);
        authResolved.current = true;
      });
  }, []);

  // Wait for Firebase to restore persisted auth before treating null as revoked.
  useEffect(() => {
    if (!auth) return; // Firebase not configured — skip auth state listener
    let unsub = () => {};
    let cancelled = false;

    const attach = () => {
      unsub = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseSignInPending.current) return;
        if (firebaseUser || !user || !authResolved.current) return;

        const provider = sessionAuthProvider(readSession());
        if (provider !== 'firebase') return;

        auditLog('firebase_auth_revoked');
        forceLogout('expired');
      });
    };

    if (typeof auth.authStateReady === 'function') {
      auth.authStateReady().then(() => {
        if (!cancelled) attach();
      });
    } else {
      attach();
    }

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, forceLogout]);

  useEffect(() => {
    if (!user) return;

    startIdleTimer((reason) => forceLogout(reason));
    const cleanupVisible = watchVisibility(revalidateSession);
    const cleanupCrossTab = initCrossTabSync((reason) => forceLogout(reason));

    auditLog('session_started', { user });

    return () => {
      stopIdleTimer();
      cleanupVisible();
      cleanupCrossTab();
    };
  }, [user, forceLogout, revalidateSession]);

  const login = useCallback(async (userId, password) => {
    setSessionExpired(false);
    setExpiredReason(null);

    try {
      const data = await api.auth.login(userId, password);
      if (!data.ok) return { ok: false, error: data.error || 'Login failed.' };

      let idToken = data.token || null;
      if (data.firebaseCustomToken) {
        firebaseSignInPending.current = true;
        try {
          const credential = await signInWithCustomToken(auth, data.firebaseCustomToken);
          idToken = await credential.user.getIdToken();
          await api.auth.session(idToken);
        } finally {
          firebaseSignInPending.current = false;
        }
      }

      persistSession(data.user, idToken, 'firebase');
      setUser(data.user);
      auditLog('login_success', { user: data.user, method: 'api' });
      trackLogin();
      return { ok: true, user: data.user };

    } catch (apiErr) {
      if (isAuthClientError(apiErr)) {
        auditLog('login_failed', { reason: apiErr.message });
        return { ok: false, error: apiErr.message || 'Invalid NODE_ID or PASSKEY.' };
      }

      if (!isApiUnreachable(apiErr)) {
        auditLog('login_error', { reason: 'api_error', detail: apiErr?.message });
        return { ok: false, error: apiErr.message || 'Authentication failed.' };
      }

      // API unreachable — no deployed backend (static host), backend down, or
      // network failure. Fall back to the offline hash gate when configured.
      try {
        const { validateCredentials, isDevAuthConfigured } = await import('../lib/auth');
        if (!isDevAuthConfigured()) {
          auditLog('login_error', { reason: 'api_unavailable', detail: apiErr?.message });
          return {
            ok: false,
            error: 'Unable to reach the authentication server. Start the backend (port 4000) or set VITE_DEV_AUTH_* at build time for offline login.',
          };
        }
        const result = await validateCredentials(userId, password);
        if (result.ok) {
          persistSession(result.user, null, 'dev');
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

  const logout = useCallback(async () => {
    const provider = sessionAuthProvider(readSession());
    auditLog('logout', { user });
    trackLogout();

    stopIdleTimer();
    broadcastLogout();
    clearAllAuthStorage();
    setUser(null);
    setSessionExpired(false);
    setExpiredReason(null);

    if (provider === 'firebase' && auth) {
      try { await firebaseSignOut(auth); } catch {}
    }
    try { await api.auth.logout(); } catch { /* backend may be offline */ }
  }, [user]);

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
