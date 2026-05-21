import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useResumeUrl } from '../lib/useSiteConfig';

const ROLES = [
  'Dimensional Data Modeller',
  'SQL Developer',
  'ERwin & ER/Studio Expert',
  'Data Warehouse Specialist',
  'Kimball Framework Expert',
];

function useTypewriter(items, typeSpeed = 70, deleteSpeed = 40, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = items[idx];
    let timeout;

    if (typing) {
      if (charIdx < current.length) {
        timeout = setTimeout(() => setCharIdx((c) => c + 1), typeSpeed);
      } else {
        timeout = setTimeout(() => setTyping(false), pause);
      }
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => setCharIdx((c) => c - 1), deleteSpeed);
      } else {
        setIdx((i) => (i + 1) % items.length);
        setTyping(true);
      }
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, typing, idx, items, typeSpeed, deleteSpeed, pause]);

  return display;
}

function useCountUp(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const steps = 40;
    const interval = Math.max(20, duration / steps);
    let step = 0;
    const id = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(step >= steps ? target : Math.floor(eased * target));
      if (step >= steps) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [start, target, duration]);
  return value;
}

const STATS = [
  { label: 'Years Experience', value: 5, suffix: 'y', color: '#22d3ee', decimal: false },
  { label: 'Data Models Built', value: 30, suffix: '+', color: '#34d399' },
  { label: 'Companies Served', value: 3, suffix: '', color: '#a78bfa' },
  { label: 'Perf Improvement', value: 35, suffix: '%', color: '#f472b6' },
];

const StatCard = React.memo(function StatCard({ stat, delay = 0 }) {
  const [show, setShow] = useState(false);
  const [counting, setCounting] = useState(false);
  const count = useCountUp(stat.value, 2000, counting);

  // Card fade-in: staggered by delay
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // Count-up: starts at 4s (auto-boot) or when portfolioBootDone event fires
  useEffect(() => {
    const start = () => setCounting(true);
    const t = setTimeout(start, 4000 + delay);
    window.addEventListener('portfolioBootDone', start, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('portfolioBootDone', start);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="glass rounded-xl p-4 text-center flex flex-col gap-1 relative overflow-hidden group cursor-default"
      style={{
        borderColor: `${stat.color}25`,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
      whileHover={{ scale: 1.06, borderColor: `${stat.color}60`, boxShadow: `0 8px 24px -8px ${stat.color}40` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${stat.color}12, transparent 70%)` }}
      />
      <div className="font-mono font-bold text-2xl relative z-10" style={{ color: stat.color }}>
        {count}{stat.suffix}
      </div>
      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider leading-tight relative z-10">{stat.label}</div>
    </motion.div>
  );
});

function useResumeDownloadCount() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    getDoc(doc(db, 'meta', 'resumeDownloads'))
      .then((snap) => { if (snap.exists()) setCount(snap.data().count ?? 0); else setCount(0); })
      .catch(() => setCount(null));
  }, []);
  return count;
}

export default function HeroSection({ onLaunchDataOS }) {
  const role = useTypewriter(ROLES);
  const statsRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const downloadCount = useResumeDownloadCount();
  const { url: RESUME_URL } = useResumeUrl();

  const handleResumeDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Increment download counter in Firestore
      const ref = doc(db, 'meta', 'resumeDownloads');
      await setDoc(ref, { count: increment(1) }, { merge: true });
    } catch {
      // Non-fatal
    }
    const url = RESUME_URL || '#contact';
    if (url && url !== '#contact') {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Nigamjyoti_Mohapatra_Resume.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.location.href = '#contact';
    }
    setTimeout(() => setDownloading(false), 2000);
  }, [downloading]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 pb-16 px-4 md:px-8">
      {/* Radial glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div style={{ position:'absolute', top:'10%', left:'5%', width:'500px', height:'500px',
          background:'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'15%', right:'5%', width:'400px', height:'400px',
          background:'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', borderRadius:'50%' }} />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center relative z-10">

        {/* ── Left Column ─────────────────────────────────── */}
        <div className="lg:col-span-7">

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 font-mono text-xs text-slate-500 mb-5
                          border border-white/5 rounded-full px-3 py-1.5 bg-white/[0.02]">
            <span className="dot text-emerald-400 bg-emerald-400" />
            <span>STATUS:</span>
            <span className="text-emerald-400">PIPELINE_ACTIVE</span>
            <span className="text-slate-700">·</span>
            <span>UPTIME:</span>
            <span className="text-cyan-300">5y</span>
          </div>

          {/* Name */}
          <h1 className="font-display font-bold leading-[0.95] tracking-tight text-5xl md:text-7xl lg:text-[5.5rem]">
            <span className="block text-slate-100">Nigamjyoti</span>
            <span className="block grad-text">Mohapatra</span>
          </h1>

          {/* Typewriter role */}
          <div className="mt-5 h-8 flex items-center gap-2 font-mono text-base md:text-lg">
            <span className="text-cyan-300 text-sm">//</span>
            <span className="text-slate-200">{role}</span>
            <span className="inline-block w-0.5 h-5 bg-cyan-300 animate-[blink_1s_step-end_infinite]" />
          </div>

          {/* Bio */}
          <p className="mt-5 text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
            Translating complex business requirements into clean, scalable
            <span className="text-slate-200"> dimensional models</span> — from conceptual ERDs
            through production-grade physical schemas. I design
            <span className="text-slate-200"> star &amp; snowflake schemas</span>, implement
            <span className="text-slate-200"> SCD Type 1/2/3</span> strategies, and optimise
            <span className="text-slate-200"> T-SQL workloads</span> that move Power BI
            dashboards up to 35% faster.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.a
              href="#projects"
              className="btn btn-cyan"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              ▶ explore_pipelines()
            </motion.a>
            <motion.a
              href="#contact"
              className="btn btn-lime"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              ↗ open_connection()
            </motion.a>
            <motion.button
              onClick={handleResumeDownload}
              disabled={downloading}
              className="btn btn-violet"
              title={RESUME_URL ? 'Download Resume PDF' : 'Resume coming soon — contact me'}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Downloading…
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download Resume
                  {downloadCount !== null && downloadCount > 0 && (
                    <span className="text-[10px] font-mono opacity-60 ml-1">({downloadCount})</span>
                  )}
                </>
              )}
            </motion.button>
            <motion.button
              onClick={onLaunchDataOS}
              className="btn"
              style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.06)' }}
              title="Launch interactive Data OS workspace"
              whileHover={{ scale: 1.04, boxShadow: '0 0 22px -6px rgba(251,191,36,0.7)' }}
              whileTap={{ scale: 0.97 }}
            >
              ⚡ Launch Data OS
            </motion.button>
          </div>

          {/* Skill chips */}
          <div className="mt-8 flex flex-wrap gap-2 max-w-2xl">
            {['Star Schema','Snowflake Schema','SCD Type 1/2/3','T-SQL','ERwin','ER/Studio',
              'Power BI','SQL Server','Kimball','Conformed Dimensions','Source-to-Target Mapping','Data Dictionary'].map((s, i) => (
              <span key={i} className={`chip ${['chip-cyan','chip-lime','chip-violet','chip-rose'][i % 4]}`}>{s}</span>
            ))}
          </div>

          {/* Stats row */}
          <div ref={statsRef} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <StatCard key={s.label} stat={s} delay={i * 120} />
            ))}
          </div>
        </div>

        {/* ── Right Column — DAG Diagram ───────────────────── */}
        <div className="lg:col-span-5">
          <div className="glass rounded-2xl p-5 relative overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                <span className="traffic r" /><span className="traffic y" /><span className="traffic g" />
                <span className="ml-2">~/dag/career_pipeline.py</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                running
              </span>
            </div>

            <svg viewBox="0 0 480 340" className="w-full h-auto">
              <defs>
                <linearGradient id="lg1" x1="0" x2="1">
                  <stop offset="0" stopColor="#22d3ee"/>
                  <stop offset="1" stopColor="#a78bfa"/>
                </linearGradient>
                <linearGradient id="lg2" x1="0" x2="1">
                  <stop offset="0" stopColor="#34d399"/>
                  <stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* ── Row 1: Sources ── */}
              <g fontFamily="JetBrains Mono" fontSize="9.5" fill="#cbd5e1">

                {/* OLTP Source */}
                <g filter="url(#glow)">
                  <rect x="8" y="20" width="100" height="46" rx="8" fill="#0c1322" stroke="#22d3ee" strokeWidth="1.2"/>
                  <circle cx="18" cy="30" r="2.5" fill="#22d3ee"/>
                  <text x="26" y="33" fill="#22d3ee" fontSize="8">SOURCE</text>
                  <text x="14" y="50" fill="#e2e8f0" fontWeight="700" fontSize="10">OLTP_DB</text>
                  <text x="14" y="62" fill="#64748b" fontSize="8">SQL Server</text>
                </g>

                {/* API Source */}
                <g filter="url(#glow)">
                  <rect x="8" y="82" width="100" height="46" rx="8" fill="#0c1322" stroke="#fbbf24" strokeWidth="1.2"/>
                  <circle cx="18" cy="92" r="2.5" fill="#fbbf24"/>
                  <text x="26" y="95" fill="#fbbf24" fontSize="8">SOURCE</text>
                  <text x="14" y="112" fill="#e2e8f0" fontWeight="700" fontSize="10">REST_API</text>
                  <text x="14" y="124" fill="#64748b" fontSize="8">Azure Blob</text>
                </g>

                {/* ── ADF Pipeline box ── */}
                <g filter="url(#glow)">
                  <rect x="152" y="30" width="120" height="82" rx="10" fill="#0c1322" stroke="#34d399" strokeWidth="1.5"/>
                  <circle cx="163" cy="42" r="3" fill="#34d399"/>
                  <text x="172" y="46" fill="#34d399" fontSize="8">ADF PIPELINE</text>
                  <text x="162" y="66" fill="#e2e8f0" fontWeight="700" fontSize="10">transform()</text>
                  <text x="162" y="80" fill="#64748b" fontSize="8">SCD Type 2</text>
                  <text x="162" y="92" fill="#64748b" fontSize="8">Data Cleanse</text>
                  <text x="162" y="104" fill="#64748b" fontSize="8">Surrogate Keys</text>
                </g>

                {/* ── Dim Layer ── */}
                <g filter="url(#glow)">
                  <rect x="330" y="20" width="110" height="46" rx="8" fill="#0c1322" stroke="#a78bfa" strokeWidth="1.2"/>
                  <circle cx="340" cy="30" r="2.5" fill="#a78bfa"/>
                  <text x="348" y="33" fill="#a78bfa" fontSize="8">DIM LAYER</text>
                  <text x="336" y="52" fill="#e2e8f0" fontWeight="700" fontSize="10">dim_customer</text>
                  <text x="336" y="63" fill="#64748b" fontSize="8">dim_product</text>
                </g>

                {/* ── Fact Layer ── */}
                <g filter="url(#glow)">
                  <rect x="330" y="82" width="110" height="46" rx="8" fill="#0c1322" stroke="#f472b6" strokeWidth="1.2"/>
                  <circle cx="340" cy="92" r="2.5" fill="#f472b6"/>
                  <text x="348" y="95" fill="#f472b6" fontSize="8">FACT LAYER</text>
                  <text x="336" y="114" fill="#e2e8f0" fontWeight="700" fontSize="10">fact_sales</text>
                  <text x="336" y="125" fill="#64748b" fontSize="8">fact_inventory</text>
                </g>

                {/* ── OLAP / Power BI ── */}
                <g filter="url(#glow)">
                  <rect x="152" y="168" width="176" height="46" rx="8" fill="#0c1322" stroke="#22d3ee" strokeWidth="1.2"/>
                  <circle cx="163" cy="178" r="2.5" fill="#22d3ee"/>
                  <text x="172" y="181" fill="#22d3ee" fontSize="8">OLAP CUBE / POWER BI</text>
                  <text x="162" y="200" fill="#e2e8f0" fontWeight="700" fontSize="10">Star Schema · Aggregations</text>
                  <text x="162" y="212" fill="#64748b" fontSize="8">KPIs · Dashboards</text>
                </g>

                {/* ── Metrics row ── */}
                <g>
                  <rect x="8" y="176" width="128" height="46" rx="8" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="18" y="192" fill="#94a3b8" fontSize="8">throughput / 30d</text>
                  <polyline points="18,215 38,208 58,212 80,200 102,206 128,190"
                    fill="none" stroke="#22d3ee" strokeWidth="1.8"/>
                  <text x="18" y="225" fill="#22d3ee" fontSize="8">↑ 38%</text>
                </g>
                <g>
                  <rect x="8" y="234" width="60" height="46" rx="8" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="14" y="250" fill="#94a3b8" fontSize="7.5">SCD2 hits</text>
                  <text x="14" y="268" fill="#34d399" fontWeight="700" fontSize="13">1.2M</text>
                </g>
                <g>
                  <rect x="78" y="234" width="60" height="46" rx="8" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="84" y="250" fill="#94a3b8" fontSize="7.5">models</text>
                  <text x="84" y="268" fill="#a78bfa" fontWeight="700" fontSize="13">30+</text>
                </g>
                <g>
                  <rect x="346" y="168" width="94" height="112" rx="8" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="356" y="186" fill="#94a3b8" fontSize="8">jobs ok</text>
                  <text x="356" y="218" fill="#34d399" fontWeight="700" fontSize="22">99.4%</text>
                  <circle cx="428" cy="182" r="4" fill="#34d399"/>
                  <text x="356" y="244" fill="#94a3b8" fontSize="7.5">avg latency</text>
                  <text x="356" y="260" fill="#22d3ee" fontWeight="700" fontSize="12">142ms</text>
                  <text x="356" y="272" fill="#94a3b8" fontSize="7.5">p99</text>
                </g>
              </g>

              {/* ── Flow lines ── */}
              <g fill="none" strokeWidth="1.5">
                <path className="flow-line" d="M108 43 C130 43 130 71 152 71" stroke="url(#lg2)"/>
                <path className="flow-line" d="M108 105 C130 105 130 81 152 81" stroke="url(#lg2)"/>
                <path className="flow-line" d="M272 48 C300 48 308 43 330 43" stroke="url(#lg1)"/>
                <path className="flow-line" d="M272 80 C300 80 308 105 330 105" stroke="url(#lg1)"/>
                <path className="flow-line" d="M385 128 C385 148 295 158 328 191" stroke="#a78bfa" opacity="0.6"/>
                <path className="flow-line" d="M385 128 L385 148 L330 191" stroke="#f472b6" opacity="0.6"/>
              </g>
            </svg>
          </div>

          {/* Tech badge strip */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {['ERwin','ER/Studio','T-SQL','Star Schema','Kimball','SQL Server','Power BI'].map((t, i) => (
              <span key={i} style={{
                fontSize:'10px', fontFamily:"'JetBrains Mono',monospace",
                padding:'3px 8px', borderRadius:'4px',
                border:`1px solid rgba(34,211,238,${0.15 + (i % 3) * 0.08})`,
                color:'#94a3b8', background:'rgba(34,211,238,0.04)'
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a href="#about"
         className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 hover:text-cyan-300
                    font-mono text-[11px] flex flex-col items-center gap-1 transition">
        <span>scroll</span>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="12" height="20" rx="6"/>
          <line x1="7" y1="6" x2="7" y2="10" strokeLinecap="round"
                style={{ animation:'scrollDot 1.4s ease-in-out infinite' }}/>
        </svg>
      </a>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes scrollDot {
          0%   { transform: translateY(0);   opacity: 1; }
          100% { transform: translateY(4px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
