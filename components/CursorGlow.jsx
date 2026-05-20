import React, { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    // Only on non-touch desktop
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const dx = pos.current.x - current.current.x;
      const dy = pos.current.y - current.current.y;
      current.current.x += dx * 0.1;
      current.current.y += dy * 0.1;
      glow.style.transform = `translate(${current.current.x - 200}px, ${current.current.y - 200}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, rgba(167,139,250,0.04) 40%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}
