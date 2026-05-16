import React from 'react';

export default function WorkspaceHeader() {
  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      background: 'linear-gradient(180deg, rgba(17, 26, 46, 0.5), rgba(12, 19, 34, 0.3))',
      backdropFilter: 'blur(12px)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <div style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>
          Data Modeler <span style={{ color: '#94a3b8' }}>v1.0</span>
        </div>
      </div>

      <div style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#94a3b8',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ color: '#34d399' }}>● </span>
          System Online
        </div>
        <div>
          Models: <span style={{ color: '#22d3ee' }}>12</span>
        </div>
        <div>
          Uptime: <span style={{ color: '#a78bfa' }}>∞</span>
        </div>
      </div>
    </header>
  );
}
