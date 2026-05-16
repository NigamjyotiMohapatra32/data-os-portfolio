/**
 * Rate limiting presets.
 * - loginLimiter  : strict — prevents brute-force on /api/auth/login
 * - apiLimiter    : general — 120 req/min for authenticated endpoints
 * - jobLimiter    : moderate — job search hits external APIs, keep it sensible
 * - contactLimiter: very strict — prevents contact form spam
 */
import rateLimit from 'express-rate-limit';

const jsonHandler = (req, res) =>
  res.status(429).json({ error: 'Too many requests. Please slow down.' });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: jsonHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 120,
  handler: jsonHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const jobLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: jsonHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  handler: jsonHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
