import React from 'react';

const shortcuts = [
  { keys: '⌘K', description: 'Open command palette' },
  { keys: '⌘⇧?', description: 'Show keyboard shortcuts' },
  { keys: '↑↓', description: 'Navigate in lists' },
  { keys: '⏎', description: 'Select item' },
  { keys: 'Esc', description: 'Close modal' },
  { keys: '⌘⇧D', description: 'Go to ER Diagram' },
  { keys: '⌘⇧S', description: 'Go to SQL editor' },
  { keys: '⌘⇧R', description: 'Go to resume analyzer' },
  { keys: '⌘⇧A', description: 'Go to tasks' },
  { keys: '⌘⇧N', description: 'Go to notes' },
  { keys: '⌘⇧H', description: 'Go to history' },
  { keys: '⌘⇧X', description: 'Go to snippets' },
  { keys: '⌘⇧B', description: 'Go to dashboard' },
  { keys: '⌘⇧J', description: 'Go to job hunter' },
];

export default function KeyboardShortcuts({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 9998,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(20, 28, 60, 0.95) 0%, rgba(12, 19, 34, 0.95) 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '80vh',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h2 style={{
            margin: 0,
            color: '#e2e8f0',
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: "'Inter', sans-serif"
          }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#94a3b8',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Quick reference for all available shortcuts
          </p>
        </div>

        {/* Shortcuts Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  background: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#22d3ee',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {shortcut.keys}
                </div>
                <div style={{
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  paddingTop: '0.25rem'
                }}>
                  {shortcut.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: 'center'
        }}>
          Press Esc to close • ⌘⇧? to toggle
        </div>
      </div>
    </div>
  );
}
