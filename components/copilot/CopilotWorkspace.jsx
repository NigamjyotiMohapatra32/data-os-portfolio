import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import JobHunter from '../workspace/JobHunter';
import { useCopilotStore } from '../../store/copilotStore';
import { fetchCareerSignals, fetchInterviewDeck } from '../../lib/mockApi';

const PANELS = [
  { id: 'overview', label: 'Overview' },
  { id: 'jobs', label: 'AI Job Search' },
  { id: 'ats', label: 'ATS Optimizer' },
  { id: 'interview', label: 'Interview AI' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'automation', label: 'Automation' },
  { id: 'assistant', label: 'AI Copilot' },
];

function Card({ children, className = '' }) {
  return (
    <motion.div
      layout
      className={`glass rounded-xl p-4 border border-white/10 ${className}`}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

function PanelHeader({ title, sub }) {
  return (
    <div className="mb-3">
      <div className="text-sm md:text-base font-semibold text-slate-100">{title}</div>
      <div className="text-xs text-slate-500 font-mono mt-1">{sub}</div>
    </div>
  );
}

function OrbAssistant() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border border-cyan-400/50 bg-cyan-400/10 backdrop-blur-md shadow-[0_0_35px_rgba(34,211,238,0.45)] flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-300 to-violet-400"
        />
      </motion.div>
    </motion.div>
  );
}

function FuturisticBackground({ embedded }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${embedded ? 'opacity-80' : ''}`}>
      <motion.div
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 -right-20 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl"
        animate={{ x: [0, -35, 0], y: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function TrackerBoard() {
  const board = useCopilotStore((s) => s.board);
  const moveCard = useCopilotStore((s) => s.moveCard);
  const [dragging, setDragging] = useState(null);
  const cols = ['wishlist', 'applied', 'hr', 'technical', 'managerial', 'offer', 'rejected'];

  return (
    <div className="grid gap-3 lg:grid-cols-7 md:grid-cols-3 sm:grid-cols-2">
      {cols.map((col) => (
        <Card
          key={col}
          className="min-h-[220px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragging?.from && dragging?.card) {
              moveCard(dragging.from, col, dragging.card);
            }
            setDragging(null);
          }}
        >
          <div className="text-xs uppercase tracking-widest text-cyan-300 font-mono mb-2">{col}</div>
          <div className="space-y-2">
            {(board[col] || []).map((item) => (
              <div
                key={item}
                draggable
                onDragStart={() => setDragging({ from: col, card: item })}
                className="text-xs rounded-lg px-2 py-2 bg-slate-900/70 border border-white/10 cursor-grab"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CopilotWorkspace({ embedded = false }) {
  const activePanel = useCopilotStore((s) => s.activePanel);
  const setActivePanel = useCopilotStore((s) => s.setActivePanel);
  const commandOpen = useCopilotStore((s) => s.commandOpen);
  const setCommandOpen = useCopilotStore((s) => s.setCommandOpen);
  const notifications = useCopilotStore((s) => s.notifications);

  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Welcome Nigamjyoti. Today target: 8 high-fit applications with ERwin focus.' },
  ]);

  const signals = useQuery({ queryKey: ['career-signals'], queryFn: fetchCareerSignals });
  const interview = useQuery({ queryKey: ['interview-deck'], queryFn: fetchInterviewDeck });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandOpen, setCommandOpen]);

  const profileBadges = useMemo(
    () => ['Data Modeler', 'SQL Developer', 'ERwin & ER/Studio Expert', 'Target: 17-20 LPA', 'Location: Bengaluru · PAN India'],
    [],
  );

  const renderPanel = () => {
    if (activePanel === 'jobs') return <JobHunter />;
    if (activePanel === 'tracker') return <TrackerBoard />;
    if (activePanel === 'interview') {
      return (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <PanelHeader title="AI Mock Interviewer" sub="Technical + HR + Managerial rounds" />
            <div className="space-y-2">
              {(interview.data || []).map((q) => (
                <div key={q} className="text-sm text-slate-300 border border-white/10 rounded-lg p-3 bg-slate-900/50">{q}</div>
              ))}
            </div>
          </Card>
          <Card>
            <PanelHeader title="Confidence Analytics" sub="Voice/camera simulation placeholder" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={(signals.data?.marketDemand || []).map((x) => ({ ...x, A: x.demand, fullMark: 100 }))}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      );
    }

    if (activePanel === 'assistant') {
      return (
        <Card>
          <PanelHeader title="AI Career Copilot" sub="Personalized insights, networking prompts, daily actions" />
          <div className="space-y-2 max-h-[360px] overflow-auto mb-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`text-sm p-3 rounded-lg ${m.role === 'ai' ? 'bg-cyan-500/10 border border-cyan-400/30' : 'bg-slate-900/70 border border-white/10'}`}>{m.text}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Ask: generate recruiter outreach for Data Modeler roles..."
              className="flex-1 bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              className="btn btn-cyan"
              onClick={() => {
                if (!chat.trim()) return;
                setMessages((p) => [...p, { role: 'user', text: chat }, { role: 'ai', text: `AI Suggestion: Tailor this for ERwin + Data Vault + Synapse impact metrics -> "${chat}"` }]);
                setChat('');
              }}
            >
              Send
            </button>
          </div>
        </Card>
      );
    }

    if (activePanel === 'automation') {
      return (
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            ['Auto-alert pipeline', 'LinkedIn + Naukri + Foundit alerts every 4 hours.'],
            ['Follow-up automation', 'Recruiter reminder after 72 hours with AI draft.'],
            ['Resume version manager', 'Track JD-specific resume variants with ATS deltas.'],
            ['Networking generator', 'Generate 10 personalized recruiter messages/day.'],
            ['Daily target engine', 'Target: 8 applies, 3 outreaches, 1 mock interview.'],
            ['Negotiation simulator', 'Simulate offer negotiation for 17-20 LPA range.'],
          ].map(([title, desc]) => (
            <Card key={title}>
              <div className="text-sm text-cyan-300 font-semibold">{title}</div>
              <div className="text-xs text-slate-400 mt-2">{desc}</div>
            </Card>
          ))}
        </div>
      );
    }

    if (activePanel === 'ats') {
      return (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <PanelHeader title="ATS Progress" sub="Resume optimization trend" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signals.data?.atsTrend || []}>
                  <defs>
                    <linearGradient id="ats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area dataKey="score" stroke="#22d3ee" fill="url(#ats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <PanelHeader title="Skill Demand Heat" sub="Market trend for your profile stack" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signals.data?.marketDemand || []}>
                  <XAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="demand" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <PanelHeader title="AI Career Analytics Dashboard" sub="ATS, funnel, trend scanner, personalized recommendations" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signals.data?.atsTrend || []}>
                <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Area dataKey="score" stroke="#22d3ee" fill="#22d3ee33" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <PanelHeader title="Live Recommendations" sub="AI next best actions" />
          <div className="space-y-2">
            {(signals.data?.recommendations || []).map((r) => (
              <div key={r} className="text-xs text-slate-300 p-2 rounded border border-white/10 bg-slate-900/60">{r}</div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <PanelHeader title="Application Funnel" sub="Wishlist → Offer conversion" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signals.data?.funnel || []}>
                <XAxis dataKey="stage" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className={`${embedded ? 'h-full overflow-auto' : 'min-h-screen'} bg-grid bg-radial relative`}>
      <FuturisticBackground embedded={embedded} />
      <div className={`${embedded ? 'max-w-none' : 'max-w-[1600px] mx-auto'} p-4 md:p-5 relative z-10`}>
        <div className="glass rounded-2xl p-4 mb-4 border border-cyan-300/20">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <div className="font-display text-2xl md:text-3xl grad-text font-bold">AI Career Copilot OS</div>
              <div className="text-xs text-slate-400 mt-1">Nigamjyoti Mohapatra · Data Modeler / Data Architect / Azure Data Engineer</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileBadges.map((x) => <span key={x} className="chip chip-cyan">{x}</span>)}
            </div>
          </div>
        </div>

        {embedded ? (
          <div className="space-y-4">
            <Card className="sticky top-3 z-20">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <PanelHeader title="Navigation" sub="Command: Ctrl/Cmd + K" />
                <div className="flex gap-2 flex-wrap">
                  {PANELS.map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition ${activePanel === p.id ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.3)]' : 'border-white/10 text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setActivePanel(p.id)}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>

            <AnimatePresence mode="wait">
              <motion.div key={activePanel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {renderPanel()}
              </motion.div>
            </AnimatePresence>

            <div className="grid lg:grid-cols-3 gap-4">
              <Card>
                <PanelHeader title="Notification Center" sub="Live activity feed" />
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded border border-white/10 bg-slate-900/70">{n.text}</div>
                  ))}
                </div>
              </Card>
              <Card>
                <PanelHeader title="Career Streak" sub="Gamified progress" />
                <div className="text-3xl font-bold text-cyan-300">12 days</div>
                <div className="text-xs text-slate-500 mt-1">Consistent applications + interview prep</div>
              </Card>
              <Card>
                <PanelHeader title="Achievements" sub="Unlockables" />
                <div className="flex flex-wrap gap-2">
                  {['ATS 80+', '10 Applies/Week', '2 Interviews', 'ERwin Expert'].map((a) => (
                    <span key={a} className="chip chip-violet">{a}</span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[230px_1fr_290px] gap-4">
            <Card className="h-fit">
              <PanelHeader title="Navigation" sub="Command: Ctrl/Cmd + K" />
              <div className="space-y-2">
                {PANELS.map((p) => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${activePanel === p.id ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300' : 'border-white/10 text-slate-400 hover:text-slate-100'}`}
                    onClick={() => setActivePanel(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Card>

            <AnimatePresence mode="wait">
              <motion.div key={activePanel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {renderPanel()}
              </motion.div>
            </AnimatePresence>

            <div className="space-y-4">
              <Card>
                <PanelHeader title="Notification Center" sub="Live activity feed" />
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded border border-white/10 bg-slate-900/70">{n.text}</div>
                  ))}
                </div>
              </Card>
              <Card>
                <PanelHeader title="Career Streak" sub="Gamified progress" />
                <div className="text-3xl font-bold text-cyan-300">12 days</div>
                <div className="text-xs text-slate-500 mt-1">Consistent applications + interview prep</div>
              </Card>
              <Card>
                <PanelHeader title="Achievements" sub="Unlockables" />
                <div className="flex flex-wrap gap-2">
                  {['ATS 80+', '10 Applies/Week', '2 Interviews', 'ERwin Expert'].map((a) => (
                    <span key={a} className="chip chip-violet">{a}</span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {commandOpen && (
          <motion.div className="fixed inset-0 bg-black/50 z-40 grid place-items-start pt-24 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCommandOpen(false)}>
            <motion.div className="w-full max-w-2xl glass rounded-xl p-3 border border-cyan-300/30" initial={{ y: -12 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-mono text-slate-500 mb-2">AI Spotlight</div>
              <div className="space-y-2">
                {PANELS.map((p) => (
                  <button key={p.id} className="w-full text-left rounded-lg px-3 py-2 border border-white/10 hover:border-cyan-300/40 hover:bg-cyan-400/10 text-sm" onClick={() => { setActivePanel(p.id); setCommandOpen(false); }}>
                    Open {p.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!embedded && <OrbAssistant />}
    </div>
  );
}

