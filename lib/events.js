/**
 * lib/events.js  (renamed from analytics.js to avoid ad-blocker blocking)
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified analytics layer.
 *
 * GA4 (Google Analytics 4)  — loaded in index.html via gtag.js script tag
 * Backend event API          — POST /api/analytics/event  (authenticated calls)
 *
 * Usage anywhere in the app:
 *   import { trackEvent, trackPage } from '../lib/events';
 *   trackEvent('job_saved', { job_title: 'Data Modeler', company: 'Accenture' });
 *   trackPage('/workspace');
 */

const GA_ID = import.meta.env.VITE_GA_ID || 'G-WVTYEJKGHL';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safe gtag caller.
 * index.html defines window.gtag via the official gtag.js snippet — use it
 * directly so GA4 receives proper Arguments objects, not plain arrays.
 */
function callGtag(command, ...args) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag(command, ...args);
  } else {
    // Fallback: push to dataLayer so GTM can still pick it up
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
}

/** Fire a GA4 custom event. */
export function trackEvent(eventName, params = {}) {
  try {
    callGtag('event', eventName, { send_to: GA_ID, ...params });
  } catch {}
}

/** Track a virtual page view (for SPA route changes). */
export function trackPage(path, title) {
  try {
    callGtag('event', 'page_view', {
      page_path:  path  || window.location.pathname,
      page_title: title || document.title,
      send_to:    GA_ID,
    });
  } catch {}
}

// ── Named event shortcuts (keeps call-sites clean) ────────────────────────────

/** User logged in successfully. */
export const trackLogin = () =>
  trackEvent('login', { method: 'portfolio_passkey' });

/** User logged out. */
export const trackLogout = () =>
  trackEvent('logout');

/** Workspace panel switched. */
export const trackPanelOpen = (panelId) =>
  trackEvent('panel_open', { panel_id: panelId });

/** Job search executed. */
export const trackJobSearch = (query, resultCount) =>
  trackEvent('job_search', { search_term: query, result_count: resultCount });

/** Job saved to pipeline. */
export const trackJobSaved = (jobTitle, company) =>
  trackEvent('job_saved', { job_title: jobTitle, company_name: company });

/** Job tracker column changed. */
export const trackTrackerMove = (stage, jobTitle) =>
  trackEvent('tracker_stage_change', { stage, job_title: jobTitle });

/** Contact form submitted. */
export const trackContactSubmit = () =>
  trackEvent('contact_form_submit');

/** Automation session started. */
export const trackAutomationRun = (mode) =>
  trackEvent('automation_run', { session_mode: mode });

/** SQL query executed in playground. */
export const trackSQLRun = () =>
  trackEvent('sql_query_run');

/** ER diagram interaction. */
export const trackERDiagram = (action) =>
  trackEvent('er_diagram_action', { action });

/** Resume/ATS tab viewed. */
export const trackATSView = () =>
  trackEvent('ats_optimizer_view');

/** Interview prep session started. */
export const trackInterviewStart = () =>
  trackEvent('interview_prep_start');

// ── Route tracker hook (use once in App.jsx) ──────────────────────────────────
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    trackPage(location.pathname + location.search);
  }, [location]);
}
