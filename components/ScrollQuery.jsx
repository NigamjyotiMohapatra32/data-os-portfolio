import React, { useEffect, useState, useRef } from 'react';

/**
 * ScrollQuery — signature scroll indicator.
 *
 * Reads page scroll as a running SQL query: sections are rows being
 * fetched. Appears after the first scroll, completes with a result
 * summary at the bottom. Desktop only, purely decorative (aria-hidden).
 */
export default function ScrollQuery() {
  const [pct, setPct] = useState(0);
  const [sections, setSections] = useState({ seen: 0, total: 0 });
  const [visible, setVisible] = useState(false);
  const startRef = useRef(null);
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    const sectionEls = Array.from(document.querySelectorAll('section[id]'));
    let raf = 0;

    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
      const mid = window.scrollY + window.innerHeight * 0.6;
      const seen = sectionEls.filter((el) => el.offsetTop < mid).length;

      setPct(p);
      setSections({ seen, total: sectionEls.length });
      setVisible(window.scrollY > 160);

      if (window.scrollY > 160 && startRef.current === null) {
        startRef.current = performance.now();
      }
      if (p >= 99 && startRef.current !== null) {
        setElapsed(((performance.now() - startRef.current) / 1000).toFixed(2));
      } else {
        setElapsed(null);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="scroll-query hidden lg:block"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="text-slate-500">
        <span className="text-violet-400">&gt;</span> SELECT * FROM <span className="text-cyan-300">portfolio</span>;
      </div>
      {elapsed ? (
        <div className="text-emerald-400">
          ✓ {sections.total} rows in set ({elapsed} sec)
        </div>
      ) : (
        <div className="text-slate-400">
          <span className="text-cyan-300">{sections.seen}</span>/{sections.total} rows
          <span className="scroll-query-bar">
            <span style={{ width: `${pct}%` }} />
          </span>
          {pct}%
        </div>
      )}
    </div>
  );
}
