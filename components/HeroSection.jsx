import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useResumeUrl } from '../lib/useSiteConfig';
import SectionVideoBackground from './SectionVideoBackground';

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
    <section id="hero" className="relative min-h-screen flex items-center pt-20 pb-16 px-4 md:px-8 overflow-hidden">
      {/* Dynamic, lazy-loaded digital command grid data stream backdrop */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-grid-loop-31911-large.mp4"
        fallbackType="cyan"
        overlayOpacity={0.91}
      />

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

          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-mono text-xs text-cyan-400 mb-2.5 uppercase tracking-widest font-bold block"
            style={{ textShadow: '0 0 10px rgba(34,211,238,0.35)' }}
          >
            🚀 Enterprise Data Warehouse Architecture Reimagined
          </motion.div>

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
                <linearGradient id="bronzeGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="silverGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="cyanGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.8" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Diagrams group */}
              <g fontFamily="JetBrains Mono" fontSize="9" fill="#94a3b8">
                
                {/* 1. Ingress Boundary */}
                <g filter="url(#glow)">
                  <rect x="8" y="20" width="86" height="40" rx="6" fill="#0c1322" stroke="#60a5fa" strokeWidth="1"/>
                  <circle cx="16" cy="30" r="2" fill="#60a5fa"/>
                  <text x="23" y="32" fill="#60a5fa" fontSize="7" fontWeight="bold">SRC: STREAM</text>
                  <text x="14" y="48" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">Kafka Ingest</text>
                </g>

                <g filter="url(#glow)">
                  <rect x="8" y="74" width="86" height="40" rx="6" fill="#0c1322" stroke="#22d3ee" strokeWidth="1"/>
                  <circle cx="16" cy="84" r="2" fill="#22d3ee"/>
                  <text x="23" y="86" fill="#22d3ee" fontSize="7" fontWeight="bold">SRC: CDC</text>
                  <text x="14" y="102" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">OLTP_Log</text>
                </g>

                {/* 2. Medallion Bronze */}
                <g filter="url(#glow)">
                  <rect x="116" y="47" width="86" height="40" rx="6" fill="#0c1322" stroke="#b45309" strokeWidth="1.2"/>
                  <circle cx="124" cy="57" r="2" fill="#b45309"/>
                  <text x="131" y="59" fill="#b45309" fontSize="7" fontWeight="bold">BRONZE LAYER</text>
                  <text x="122" y="75" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">Delta Raw</text>
                </g>

                {/* 3. Medallion Silver */}
                <g filter="url(#glow)">
                  <rect x="224" y="47" width="86" height="40" rx="6" fill="#0c1322" stroke="#94a3b8" strokeWidth="1.2"/>
                  <circle cx="232" cy="57" r="2" fill="#94a3b8"/>
                  <text x="239" y="59" fill="#cbd5e1" fontSize="7" fontWeight="bold">SILVER LAYER</text>
                  <text x="230" y="75" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">Conformed</text>
                </g>

                {/* 4. Medallion Gold */}
                <g filter="url(#glow)">
                  <rect x="332" y="47" width="140" height="40" rx="6" fill="#0c1322" stroke="#fbbf24" strokeWidth="1.5"/>
                  <circle cx="340" cy="57" r="2" fill="#fbbf24"/>
                  <text x="347" y="59" fill="#fbbf24" fontSize="7" fontWeight="bold">GOLD LAYER (KIMBALL)</text>
                  <text x="338" y="75" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">dim_cust · fact_claims</text>
                </g>

                {/* 5. Serving API & BI */}
                <g filter="url(#glow)">
                  <rect x="116" y="160" width="150" height="40" rx="6" fill="#0c1322" stroke="#a78bfa" strokeWidth="1.2"/>
                  <circle cx="124" cy="170" r="2" fill="#a78bfa"/>
                  <text x="131" y="172" fill="#a78bfa" fontSize="7" fontWeight="bold">SERVING LAYER &amp; APIs</text>
                  <text x="122" y="188" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">GraphQL · FastAPI</text>
                </g>

                <g filter="url(#glow)">
                  <rect x="290" y="160" width="182" height="40" rx="6" fill="#0c1322" stroke="#f472b6" strokeWidth="1.2"/>
                  <circle cx="298" cy="170" r="2" fill="#f472b6"/>
                  <text x="305" y="172" fill="#f472b6" fontSize="7" fontWeight="bold">BI &amp; GENAI INSIGHTS</text>
                  <text x="296" y="188" fill="#e2e8f0" fontWeight="bold" fontSize="8.5">Power BI · Semantic Models</text>
                </g>

                {/* Performance stats row */}
                <g>
                  <rect x="8" y="160" width="86" height="40" rx="6" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="14" y="174" fill="#64748b" fontSize="7">ingest ok</text>
                  <text x="14" y="191" fill="#34d399" fontWeight="bold" fontSize="13">99.98%</text>
                </g>
                <g>
                  <rect x="8" y="210" width="86" height="40" rx="6" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="14" y="224" fill="#64748b" fontSize="7">latency</text>
                  <text x="14" y="241" fill="#22d3ee" fontWeight="bold" fontSize="13">140ms</text>
                </g>
                <g>
                  <rect x="116" y="220" width="356" height="74" rx="8" fill="#0c1322" stroke="#1f2a44"/>
                  <text x="128" y="238" fill="#64748b" fontSize="7.5" fontWeight="bold">DATA OPS / GOVERNANCE ENGINE</text>
                  <text x="128" y="258" fill="#cbd5e1" fontSize="8.5">✔ Data Contracts: ACTIVE</text>
                  <text x="128" y="272" fill="#cbd5e1" fontSize="8.5">✔ Lineage Traced · RBAC Encrypted · Observability online</text>
                </g>

              </g>

              {/* Connection flow lines */}
              <g fill="none" strokeWidth="1.2">
                <path className="flow-line" d="M94 40 C105 40 105 57 116 57" stroke="#60a5fa" opacity="0.6"/>
                <path className="flow-line" d="M94 94 C105 94 105 77 116 77" stroke="#22d3ee" opacity="0.6"/>
                <path className="flow-line" d="M202 67 L224 67" stroke="#b45309" opacity="0.7"/>
                <path className="flow-line" d="M310 67 L332 67" stroke="#94a3b8" opacity="0.7"/>
                <path className="flow-line" d="M402 87 L402 110 C402 135 240 135 240 160" stroke="#fbbf24" opacity="0.6"/>
                <path className="flow-line" d="M402 87 L402 110 C402 135 340 135 340 160" stroke="#fbbf24" opacity="0.6"/>
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
