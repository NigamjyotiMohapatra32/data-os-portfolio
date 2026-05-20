import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { usePageTracking } from './lib/events';
import './styles.css';

const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Workspace = lazy(() => import('./pages/Workspace'));

function RouteFallback() {
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
      Loading...
    </div>
  );
}

/** Inner component so usePageTracking can use the router context. */
function AppRoutes() {
  usePageTracking(); // fires GA4 page_view on every route change

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/"        element={<Portfolio />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
