import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPanelOpen, trackSQLRun } from '../../lib/events';
import BootAnimation from './BootAnimation';
import EnhancedSidebar from './EnhancedSidebar';
import WorkspaceHeader from './Header';
import ERDiagramCanvas from './ERDiagramCanvas';
import SQLEditor from './SQLEditor';
import ClockWidget from './ClockWidget';
import TasksWidget from './TasksWidget';
import NotesPanel from './NotesPanel';
import QueryHistory from './QueryHistory';
import SavedSnippets from './SavedSnippets';
import CommandPalette from './CommandPalette';
import KeyboardShortcuts from './KeyboardShortcuts';
import Toast from './Toast';
import './EnhancedWorkspace.css';

const PerformanceDashboard = lazy(() => import('./PerformanceDashboard'));
const CopilotWorkspace = lazy(() => import('../copilot/CopilotWorkspace'));
const AdminPanel = lazy(() => import('../AdminPanel'));
const ResumeAnalyzer = lazy(() => import('./ResumeAnalyzer'));

// Panel-level error boundary
class PanelErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error('[PanelError]', e, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        React.createElement('div', {
          style: { padding: 32, color: '#f87171', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }
        },
          React.createElement('div', { style: { marginBottom: 8, color: '#f472b6', fontSize: 14 } }, 'Panel Error'),
          React.createElement('div', { style: { marginBottom: 12, color: '#fca5a5', lineHeight: 1.6 } },
            this.state.error.message
          ),
          React.createElement('pre', {
            style: { color: '#475569', fontSize: 10, whiteSpace: 'pre-wrap',
              wordBreak: 'break-all', maxHeight: 280, overflow: 'auto', lineHeight: 1.5 }
          }, (this.state.error.stack || '').split('\n').slice(0, 10).join('\n')),
          React.createElement('button', {
            onClick: () => this.setState({ error: null }),
            style: { marginTop: 16, padding: '6px 14px',
              background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: 6, color: '#22d3ee', cursor: 'pointer', fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace" }
          }, 'Retry Panel')
        )
      );
    }
    return this.props.children;
  }
}

function PanelLoading() {
  return (
    <div style={{
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      color: '#64748b',
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: 12,
    }}>
      Loading panel...
    </div>
  );
}

export default function EnhancedWorkspace() {
  const [showBoot, setShowBoot] = useState(true);
  const [activePanel, setActivePanel] = useState('diagram');
  const [toasts, setToasts] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const toastTimersRef = useRef([]);
  const navigate = useNavigate();

  // GA4: track panel switches
  const handlePanelChange = (panelId) => {
    setActivePanel(panelId);
    trackPanelOpen(panelId);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowBoot(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const PANEL_KEYS = {
      d: 'diagram', s: 'sql', r: 'resume', a: 'tasks', n: 'notes',
      h: 'history', x: 'snippets', b: 'dashboard', j: 'jobs',
    };
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }
      if (mod && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      // Panel navigation: Ctrl+Shift+[key]
      if (mod && e.shiftKey) {
        const panel = PANEL_KEYS[e.key.toLowerCase()];
        if (panel) {
          e.preventDefault();
          handlePanelChange(panel);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    const timerId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      toastTimersRef.current = toastTimersRef.current.filter((t) => t !== timerId);
    }, 3000);
    toastTimersRef.current.push(timerId);
  };

  const handleExit = () => navigate('/');

  if (showBoot) return React.createElement(BootAnimation, null);

  const containerStyle = {
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a0e3f 50%, #0f1e4d 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
    minHeight: '100vh',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  };

  const bodyStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
    minWidth: 0,
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    overflow: 'hidden',
    minHeight: 0,
  };

  const panelStyle = {
    background: 'linear-gradient(135deg, rgba(20,28,60,0.8) 0%, rgba(12,19,34,0.6) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    flex: 1,
    minHeight: 0,
  };

  const sidebarStyle = {
    width: 320,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflowY: 'auto',
  };

  const widgetCardStyle = {
    background: 'linear-gradient(135deg, rgba(20,28,60,0.7) 0%, rgba(15,24,50,0.5) 100%)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '1rem',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <EnhancedSidebar
        activePanel={activePanel}
        setActivePanel={handlePanelChange}
        onExit={handleExit}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div style={bodyStyle}>
        <WorkspaceHeader />

        <div style={mainStyle}>
          <div style={panelStyle}>
            <PanelErrorBoundary key={activePanel}>
              <Suspense fallback={<PanelLoading />}>
                {activePanel === 'diagram'   && <ERDiagramCanvas />}
                {activePanel === 'sql'       && <SQLEditor onQueryRun={() => { addToast('Query executed!', 'success'); trackSQLRun(); }} />}
                {activePanel === 'resume'    && <ResumeAnalyzer />}
                {activePanel === 'tasks'     && <TasksWidget />}
                {activePanel === 'notes'     && <NotesPanel />}
                {activePanel === 'history'   && <QueryHistory />}
                {activePanel === 'snippets'  && <SavedSnippets />}
                {activePanel === 'jobs'      && <CopilotWorkspace embedded />}
                {activePanel === 'dashboard' && <PerformanceDashboard />}
                {activePanel === 'admin'     && <AdminPanel />}
              </Suspense>
            </PanelErrorBoundary>
          </div>

          {activePanel !== 'diagram' && activePanel !== 'jobs' && (
            <div style={sidebarStyle}>
              <ClockWidget />
              <div style={widgetCardStyle}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Quick Stats
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#22d3ee', fontSize: 11, marginBottom: 4 }}>Models Built</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>12</div>
                  </div>
                  <div>
                    <div style={{ color: '#34d399', fontSize: 11, marginBottom: 4 }}>Queries Executed</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>47</div>
                  </div>
                  <div>
                    <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 4 }}>Productivity Score</div>
                    <div style={{ fontSize: 18, fontWeight: 700,
                      background: 'linear-gradient(135deg,#a78bfa,#f472b6)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      94%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onPanelChange={setActivePanel}
        />
      )}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999,
        display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
}
