import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const NAV_LINKS = [
  { href: '#about',    label: '01_about' },
  { href: '#skills',   label: '02_skills' },
  { href: '#projects', label: '03_pipelines' },
  { href: '#timeline', label: '04_timeline' },
  { href: '#resume',   label: '05_resume' },
  { href: '#sql',      label: '06_sql' },
  { href: '#contact',  label: '07_contact' },
];

function useActiveSection() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.25, rootMargin: '-80px 0px -40% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

export default function Navigation({ theme, onThemeToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const handleResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-40 transition-all duration-300"
      style={{
        backdropFilter: 'blur(16px)',
        background: scrolled ? 'rgba(6,8,15,0.85)' : 'rgba(6,8,15,0.6)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px origin-left"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2 font-mono text-xs md:text-sm group">
          <motion.span
            className="dot text-emerald-400 bg-emerald-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-slate-400 group-hover:text-slate-300 transition">node://</span>
          <span className="text-cyan-300 group-hover:text-cyan-200 transition">nigamjyoti</span>
          <span className="text-slate-600 hidden md:inline">/ data-modeler</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 font-mono text-xs">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = active === href.slice(1);
            return (
              <a
                key={href}
                href={href}
                className="relative px-3 py-2 transition-colors duration-200"
                style={{ color: isActive ? '#22d3ee' : '#94a3b8' }}
              >
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-px"
                    style={{ background: '#22d3ee' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onThemeToggle}
            aria-label="Toggle cyber theme"
            className="btn btn-violet !py-1.5 !px-3 !text-[11px] gap-1.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>◐</span>
            <span className="hidden md:inline">{theme === 'cyber' ? 'Default' : 'Cyber'}</span>
          </motion.button>

          {/* Download Resume — nav shortcut */}
          <motion.a
            href="#contact"
            className="hidden md:inline-flex btn btn-lime !py-1.5 !px-3 !text-[11px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download Resume"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Resume</span>
          </motion.a>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] rounded focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`block h-px w-5 bg-slate-300 transition-transform duration-300 ${menuOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 bg-slate-300 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 bg-slate-300 transition-transform duration-300 ${menuOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <motion.div
          className="md:hidden border-b border-white/5 px-4 pb-4"
          style={{ background: 'rgba(6,8,15,0.96)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex flex-col gap-1 font-mono text-xs pt-2">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={handleNavClick}
                className="px-3 py-2.5 rounded transition"
                style={{ color: active === href.slice(1) ? '#22d3ee' : '#94a3b8' }}
              >
                {label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={handleNavClick}
              className="px-3 py-2.5 rounded transition flex items-center gap-2 mt-1"
              style={{ color: '#34d399' }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download Resume
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
