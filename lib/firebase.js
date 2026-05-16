/**
 * Browser Firebase SDK.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBxzIPNCeRt5RBz0xIyoYBjP02hoXk7PKY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'my-portfollio-23e3c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'my-portfollio-23e3c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'my-portfollio-23e3c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '479610124761',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:479610124761:web:4078cbfe270d9bf31e81c8',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5KQ7XG177S',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

let analytics = null;
let performance = null;

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

export { app, auth, analytics, performance };
