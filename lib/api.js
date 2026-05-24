/**
 * Frontend API client.
 */

const BASE = import.meta.env.VITE_API_URL || '/api';

/** True for wrong credentials / validation errors — must not trigger offline fallback. */
export function isAuthClientError(err) {
  const s = err?.status;
  return s === 400 || s === 401 || s === 403;
}

/** True when the API is down or unreachable (proxy 502, network failure, etc.). */
export function isApiUnreachable(err) {
  const s = err?.status;
  return !s || s >= 500;
}

let authTokenProvider = null;

export function setAuthTokenProvider(provider) {
  authTokenProvider = typeof provider === 'function' ? provider : null;
}

async function request(method, path, body) {
  const token = authTokenProvider?.();
  const opts = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  };

  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (err) {
    if (method === 'GET' && err.name !== 'AbortError') {
      try {
        res = await fetch(`${BASE}${path}`, opts);
      } catch {
        throw Object.assign(new Error('Network error — API unreachable.'), { status: 0 });
      }
    } else {
      throw Object.assign(err, { status: err.status || 0 });
    }
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data?.error || `API error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status, data });
  }

  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),

  auth: {
    login: (userId, password) => request('POST', '/auth/login', { userId, password }),
    session: (idToken) => request('POST', '/auth/session', { idToken }),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
  },

  jobs: {
    search: (q, loc, limit = 20, source = 'auto') =>
      request('GET', `/jobs/search?q=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc || '')}&limit=${limit}&source=${encodeURIComponent(source)}`),
    getSaved: () => request('GET', '/jobs/saved'),
    saveJob: (job) => request('POST', '/jobs/saved', job),
    removeJob: (id) => request('DELETE', `/jobs/saved/${encodeURIComponent(id)}`),
    getTracker: () => request('GET', '/jobs/tracker'),
    updateTracker: (tracker) => request('PUT', '/jobs/tracker', { tracker }),
  },

  notes: {
    list: () => request('GET', '/notes'),
    create: (note) => request('POST', '/notes', note),
    update: (id, note) => request('PUT', `/notes/${encodeURIComponent(id)}`, note),
    delete: (id) => request('DELETE', `/notes/${encodeURIComponent(id)}`),
  },

  contact: {
    send: (payload) => request('POST', '/contact', payload),
  },

  analytics: {
    visit: (page, referrer) => request('POST', '/analytics/visit', { page, referrer }),
    event: (name, props) => request('POST', '/analytics/event', { name, properties: props }),
    stats: () => request('GET', '/analytics/stats'),
  },
};

export default api;
