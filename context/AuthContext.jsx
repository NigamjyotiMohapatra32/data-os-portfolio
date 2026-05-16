/**
 * AuthContext backed by Firebase Authentication and the Express API.
 *
 * The UI still uses the existing NODE_ID/PASSKEY screen. The server validates
 * that passkey, returns a Firebase custom token, and the browser signs in with
 * Firebase before establishing a secure httpOnly session cookie.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import api, { setAuthTokenProvider } from '../lib/api';
import { auth } from '../lib/firebase';
import { trackLogin, trackLogout } from '../lib/events';

const AuthContext = createContext(null);
const SESSION_KEY = '__dos_session__';
const SESSION_TTL = 8 * 60 * 60 * 1000;

function persistSession(user, token) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, ts: Date.now() })); } catch {}
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > SESSION_TTL) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

setAuthTokenProvider(() => readSession()?.token || null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readSession();
    if (session?.user) {
      setUser(session.user);
      setLoading(false);
      return;
    }

    api.auth.me()
      .then(({ user: u }) => {
        setUser(u);
        persistSession(u, null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (userId, password) => {
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
      trackLogin();
      return { ok: true, user: data.user };
    } catch {
      // Backend unavailable (404 on Netlify static host, 502/503/504, network error, etc.)
      // Always fall back to client-side SHA-256 verification
      try {
        const { validateCredentials, persistSession: localPersist } = await import('../lib/auth');
        const result = await validateCredentials(userId, password);
        if (result.ok) {
          localPersist(result.user);
          persistSession(result.user, null);
          setUser(result.user);
        }
        return result;
      } catch {
        return { ok: false, error: 'Authentication failed. Please try again.' };
      }
    }
  }, []);

  const logout = useCallback(async () => {
    trackLogout();
    clearSession();
    setUser(null);
    try { await firebaseSignOut(auth); } catch {}
    try { await api.auth.logout(); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
