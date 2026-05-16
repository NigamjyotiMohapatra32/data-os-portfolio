import React, { useState, useEffect } from 'react';

const C = {
  cyan:   '#22d3ee', green:  '#34d399', purple: '#a78bfa',
  pink:   '#f472b6', amber:  '#fbbf24', teal:   '#06d6a0',
  blue:   '#60a5fa', red:    '#f87171',
};

function useAnimatedValue(target, duration = 1200) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function AnimCount({ to, suffix = '', prefix = '' }) {
  const v = useAnimatedValue(to);
  return React.createElement(React.Fragment, null, prefix + v.toLocaleString() + suffix);
}

function Sparkline({ data, color }) {
  const W = 80, H = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 30 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LineAreaChart({ data, color = C.cyan, label = '', fill = true, height = 160 }) {
  const W = 500, H = height;
  const padT = 10, padR = 14, padB = 30, padL = 42;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const maxV = Math.max(...data.map(d => d.v)) || 1;
  const minV = Math.min(...data.map(d => d.v));
  const range = maxV - minV || 1;
  const xS = (i) => padL + (i / (data.length - 1)) * iW;
  const yS = (v) => padT + iH - ((v - minV) / range) * iH;
  const pts = data.map((d, i) => `${xS(i)},${yS(d.v)}`).join(' ');
  const area = `M${xS(0)},${padT + iH} ` +
    data.map((d, i) => `L${xS(i)},${yS(d.v)}`).join(' ') +
    ` L${xS(data.length - 1)},${padT + iH} Z`;
  const gid = `lg${label.replace(/\W/g,'')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + iH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + iW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={padL - 5} y={y + 4} fill="#475569" fontSize="9" textAnchor="end">
              {(minV + t * range).toFixed(range < 2 ? 1 : 0)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={i} x={xS(i)} y={H - 5} fill="#475569" fontSize="9" textAnchor="middle">{d.l}</text>
      ))}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xS(i)} cy={yS(d.v)} r="4" fill={color} stroke="#0a0e27" strokeWidth="2">
          <title>{d.l}: {d.v}</title>
        </circle>
      ))}
    </svg>
  );
}

function BarChart({ data, height = 200 }) {
  const W = 500, H = height;
  const padT = 16, padR = 10, padB = 38, padL = 44;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const maxV = Math.max(...data.map(d => d.v)) || 1;
  const barW = (iW / data.length) * 0.55;
  const gap  = iW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={d.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={d.color} stopOpacity="0.25" />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padT + iH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + iW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={padL - 5} y={y + 4} fill="#475569" fontSize="9" textAnchor="end">{Math.round(t * maxV)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bH = (d.v / maxV) * iH;
        const x  = padL + i * gap + gap / 2 - barW / 2;
        const y  = padT + iH - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx="4" fill={`url(#bg${i})`}>
              <title>{d.l}: {d.v}</title>
            </rect>
            <rect x={x} y={y} width={barW} height="3" rx="2" fill={d.color} />
            <text x={x + barW / 2} y={H - 6} fill="#475569" fontSize="9" textAnchor="middle">{d.l}</text>
            <text x={x + barW / 2} y={y - 5} fill={d.color} fontSize="10" textAnchor="middle" fontWeight="700">{d.v}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, size = 180 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.38, r = size * 0.23;
  const total = data.reduce((s, d) => s + d.v, 0);
  let angle = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      {data.map((d, i) => {
        const sweep = (d.v / total) * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle);
        const y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep);
        const y2 = cy + R * Math.sin(angle + sweep);
        const ix1 = cx + r * Math.cos(angle);
        const iy1 = cy + r * Math.sin(angle);
        const ix2 = cx + r * Math.cos(angle + sweep);
        const iy2 = cy + r * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
        angle += sweep;
        return (
          <path key={i} d={path} fill={d.color} opacity="0.85" stroke="#0a0e27" strokeWidth="2">
            <title>{d.l}: {d.v} ({Math.round(d.v / total * 100)}%)</title>
          </path>
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="700">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="9">TOTAL</text>
    </svg>
  );
}

function RadarChart({ axes, data, size = 220 }) {
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const n = axes.length;
  const angle = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (i, ratio) => ({ x: cx + R * ratio * Math.cos(angle(i)), y: cy + R * ratio * Math.sin(angle(i)) });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <polygon key={t}
          points={axes.map((_, i) => { const p = pt(i, t); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}
      {data.map((series, si) => {
        const pts = series.values.map((v, i) => { const p = pt(i, v); return `${p.x},${p.y}`; }).join(' ');
        return (
          <g key={si}>
            <polygon points={pts} fill={series.color} fillOpacity="0.18" stroke={series.color} strokeWidth="2" />
            {series.values.map((v, i) => {
              const p = pt(i, v);
              return <circle key={i} cx={p.x} cy={p.y} r="4" fill={series.color} stroke="#0a0e27" strokeWidth="1.5" />;
            })}
          </g>
        );
      })}
      {axes.map((label, i) => {
        const p = pt(i, 1.18);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill="#94a3b8" fontSize="9.5" fontWeight="500">{label}</text>
        );
      })}
    </svg>
  );
}

function ActivityHeatmap() {
  const [cells] = React.useState(() =>
    Array.from({ length: 8 }, () =>
      Array.from({ length: 7 }, () => ({ v: Math.random() > 0.2 ? Math.floor(Math.random() * 10) : 0 }))
    )
  );
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const cellColor = (v) => {
    if (v === 0) return 'rgba(255,255,255,0.04)';
    const t = v / 9;
    return `rgba(34,${Math.round(148 + t * 65)},${Math.round(200 + t * 38)},${0.25 + t * 0.7})`;
  };
  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: 2, marginRight: 4 }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{ width: 14, height: 14, fontSize: 9, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l}</div>
        ))}
      </div>
      {cells.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {week.map((cell, di) => (
            <div key={di} title={`${cell.v} actions`} style={{
              width: 14, height: 14, borderRadius: 3,
              background: cellColor(cell.v),
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'default',
            }} />
          ))}
        </div>
      ))}
      <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingBottom: 2 }}>
        <span style={{ fontSize: 9, color: '#475569' }}>Less</span>
        {[0, 2, 4, 6, 9].map(v => (
          <div key={v} style={{ width: 12, height: 12, borderRadius: 2, background: cellColor(v) }} />
        ))}
        <span style={{ fontSize: 9, color: '#475569' }}>More</span>
      </div>
    </div>
  );
}

export default function PerformanceDashboard() {
  const [tab, setTab] = useState('overview');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const queryTrend = [
    { l: 'Mon', v: 82 + (tick % 3) }, { l: 'Tue', v: 110 },
    { l: 'Wed', v: 94 + (tick % 5) }, { l: 'Thu', v: 130 },
    { l: 'Fri', v: 117 + (tick % 4) }, { l: 'Sat', v: 65 },
    { l: 'Sun', v: 127 + (tick % 6) },
  ];
  const latencyTrend = [
    { l: 'Mon', v: 310 }, { l: 'Tue', v: 280 },
    { l: 'Wed', v: 295 - (tick % 10) }, { l: 'Thu', v: 255 },
    { l: 'Fri', v: 245 - (tick % 8) }, { l: 'Sat', v: 260 }, { l: 'Sun', v: 245 },
  ];
  const dataProcTrend = [
    { l: 'Mon', v: 1.2 }, { l: 'Tue', v: 1.8 }, { l: 'Wed', v: 2.1 },
    { l: 'Thu', v: 1.5 }, { l: 'Fri', v: 2.4 }, { l: 'Sat', v: 0.9 },
    { l: 'Sun', v: 2.4 + (tick % 3) * 0.1 },
  ];
  const cumulativeData = dataProcTrend.map((d, i) => ({
    l: d.l,
    v: parseFloat(dataProcTrend.slice(0, i + 1).reduce((s, x) => s + x.v, 0).toFixed(1)),
  }));
  const skillUsage = [
    { l: 'SQL', v: 87, color: C.cyan }, { l: 'Python', v: 74, color: C.green },
    { l: 'Spark', v: 61, color: C.purple }, { l: 'dbt', v: 55, color: C.amber },
    { l: 'Airflow', v: 48, color: C.pink }, { l: 'Kafka', v: 39, color: C.teal },
    { l: 'GCP', v: 66, color: C.blue },
  ];
  const taskDist = [
    { l: 'Completed', v: 34, color: C.green }, { l: 'In Progress', v: 12, color: C.cyan },
    { l: 'Pending', v: 8, color: C.amber }, { l: 'Blocked', v: 3, color: C.red },
  ];
  const radarAxes = ['SQL', 'Python', 'Cloud', 'Pipelines', 'Visualisation', 'ML'];
  const radarData = [
    { color: C.cyan, values: [0.92, 0.78, 0.70, 0.85, 0.65, 0.55] },
    { color: C.purple, values: [0.60, 0.88, 0.55, 0.70, 0.80, 0.75] },
  ];
  const metricCards = [
    { label: 'Queries Today', value: 127 + tick % 4, suffix: '', icon: '⚡', color: C.cyan, spark: [70,85,92,78,110,99,127] },
    { label: 'Avg Latency', value: 245 - tick % 3, suffix: 'ms', icon: '⏱', color: C.green, spark: [310,280,295,255,245,260,245] },
    { label: 'Models Built', value: 12, suffix: '', icon: '📐', color: C.purple, spark: [5,7,8,9,10,11,12] },
    { label: 'Data Processed', value: 24, suffix: ' GB', icon: '💾', color: C.pink, spark: [12,15,18,21,19,23,24] },
    { label: 'Uptime', value: 99, suffix: '.8%', icon: '🟢', color: C.teal, spark: [99,100,99,100,100,99,100] },
    { label: 'CPU Usage', value: 34 + tick % 5, suffix: '%', icon: '🔥', color: C.amber, spark: [28,32,35,30,38,34,34] },
  ];
  const activity = [
    { time: 'Just now',  action: 'Executed: SELECT orders by revenue window', status: '✓', color: C.green },
    { time: '8 min ago', action: 'Created DBT model: fct_revenue_daily', status: '✓', color: C.cyan },
    { time: '22 min',    action: 'Pushed pipeline to Airflow DAG', status: '✓', color: C.purple },
    { time: '45 min',    action: 'Resolved 3 schema drift alerts', status: '!', color: C.amber },
    { time: '1 hr',      action: 'Completed Pomodoro — deep work session', status: '✓', color: C.teal },
    { time: '2 hr',      action: 'Reviewed PR: spark-streaming-kafka-ingest', status: '✓', color: C.blue },
  ];
  const skillBars = [
    { l: 'SQL / Query Optimisation', v: 92, c: C.cyan },
    { l: 'Python (Pandas / PySpark)', v: 78, c: C.green },
    { l: 'Cloud (GCP / AWS)', v: 70, c: C.blue },
    { l: 'Data Pipelines / Airflow', v: 85, c: C.purple },
    { l: 'dbt / Data Modelling', v: 75, c: C.amber },
    { l: 'Kafka / Streaming', v: 60, c: C.pink },
    { l: 'Machine Learning', v: 55, c: C.teal },
  ];

  const tabs = [
    { id: 'overview', label: '📊 Overview' }, { id: 'charts', label: '📈 Charts' },
    { id: 'skills', label: '🎯 Skills' }, { id: 'activity', label: '🕐 Activity' },
  ];
  const card = {
    background: 'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '1rem', marginBottom: '0.75rem',
  };
  const titleStyle = { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' };
  const monoSm = { fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.45rem 0.9rem', borderRadius: 8,
            border: tab === t.id ? `1.5px solid ${C.cyan}` : '1px solid rgba(255,255,255,0.1)',
            background: tab === t.id ? `${C.cyan}18` : 'transparent',
            color: tab === t.id ? C.cyan : '#64748b',
            cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'pdPulse 2s infinite' }} />
          <span style={{ ...monoSm, color: C.green }}>LIVE</span>
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {metricCards.map((m, i) => (
              <div key={i} style={{ ...card, marginBottom: 0, border: `1.5px solid ${m.color}44`, background: `linear-gradient(135deg,${m.color}12,${m.color}04)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <Sparkline data={m.spark} color={m.color} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                  <AnimCount to={m.value} suffix={m.suffix} />
                </div>
                <div style={monoSm}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={titleStyle}>⚡ Query Volume — Last 7 Days</div>
            <div style={{ height: 160 }}><LineAreaChart data={queryTrend} color={C.cyan} label="queries" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={titleStyle}>⏱ Avg Latency (ms)</div>
              <div style={{ height: 130 }}><LineAreaChart data={latencyTrend} color={C.green} label="latency" fill={false} height={130} /></div>
            </div>
            <div style={{ ...card, marginBottom: 0 }}>
              <div style={titleStyle}>💾 Data Processed (GB)</div>
              <div style={{ height: 130 }}><LineAreaChart data={dataProcTrend} color={C.purple} label="data" height={130} /></div>
            </div>
          </div>
        </>
      )}

      {tab === 'charts' && (
        <>
          <div style={card}>
            <div style={titleStyle}>🔧 Tool Usage Frequency</div>
            <div style={{ height: 210 }}><BarChart data={skillUsage} height={210} /></div>
          </div>
          <div style={card}>
            <div style={titleStyle}>✅ Task Distribution</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <DonutChart data={taskDist} size={180} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                {taskDist.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{d.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{d.v}</span>
                    <span style={{ fontSize: 10, color: '#475569' }}>({Math.round(d.v / taskDist.reduce((s, x) => s + x.v, 0) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={titleStyle}>📥 Cumulative Data Ingested (GB)</div>
            <div style={{ height: 150 }}><LineAreaChart data={cumulativeData} color={C.amber} label="cumulative" height={150} /></div>
          </div>
        </>
      )}

      {tab === 'skills' && (
        <>
          <div style={card}>
            <div style={titleStyle}>🎯 Skill Proficiency Radar</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <RadarChart axes={radarAxes} data={radarData} size={230} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 24, height: 3, background: C.cyan, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Current Proficiency</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 24, height: 3, background: C.purple, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Target (6 months)</span>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(34,211,238,0.07)', borderRadius: 8, border: '1px solid rgba(34,211,238,0.15)' }}>
                  <div style={{ ...monoSm, marginBottom: 4 }}>Strongest Area</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.cyan }}>SQL / Query Optimisation</div>
                </div>
                <div style={{ padding: '0.6rem', background: 'rgba(167,139,250,0.07)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.15)' }}>
                  <div style={{ ...monoSm, marginBottom: 4 }}>Growth Focus</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.purple }}>ML / Feature Engineering</div>
                </div>
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={titleStyle}>📊 Skill Depth (self-rated %)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {skillBars.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.l}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.c }}>{s.v}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.v}%`, borderRadius: 4, background: `linear-gradient(90deg,${s.c}77,${s.c})`, transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'activity' && (
        <>
          <div style={card}>
            <div style={titleStyle}>🗓 Activity Heatmap — Last 8 Weeks</div>
            <ActivityHeatmap />
          </div>
          <div style={card}>
            <div style={titleStyle}>📋 Recent Activity Log</div>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.7rem 0', borderBottom: i < activity.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                  {i < activity.length - 1 && <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 2 }}>{a.action}</div>
                  <div style={monoSm}>{a.time}</div>
                </div>
                <span style={{ fontSize: 13, color: a.color }}>{a.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes pdPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }`}</style>
    </div>
  );
}
