/**
 * Analytics routes — lightweight visit & event tracking (Firestore-backed).
 *
 * POST /api/analytics/visit  — record a page visit
 * POST /api/analytics/event  — record a named UI event
 * GET  /api/analytics/stats  — summary stats (auth required)
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { db } from '../config/firebase.js';

const router = Router();

const VisitSchema = z.object({
  page:      z.string().max(100).default('/'),
  referrer:  z.string().max(200).optional(),
  userAgent: z.string().max(300).optional(),
});

const EventSchema = z.object({
  name:       z.string().max(100),
  properties: z.record(z.unknown())
    .optional()
    .refine(
      (p) => !p || JSON.stringify(p).length <= 2000,
      { message: 'properties too large' },
    ),
});

// ── POST /api/analytics/visit (public) ─────────────────────────────────────
router.post('/visit', apiLimiter, async (req, res) => {
  const parsed = VisitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload.' });
  try {
    await db.collection('pageVisits').add({
      ...parsed.data,
      ip:        req.ip,
      visitedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics/visit]', err.message);
  }
  return res.json({ ok: true });
});

// ── POST /api/analytics/event (public) ─────────────────────────────────────
router.post('/event', apiLimiter, async (req, res) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload.' });
  try {
    await db.collection('uiEvents').add({
      ...parsed.data,
      ip:      req.ip,
      firedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics/event]', err.message);
  }
  return res.json({ ok: true });
});

// ── GET /api/analytics/stats (protected) ───────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [visitsSnap, eventsSnap, contactsSnap] = await Promise.all([
      db.collection('pageVisits').count().get(),
      db.collection('uiEvents').count().get(),
      db.collection('contactSubmissions').count().get(),
    ]);
    return res.json({
      visits:   visitsSnap.data().count,
      events:   eventsSnap.data().count,
      contacts: contactsSnap.data().count,
    });
  } catch (err) {
    console.error('[analytics/stats]', err.message);
    return res.status(500).json({ error: 'Failed to load stats.' });
  }
});

export default router;
