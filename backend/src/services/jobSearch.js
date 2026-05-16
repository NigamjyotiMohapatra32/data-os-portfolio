/**
 * Job search service - proxies external job APIs server-side.
 */
import fetch from 'node-fetch';

const REMOTIVE_URL = process.env.REMOTIVE_BASE_URL || 'https://remotive.com/api/remote-jobs';
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ITEMS = 100;
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX_ITEMS) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

function cleanText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(options.timeout || 9000),
  });

  if (!res.ok) throw new Error(`Job API error: ${res.status}`);
  return res.json();
}

export async function searchRemotive({ query = '', limit = 20 } = {}) {
  const params = new URLSearchParams({ search: query, limit: String(limit) });
  const cacheKey = `remotive:${query}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const json = await fetchJson(`${REMOTIVE_URL}?${params}`, { timeout: 8000 });
  const jobs = (json.jobs || []).map(normalizeRemotive).slice(0, limit);
  cacheSet(cacheKey, jobs);
  return jobs;
}

function normalizeRemotive(j) {
  return {
    id: String(j.id),
    title: j.title || '',
    company_name: j.company_name || '',
    company_logo: j.company_logo_url || null,
    category: j.category || '',
    tags: Array.isArray(j.tags) ? j.tags : [],
    job_type: j.job_type || 'full_time',
    publication_date: j.publication_date || null,
    candidate_required_location: j.candidate_required_location || 'Worldwide',
    salary: j.salary || '',
    url: j.url || '',
    description: cleanText(j.description),
    source: 'remotive',
  };
}

export async function searchJSearch({ query = '', location = '', page = 1, limit = 20 } = {}) {
  const key = process.env.JSEARCH_API_KEY;
  if (!key) return [];

  const cacheKey = `jsearch:${query}:${location}:${page}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    query: `${query} ${location}`.trim(),
    page: String(page),
    num_pages: '1',
  });
  const url = `https://jsearch.p.rapidapi.com/search?${params}`;

  const json = await fetchJson(url, {
    timeout: 10000,
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });
  const jobs = (json.data || []).map(normalizeJSearch).slice(0, limit);
  cacheSet(cacheKey, jobs);
  return jobs;
}

function normalizeJSearch(j) {
  return {
    id: String(j.job_id || `${j.employer_name || 'job'}-${j.job_title || Date.now()}`),
    title: j.job_title || '',
    company_name: j.employer_name || '',
    company_logo: j.employer_logo || null,
    category: j.job_category || '',
    tags: [],
    job_type: j.job_employment_type || 'FULLTIME',
    publication_date: j.job_posted_at_datetime_utc || null,
    candidate_required_location: [j.job_city, j.job_country].filter(Boolean).join(', '),
    salary: j.job_min_salary
      ? `${j.job_min_salary}-${j.job_max_salary || j.job_min_salary} ${j.job_salary_currency || 'USD'}`
      : '',
    url: j.job_apply_link || j.job_google_link || '',
    description: cleanText(j.job_description),
    source: 'jsearch',
  };
}
