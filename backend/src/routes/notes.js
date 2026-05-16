/**
 * Notes routes — Firestore-backed
 * GET    /api/notes          — list all notes
 * POST   /api/notes          — create note
 * PUT    /api/notes/:id      — update note
 * DELETE /api/notes/:id      — delete note
 */
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { userDocId } from '../utils/userDoc.js';

const router = Router();
router.use(requireAuth);

const NoteSchema = z.object({
  title:   z.string().max(200).default('Untitled'),
  content: z.string().max(50000),
  tags:    z.array(z.string()).default([]),
  pinned:  z.boolean().default(false),
});

// ── GET /api/notes ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const snap = await db
      .collection('users').doc(userDocId(req))
      .collection('notes')
      .orderBy('updatedAt', 'desc')
      .get();
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ notes });
  } catch (err) {
    console.error('[notes GET]', err.message);
    return res.status(500).json({ error: 'Failed to load notes.' });
  }
});

// ── POST /api/notes ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const parsed = NoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid note data.' });
  try {
    const id  = randomUUID();
    const now = new Date().toISOString();
    const note = { id, ...parsed.data, createdAt: now, updatedAt: now };
    await db
      .collection('users').doc(userDocId(req))
      .collection('notes').doc(id)
      .set(note);
    return res.status(201).json({ ok: true, note });
  } catch (err) {
    console.error('[notes POST]', err.message);
    return res.status(500).json({ error: 'Failed to create note.' });
  }
});

// ── PUT /api/notes/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const parsed = NoteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid note data.' });
  try {
    await db
      .collection('users').doc(userDocId(req))
      .collection('notes').doc(req.params.id)
      .update({ ...parsed.data, updatedAt: new Date().toISOString() });
    return res.json({ ok: true });
  } catch (err) {
    // Firestore throws when updating a non-existent document
    if (err.code === 5 || err.message?.includes('No document to update')) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    console.error('[notes PUT]', err.message);
    return res.status(500).json({ error: 'Failed to update note.' });
  }
});

// ── DELETE /api/notes/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db
      .collection('users').doc(userDocId(req))
      .collection('notes').doc(req.params.id)
      .delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error('[notes DELETE]', err.message);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;
