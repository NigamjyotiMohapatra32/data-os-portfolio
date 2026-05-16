import React, { useState, useEffect } from 'react';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(17, 26, 46, 0.7), rgba(12, 19, 34, 0.5))',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '12px',
      padding: '1.25rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '0.75rem'
      }}>
        Real-Time Clock
      </div>

      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#22d3ee',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: '1.2',
        marginBottom: '0.5rem',
        textShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
      }}>
        {hours}:{minutes}:{seconds}
      </div>

      <div style={{
        fontSize: '12px',
        color: '#cbd5e1',
        fontFamily: "'Inter', sans-serif",
        marginBottom: '1rem'
      }}>
        {dateStr}
      </div>

      <div style={{
        fontSize: '10px',
        color: '#64748b',
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        IST (UTC+5:30)
      </div>
    </div>
  );
}
