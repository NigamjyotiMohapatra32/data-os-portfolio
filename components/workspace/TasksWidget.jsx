import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'dos_workspace_tasks';

const initialTasks = [
  { id: 1, title: 'Design Customer Dimension', status: 'completed' },
  { id: 2, title: 'Build Fact Table Schema', status: 'in-progress' },
  { id: 3, title: 'Implement SCD Type 2', status: 'in-progress' },
  { id: 4, title: 'Optimize Query Performance', status: 'pending' },
  { id: 5, title: 'Create Power BI Models', status: 'pending' },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialTasks;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialTasks;
  } catch { return initialTasks; }
}

const STATUS_COLOR = { completed: '#34d399', 'in-progress': '#fbbf24', pending: '#94a3b8' };
const STATUS_CYCLE = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };

export default function TasksWidget() {
  const [tasks, setTasks]     = useState(loadTasks);
  const [newTask, setNewTask] = useState('');

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const maxId = tasks.reduce((m, t) => Math.max(m, t.id), 0); // safe with empty array
    setTasks(prev => [...prev, { id: maxId + 1, title: newTask.trim(), status: 'pending' }]);
    setNewTask('');
  };

  const handleCycleStatus = (id) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: STATUS_CYCLE[t.status] || 'pending' } : t
    ));
  };

  const handleDeleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const completed = tasks.filter(t => t.status === 'completed').length;
  // BUG FIX: guard against tasks.length === 0 to avoid NaN/Infinity
  const progress  = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const col = (s) => STATUS_COLOR[s] || '#94a3b8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,16,32,0.8)' }}>
        <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: '0.75rem', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
          Tasks Overview
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ width: progress + '%', height: '100%', background: 'linear-gradient(90deg,#34d399,#22d3ee)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace", display: 'flex', justifyContent: 'space-between' }}>
          <span>{completed} of {tasks.length} completed</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* ── Add task ── */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder="Add new task…"
          maxLength={200}
          style={{
            flex: 1, padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#e2e8f0', fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace", outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor='rgba(34,211,238,0.3)'; e.target.style.background='rgba(34,211,238,0.05)'; }}
          onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
        />
        <button
          onClick={handleAddTask}
          style={{
            padding: '0.5rem 0.75rem', borderRadius: 6,
            border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.1)',
            color: '#22d3ee', cursor: 'pointer', fontSize: 11,
            fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap',
          }}
        >+ Add</button>
      </div>

      {/* ── Task list ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem' }}>
        {tasks.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', paddingTop: '2rem' }}>
            No tasks. Add one to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                className="lift"
                style={{
                  padding: '0.85rem', borderRadius: 10,
                  background: task.status === 'completed' ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${col(task.status)}30`,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {/* Status cycle button */}
                <button
                  onClick={() => handleCycleStatus(task.id)}
                  title={`Status: ${task.status} — click to cycle`}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${col(task.status)}`,
                    background: task.status === 'completed' ? col(task.status) + '20' : 'transparent',
                    color: col(task.status), cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                >
                  {task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '→' : '◯'}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, wordBreak: 'break-word',
                    color: task.status === 'completed' ? '#94a3b8' : '#e2e8f0',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    fontWeight: 500,
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 10, color: col(task.status), fontFamily: "'JetBrains Mono',monospace", marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {task.status}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  style={{
                    padding: '3px 7px', borderRadius: 6, flexShrink: 0,
                    border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
                    color: '#ef4444', cursor: 'pointer', fontSize: 10,
                    fontFamily: "'JetBrains Mono',monospace",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.2)'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(239,68,68,0.05)'; e.target.style.color = '#ef4444'; }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
