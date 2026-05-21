/**
 * ProtectedRoute — hardened route guard.
 *
 * Security features (no UI style changes):
 *  1. Shows auth-check loading screen instead of null — prevents blank flash
 *     and stops race-condition rendering of protected content.
 *  2. Installs a popstate guard when authenticated — pressing Back after
 *     logout cannot reveal the cached workspace.
 *  3. Passes sessionExpired + reason to /login via location state so
 *     LoginPage can surface the appropriate message.
 *  4. Rejects access while auth is resolving — nothing protected renders
 *     until the check fully completes.
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { installHistoryGuard } from '../../lib/sessionManager';

// Matches the existing RouteFallback style in App.jsx — no design changes
function AuthCheckScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0a0e27',
      color: '#22d3ee',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 20,
          height: 20,
          border: '2px solid rgba(34,211,238,0.3)',
          borderTopColor: '#22d3ee',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <span>Verifying session…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function expiredMessage(reason) {
  switch (reason) {
    case 'idle':      return 'Your session timed out due to inactivity. Please log in again.';
    case 'cross_tab': return 'You were logged out from another tab.';
    case 'expired':   return 'Your session has expired. Please log in again.';
    default:          return 'Your session ended. Please log in again.';
  }
}

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, sessionExpired, expiredReason } = useAuth();
  const location = useLocation();

  // Install the Back-button guard while the user is authenticated.
  // Pushes a duplicate history entry and intercepts popstate so pressing
  // Back after logout shows the login page, not the cached workspace.
  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = installHistoryGuard();
    return cleanup;
  }, [isAuthenticated]);

  // Phase 1: auth still resolving — show spinner, render nothing protected
  if (loading) return <AuthCheckScreen />;

  // Phase 2: session expired mid-session (idle, cross-tab, token revocation)
  // AuthContext has already cleared state. Redirect with reason for message display.
  if (sessionExpired) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, authMessage: expiredMessage(expiredReason) }}
        replace
      />
    );
  }

  // Phase 3: not authenticated — redirect to login, preserve intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Phase 4: authenticated — render protected content
  return children;
}
