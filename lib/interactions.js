/**
 * Signature interaction hooks — brand motion language.
 *
 * useMagnetic(strength)  — element drifts toward the cursor while hovered.
 * useSpotlight()         — feeds --mx/--my custom props for the .spotlight
 *                          CSS treatment (cursor-following light).
 *
 * Both are no-ops when the user prefers reduced motion or on touch-only
 * devices, and both animate transform/custom-props only (no layout work).
 */
import { useRef, useEffect } from 'react';

function motionAllowed() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia('(hover: none)').matches) return false; // touch devices
  return true;
}

/**
 * Magnetic hover: the wrapped element translates a few px toward the
 * cursor, snapping back on leave. Apply the returned ref to a WRAPPER
 * element (not a framer-motion node — framer owns its own transform).
 */
export function useMagnetic(strength = 0.25, maxShift = 8) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;

    let raf = 0;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      const x = Math.max(-maxShift, Math.min(maxShift, dx));
      const y = Math.max(-maxShift, Math.min(maxShift, dy));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = 'translate3d(0, 0, 0)';
      setTimeout(() => { el.style.transition = ''; }, 450);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength, maxShift]);

  return ref;
}

/**
 * Spotlight: writes cursor position into --mx/--my so the .spotlight
 * CSS class can render a light that follows the pointer.
 */
export function useSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;

    let raf = 0;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${mx}%`);
        el.style.setProperty('--my', `${my}%`);
      });
    };

    el.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mousemove', onMove);
    };
  }, []);

  return ref;
}
