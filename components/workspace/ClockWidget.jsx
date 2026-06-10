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
    <div className="glass-premium text-center" style={{ padding: '1.5rem', borderRadius: '16px' }}>
      <div style={{
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '0.75rem'
      }}>
        Real-Time Clock
      </div>

      <div className="animated-gradient-text" style={{
        fontSize: '32px',
        fontWeight: '700',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: '1.2',
        marginBottom: '0.5rem',
        textShadow: '0 0 20px rgba(34, 211, 238, 0.25)'
      }}>
        {hours}:{minutes}:{seconds}
      </div>

      <div style={{
        fontSize: '12px',
        color: '#cbd5e1',
        fontFamily: "'Inter', sans-serif",
        marginBottom: '1rem',
        fontWeight: '500'
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
