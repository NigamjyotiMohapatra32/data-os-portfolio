import React, { useEffect, useRef } from 'react';

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // Fewer particles on mobile for performance
    const N = window.innerWidth < 768 ? 25 : 50;
    let W = 0;
    let H = 0;
    let pts = [];
    let rafId = null;

    function resize() {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    }

    function init() {
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3 * dpr,
        vy: (Math.random() - 0.5) * 0.3 * dpr,
        r: Math.random() * 1.4 + 0.4,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const maxDist = 150 * dpr;
      const maxDist2 = maxDist * maxDist;

      for (let i = 0; i < N; i++) {
        const a = pts[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;

        for (let j = i + 1; j < N; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist2) {
            const op = 1 - Math.sqrt(d2) / maxDist;
            ctx.strokeStyle = `rgba(34,211,238,${op * 0.18})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(34,211,238,0.55)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    let resizeTimer = null;
    function handleResize() {
      // Debounce resize to avoid thrashing
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        init();
      }, 150);
    }

    resize();
    init();
    draw();

    window.addEventListener('resize', handleResize);

    // Cleanup: cancel animation loop and remove listener on unmount
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
