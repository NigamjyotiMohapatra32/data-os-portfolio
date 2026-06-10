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
  if (import.meta.env.PROD && missing.length) {
    throw new Error(
      `[Firebase] Missing required env: ${missing.join(', ')}. Set GitHub/Netlify secrets or .env for production builds.`
    );
  }
  if (!import.meta.env.PROD && missing.length) {
    console.warn('[Firebase] Missing env vars:', missing.join(', '), '— auth/analytics may be limited.');
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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;
let performance = null;

if (firebaseConfig.apiKey) {
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
