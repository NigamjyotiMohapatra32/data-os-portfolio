import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, db, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import {
  ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject, getMetadata,
} from 'firebase/storage';
import {
  collection, getDocs, orderBy, query, deleteDoc, doc, getDoc, updateDoc,
} from 'firebase/firestore';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];
const MAX_SIZE_MB = 10;
const MAX_FILES = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileInfo(name = '', type = '') {
  const n = name.toLowerCase();
  if (type.includes('pdf') || n.endsWith('.pdf'))
    return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'PDF', isImage: false };
  if (type.includes('png') || n.endsWith('.png'))
    return { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'PNG', isImage: true };
  if (type.includes('jpeg') || n.endsWith('.jpg') || n.endsWith('.jpeg'))
    return { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'JPG', isImage: true };
  if (type.includes('webp') || n.endsWith('.webp'))
    return { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'WEBP', isImage: true };
  if (type.includes('wordprocessingml') || type.includes('msword') || n.endsWith('.docx') || n.endsWith('.doc'))
    return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'DOCX', isImage: false };
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'FILE', isImage: false };
}

function fmtBytes(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

async function ensureAuth() {
  if (!auth.currentUser) await signInAnonymously(auth);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: `linear-gradient(135deg, ${color}10, ${color}05)`, border: `1px solid ${color}25` }}
    >
      <div className="absolute -top-4 -right-4 text-5xl opacity-10 select-none">{icon}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{label}</div>
      <div className="text-3xl font-bold" style={{ color, textShadow: `0 0 20px ${color}60` }}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-slate-500">{sub}</div>}
    </motion.div>
  );
}

function ConfirmModal({ message, detail, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.88, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl p-6 max-w-sm w-full space-y-4"
          style={{ background: 'rgba(12,19,34,0.97)', border: '1px solid rgba(244,114,182,0.3)', boxShadow: '0 0 60px rgba(244,114,182,0.15)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)' }}>
              🗑
            </div>
            <div>
              <div className="font-display font-semibold text-slate-100 mb-0.5">{message}</div>
              {detail && <div className="font-mono text-xs text-slate-500 break-all">{detail}</div>}
            </div>
          </div>
          <p className="text-xs text-slate-400">This action cannot be undone.</p>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
              Cancel
            </button>
            <motion.button onClick={onConfirm} whileTap={{ scale: 0.96 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all"
              style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.4)', color: '#f472b6' }}>
              Delete
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DropZone({ onFiles, dragging, setDragging }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).slice(0, MAX_FILES);
    if (dropped.length) onFiles(dropped);
  };
  const handleChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, MAX_FILES);
    if (selected.length) onFiles(selected);
    e.target.value = '';
  };

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      animate={{
        borderColor: dragging ? 'rgba(34,211,238,0.7)' : 'rgba(255,255,255,0.1)',
        background: dragging ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: dragging ? '0 0 40px rgba(34,211,238,0.15), inset 0 0 30px rgba(34,211,238,0.04)' : '0 0 0px transparent',
      }}
      transition={{ duration: 0.2 }}
      className="relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer select-none overflow-hidden"
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,image/*" multiple onChange={handleChange} />

      {/* Animated corner glows when dragging */}
      <AnimatePresence>
        {dragging && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <motion.div key={pos}
            className={`absolute w-8 h-8 ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              background: `radial-gradient(circle at ${pos.includes('left') ? '0% ' : '100%'}${pos.includes('top') ? '0%' : '100%'}, rgba(34,211,238,0.5), transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>

      <motion.div
        animate={{ scale: dragging ? 1.15 : 1, rotate: dragging ? 5 : 0 }}
        className="text-5xl mb-4 inline-block"
      >
        {dragging ? '📥' : '📤'}
      </motion.div>
      <div className="font-display font-semibold text-slate-200 mb-1 text-lg">
        {dragging ? 'Release to upload' : 'Drop files here'}
      </div>
      <div className="font-mono text-xs text-slate-500 mb-3">or click to browse</div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono"
        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
        PDF · DOCX · PNG · JPG · WEBP · max {MAX_SIZE_MB}MB · up to {MAX_FILES} files
      </div>
    </motion.div>
  );
}

function UploadItem({ u, onCopy }) {
  const fi = fileInfo(u.name);
  const isDone = u.status === 'done';
  const isErr = u.status === 'error';
  const eta = u.startedAt && !isDone && !isErr && u.pct > 0
    ? Math.round(((Date.now() - u.startedAt) / u.pct) * (100 - u.pct) / 1000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      className="rounded-2xl p-4 space-y-2.5"
      style={{
        background: isErr ? 'rgba(244,114,182,0.06)' : isDone ? 'rgba(52,211,153,0.06)' : 'rgba(34,211,238,0.06)',
        border: `1px solid ${isErr ? 'rgba(244,114,182,0.2)' : isDone ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.2)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: fi.bg, border: `1px solid ${fi.color}30`, color: fi.color }}>
          {isErr ? '✗' : isDone ? '✓' : '⟳'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-200 truncate font-medium">{u.name}</div>
          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2">
            <span>{fmtBytes(u.size)}</span>
            {eta !== null && eta > 0 && <span>· ~{eta}s left</span>}
          </div>
        </div>
        <div className="font-mono text-xs font-semibold flex-shrink-0"
          style={{ color: isErr ? '#f472b6' : isDone ? '#34d399' : '#22d3ee' }}>
          {isErr ? 'Failed' : isDone ? 'Done' : `${u.pct}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div className="h-full rounded-full relative"
          style={{ background: isErr ? '#f472b6' : isDone ? '#34d399' : 'linear-gradient(90deg, #22d3ee, #a78bfa)' }}
          animate={{ width: `${u.pct}%` }}
          transition={{ duration: 0.3 }}>
          {!isDone && !isErr && (
            <motion.div className="absolute inset-0 rounded-full"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', width: '60%' }}
            />
          )}
        </motion.div>
      </div>

      {isErr && <p className="text-xs text-rose-400 font-mono">{u.error}</p>}
      {isDone && u.url && (
        <div className="flex items-center gap-2">
          <a href={u.url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-cyan-400 font-mono truncate flex-1 hover:underline">{u.url}</a>
          <CopyButton text={u.url} onCopy={onCopy} small />
        </div>
      )}
    </motion.div>
  );
}

function CopyButton({ text, onCopy, small }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <motion.button onClick={handle}
      whileTap={{ scale: 0.92 }}
      className={`flex items-center gap-1 font-mono rounded-lg transition-all ${small ? 'text-[10px] px-2 py-1' : 'text-xs px-2.5 py-1.5'}`}
      style={{
        background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(34,211,238,0.08)',
        border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(34,211,238,0.2)'}`,
        color: copied ? '#34d399' : '#22d3ee',
      }}>
      <AnimatePresence mode="wait">
        <motion.span key={copied ? 'check' : 'copy'}
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}>
          {copied ? '✓ Copied' : 'Copy URL'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function FileCard({ f, onDelete, onSetResume, resumeUrl }) {
  const fi = fileInfo(f.name, f.contentType);
  const isResume = f.url === resumeUrl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, boxShadow: `0 12px 32px -8px ${fi.color}20` }}
      className="rounded-2xl p-4 flex flex-col gap-3 relative group"
      style={{ background: `${fi.bg}`, border: `1px solid ${fi.color}20`, transition: 'box-shadow 0.2s' }}
    >
      {isResume && (
        <div className="absolute top-2 right-2">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(34,211,238,0.2)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)' }}>
            ★ RESUME
          </span>
        </div>
      )}

      {/* Preview area */}
      <div className="h-20 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {fi.isImage ? (
          <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
        ) : (
          <div className="text-3xl opacity-60">
            {fi.label === 'PDF' ? '📄' : '📎'}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm text-slate-200 font-medium truncate" title={f.name}>{f.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: fi.bg, color: fi.color, border: `1px solid ${fi.color}30` }}>
            {fi.label}
          </span>
          {f.size && <span className="font-mono text-[10px] text-slate-500">{fmtBytes(f.size)}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CopyButton text={f.url} small />
        {fi.label === 'PDF' && !isResume && (
          <motion.button onClick={() => onSetResume(f.url)} whileTap={{ scale: 0.94 }}
            className="font-mono text-[10px] px-2 py-1 rounded-lg transition"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
            Set as Resume
          </motion.button>
        )}
        <motion.button onClick={() => onDelete(f)} whileTap={{ scale: 0.94 }}
          className="font-mono text-[10px] px-2 py-1 rounded-lg transition ml-auto"
          style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)', color: '#f472b6' }}>
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

function FileRow({ f, onDelete, onSetResume, resumeUrl }) {
  const fi = fileInfo(f.name, f.contentType);
  const isResume = f.url === resumeUrl;

  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      className="rounded-xl p-3.5 flex items-center gap-4 group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      whileHover={{ borderColor: `${fi.color}25`, background: `${fi.color}05` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: fi.bg, border: `1px solid ${fi.color}30` }}>
        {fi.label === 'PDF' ? '📄' : fi.isImage ? '🖼' : '📎'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-200 truncate font-medium">{f.name}</span>
          {isResume && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }}>★ Resume</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: fi.bg, color: fi.color, border: `1px solid ${fi.color}30` }}>{fi.label}</span>
          {f.size && <span className="font-mono text-[10px] text-slate-500">{fmtBytes(f.size)}</span>}
          <a href={f.url} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[10px] text-slate-600 hover:text-cyan-400 transition truncate max-w-xs">{f.url}</a>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={f.url} small />
        {fi.label === 'PDF' && !isResume && (
          <motion.button onClick={() => onSetResume(f.url)} whileTap={{ scale: 0.94 }}
            className="font-mono text-[10px] px-2 py-1 rounded-lg"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
            Set as Resume
          </motion.button>
        )}
        <motion.button onClick={() => onDelete(f)} whileTap={{ scale: 0.94 }}
          className="font-mono text-[10px] px-2 py-1 rounded-lg"
          style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)', color: '#f472b6' }}>
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

function MessageCard({ s, onDelete, onMarkRead }) {
  const [expanded, setExpanded] = useState(false);
  const isUnread = !s.read;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-2xl p-5 space-y-3 relative overflow-hidden"
      style={{
        background: isUnread ? 'rgba(34,211,238,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isUnread ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}>
      {isUnread && (
        <motion.div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(34,211,238,0.08), transparent 70%)' }} />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
            {(s.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-slate-100 text-sm">{s.name}</span>
              {isUnread && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
              )}
            </div>
            <a href={`mailto:${s.email}`}
              className="font-mono text-[11px] text-cyan-400 hover:underline">{s.email}</a>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[10px] text-slate-600">{fmtDate(s.submittedAt)}</span>
        </div>
      </div>

      <motion.div
        animate={{ height: expanded ? 'auto' : '2.5rem' }}
        className="overflow-hidden"
      >
        <p className="text-xs text-slate-400 leading-relaxed">{s.message}</p>
      </motion.div>
      {s.message && s.message.length > 120 && (
        <button onClick={() => setExpanded(!expanded)}
          className="font-mono text-[10px] text-slate-500 hover:text-slate-300 transition">
          {expanded ? '↑ Show less' : '↓ Read more'}
        </button>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <motion.a href={`mailto:${s.email}?subject=Re: Your message via Portfolio`}
          target="_blank" rel="noopener noreferrer"
          whileTap={{ scale: 0.95 }}
          className="font-mono text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
          ↗ Reply
        </motion.a>
        {isUnread && (
          <motion.button onClick={() => onMarkRead(s.id)} whileTap={{ scale: 0.95 }}
            className="font-mono text-[11px] px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
            Mark Read
          </motion.button>
        )}
        <motion.button onClick={() => onDelete(s)} whileTap={{ scale: 0.95 }}
          className="font-mono text-[11px] px-3 py-1.5 rounded-lg transition ml-auto"
          style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.2)', color: '#f472b6' }}>
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [files, setFiles] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState({ downloads: 0 });
  const [loading, setLoading] = useState({ files: true, submissions: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [filterType, setFilterType] = useState('all');
  const [dragging, setDragging] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(null); // null=unknown, true/false

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadFiles = useCallback(async () => {
    setLoading((p) => ({ ...p, files: true }));
    try {
      const listRef = ref(storage, 'uploads/');
      const result = await listAll(listRef);
      setStorageAvailable(true);
      const items = await Promise.all(
        result.items.map(async (item) => {
          try {
            const [url, meta] = await Promise.all([getDownloadURL(item), getMetadata(item)]);
            return { name: item.name, path: item.fullPath, url, size: meta.size, contentType: meta.contentType };
          } catch {
            const url = await getDownloadURL(item).catch(() => '');
            return { name: item.name, path: item.fullPath, url, size: 0, contentType: '' };
          }
        })
      );
      setFiles(items);
    } catch (err) {
      // Firebase Storage requires the Blaze plan on new projects
      if (err.code === 'storage/unauthorized' || err.code === 'storage/unknown' || err.message?.includes('bucket') || err.message?.includes('403') || err.message?.includes('does not exist')) {
        setStorageAvailable(false);
      } else {
        setError('Could not load files: ' + err.message);
      }
    } finally {
      setLoading((p) => ({ ...p, files: false }));
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    setLoading((p) => ({ ...p, submissions: true }));
    try {
      const q = query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Could not load messages: ' + err.message);
    } finally {
      setLoading((p) => ({ ...p, submissions: false }));
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'meta', 'resumeDownloads'));
      setStats({ downloads: snap.exists() ? (snap.data().count ?? 0) : 0 });
    } catch {}
  }, []);

  // Ensure anonymous Firebase auth BEFORE any Firestore/Storage operation.
  // Both effects previously fired simultaneously — loadSubmissions ran before
  // signInAnonymously resolved, causing "Missing or insufficient permissions".
  useEffect(() => {
    ensureAuth()
      .then(() => {
        loadFiles();
        loadSubmissions();
        loadStats();
      })
      .catch((err) => {
        setError(
          `Firebase Anonymous Auth failed — enable it in Firebase Console → Authentication → Sign-in methods → Anonymous. (${err.message})`
        );
        setLoading({ files: false, submissions: false });
      });
  }, [loadFiles, loadSubmissions, loadStats]);

  // ── Flash messages ─────────────────────────────────────────────────────────
  const flash = useCallback((msg, type = 'success') => {
    if (type === 'error') setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (fileList) => {
    setError('');
    const valid = [];
    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        flash(`"${file.name}" — type not allowed. Use PDF, DOCX, PNG, JPG or WEBP.`, 'error');
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        flash(`"${file.name}" exceeds ${MAX_SIZE_MB}MB`, 'error');
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;

    // Ensure Firebase Auth (anonymous) before upload
    try { await ensureAuth(); } catch (e) {
      flash('Auth failed — check Firebase Anonymous Auth is enabled: ' + e.message, 'error');
      return;
    }

    for (const file of valid) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, `uploads/${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      setUploads((prev) => [...prev, {
        id, name: file.name, size: file.size, pct: 0, status: 'uploading', url: null, startedAt: Date.now(),
      }]);

      // Watchdog: if still at 0% after 10s the bucket doesn't exist (Blaze plan required)
      const watchdog = setTimeout(() => {
        task.cancel();
        setStorageAvailable(false);
        setUploads((prev) => prev.map((u) =>
          u.id === id && u.pct === 0 && u.status === 'uploading'
            ? { ...u, status: 'error', error: 'Firebase Storage bucket not found. Upgrade to Blaze plan to enable uploads — see the banner below.' }
            : u
        ));
      }, 10_000);

      task.on('state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          if (pct > 0) clearTimeout(watchdog); // progressing — cancel watchdog
          setUploads((prev) => prev.map((u) => u.id === id ? { ...u, pct } : u));
        },
        (err) => {
          clearTimeout(watchdog);
          // Detect Storage-related errors and surface the amber banner
          const isStorageMissing =
            err.code === 'storage/canceled' ||
            err.code === 'storage/unknown' ||
            err.message?.includes('bucket') ||
            err.message?.includes('403') ||
            err.message?.includes('does not exist');
          if (isStorageMissing) setStorageAvailable(false);
          setUploads((prev) => prev.map((u) =>
            u.id === id ? { ...u, status: 'error', error: err.message } : u
          ));
        },
        async () => {
          clearTimeout(watchdog);
          setStorageAvailable(true);
          const url = await getDownloadURL(task.snapshot.ref);
          setUploads((prev) => prev.map((u) => u.id === id ? { ...u, status: 'done', url, pct: 100 } : u));
          loadFiles();
        }
      );
    }
  }, [flash, loadFiles]);

  // ── Delete file ───────────────────────────────────────────────────────────
  const confirmDelete = useCallback((item, type) => {
    setConfirm({
      message: `Delete "${item.name || 'message'}"?`,
      detail: item.name || item.email,
      onConfirm: async () => {
        setConfirm(null);
        try {
          if (type === 'file') {
            await deleteObject(ref(storage, item.path));
            setFiles((prev) => prev.filter((f) => f.path !== item.path));
            flash('File deleted');
          } else {
            await deleteDoc(doc(db, 'contactSubmissions', item.id));
            setSubmissions((prev) => prev.filter((s) => s.id !== item.id));
            flash('Message deleted');
          }
        } catch (err) {
          flash('Delete failed: ' + err.message, 'error');
        }
      },
    });
  }, [flash]);

  const handleMarkRead = useCallback(async (id) => {
    try {
      await updateDoc(doc(db, 'contactSubmissions', id), { read: true });
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, read: true } : s));
    } catch {}
  }, []);

  const handleSetResume = useCallback((url) => {
    setResumeUrl(url);
    navigator.clipboard.writeText(url);
    flash('Resume URL copied! Paste it into VITE_RESUME_URL in your Netlify env vars → redeploy.');
  }, [flash]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const unread = submissions.filter((s) => !s.read).length;

  const filteredFiles = files.filter((f) => {
    const fi = fileInfo(f.name, f.contentType);
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all'
      || (filterType === 'pdf' && fi.label === 'PDF')
      || (filterType === 'image' && fi.isImage);
    return matchesSearch && matchesType;
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: '📊' },
    { id: 'files', label: 'Files', shortLabel: '📁', badge: files.length || null },
    { id: 'messages', label: 'Messages', shortLabel: '📬', badge: unread || null },
    { id: 'upload', label: 'Upload', shortLabel: '⬆️', badge: uploads.filter((u) => u.status === 'uploading').length || null },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent', color: '#e2e8f0' }}>
      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
              ⚙
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-100 text-lg leading-none">Admin Console</h2>
              <div className="font-mono text-[10px] text-slate-500 mt-0.5">DATA-OS · SECURE PANEL</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              animate={{ boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 12px rgba(52,211,153,0.3)', '0 0 0px rgba(52,211,153,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
              <span className="font-mono text-[10px] text-emerald-400">LIVE</span>
            </motion.div>
            <button onClick={() => ensureAuth().then(() => { loadFiles(); loadSubmissions(); loadStats(); }).catch(() => {})}
              className="font-mono text-[10px] px-2.5 py-1 rounded-full transition"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <motion.button key={t.id} onClick={() => setTab(t.id)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs transition-colors"
                style={{ color: isActive ? '#22d3ee' : '#475569' }}
                whileTap={{ scale: 0.97 }}>
                {isActive && (
                  <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
                {t.badge > 0 && (
                  <span className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold px-1"
                    style={{ background: isActive ? 'rgba(34,211,238,0.25)' : 'rgba(244,114,182,0.25)', color: isActive ? '#22d3ee' : '#f472b6' }}>
                    {t.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Flash messages ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }} className="mx-6 mb-3 flex-shrink-0">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{
                background: error ? 'rgba(244,114,182,0.08)' : 'rgba(52,211,153,0.08)',
                border: `1px solid ${error ? 'rgba(244,114,182,0.3)' : 'rgba(52,211,153,0.3)'}`,
                color: error ? '#f472b6' : '#34d399',
              }}>
              <span>{error ? '⚠' : '✓'}</span>
              <span className="flex-1 text-xs font-mono">{error || success}</span>
              <button onClick={() => { setError(''); setSuccess(''); }} className="opacity-50 hover:opacity-100">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,211,238,0.15) transparent' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>

            {/* ══ DASHBOARD ════════════════════════════════════════════════ */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Files" value={loading.files ? '…' : files.length} icon="📁" color="#22d3ee" delay={0} />
                  <StatCard label="Messages" value={loading.submissions ? '…' : submissions.length}
                    sub={unread > 0 ? `${unread} unread` : 'All read'} icon="📬" color="#a78bfa" delay={0.05} />
                  <StatCard label="Resume Downloads" value={stats.downloads} icon="📄" color="#34d399" delay={0.1} />
                  <StatCard label="Storage Used" icon="💾" color="#f472b6" delay={0.15}
                    value={loading.files ? '…' : fmtBytes(files.reduce((sum, f) => sum + (f.size || 0), 0))} />
                </div>

                {/* Quick Actions */}
                <div>
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '⬆ Upload File', action: () => setTab('upload'), color: '#22d3ee' },
                      { label: '📬 View Messages', action: () => setTab('messages'), color: '#a78bfa' },
                      { label: '📁 Manage Files', action: () => setTab('files'), color: '#34d399' },
                      { label: '↻ Refresh All', action: () => ensureAuth().then(() => { loadFiles(); loadSubmissions(); loadStats(); }).catch(() => {}), color: '#f472b6' },
                    ].map((a, i) => (
                      <motion.button key={a.label} onClick={a.action}
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.04 }}
                        className="py-3 px-4 rounded-xl text-sm font-mono text-left transition-all"
                        style={{ background: `${a.color}08`, border: `1px solid ${a.color}20`, color: a.color }}>
                        {a.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Recent uploads */}
                {files.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">Recent Files</div>
                    <div className="space-y-2">
                      {files.slice(0, 3).map((f, i) => {
                        const fi = fileInfo(f.name, f.contentType);
                        return (
                          <motion.div key={f.path} initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-base">{fi.label === 'PDF' ? '📄' : '🖼'}</span>
                            <span className="text-xs text-slate-300 truncate flex-1">{f.name}</span>
                            <span className="font-mono text-[10px]" style={{ color: fi.color }}>{fi.label}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resume URL hint */}
                {resumeUrl && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <div className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">Active Resume URL</div>
                    <div className="font-mono text-[10px] text-slate-400 break-all">{resumeUrl}</div>
                    <div className="font-mono text-[10px] text-slate-600">
                      Add VITE_RESUME_URL={resumeUrl} to Netlify environment variables and redeploy.
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ FILES ════════════════════════════════════════════════════ */}
            {tab === 'files' && (
              <div className="space-y-4">
                {storageAvailable === false && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <span>⚠️</span>
                    <span className="font-mono text-xs text-amber-300">Firebase Storage not available on Spark plan — upgrade to Blaze to use file uploads.</span>
                    <a href="https://console.firebase.google.com/project/my-portfollio-23e3c/usage/details"
                      target="_blank" rel="noopener noreferrer"
                      className="ml-auto font-mono text-[10px] px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                      Upgrade →
                    </a>
                  </motion.div>
                )}
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 relative min-w-[140px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">⌕</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search files…"
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono bg-transparent outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }} />
                  </div>
                  <div className="flex gap-1">
                    {['all', 'pdf', 'image'].map((t) => (
                      <button key={t} onClick={() => setFilterType(t)}
                        className="font-mono text-[10px] px-2.5 py-1.5 rounded-lg transition"
                        style={{
                          background: filterType === t ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${filterType === t ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          color: filterType === t ? '#22d3ee' : '#475569',
                        }}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[['list', '☰'], ['grid', '⊞']].map(([mode, icon]) => (
                      <button key={mode} onClick={() => setViewMode(mode)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                        style={{
                          background: viewMode === mode ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${viewMode === mode ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          color: viewMode === mode ? '#22d3ee' : '#475569',
                        }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                  <button onClick={loadFiles}
                    className="font-mono text-[10px] px-2.5 py-1.5 rounded-lg transition"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                    ↻
                  </button>
                </div>

                {loading.files ? (
                  <div className="flex items-center justify-center py-16">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 rounded-full"
                      style={{ borderColor: 'rgba(34,211,238,0.3)', borderTopColor: '#22d3ee' }} />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <div className="text-4xl opacity-30">📁</div>
                    <div className="font-mono text-sm text-slate-500">
                      {search ? 'No files match your search' : 'No files uploaded yet'}
                    </div>
                    {!search && (
                      <button onClick={() => setTab('upload')}
                        className="font-mono text-xs px-4 py-2 rounded-xl mt-2 transition"
                        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
                        ⬆ Upload your first file
                      </button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  <motion.div layout className="grid grid-cols-2 gap-3">
                    <AnimatePresence>
                      {filteredFiles.map((f) => (
                        <FileCard key={f.path} f={f}
                          onDelete={(f) => confirmDelete(f, 'file')}
                          onSetResume={handleSetResume}
                          resumeUrl={resumeUrl} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div layout className="space-y-2">
                    <AnimatePresence>
                      {filteredFiles.map((f) => (
                        <FileRow key={f.path} f={f}
                          onDelete={(f) => confirmDelete(f, 'file')}
                          onSetResume={handleSetResume}
                          resumeUrl={resumeUrl} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                <div className="font-mono text-[10px] text-slate-600 pt-2">
                  {files.length} file{files.length !== 1 ? 's' : ''} · To update resume on portfolio: click "Set as Resume" on any PDF
                </div>
              </div>
            )}

            {/* ══ MESSAGES ════════════════════════════════════════════════ */}
            {tab === 'messages' && (
              <div className="space-y-3">
                {loading.submissions ? (
                  <div className="flex items-center justify-center py-16">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 rounded-full"
                      style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: '#a78bfa' }} />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <div className="text-4xl opacity-30">📬</div>
                    <div className="font-mono text-sm text-slate-500">No contact messages yet</div>
                  </div>
                ) : (
                  <>
                    {unread > 0 && (
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-mono text-xs text-slate-500">
                          <span style={{ color: '#22d3ee' }}>{unread}</span> unread · {submissions.length} total
                        </div>
                        <button
                          onClick={() => submissions.filter((s) => !s.read).forEach((s) => handleMarkRead(s.id))}
                          className="font-mono text-[10px] px-3 py-1.5 rounded-lg transition"
                          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
                          Mark all read
                        </button>
                      </div>
                    )}
                    <AnimatePresence>
                      {submissions.map((s) => (
                        <MessageCard key={s.id} s={s}
                          onDelete={(s) => confirmDelete(s, 'submission')}
                          onMarkRead={handleMarkRead} />
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}

            {/* ══ UPLOAD ══════════════════════════════════════════════════ */}
            {tab === 'upload' && (
              <div className="space-y-4">
                {/* Storage unavailable banner */}
                {storageAvailable === false && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 space-y-3"
                    style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <span className="font-display font-semibold text-amber-400">Firebase Storage requires the Blaze plan</span>
                    </div>
                    <p className="font-mono text-xs text-slate-400 leading-relaxed">
                      File uploads use Firebase Storage, which moved to the paid Blaze plan for new projects.
                      Your Firestore data (messages, counters) works perfectly on the free Spark plan.
                    </p>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="text-slate-500 uppercase tracking-wider">To enable uploads — two options:</div>
                      <div className="flex items-start gap-2 text-amber-300">
                        <span className="mt-0.5">①</span>
                        <span>Upgrade to Blaze (pay-as-you-go, free up to 5GB — just needs a credit card on file)</span>
                      </div>
                      <div className="flex items-start gap-2 text-emerald-400">
                        <span className="mt-0.5">②</span>
                        <span>Upload your resume to Google Drive / Dropbox and paste the public link into Netlify env → <code className="text-cyan-400">VITE_RESUME_URL</code></span>
                      </div>
                    </div>
                    <a href="https://console.firebase.google.com/project/my-portfollio-23e3c/usage/details"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg transition"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                      ↗ Upgrade in Firebase Console
                    </a>
                  </motion.div>
                )}
                {storageAvailable !== false && <DropZone onFiles={handleFiles} dragging={dragging} setDragging={setDragging} />}

                {/* Tips */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Accepted types', value: 'PDF · DOCX · DOC · PNG · JPG · WEBP', color: '#22d3ee' },
                    { label: 'Max file size', value: `${MAX_SIZE_MB} MB`, color: '#34d399' },
                    { label: 'Max files at once', value: `${MAX_FILES} files`, color: '#a78bfa' },
                    { label: 'Storage', value: 'Firebase Storage', color: '#f472b6' },
                  ].map((tip) => (
                    <div key={tip.label} className="rounded-xl px-3 py-2.5"
                      style={{ background: `${tip.color}08`, border: `1px solid ${tip.color}15` }}>
                      <div className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">{tip.label}</div>
                      <div className="font-mono text-xs mt-0.5" style={{ color: tip.color }}>{tip.value}</div>
                    </div>
                  ))}
                </div>

                {/* Upload queue */}
                {uploads.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Upload Queue</div>
                      <button onClick={() => setUploads((p) => p.filter((u) => u.status === 'uploading'))}
                        className="font-mono text-[10px] text-slate-600 hover:text-slate-400 transition">
                        Clear Done
                      </button>
                    </div>
                    <AnimatePresence>
                      {uploads.map((u) => <UploadItem key={u.id} u={u} onCopy={() => flash('URL copied!')} />)}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          detail={confirm.detail}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
