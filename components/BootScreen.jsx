import React, { useEffect, useState, useCallback } from 'react';

export default function BootScreen({ onSkip }) {
  const [lines, setLines] = useState([]);
  const [barFill, setBarFill] = useState(0);

  const skip = useCallback(() => {
    if (onSkip) onSkip();
  }, [onSkip]);

  useEffect(() => {
    // Allow keyboard skip
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skip();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [skip]);

  useEffect(() => {
    const bootMessages = [
      'PIPELINE//BOOT v1.0',
      'Initializing core systems...',
      'Loading career.dat',
      'Compiling experience module...',
      'Mounting data models...',
      'Starting pipeline flow...',
      'System ready.',
    ];

    const timers = bootMessages.map((msg, i) =>
      setTimeout(() => setLines((prev) => [...prev, msg]), i * 300)
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      setBarFill(Math.min(100, progress));
      if (progress >= 100) clearInterval(interval);
    }, 150);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center font-mono text-sm md:text-base px-6"
      role="dialog"
      aria-label="Loading portfolio"
    >
      <div className="text-center">
        <div className="flex items-center gap-2 justify-center mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-300" aria-hidden="true">
            <path d="M3 12h4l3-9 4 18 3-9h4"/>
          </svg>
          <span className="text-slate-300 tracking-widest">PIPELINE//BOOT</span>
        </div>

        <div className="space-y-1.5 text-left max-w-md mx-auto mb-6" aria-live="polite">
          {lines.map((line, i) => (
            <div key={i} style={{ opacity: 0, animation: 'fadeLine 0.25s forwards' }}>
              <span className="text-cyan-300">›</span> {line}
            </div>
          ))}
        </div>

        <div style={{ width: '280px', height: '4px', background: 'rgba(34,211,238,0.15)', borderRadius: '4px', overflow: 'hidden', margin: '1.5rem auto 1.25rem' }}>
          <div style={{ width: barFill + '%', height: '100%', background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', transition: 'width 0.15s linear', boxShadow: '0 0 14px #22d3ee' }} />
        </div>

        <button
          onClick={skip}
          className="mt-2 text-xs text-slate-500 hover:text-cyan-300 transition tracking-wider font-mono cursor-pointer"
          aria-label="Skip loading screen"
        >
          [ press Esc or click to skip ]
        </button>
      </div>

      <style>{`
        @keyframes fadeLine {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
