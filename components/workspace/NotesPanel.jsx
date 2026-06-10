import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'dos_workspace_notes';
const COLORS = ['#22d3ee', '#34d399', '#a78bfa', '#f472b6', '#fbbf24', '#06d6a0', '#ff006e'];

const defaultNotes = [
  { id: 1, title: 'Star Schema Design', content: 'Need to implement fact table for sales orders.\nUse surrogate keys for all dimensions.', color: '#22d3ee', pinned: false, updatedAt: Date.now() },
  { id: 2, title: 'SCD Implementation', content: 'Type 2 tracking for customer dimension updates.\nAdd effective_date, expiry_date, is_current columns.', color: '#a78bfa', pinned: false, updatedAt: Date.now() },
  { id: 3, title: 'Query Optimization', content: 'Add indexes for customer lookup queries.\nPartition fact table by year_month.', color: '#06d6a0', pinned: true, updatedAt: Date.now() },
];

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotes;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultNotes;
  } catch { return defaultNotes; }
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.75rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13,
  fontFamily: "'Inter',sans-serif", outline: 'none',
};

export default function NotesPanel() {
  const [notes, setNotes]             = useState(loadNotes);
  const [newNote, setNewNote]         = useState({ title: '', content: '' });
  const [selectedColor, setColor]     = useState('#22d3ee');
  const [editingId, setEditingId]     = useState(null);
  const [editDraft, setEditDraft]     = useState({});
  const [search, setSearch]           = useState('');

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
  }, [notes]);

  const addNote = () => {
    if (!newNote.title.trim()) return;
    setNotes(prev => [
      { id: Date.now(), ...newNote, color: selectedColor, pinned: false, updatedAt: Date.now() },
      ...prev,
    ]);
    setNewNote({ title: '', content: '' });
  };

  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  const togglePin = (id) => setNotes(prev =>
    prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
  );

  const startEdit = (note) => { setEditingId(note.id); setEditDraft({ title: note.title, content: note.content, color: note.color }); };
  const saveEdit  = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...editDraft, updatedAt: Date.now() } : n));
    setEditingId(null);
  };

  // Sort: pinned first, then by updatedAt desc
  const filtered = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Add note form ── */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,16,32,0.8)' }}>
        <input
          type="text"
          placeholder="Note title…"
          value={newNote.title}
          onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addNote()}
          maxLength={150}
          style={{ ...inputStyle, marginBottom: '0.5rem' }}
          onFocus={e => { e.target.style.borderColor='rgba(34,211,238,0.3)'; e.target.style.background='rgba(34,211,238,0.05)'; }}
          onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
        />
        <textarea
          placeholder="Note content… (optional)"
          value={newNote.content}
          onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
          maxLength={5000}
          style={{ ...inputStyle, minHeight: 56, resize: 'none', marginBottom: '0.75rem', fontSize: 12 }}
          onFocus={e => { e.target.style.borderColor='rgba(34,211,238,0.3)'; e.target.style.background='rgba(34,211,238,0.05)'; }}
          onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flex: 1 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} title={c} style={{
                width: 22, height: 22, borderRadius: 5, background: c, cursor: 'pointer', flexShrink: 0,
                border: selectedColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.25)',
                boxShadow: selectedColor === c ? `0 0 10px ${c}` : 'none',
              }} />
            ))}
          </div>
          <button onClick={addNote} style={{
            padding: '0.4rem 0.9rem', borderRadius: 7,
            border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.1)',
            color: '#22d3ee', cursor: 'pointer', fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap',
          }}>+ Add</button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          type="text"
          placeholder="Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, fontSize: 12, padding: '0.4rem 0.7rem' }}
          onFocus={e => { e.target.style.borderColor='rgba(34,211,238,0.3)'; }}
          onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; }}
        />
      </div>

      {/* ── Notes grid ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '0.75rem', alignContent: 'start' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', color: '#64748b', textAlign: 'center', paddingTop: '2rem', fontSize: 13 }}>
            {search ? 'No matching notes.' : 'No notes yet. Create one above!'}
          </div>
        ) : filtered.map(note => (
          <div key={note.id} style={{
            background: `linear-gradient(135deg,${note.color}15 0%,${note.color}08 100%)`,
            border: `1.5px solid ${note.color}40`, borderRadius: 12, padding: '0.85rem',
            transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative',
            boxShadow: note.pinned ? `0 0 18px ${note.color}35` : `0 0 10px ${note.color}15`,
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 0 28px ${note.color}45`; e.currentTarget.style.transform='translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow=note.pinned?`0 0 18px ${note.color}35`:`0 0 10px ${note.color}15`; e.currentTarget.style.transform='translateY(0)'; }}
          >
            {editingId === note.id ? (
              // ── Inline edit mode ──
              <div>
                <input
                  autoFocus
                  value={editDraft.title}
                  onChange={e => setEditDraft(p => ({ ...p, title: e.target.value }))}
                  maxLength={150}
                  style={{ ...inputStyle, marginBottom: 6, fontSize: 13, padding: '0.3rem 0.5rem' }}
                />
                <textarea
                  value={editDraft.content}
                  onChange={e => setEditDraft(p => ({ ...p, content: e.target.value }))}
                  maxLength={5000}
                  style={{ ...inputStyle, fontSize: 12, minHeight: 70, resize: 'vertical', marginBottom: 8, padding: '0.3rem 0.5rem' }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setEditDraft(p=>({...p,color:c}))} style={{
                      width:18,height:18,borderRadius:4,background:c,cursor:'pointer',
                      border:editDraft.color===c?'2px solid white':'1px solid transparent',
                    }}/>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <button onClick={() => saveEdit(note.id)} style={{ flex:1, padding:'4px 0', borderRadius:6, border:'1px solid rgba(52,211,153,0.4)', background:'rgba(52,211,153,0.1)', color:'#34d399', cursor:'pointer', fontSize:11 }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ flex:1, padding:'4px 0', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>Cancel</button>
                </div>
              </div>
            ) : (
              // ── Display mode ──
              <>
                {note.pinned && <span title="Pinned" style={{ position:'absolute',top:8,left:8,fontSize:11,opacity:0.7 }}>📌</span>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem', paddingLeft: note.pinned ? 20 : 0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', wordBreak:'break-word', flex:1 }}>
                    {note.title}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:4 }}>
                    <button onClick={() => togglePin(note.id)} title={note.pinned ? 'Unpin':'Pin'} style={{ background:'none',border:'none',cursor:'pointer',fontSize:12,opacity:0.6,padding:'1px 3px',transition:'transform 0.2s' }} onMouseEnter={e => e.target.style.transform='scale(1.2)'} onMouseLeave={e => e.target.style.transform='scale(1)'}>{note.pinned?'📌':'📍'}</button>
                    <button onClick={() => startEdit(note)} title="Edit" style={{ background:'rgba(167,139,250,0.15)',border:'none',color:'#a78bfa',cursor:'pointer',fontSize:11,padding:'2px 6px',borderRadius:5,transition:'all 0.2s' }} onMouseEnter={e => { e.target.style.background='rgba(167,139,250,0.3)'; }} onMouseLeave={e => { e.target.style.background='rgba(167,139,250,0.15)'; }}>✏</button>
                    <button onClick={() => deleteNote(note.id)} title="Delete" style={{ background:'rgba(239,68,68,0.15)',border:'none',color:'#ef4444',cursor:'pointer',fontSize:11,padding:'2px 6px',borderRadius:5,transition:'all 0.2s' }} onMouseEnter={e => { e.target.style.background='rgba(239,68,68,0.3)'; }} onMouseLeave={e => { e.target.style.background='rgba(239,68,68,0.15)'; }}>✕</button>
                  </div>
                </div>
                {note.content && (
                  <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                    {note.content.length > 200 ? note.content.slice(0,200)+'…' : note.content}
                  </div>
                )}
                <div style={{ fontSize:10, color:'#475569', fontFamily:"'JetBrains Mono',monospace", marginTop:8 }}>
                  {new Date(note.updatedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
