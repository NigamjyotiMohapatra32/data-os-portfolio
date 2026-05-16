import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  { text: '> IDENTITY VERIFIED',           delay: 0,    color: '#00ff9d' },
  { text: `> Welcome, Nigamjyoti`,         delay: 700,  color: '#00e5ff' },
  { text: '> Initializing Data OS...',     delay: 1500, color: '#c084fc' },
  { text: '> Loading Intelligence Modules...', delay: 2400, color: '#00e5ff' },
  { text: '> Mounting Data Models...',     delay: 3200, color: '#c084fc' },
  { text: '> Connecting to Data Fabric...', delay: 4000, color: '#00e5ff' },
  { text: '> ACCESS GRANTED',              delay: 4900, color: '#00ff9d' },
];

const PROGRESS_STEPS = [
  { label: 'Auth Layer',       pct: 20,  time: 500  },
  { label: 'Core Modules',     pct: 42,  time: 1600 },
  { label: 'Data Connectors',  pct: 65,  time: 2800 },
  { label: 'Intelligence Grid',pct: 83,  time: 3900 },
  { label: 'Full Access',      pct: 100, time: 4800 },
];

export default function WelcomeSequence({ user, onDone }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress, setProgress]         = useState(0);
  const [progressLabel, setProgressLabel] = useState('Authenticating...');
  const [glitch, setGlitch]             = useState(false);
  const timers = useRef([]);

  // Show terminal lines one by one
  useEffect(() => {
    MESSAGES.forEach(({ text, delay, color }) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, { text, color }]);
      }, delay);
      timers.current.push(t);
    });

    // Progress bar steps
    PROGRESS_STEPS.forEach(({ pct, label, time }) => {
      const t = setTimeout(() => {
        setProgress(pct);
        setProgressLabel(label);
      }, time);
      timers.current.push(t);
    });

    // Glitch flash before redirect
    const g = setTimeout(() => setGlitch(true), 5200);
    timers.current.push(g);

    // Redirect to workspace
    const done = setTimeout(() => onDone(), 5800);
    timers.current.push(done);

    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#06080f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        overflow: 'hidden',
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.015) 2px, rgba(0,229,255,0.015) 4px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Glitch flash */}
      {glitch && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,255,157,0.08)',
            animation: 'welcomeFlash 0.3s ease-out forwards',
            zIndex: 2,
          }}
        />
      )}

      <style>{`
        @keyframes welcomeFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes termFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 8px #00e5ff; }
          50%       { box-shadow: 0 0 20px #00e5ff, 0 0 40px #00e5ff; }
        }
        @keyframes hexSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Rotating hex logo */}
      <div style={{ position: 'relative', marginBottom: '2rem', zIndex: 10 }}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ animation: 'hexSpin 6s linear infinite' }}
        >
          <polygon
            points="40,4 74,22 74,58 40,76 6,58 6,22"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <polygon
            points="40,12 66,26 66,54 40,68 14,54 14,26"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#00e5ff',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          D
        </div>
      </div>

      {/* Terminal card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          margin: '0 1rem',
          background: 'rgba(0,15,30,0.9)',
          border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: '12px',
          padding: '1.5rem',
          zIndex: 10,
          boxShadow: '0 0 40px rgba(0,229,255,0.1), inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(0,229,255,0.12)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'rgba(0,229,255,0.5)', letterSpacing: '0.1em' }}>
            DATA-OS :: BOOT SEQUENCE
          </span>
        </div>

        {/* Terminal lines */}
        <div style={{ minHeight: '180px' }}>
          {visibleLines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.color,
                fontSize: '0.85rem',
                lineHeight: '1.8',
                animation: 'termFadeIn 0.3s ease-out both',
                textShadow: `0 0 8px ${line.color}60`,
                fontWeight: line.text.includes('GRANTED') || line.text.includes('VERIFIED') ? 700 : 400,
                letterSpacing: '0.04em',
              }}
            >
              {line.text}
              {/* Blinking cursor on last line */}
              {i === visibleLines.length - 1 && (
                <span style={{ animation: 'blinkCursor 0.8s step-end infinite', marginLeft: 2 }}>█</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.4rem',
              fontSize: '0.7rem',
              color: 'rgba(0,229,255,0.5)',
              letterSpacing: '0.08em',
            }}
          >
            <span>LOADING :: {progressLabel.toUpperCase()}</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              height: '4px',
              background: 'rgba(0,229,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00e5ff, #c084fc)',
                borderRadius: '2px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'progressGlow 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* System info strip */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          fontSize: '0.65rem',
          color: 'rgba(0,229,255,0.25)',
          letterSpacing: '0.1em',
          zIndex: 10,
        }}
      >
        <span>USER :: {user || 'NIGAMJYOTI'}</span>
        <span>NODE :: DATA-OS-v2.0</span>
        <span>STATUS :: AUTHORIZED</span>
      </div>
    </div>
  );
}
