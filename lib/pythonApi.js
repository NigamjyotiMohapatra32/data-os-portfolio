/**
 * lib/pythonApi.js
 * Type-safe client for the Data OS Python FastAPI microservice.
 * Base URL: VITE_PYTHON_API_URL env var (falls back to localhost:8000 in dev).
 */

const BASE = import.meta.env.VITE_PYTHON_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const TIMEOUT_MS = 30_000;

async function request(method, path, body, signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const combinedSignal = signal || ctrl.signal;

  try {
    const opts = {
      method,
      signal: combinedSignal,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.detail || `API ${res.status}`), { status: res.status, data });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function uploadFile(path, file, extraFields = {}) {
  const form = new FormData();
  form.append('file', file);
  for (const [k, v] of Object.entries(extraFields)) form.append(k, v);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000); // 60s for uploads

  try {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data?.detail || `Upload error ${res.status}`), { status: res.status });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => request('GET', '/api/health');

// ── Resume ────────────────────────────────────────────────────────────────────
/**
 * @param {File} file - PDF or DOCX
 * @param {string} [jobDescription] - Optional JD for match scoring
 */
export const analyzeResume = (file, jobDescription = '') =>
  uploadFile('/api/resume/analyze', file, { job_description: jobDescription });

/**
 * @param {string} resumeText
 * @param {string} jobDescription
 */
export const matchJob = (resumeText, jobDescription) =>
  request('POST', '/api/resume/match-job', { resume_text: resumeText, job_description: jobDescription });

// ── SQL Tools ─────────────────────────────────────────────────────────────────
/**
 * @param {string} sql
 * @param {'sqlserver'|'postgresql'|'mysql'} [dialect]
 */
export const formatSQL = (sql, dialect = 'sqlserver') =>
  request('POST', '/api/sql/format', { sql, dialect });

/**
 * @param {string} sql
 * @param {'sqlserver'|'postgresql'|'mysql'} [dialect]
 */
export const validateSQL = (sql, dialect = 'sqlserver') =>
  request('POST', '/api/sql/validate', { sql, dialect });

// ── ER Diagram ────────────────────────────────────────────────────────────────
/**
 * @param {Array<{name:string,attributes:Array}>} entities
 * @param {'sqlserver'|'postgresql'|'mysql'} [dialect]
 */
export const generateDDL = (entities, dialect = 'sqlserver') =>
  request('POST', '/api/er/generate-ddl', { entities, dialect });

// ── Contact ───────────────────────────────────────────────────────────────────
export const sendEmail = (payload) =>
  request('POST', '/api/contact/send', payload);

// ── Skills ────────────────────────────────────────────────────────────────────
export const getSkillCategories = () => request('GET', '/api/skills/categories');

export default {
  checkHealth,
  analyzeResume,
  matchJob,
  formatSQL,
  validateSQL,
  generateDDL,
  sendEmail,
  getSkillCategories,
};
