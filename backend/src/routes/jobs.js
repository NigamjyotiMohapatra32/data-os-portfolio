/**
 * Job routes - Firestore-backed.
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { jobLimiter } from '../middleware/rateLimit.js';
import { searchRemotive, searchJSearch } from '../services/jobSearch.js';
import { db } from '../config/firebase.js';
import { userDocId } from '../utils/userDoc.js';

const router = Router();
router.use(requireAuth);

const SavedJobSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  company_name: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal('')),
}).passthrough();

const TrackerSchema = z.record(z.string().max(200), z.string().max(40));

router.get('/search', jobLimiter, async (req, res) => {
  const query = String(req.query.q || 'data modeler architect').slice(0, 180);
  const location = String(req.query.loc || '').slice(0, 120);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const source = String(req.query.source || 'auto').toLowerCase();

  try {
    const shouldUseJSearch = (source === 'auto' || source === 'jsearch') && process.env.JSEARCH_API_KEY;
    const jobs = shouldUseJSearch
      ? await searchJSearch({ query, location, limit })
      : await searchRemotive({ query, limit });

    return res.json({
      jobs,
      total: jobs.length,
      source: shouldUseJSearch ? 'jsearch' : 'remotive',
    });
  } catch (err) {
    console.error('[jobs/search]', err.message);
    return res.status(502).json({ error: 'Job search temporarily unavailable.', jobs: [] });
  }
});

router.get('/saved', async (req, res) => {
  try {
    const snap = await db
      .collection('users').doc(userDocId(req))
      .collection('savedJobs')
      .orderBy('savedAt', 'desc')
      .get();
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ savedJobs: jobs });
  } catch (err) {
    console.error('[jobs/saved GET]', err.message);
    return res.status(500).json({ error: 'Failed to load saved jobs.' });
  }
});

router.post('/saved', async (req, res) => {
  const parsed = SavedJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid job object.' });

  try {
    const now = new Date().toISOString();
    const docRef = db
      .collection('users').doc(userDocId(req))
      .collection('savedJobs').doc(String(parsed.data.id));
    await docRef.set({ ...parsed.data, savedAt: now, updatedAt: now }, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[jobs/saved POST]', err.message);
    return res.status(500).json({ error: 'Failed to save job.' });
  }
});

router.delete('/saved/:id', async (req, res) => {
  try {
    await db
      .collection('users').doc(userDocId(req))
      .collection('savedJobs').doc(String(req.params.id))
      .delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error('[jobs/saved DELETE]', err.message);
    return res.status(500).json({ error: 'Failed to remove job.' });
  }
});

router.get('/tracker', async (req, res) => {
  try {
    const doc = await db
      .collection('users').doc(userDocId(req))
      .collection('state').doc('tracker')
      .get();
    const tracker = doc.exists ? doc.data() : {};
    delete tracker.updatedAt;
    return res.json({ tracker });
  } catch (err) {
    console.error('[jobs/tracker GET]', err.message);
    return res.status(500).json({ error: 'Failed to load tracker.' });
  }
});

router.put('/tracker', async (req, res) => {
  const parsed = TrackerSchema.safeParse(req.body?.tracker);
  if (!parsed.success) return res.status(400).json({ error: 'tracker must be a status map.' });

  try {
    await db
      .collection('users').doc(userDocId(req))
      .collection('state').doc('tracker')
      .set({ ...parsed.data, updatedAt: new Date().toISOString() });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[jobs/tracker PUT]', err.message);
    return res.status(500).json({ error: 'Failed to update tracker.' });
  }
});

export default router;
