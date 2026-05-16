import React from 'react';

const navItems = [
  { id: 'diagram', label: 'ER Diagram', icon: '◻' },
  { id: 'sql', label: 'SQL Compiler', icon: '{}' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
];

export default function WorkspaceSidebar({ activePanel, setActivePanel, onExit }) {
  return (
    <div style={{
      width: '200px',
      background: 'linear-gradient(180deg, rgba(12, 19, 34, 0.95), rgba(8, 12, 22, 0.95))',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      gap: '1rem',
      minHeight: '100vh'
    }}>
      {/* Logo/Title */}
      <div style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#22d3ee',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(34, 211, 238, 0.2)',
        paddingBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        Data OS
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            style={{
              padding: '0.75rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid ' + (activePanel === item.id ? 'rgba(34, 211, 238, 0.5)' : 'rgba(255, 255, 255, 0.06)'),
              background: activePanel === item.id ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
              color: activePanel === item.id ? '#22d3ee' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (activePanel !== item.id) {
                e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                e.target.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (activePanel !== item.id) {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.target.style.color = '#94a3b8';
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Exit button */}
      <button
        onClick={onExit}
        style={{
          padding: '0.75rem 0.875rem',
          borderRadius: '8px',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          background: 'rgba(244, 114, 182, 0.06)',
          color: '#f472b6',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          transition: 'all 0.2s',
          marginTop: 'auto'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(244, 114, 182, 0.15)';
          e.target.style.boxShadow = '0 0 20px rgba(244, 114, 182, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(244, 114, 182, 0.06)';
          e.target.style.boxShadow = 'none';
        }}
      >
        ✕ Exit System
      </button>
    </div>
  );
}
