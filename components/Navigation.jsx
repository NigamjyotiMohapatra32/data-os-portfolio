import React, { useState, useEffect } from 'react';

const NAV_LINKS = [
  { href: '#about', label: '01_about' },
  { href: '#skills', label: '02_skills' },
  { href: '#projects', label: '03_pipelines' },
  { href: '#timeline', label: '04_timeline' },
  { href: '#sql', label: '05_sql' },
  { href: '#contact', label: '06_contact' },
];

export default function Navigation({ theme, onThemeToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on Escape key or resize to desktop
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
    <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-ink/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">

        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2 font-mono text-xs md:text-sm">
          <span className="dot text-emerald-400 bg-emerald-400"></span>
          <span className="text-slate-400">node://</span>
          <span className="text-cyan-300">nigamjyoti</span>
          <span className="text-slate-600 hidden md:inline">/ data-engineer</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 font-mono text-xs">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="px-3 py-2 text-slate-400 hover:text-cyan-300 transition">
              {label}
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onThemeToggle}
            aria-label="Toggle cyber theme"
            className="btn btn-violet !py-1.5 !px-3 !text-[11px]"
          >
            <span>◐</span>
            <span className="hidden md:inline">{theme === 'cyber' ? 'default' : 'cyber'}</span>
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] rounded focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span
              className={`block h-px w-5 bg-slate-300 transition-transform duration-300 ${menuOpen ? 'translate-y-[6px] rotate-45' : ''}`}
            />
            <span
              className={`block h-px w-5 bg-slate-300 transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block h-px w-5 bg-slate-300 transition-transform duration-300 ${menuOpen ? '-translate-y-[6px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-ink/95 backdrop-blur-md border-b border-white/5 px-4 pb-4">
          <div className="flex flex-col gap-1 font-mono text-xs pt-2">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={handleNavClick}
                className="px-3 py-2.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded transition"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
