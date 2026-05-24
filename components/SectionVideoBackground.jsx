import React, { useEffect, useRef, useState } from 'react';

/**
 * SectionVideoBackground
 * Implements lazy-loaded looping videos from high-speed public data-stream CDNs,
 * overlaying a dark glass mask, combined with a high-fidelity, hardware-accelerated
 * HTML5 Canvas particle/grid fallback styled to the section's custom accent color.
 */
export default function SectionVideoBackground({ 
  videoUrl, 
  fallbackType = 'cyan', // 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber'
  overlayOpacity = 0.90 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);

  // Accent colors mapping
  const colors = {
    cyan: { primary: '34, 211, 238', secondary: '167, 139, 250' },
    violet: { primary: '167, 139, 250', secondary: '244, 114, 182' },
    emerald: { primary: '52, 211, 153', secondary: '34, 211, 238' },
    rose: { primary: '244, 114, 182', secondary: '167, 139, 250' },
    amber: { primary: '251, 191, 36', secondary: '52, 211, 153' }
  };

  const themeColors = colors[fallbackType] || colors.cyan;

  // 1. Lazy load video using Intersection Observer
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Play/pause video when scrolling in/out of viewport
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !shouldRenderVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRenderVideo]);

  // 3. Fallback Canvas Animation System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let width = 0;
    let height = 0;
    const dpr = window.devicePixelRatio || 1;

    // Scale canvas for retina displays
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width * dpr;
      height = canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Particles array
    const particleCount = window.innerWidth < 768 ? 20 : 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (width / dpr),
      y: Math.random() * (height / dpr),
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.45 + 0.15
    }));

    // Grid lines setup
    const gridSpacing = 60;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width / dpr, height / dpr);

      // Draw subtle cybersecurity digital grid in background
      ctx.strokeStyle = `rgba(${themeColors.primary}, 0.022)`;
      ctx.lineWidth = 0.5;

      // Vertical grid lines
      for (let x = 0; x < width / dpr; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height / dpr);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < height / dpr; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width / dpr, y);
        ctx.stroke();
      }

      // Draw moving telemetry flow particles (visual data packets)
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce bounds
        if (p.x < 0 || p.x > width / dpr) p.vx *= -1;
        if (p.y < 0 || p.y > height / dpr) p.vy *= -1;

        // Draw particle node
        ctx.fillStyle = `rgba(${themeColors.primary}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect close particles with subtle data networks
        particles.forEach((other) => {
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const linkAlpha = (1 - dist / 110) * 0.08 * Math.min(p.alpha, other.alpha);
            ctx.strokeStyle = `rgba(${themeColors.primary}, ${linkAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      // Slowly draw flowing telemetry beam across bottom
      offset = (offset + 0.15) % (width / dpr);
      const grad = ctx.createLinearGradient(0, height / dpr - 2, width / dpr, height / dpr);
      grad.addColorStop(0, `rgba(${themeColors.primary}, 0)`);
      grad.addColorStop(Math.min(1, offset / (width / dpr)), `rgba(${themeColors.primary}, 0.04)`);
      grad.addColorStop(Math.min(1, (offset + 100) / (width / dpr)), `rgba(${themeColors.secondary}, 0.04)`);
      grad.addColorStop(1, `rgba(${themeColors.primary}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, height / dpr - 2, width / dpr, 2);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [fallbackType, themeColors]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
      {/* 1. Falling particles & Grid network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* 2. Looping Video Element (hidden until intersecting & fully loaded) */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-1000"
        style={{ opacity: videoLoaded ? 0.35 : 0 }}
      >
        {shouldRenderVideo && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            loop
            muted
            playsInline
            preload="none"
            onCanPlay={() => setVideoLoaded(true)}
            className="w-full h-full object-cover scale-[1.03]"
          />
        )}
      </div>

      {/* 3. Dark cyber glass overlap ensuring high text contrast */}
      <div 
        className="absolute inset-0 w-full h-full bg-slate-950 bg-radial transition-all duration-300"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}
