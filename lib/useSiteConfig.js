/**
 * lib/useSiteConfig.js
 * Firestore-backed site configuration.
 * Stores resumeUrl and other admin-settable values in meta/siteConfig.
 * Fallback chain: Firestore → VITE_RESUME_URL env var → null
 */
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const CONFIG_REF = () => doc(db, 'meta', 'siteConfig');

let _cached = null; // in-memory cache so multiple components don't re-fetch

export function useSiteConfig() {
  const [config, setConfig] = useState(_cached);
  const [loading, setLoading] = useState(!_cached);

  useEffect(() => {
    if (_cached) { setConfig(_cached); setLoading(false); return; }
    getDoc(CONFIG_REF())
      .then((snap) => {
        const data = snap.exists() ? snap.data() : {};
        _cached = data;
        setConfig(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}

export function useResumeUrl() {
  const { config, loading } = useSiteConfig();
  const envUrl = import.meta.env.VITE_RESUME_URL || null;
  return { url: config?.resumeUrl || envUrl, loading };
}

export async function saveSiteConfig(updates) {
  _cached = null; // invalidate cache
  await setDoc(CONFIG_REF(), updates, { merge: true });
  _cached = null;
}
