import React from 'react';

const navItems = [
  { id: 'diagram',   label: 'ER Diagram',   icon: '◻',  color: '#22d3ee' },
  { id: 'sql',       label: 'SQL Editor',   icon: '{}', color: '#34d399' },
  { id: 'tasks',     label: 'Tasks',        icon: '✓',  color: '#fbbf24' },
  { id: 'notes',     label: 'Notes',        icon: '📝', color: '#a78bfa' },
  { id: 'history',   label: 'History',      icon: '⏱', color: '#f472b6' },
  { id: 'snippets',  label: 'Snippets',     icon: '📌', color: '#06d6a0' },
  { id: 'dashboard', label: 'Dashboard',    icon: '📊', color: '#ff006e' },
  { id: 'jobs',      label: 'Job Hunter',   icon: '🔍', color: '#60a5fa' },
  { id: 'admin',     label: 'Admin Panel',  icon: '🔐', color: '#fbbf24' },
];

export default function EnhancedSidebar({ activePanel, setActivePanel, onExit, onShowShortcuts }) {
  return (
    <div style={{
      width: '220px',
      background: 'linear-gradient(180deg, rgba(12, 19, 34, 0.95), rgba(8, 12, 22, 0.95))',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '1.5rem',
      minHeight: '100vh',
      position: 'relative',
      zIndex: 10,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Logo */}
      <div style={{
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: '700',
        marginBottom: '0.5rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        💎 Data OS
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '10px',
              border: activePanel === item.id ? `2px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
              background: activePanel === item.id
                ? `linear-gradient(135deg, ${item.color}22 0%, ${item.color}11 100%)`
                : 'transparent',
              color: activePanel === item.id ? item.color : '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (activePanel !== item.id) {
                e.target.style.borderColor = item.color + '60';
                e.target.style.color = item.color;
                e.target.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePanel !== item.id) {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.color = '#94a3b8';
                e.target.style.transform = 'translateX(0)';
              }
            }}
          >
            <span style={{ fontSize: '16px', minWidth: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
            {activePanel === item.id && (
              <div style={{
                position: 'absolute',
                right: '0.5rem',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 10px ${item.color}`,
                animation: 'pulse 2s infinite'
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
        <button
          onClick={onShowShortcuts}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(138, 43, 226, 0.3)',
            background: 'rgba(138, 43, 226, 0.05)',
            color: '#9d4edd',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(138, 43, 226, 0.15)';
            e.target.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(138, 43, 226, 0.05)';
            e.target.style.boxShadow = 'none';
          }}
        >
          ⌨ Shortcuts
        </button>

        <button
          onClick={onExit}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(244, 114, 182, 0.3)',
            background: 'rgba(244, 114, 182, 0.08)',
            color: '#f472b6',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.3s',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(244, 114, 182, 0.15)';
            e.target.style.boxShadow = '0 0 20px rgba(244, 114, 182, 0.4)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(244, 114, 182, 0.08)';
            e.target.style.boxShadow = 'none';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ✕ Exit System
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
