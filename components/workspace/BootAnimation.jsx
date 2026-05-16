import React, { useEffect, useState } from 'react';

export default function BootAnimation() {
  const [lines, setLines] = useState([]);
  const [barFill, setBarFill] = useState(0);

  useEffect(() => {
    const bootMessages = [
      'Initializing Data Modeling Engine...',
      'Loading SQL Compiler Stack...',
      'Starting ER Diagram Canvas...',
      'Mounting Real-time Widgets...',
      'Connecting Pipeline Services...',
      'Initializing Workspace...',
      'System Ready ✓'
    ];

    bootMessages.forEach((msg, i) => {
      setTimeout(() => {
        setLines(prev => [...prev, msg]);
      }, i * 200);
    });

    // Progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      setBarFill(Math.min(100, progress));
      if (progress >= 100) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at center, #0a1224 0%, #04060c 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'JetBrains Mono', monospace",
      color: '#e2e8f0'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#22d3ee' }}>
            <path d="M3 12h4l3-9 4 18 3-9h4"/>
          </svg>
          <span style={{ fontSize: '14px', letterSpacing: '0.1em', color: '#cbd5e1' }}>DATA_OS//BOOT</span>
        </div>

        <div style={{
          margin: '0 auto',
          marginBottom: '24px',
          textAlign: 'left',
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#64748b',
          minHeight: '140px',
          lineHeight: '1.6'
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{ opacity: 0, animation: `fadeIn 0.4s ease forwards`, animationDelay: `${i * 0.1}s` }}>
              <span style={{ color: '#34d399' }}>→</span> {line}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '280px',
          height: '4px',
          background: 'rgba(34, 211, 238, 0.15)',
          borderRadius: '4px',
          overflow: 'hidden',
          margin: '0 auto 16px'
        }}>
          <div style={{
            width: barFill + '%',
            height: '100%',
            background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
            boxShadow: '0 0 14px #22d3ee',
            transition: 'width 0.2s linear'
          }}></div>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.08em' }}>
          {Math.round(barFill)}%
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
