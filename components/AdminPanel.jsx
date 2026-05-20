import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_MB = 10;

function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div
      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
      style={{
        borderColor: dragging ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.1)',
        background: dragging ? 'rgba(34,211,238,0.04)' : 'rgba(255,255,255,0.02)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,image/*" onChange={handleFile} />
      <div className="text-3xl mb-3">📤</div>
      <div className="font-mono text-sm text-slate-300 mb-1">Drop file here or click to browse</div>
      <div className="font-mono text-xs text-slate-500">PDF, PNG, JPG, WEBP · Max {MAX_SIZE_MB}MB</div>
    </div>
  );
}

function ProgressBar({ pct, color = '#22d3ee' }) {
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

export default function AdminPanel() {
  const [uploads, setUploads] = useState([]);
  const [files, setFiles] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [error, setError] = useState('');

  const loadFiles = async () => {
    try {
      const listRef = ref(storage, 'uploads/');
      const result = await listAll(listRef);
      const items = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          path: item.fullPath,
          url: await getDownloadURL(item),
        }))
      );
      setFiles(items);
    } catch (err) {
      setError('Could not load files: ' + err.message);
    }
  };

  const loadSubmissions = async () => {
    try {
      const q = query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Could not load submissions: ' + err.message);
    }
  };

  useEffect(() => {
    loadFiles();
    loadSubmissions();
  }, []);

  const handleUpload = (file) => {
    setError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type not allowed. Use PDF, PNG, JPG, or WEBP.`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    const id = Date.now().toString();
    const storageRef = ref(storage, `uploads/${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    setUploads((prev) => [...prev, { id, name: file.name, pct: 0, status: 'uploading', url: null }]);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, pct } : u)));
      },
      (err) => {
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u)));
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'done', url, pct: 100 } : u)));
        loadFiles();
      }
    );
  };

  const handleDelete = async (path, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteObject(ref(storage, path));
      setFiles((prev) => prev.filter((f) => f.path !== path));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try {
      await deleteDoc(doc(db, 'contactSubmissions', id));
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const tabs = [
    { id: 'files', label: 'File Manager', icon: '📁' },
    { id: 'submissions', label: 'Contact Submissions', icon: '📬' },
    { id: 'upload', label: 'Upload File', icon: '⬆️' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="font-mono text-xs px-4 py-2 rounded-lg border transition-all duration-200"
            style={{
              color: activeTab === t.id ? '#22d3ee' : '#64748b',
              borderColor: activeTab === t.id ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)',
              background: activeTab === t.id ? 'rgba(34,211,238,0.08)' : 'transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="glass rounded-lg px-4 py-3 text-sm text-rose-400" style={{ borderColor: 'rgba(244,114,182,0.3)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <UploadZone onUpload={handleUpload} />
          {uploads.map((u) => (
            <div key={u.id} className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 truncate max-w-xs">{u.name}</span>
                <span className="font-mono text-xs" style={{ color: u.status === 'done' ? '#34d399' : u.status === 'error' ? '#f472b6' : '#22d3ee' }}>
                  {u.status === 'done' ? '✓ Done' : u.status === 'error' ? '✗ Error' : `${u.pct}%`}
                </span>
              </div>
              <ProgressBar pct={u.pct} color={u.status === 'error' ? '#f472b6' : '#22d3ee'} />
              {u.status === 'error' && <p className="text-xs text-rose-400">{u.error}</p>}
              {u.status === 'done' && u.url && (
                <div className="flex items-center gap-2 mt-2">
                  <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline font-mono truncate flex-1">{u.url}</a>
                  <button
                    onClick={() => navigator.clipboard.writeText(u.url)}
                    className="text-xs text-slate-400 hover:text-slate-200 font-mono"
                  >
                    Copy URL
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          {files.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-500 font-mono text-sm">No files uploaded yet.</div>
          ) : (
            files.map((f) => (
              <div key={f.path} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-200 truncate">{f.name}</div>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-slate-500 hover:text-cyan-400 truncate block">{f.url}</a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(f.url)}
                    className="font-mono text-[10px] text-slate-400 hover:text-cyan-300 transition"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(f.path, f.name)}
                    className="font-mono text-[10px] text-rose-400/60 hover:text-rose-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
          <p className="font-mono text-[10px] text-slate-600 mt-2">
            To use resume on portfolio: copy the URL above → set VITE_RESUME_URL in your .env
          </p>
        </div>
      )}

      {/* Submissions tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-500 font-mono text-sm">No contact submissions yet.</div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="glass rounded-xl p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-semibold text-slate-100 text-sm">{s.name}</div>
                    <a href={`mailto:${s.email}`} className="font-mono text-xs text-cyan-400 hover:underline">{s.email}</a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[10px] text-slate-500">
                      {s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleDateString() : String(s.submittedAt ?? '').slice(0, 10)}
                    </span>
                    <button
                      onClick={() => handleDeleteSubmission(s.id)}
                      className="font-mono text-[10px] text-rose-400/60 hover:text-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">{s.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
