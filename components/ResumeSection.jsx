import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

const RESUME_URL = import.meta.env.VITE_RESUME_URL || null;

const RESOURCES = [
  {
    id: 'resume',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    title: 'Resume / CV',
    desc: 'Data Modeler · SQL Developer · 5 years enterprise DWH experience across EY GDS, Circana, and TCS.',
    tag: 'PDF',
    tagColor: '#22d3ee',
    available: !!RESUME_URL,
    url: RESUME_URL,
    filename: 'Nigamjyoti_Mohapatra_Resume.pdf',
  },
];

function DownloadCard({ resource }) {
  const [downloading, setDownloading] = useState(false);
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (resource.id !== 'resume') return;
    getDoc(doc(db, 'meta', 'resumeDownloads'))
      .then((snap) => setCount(snap.exists() ? (snap.data().count ?? 0) : 0))
      .catch(() => {});
  }, [resource.id]);

  const handleDownload = async () => {
    if (downloading || !resource.available) return;
    setDownloading(true);

    if (resource.id === 'resume') {
      try {
        await setDoc(doc(db, 'meta', 'resumeDownloads'), { count: increment(1) }, { merge: true });
        setCount((c) => (c ?? 0) + 1);
      } catch {}
    }

    if (resource.url) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <motion.div
      className="glass rounded-2xl p-6 flex flex-col gap-4"
      style={{ borderColor: `${resource.tagColor}20` }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      whileHover={{ y: -4, borderColor: `${resource.tagColor}40` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${resource.tagColor}12`, color: resource.tagColor, border: `1px solid ${resource.tagColor}25` }}
        >
          {resource.icon}
        </div>
        <span
          className="font-mono text-[10px] px-2 py-1 rounded-full border"
          style={{ color: resource.tagColor, borderColor: `${resource.tagColor}40`, background: `${resource.tagColor}10` }}
        >
          {resource.tag}
        </span>
      </div>

      <div>
        <h3 className="font-display font-semibold text-slate-100 mb-1">{resource.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{resource.desc}</p>
      </div>

      {count !== null && count > 0 && (
        <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Downloaded by {count} visitor{count !== 1 ? 's' : ''}
        </div>
      )}

      <motion.button
        onClick={handleDownload}
        disabled={downloading || !resource.available}
        className="btn w-full justify-center text-sm"
        style={{
          color: resource.available ? resource.tagColor : '#475569',
          borderColor: resource.available ? `${resource.tagColor}40` : 'rgba(71,85,105,0.4)',
          background: resource.available ? `${resource.tagColor}08` : 'rgba(71,85,105,0.06)',
          cursor: resource.available ? 'pointer' : 'not-allowed',
        }}
        whileHover={resource.available && !downloading ? { scale: 1.02 } : {}}
        whileTap={resource.available && !downloading ? { scale: 0.98 } : {}}
      >
        {downloading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Downloading…
          </span>
        ) : resource.available ? (
          <span className="flex items-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download {resource.tag}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Contact Me to Request
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}

export default function ResumeSection() {
  return (
    <section id="resume" className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[05]</span>
            <span>DOWNLOADABLE_ASSETS</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Resume &amp; Resources</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-cyan-400/60 to-transparent" />
          <p className="mt-4 text-slate-400 text-sm max-w-xl">
            Download my professional resume or request project case studies and other documents.
          </p>
        </motion.header>

        {/* Quick download bar */}
        <motion.div
          className="glass rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderColor: 'rgba(34,211,238,0.2)', background: 'linear-gradient(135deg, rgba(34,211,238,0.04), transparent)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22d3ee" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-semibold text-slate-100 text-sm">Nigamjyoti Mohapatra — Resume</div>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">Data Modeler · SQL Developer · EY GDS · 5 years</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {RESUME_URL ? (
              <a
                href={RESUME_URL}
                download="Nigamjyoti_Mohapatra_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-cyan !text-xs"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download PDF
              </a>
            ) : (
              <a href="#contact" className="btn btn-cyan !text-xs">↗ Request Resume</a>
            )}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((r) => (
            <DownloadCard key={r.id} resource={r} />
          ))}

          {/* Placeholder cards for future resources */}
          {[
            { title: 'ERwin Model Samples', desc: 'Sample dimensional models and ER diagrams from insurance and retail domains.', tag: 'Soon', color: '#a78bfa' },
            { title: 'SQL Query Playbook', desc: 'Collection of advanced T-SQL patterns: CTEs, window functions, SCD Type 2 templates.', tag: 'Soon', color: '#34d399' },
          ].map((item) => (
            <motion.div
              key={item.title}
              className="glass rounded-2xl p-6 flex flex-col gap-4 opacity-60"
              style={{ borderColor: `${item.color}15`, borderStyle: 'dashed' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}10`, border: `1px dashed ${item.color}30` }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={item.color} strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-slate-300 text-sm">{item.title}</h3>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border" style={{ color: item.color, borderColor: `${item.color}30` }}>{item.tag}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <div className="btn !text-xs !cursor-not-allowed opacity-40 justify-center" style={{ color: item.color }}>Coming Soon</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
