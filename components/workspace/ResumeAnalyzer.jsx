import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeResume, checkHealth } from '../../lib/pythonApi';

// ── helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  modeling: { label: 'Data Modeling',  color: '#22d3ee', icon: '🗂' },
  sql:      { label: 'SQL & Databases', color: '#34d399', icon: '🛢' },
  etl:      { label: 'ETL / Pipelines', color: '#a78bfa', icon: '⚙' },
  cloud:    { label: 'Cloud Platforms', color: '#60a5fa', icon: '☁' },
  bi:       { label: 'BI & Reporting',  color: '#f472b6', icon: '📊' },
  soft:     { label: 'Soft Skills',     color: '#fbbf24', icon: '🤝' },
};

function scoreColor(s) {
  if (s >= 75) return '#34d399';
  if (s >= 50) return '#fbbf24';
  return '#f472b6';
}

function ScoreRing({ score, size = 100 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="font-bold leading-none"
          style={{ fontSize: size * 0.22, color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {score}
        </motion.div>
        <div className="font-mono" style={{ fontSize: size * 0.1, color: '#64748b', marginTop: 2 }}>ATS</div>
      </div>
    </div>
  );
}

function SkillPill({ label }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className="inline-block font-mono text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee' }}>
      {label}
    </motion.span>
  );
}

function CategoryBar({ cat, skills, color }) {
  const meta = CATEGORY_META[cat] || { label: cat, color: '#94a3b8', icon: '•' };
  const pct = Math.min(100, Math.round((skills.length / 8) * 100));

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 13 }}>{meta.icon}</span>
          <span className="font-mono text-[11px] text-slate-300">{meta.label}</span>
        </div>
        <span className="font-mono text-[10px]" style={{ color: meta.color }}>{skills.length} skills</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {skills.slice(0, 6).map((s) => <SkillPill key={s} label={s} />)}
          {skills.length > 6 && (
            <span className="font-mono text-[10px] text-slate-500">+{skills.length - 6} more</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function DropArea({ onFile, dragging, setDragging }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{
        borderColor: dragging ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.08)',
        background: dragging ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: dragging ? '0 0 40px rgba(167,139,250,0.15)' : '0 0 0 transparent',
      }}
      transition={{ duration: 0.2 }}
      className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer select-none"
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <motion.div animate={{ scale: dragging ? 1.2 : 1 }} className="text-5xl mb-3">
        {dragging ? '📥' : '📄'}
      </motion.div>
      <div className="font-display font-semibold text-slate-200 text-base mb-1">
        Drop your resume here
      </div>
      <div className="font-mono text-xs text-slate-500 mb-3">or click to browse</div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px]"
        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        PDF · DOCX · DOC — max 10 MB
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResumeAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState(null); // null | 'ok' | 'down'

  const checkApi = useCallback(async () => {
    try {
      await checkHealth();
      setApiStatus('ok');
    } catch {
      setApiStatus('down');
    }
  }, []);

  React.useEffect(() => { checkApi(); }, [checkApi]);

  const handleFile = (f) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|docx|doc)$/i)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large (max 10 MB).');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await analyzeResume(file, jobDesc);
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Is the Python API running?');
      } else {
        setError(err.message || 'Analysis failed. Check the Python API is deployed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); setJobDesc(''); };

  const panelBg = { background: 'rgba(12,19,34,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🎯</span>
            <h2 className="font-display font-bold text-slate-100 text-lg">Resume Analyzer</h2>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa' }}>
              Python · FastAPI
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-500">ATS scoring · skill gap analysis · job match</p>
        </div>

        {/* API status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: apiStatus === 'ok' ? 'rgba(52,211,153,0.08)' : apiStatus === 'down' ? 'rgba(244,114,182,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${apiStatus === 'ok' ? 'rgba(52,211,153,0.25)' : apiStatus === 'down' ? 'rgba(244,114,182,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: apiStatus === 'ok' ? '#34d399' : apiStatus === 'down' ? '#f472b6' : '#64748b' }} />
          <span className="font-mono text-[10px]" style={{ color: apiStatus === 'ok' ? '#34d399' : apiStatus === 'down' ? '#f472b6' : '#64748b' }}>
            {apiStatus === 'ok' ? 'API Online' : apiStatus === 'down' ? 'API Offline' : 'Checking…'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(167,139,250,0.15) transparent' }}>

        {/* API offline banner */}
        {apiStatus === 'down' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div className="font-mono text-xs text-amber-400 font-semibold">⚠ Python API not reachable</div>
            <p className="font-mono text-[11px] text-slate-400">
              Deploy the FastAPI service to Railway or Render, then set <code className="text-cyan-400">VITE_PYTHON_API_URL</code> in Netlify env vars.
            </p>
            <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
              <div>1. <code className="text-slate-300">cd backend/python</code></div>
              <div>2. Push to GitHub → connect Railway → auto-deploys</div>
              <div>3. Set <code className="text-cyan-400">VITE_PYTHON_API_URL=https://your-app.railway.app</code></div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Drop zone */}
              <DropArea onFile={handleFile} dragging={dragging} setDragging={setDragging} />

              {/* Selected file */}
              {file && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate font-medium">{file.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-slate-500 hover:text-slate-300 text-lg transition">×</button>
                </motion.div>
              )}

              {/* Job description */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Job Description <span className="text-slate-600">(optional — enables match scoring)</span>
                </label>
                <textarea
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Paste the job description here to get a match score against your resume…"
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-600 resize-none outline-none transition-all"
                  style={{ background: 'rgba(8,12,22,0.7)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: jobDesc ? '0 0 0 2px rgba(167,139,250,0.15)' : 'none' }}
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-xs"
                  style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.25)', color: '#f472b6' }}>
                  <span>⚠</span> {error}
                </motion.div>
              )}

              {/* Analyze button */}
              <motion.button
                onClick={handleAnalyze}
                disabled={!file || loading || apiStatus === 'down'}
                whileHover={file && !loading ? { scale: 1.01, boxShadow: '0 0 30px rgba(167,139,250,0.3)' } : {}}
                whileTap={file && !loading ? { scale: 0.98 } : {}}
                className="relative w-full py-3.5 rounded-2xl font-mono text-sm font-semibold overflow-hidden"
                style={{
                  background: file && apiStatus === 'ok' ? 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(34,211,238,0.12))' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${file && apiStatus === 'ok' ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: file && apiStatus === 'ok' ? '#a78bfa' : '#334155',
                  cursor: file && !loading && apiStatus === 'ok' ? 'pointer' : 'not-allowed',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 rounded-full"
                      style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: '#a78bfa' }} />
                    Analysing resume…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🎯 Analyse Resume
                  </span>
                )}
              </motion.button>
            </motion.div>
          ) : (
            /* ── Results ──────────────────────────────────────────────────── */
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Score header */}
              <div className="rounded-2xl p-5 flex items-center gap-6"
                style={{ background: `linear-gradient(135deg, ${scoreColor(result.ats_score)}10, transparent)`, border: `1px solid ${scoreColor(result.ats_score)}25` }}>
                <ScoreRing score={result.ats_score} size={90} />
                <div className="flex-1">
                  <div className="font-display font-bold text-lg text-slate-100 mb-1">
                    {result.ats_score >= 75 ? 'Strong Resume' : result.ats_score >= 50 ? 'Good Foundation' : 'Needs Work'}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 space-y-0.5">
                    <div><span className="text-slate-500">Skills found:</span> <span style={{ color: scoreColor(result.ats_score) }}>{result.total_skills_found}</span></div>
                    {result.years_experience > 0 && (
                      <div><span className="text-slate-500">Experience:</span> <span className="text-cyan-400">{result.years_experience}+ years</span></div>
                    )}
                    <div><span className="text-slate-500">File:</span> <span className="text-slate-300">{result.filename}</span></div>
                  </div>
                </div>
                <button onClick={reset}
                  className="font-mono text-[10px] px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                  ↺ New
                </button>
              </div>

              {/* Job match */}
              {result.job_match && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-sm text-slate-200">📋 Job Match Score</span>
                    <span className="font-bold text-xl" style={{ color: scoreColor(result.job_match.score) }}>{result.job_match.score}%</span>
                  </div>
                  {result.job_match.missing.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Missing keywords</div>
                      <div className="flex flex-wrap gap-1">
                        {result.job_match.missing.map((s) => (
                          <span key={s} className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)', color: '#f472b6' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Skills by category */}
              <div className="rounded-2xl p-5 space-y-4" style={panelBg}>
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">Skills Detected</div>
                {Object.entries(result.skills_matched).map(([cat, skills], i) => (
                  <motion.div key={cat} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <CategoryBar cat={cat} skills={skills} />
                  </motion.div>
                ))}
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="rounded-2xl p-5 space-y-2.5" style={panelBg}>
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">💡 Improvement Suggestions</div>
                  {result.suggestions.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                      className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-amber-400 flex-shrink-0 font-mono text-[11px]">→</span>
                      <span className="font-mono text-[11px] text-slate-300 leading-relaxed">{s}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
