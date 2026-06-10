import React, { useEffect, useRef } from 'react';

/**
 * SchemaTrail — signature cursor effect.
 *
 * As the cursor travels, it drops tiny "entity" nodes and links them with
 * relationship lines drawn in ER crow's-foot notation — the visitor sketches
 * a living ER diagram just by moving the mouse. Segments fade after ~2s.
 *
 * Disabled on touch devices and under prefers-reduced-motion.
 * Canvas overlay, transform-free, single rAF loop, zero dependencies.
 */
const FADE_MS = 2200;
const MIN_DIST = 90;
const MAX_POINTS = 12;
const CYAN = '34, 211, 238';
const VIOLET = '167, 139, 250';

export default function SchemaTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const points = [];
    let raf = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      const last = points[points.length - 1];
      const dx = last ? e.clientX - last.x : Infinity;
      const dy = last ? e.clientY - last.y : Infinity;
      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) return;
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (points.length > MAX_POINTS) points.shift();
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const drawCrowsFoot = (x, y, angle, alpha) => {
      // "Many" cardinality mark: three prongs fanning back from the endpoint
      ctx.strokeStyle = `rgba(${VIOLET}, ${alpha})`;
      for (const spread of [-0.38, 0, 0.38]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(angle + spread) * 9, y - Math.sin(angle + spread) * 9);
        ctx.stroke();
      }
    };

    const drawOneTick = (x, y, angle, alpha) => {
      // "One" cardinality mark: short perpendicular tick near the origin
      const px = Math.cos(angle + Math.PI / 2) * 5;
      const py = Math.sin(angle + Math.PI / 2) * 5;
      ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x - px, y - py);
      ctx.lineTo(x + px, y + py);
      ctx.stroke();
    };

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      while (points.length && now - points[0].t > FADE_MS) points.shift();

      ctx.lineWidth = 1;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const age = now - b.t;
        const alpha = Math.max(0, (1 - age / FADE_MS)) * 0.28;
        if (alpha <= 0.01) continue;

        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const ax = a.x + Math.cos(angle) * 14;
        const ay = a.y + Math.sin(angle) * 14;
        const bx = b.x - Math.cos(angle) * 14;
        const by = b.y - Math.sin(angle) * 14;

        // Relationship line
        ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // Cardinality: one ──||──────<── many
        drawOneTick(ax + Math.cos(angle) * 6, ay + Math.sin(angle) * 6, angle, alpha);
        drawCrowsFoot(bx, by, angle, alpha);

        // Entity nodes: tiny rounded rects at each point
        ctx.strokeStyle = `rgba(${CYAN}, ${alpha * 1.4})`;
        ctx.strokeRect(b.x - 5, b.y - 3.5, 10, 7);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
}
