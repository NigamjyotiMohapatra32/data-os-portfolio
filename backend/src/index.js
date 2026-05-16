/**
 * Data-OS Portfolio — Express API Server
 *
 * Routes:
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 *   GET    /api/jobs/search
 *   GET    /api/jobs/saved
 *   POST   /api/jobs/saved
 *   DELETE /api/jobs/saved/:id
 *   GET    /api/jobs/tracker
 *   PUT    /api/jobs/tracker
 *   GET    /api/notes
 *   POST   /api/notes
 *   PUT    /api/notes/:id
 *   DELETE /api/notes/:id
 *   POST   /api/contact
 *   POST   /api/analytics/visit
 *   POST   /api/analytics/event
 *   GET    /api/analytics/stats  (auth)
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes      from './routes/auth.js';
import jobRoutes       from './routes/jobs.js';
import noteRoutes      from './routes/notes.js';
import contactRoutes   from './routes/contact.js';
import analyticsRoutes from './routes/analytics.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:4173',  // vite preview
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,  // Required for cookie-based auth
}));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'data-os-api',
    ts:      new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/jobs',      jobRoutes);
app.use('/api/notes',     noteRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Data-OS API running at http://localhost:${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/health`);
  console.log(`    Mode:   ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
