import React, { useState, useEffect, useRef } from 'react';

export default function PomodoroTimer({ onAlert }) {
  const onAlertRef = useRef(onAlert);
  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [sessions, setSessions] = useState(0);
  const totalTime = 25 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessions(prev => prev + 1);
      onAlertRef.current?.('🎉 Pomodoro session complete! Take a break.');
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="glass-premium text-center animate-pulse-slow" style={{
      padding: '1.5rem',
      borderRadius: '16px',
      border: '1.5px solid rgba(255, 0, 110, 0.25)',
      background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.08) 0%, rgba(12, 19, 34, 0.6) 100%)',
      boxShadow: '0 8px 32px rgba(255, 0, 110, 0.15)',
    }}>
      <div style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#94a3b8',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        🍅 Pomodoro Timer
      </div>

      {/* Circle progress */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        margin: '0 auto 1rem',
      }}>
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255, 0, 110, 0.2)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="url(#gradientPomodoro)"
            strokeWidth="8"
            strokeDasharray={`${(progress / 100) * (2 * Math.PI * 55)} ${2 * Math.PI * 55}`}
            style={{ transition: 'stroke-dasharray 0.3s' }}
          />
          <defs>
            <linearGradient id="gradientPomodoro" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#ff006e" />
              <stop offset="100%" stopColor="#c2185b" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ff006e',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 110, 0.4)',
            background: 'rgba(255, 0, 110, 0.15)',
            color: '#ff006e',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.3s',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 0, 110, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 0, 110, 0.15)';
          }}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 110, 0.2)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#ff006e';
            e.target.style.borderColor = 'rgba(255, 0, 110, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#94a3b8';
            e.target.style.borderColor = 'rgba(255, 0, 110, 0.2)';
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Sessions counter */}
      <div style={{
        fontSize: '12px',
        color: '#cbd5e1',
        borderTop: '1px solid rgba(255, 0, 110, 0.2)',
        paddingTop: '0.75rem'
      }}>
        <span style={{ color: '#ff006e', fontWeight: '700' }}>{sessions}</span> sessions completed
      </div>
    </div>
  );
}
