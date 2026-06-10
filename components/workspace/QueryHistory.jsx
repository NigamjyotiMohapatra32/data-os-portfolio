import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'dos_workspace_history';
const defaultHistory = [
  { id: 1, query: "SELECT * FROM customers WHERE status = 'active'", timestamp: '2 mins ago', rows: 1245 },
  { id: 2, query: 'INSERT INTO orders VALUES (...)', timestamp: '15 mins ago', rows: 42 },
  { id: 3, query: 'UPDATE inventory SET qty = qty - 1...', timestamp: '1 hour ago', rows: 823 },
  { id: 4, query: 'DELETE FROM temp_staging...', timestamp: '3 hours ago', rows: 0 },
];

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHistory;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultHistory;
  } catch {
    return defaultHistory;
  }
}

export default function QueryHistory() {
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    const handleReload = () => {
      setHistory(loadHistory());
    };
    window.addEventListener('dosHistoryUpdated', handleReload);
    return () => window.removeEventListener('dosHistoryUpdated', handleReload);
  }, []);

  const handleClear = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}
    setHistory([]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(10, 16, 32, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
          {history.length} queries
        </div>
        <button
          onClick={handleClear}
          style={{
            fontSize: '11px',
            padding: '0.4rem 0.8rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#ef4444';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#94a3b8';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem' }}>
        {history.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '2rem', fontSize: '13px' }}>
            No query history yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.2)';
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#22d3ee',
                  marginBottom: '0.4rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.query}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: '#94a3b8'
                }}>
                  <span>{item.timestamp}</span>
                  <button
                    onClick={() => copyToClipboard(item.query)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#22d3ee';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#94a3b8';
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
