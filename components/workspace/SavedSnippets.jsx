import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'dos_workspace_snippets';

const defaultSnippets = [
  { id: 1, name: 'SCD Type 2 Template', lang: 'sql', code: `MERGE INTO dim_customer AS t
USING source_customer AS s ON t.customer_key = s.customer_id
WHEN MATCHED AND t.is_current = 1 AND (t.email <> s.email OR t.name <> s.name)
  THEN UPDATE SET t.is_current = 0, t.expiry_date = GETDATE()
WHEN NOT MATCHED
  THEN INSERT (customer_key, name, email, effective_date, expiry_date, is_current)
       VALUES (s.customer_id, s.name, s.email, GETDATE(), '9999-12-31', 1);` },
  { id: 2, name: 'Star Schema DDL', lang: 'sql', code: `CREATE TABLE fact_sales (
  sale_id       BIGINT PRIMARY KEY,
  date_key      INT REFERENCES dim_date(date_key),
  customer_key  INT REFERENCES dim_customer(customer_key),
  product_key   INT REFERENCES dim_product(product_key),
  amount        DECIMAL(18,2),
  quantity      INT
);` },
  { id: 3, name: 'Window Functions', lang: 'sql', code: `SELECT
  customer_id,
  order_date,
  amount,
  ROW_NUMBER()  OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn,
  SUM(amount)   OVER (PARTITION BY customer_id) AS total_spend,
  LAG(amount)   OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount
FROM orders;` },
];

function loadSnippets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSnippets;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSnippets;
  } catch { return defaultSnippets; }
}

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.45rem 0.7rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, color: '#e2e8f0', outline: 'none',
};

export default function SavedSnippets() {
  const [snippets, setSnippets] = useState(loadSnippets);
  const [form, setForm]         = useState({ name: '', code: '', lang: 'sql' });
  const [copied, setCopied]     = useState(null);   // id of last-copied snippet
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);   // id of expanded snippet

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets)); } catch {}
  }, [snippets]);

  const addSnippet = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSnippets(prev => [{ id: Date.now(), ...form }, ...prev]);
    setForm({ name: '', code: '', lang: 'sql' });
  };

  const deleteSnippet = (id) => setSnippets(prev => prev.filter(s => s.id !== id));

  const copySnippet = async (id, code) => {
    try { await navigator.clipboard.writeText(code); } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const filtered = snippets.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Add snippet ── */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,16,32,0.8)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            placeholder="Snippet name…"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            maxLength={80}
            style={{ ...inputBase, flex: 3, fontSize: 12 }}
            onFocus={e => e.target.style.borderColor='rgba(52,211,153,0.35)'}
            onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
          <select
            value={form.lang}
            onChange={e => setForm(p => ({ ...p, lang: e.target.value }))}
            style={{ ...inputBase, flex: 1, fontSize: 11, cursor: 'pointer', color: '#94a3b8' }}
          >
            {['sql','python','bash','json','yaml','js'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <textarea
          placeholder="Paste your code…"
          value={form.code}
          onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
          maxLength={10000}
          style={{ ...inputBase, fontSize: 11, fontFamily:"'JetBrains Mono',monospace", minHeight: 72, resize: 'none', marginBottom: 8 }}
          onFocus={e => e.target.style.borderColor='rgba(52,211,153,0.35)'}
          onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
        />
        <button onClick={addSnippet} style={{
          width: '100%', padding: '0.45rem',
          borderRadius: 7, border: '1px solid rgba(52,211,153,0.3)',
          background: 'rgba(52,211,153,0.1)', color: '#34d399',
          cursor: 'pointer', fontSize: 12, fontFamily:"'JetBrains Mono',monospace",
        }}>+ Save Snippet</button>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          placeholder="Search snippets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputBase, fontSize: 12, padding: '0.35rem 0.7rem' }}
          onFocus={e => e.target.style.borderColor='rgba(52,211,153,0.35)'}
          onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
        />
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '2rem', fontSize: 12 }}>
            {search ? 'No matching snippets.' : 'No snippets saved yet.'}
          </div>
        ) : filtered.map(s => (
          <div key={s.id}
            className="lift"
            style={{
              background: 'rgba(52,211,153,0.06)', border: '1.5px solid rgba(52,211,153,0.18)',
              borderRadius: 12, padding: '0.85rem', transition: 'all 0.25s ease-in-out',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  fontSize: 9, fontFamily:"'JetBrains Mono',monospace", padding: '2px 6px',
                  borderRadius: 5, background: 'rgba(34,211,238,0.15)', color: '#22d3ee',
                  flexShrink: 0, textTransform: 'uppercase', fontWeight: 'bold'
                }}>{s.lang}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={{
                  background: 'rgba(34,211,238,0.1)', border: 'none', color: '#22d3ee',
                  cursor: 'pointer', fontSize: 10, padding: '3px 8px', borderRadius: 5,
                  transition: 'all 0.2s', fontWeight: '600'
                }}
                onMouseEnter={e => e.target.style.background='rgba(34,211,238,0.2)'}
                onMouseLeave={e => e.target.style.background='rgba(34,211,238,0.1)'}
                >{expanded === s.id ? 'Collapse' : 'Expand'}</button>
                <button onClick={() => copySnippet(s.id, s.code)} style={{
                  background: copied===s.id ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.12)',
                  border: 'none', color: copied===s.id ? '#34d399' : '#cbd5e1',
                  cursor: 'pointer', fontSize: 10, padding: '3px 8px', borderRadius: 5, transition: 'all 0.2s',
                  fontWeight: '600'
                }}
                onMouseEnter={e => { if (copied!==s.id) e.target.style.background='rgba(52,211,153,0.2)'; }}
                onMouseLeave={e => { if (copied!==s.id) e.target.style.background='rgba(52,211,153,0.12)'; }}
                >{copied===s.id ? '✓ Copied' : 'Copy'}</button>
                <button onClick={() => deleteSnippet(s.id)} style={{
                  background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171',
                  cursor: 'pointer', fontSize: 10, padding: '3px 7px', borderRadius: 5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.target.style.background='rgba(239,68,68,0.2)'}
                onMouseLeave={e => e.target.style.background='rgba(239,68,68,0.1)'}
                >✕</button>
              </div>
            </div>
            {/* Code preview */}
            <pre style={{
              background: '#050913', borderRadius: 6, padding: '0.5rem',
              fontSize: 10, fontFamily:"'JetBrains Mono',monospace", color: '#cbd5e1',
              maxHeight: expanded === s.id ? 400 : 80, overflow: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
              transition: 'max-height 0.3s ease',
            }}>
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
