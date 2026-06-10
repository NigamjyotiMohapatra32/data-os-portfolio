/**
 * Browser Firebase SDK — config from environment only (no hardcoded project secrets).
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function readConfig() {
  const missing = ENV_KEYS.filter((k) => !import.meta.env[k]);
  if (missing.length) {
    // Never throw here: this module loads at app startup, and an exception
    // would blank the entire site (module scope — the ErrorBoundary cannot
    // catch it). Degrade gracefully: Firebase features turn off, the
    // portfolio still renders. This exact throw kept production blank when
    // CI secrets were missing.
    console.error(
      `[Firebase] Missing env: ${missing.join(', ')} — Firebase features disabled. ` +
      'Provide .env.production or CI env vars for full functionality.'
    );
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  };
}

const firebaseConfig = readConfig();

// Only initialize Firebase when a valid API key is present.
// With an empty key, getAuth() throws "auth/invalid-api-key" at module
// scope — crashing the entire app before React can mount.
let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;
let performance = null;

if (firebaseConfig.apiKey) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  analyticsSupported()
    .then((yes) => {
      if (yes) analytics = getAnalytics(app);
    })
    .catch((err) => {
      if (import.meta.env.DEV) console.warn('[Firebase Analytics] not available:', err.message);
    });

  try {
    if (typeof window !== 'undefined') performance = getPerformance(app);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Firebase Performance] not available:', err.message);
  }
}

export { app, auth, db, storage, analytics, performance };
