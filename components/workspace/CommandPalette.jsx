import React, { useState, useRef, useEffect } from 'react';

const commands = [
  { name: 'Go to ER Diagram', cmd: 'diagram', icon: '◻' },
  { name: 'Open SQL Editor', cmd: 'sql', icon: '{}' },
  { name: 'View Tasks', cmd: 'tasks', icon: '✓' },
  { name: 'Open Notes', cmd: 'notes', icon: '📝' },
  { name: 'Query History', cmd: 'history', icon: '⏱' },
  { name: 'Saved Snippets', cmd: 'snippets', icon: '📌' },
  { name: 'Performance Dashboard', cmd: 'dashboard', icon: '📊' },
  { name: 'Job Hunter', cmd: 'jobs', icon: '🔍' },
];

export default function CommandPalette({ onClose, onPanelChange }) {
  const [input, setInput] = useState('');
  const [filtered, setFiltered] = useState(commands);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const results = commands.filter(cmd =>
      cmd.name.toLowerCase().includes(input.toLowerCase())
    );
    setFiltered(results);
    setSelected(0);
  }, [input]);

  const handleSelect = (cmd) => {
    const PANEL_IDS = ['diagram', 'sql', 'tasks', 'notes', 'history', 'snippets', 'dashboard', 'jobs'];
    if (PANEL_IDS.includes(cmd.cmd)) {
      onPanelChange(cmd.cmd);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => (s + 1) % filtered.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => (s - 1 + filtered.length) % filtered.length);
    }
    if (e.key === 'Enter') {
      handleSelect(filtered[selected]);
    }
  };

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
        zIndex: 9999,
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
          maxWidth: '600px',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Search input */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="⌘K  Type a command..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '16px',
              outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={i}
                onClick={() => handleSelect(cmd)}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: selected === i ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                  border: 'none',
                  color: selected === i ? '#22d3ee' : '#cbd5e1',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  setSelected(i);
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                }}
              >
                <span style={{ fontSize: '18px' }}>{cmd.icon}</span>
                <span style={{ flex: 1 }}>{cmd.name}</span>
                <span style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {cmd.cmd}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: "'JetBrains Mono', monospace",
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <span>↑↓ Navigate</span>
          <span>⏎ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
