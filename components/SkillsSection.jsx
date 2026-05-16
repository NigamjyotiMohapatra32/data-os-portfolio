import React, { useEffect, useRef, useState } from 'react';

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const SKILL_GROUPS = [
  {
    title: 'Data Modeling',
    color: '#22d3ee',
    icon: '🏗',
    skills: [
      { name: 'Dimensional Modeling (Kimball)', pct: 95 },
      { name: 'Star & Snowflake Schema', pct: 95 },
      { name: 'SCD Types 1 / 2 / 3', pct: 92 },
      { name: 'Data Vault 2.0', pct: 78 },
      { name: 'Erwin / ER Studio', pct: 88 },
      { name: 'Normalization / Denormalization', pct: 93 },
    ],
  },
  {
    title: 'SQL Development',
    color: '#34d399',
    icon: '🗄',
    skills: [
      { name: 'T-SQL (Advanced)', pct: 96 },
      { name: 'Window Functions & CTEs', pct: 94 },
      { name: 'Stored Procedures & Triggers', pct: 90 },
      { name: 'Query Tuning & Execution Plans', pct: 88 },
      { name: 'PL/SQL', pct: 75 },
      { name: 'Dynamic SQL', pct: 85 },
    ],
  },
  {
    title: 'Azure & Cloud',
    color: '#a78bfa',
    icon: '☁️',
    skills: [
      { name: 'Azure Data Factory (ADF)', pct: 92 },
      { name: 'Azure Synapse Analytics', pct: 80 },
      { name: 'Azure Blob / ADLS Gen2', pct: 85 },
      { name: 'Azure SQL Database', pct: 88 },
      { name: 'Azure DevOps (CI/CD)', pct: 72 },
      { name: 'Self-Hosted Integration Runtime', pct: 82 },
    ],
  },
  {
    title: 'ETL / ELT Engineering',
    color: '#fbbf24',
    icon: '🔄',
    skills: [
      { name: 'SSIS (SQL Server Integration Services)', pct: 90 },
      { name: 'Metadata-Driven Pipelines', pct: 93 },
      { name: 'Incremental / Delta Loads', pct: 91 },
      { name: 'Error Handling & Audit Logging', pct: 87 },
      { name: 'CDC (Change Data Capture)', pct: 80 },
      { name: 'SSAS Tabular Models', pct: 78 },
    ],
  },
  {
    title: 'BI & Reporting',
    color: '#f472b6',
    icon: '📊',
    skills: [
      { name: 'Power BI (Desktop + Service)', pct: 90 },
      { name: 'DAX Measures & Calculated Columns', pct: 85 },
      { name: 'Power Query / M Language', pct: 80 },
      { name: 'SSRS Reports', pct: 75 },
      { name: 'KPI Dashboards', pct: 88 },
      { name: 'DirectQuery & Import Mode', pct: 84 },
    ],
  },
  {
    title: 'Databases & Tools',
    color: '#06d6a0',
    icon: '🛠',
    skills: [
      { name: 'SQL Server (2016–2022)', pct: 94 },
      { name: 'Oracle DB', pct: 72 },
      { name: 'Azure Synapse / Dedicated Pool', pct: 78 },
      { name: 'SSMS / Azure Data Studio', pct: 95 },
      { name: 'Git / Azure DevOps', pct: 76 },
      { name: 'Python (Pandas / PySpark basics)', pct: 60 },
    ],
  },
];

function SkillBar({ name, pct, color, animate, delay = 0 }) {
  return (
    <div style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-300">{name}</span>
        <span className="font-mono text-[10px]" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animate ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: animate ? `0 0 8px ${color}60` : 'none',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function SkillGroupCard({ group, visible, groupDelay }) {
  return (
    <div
      className="glass rounded-2xl p-5"
      style={{
        borderColor: `${group.color}20`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${groupDelay}ms, transform 0.6s ease ${groupDelay}ms`,
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${group.color}15`, border: `1px solid ${group.color}30` }}
        >
          {group.icon}
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-slate-100">{group.title}</h3>
          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
            {group.skills.length} skills
          </div>
        </div>
        <div
          className="ml-auto font-mono text-[11px] font-bold"
          style={{ color: group.color }}
        >
          {Math.round(group.skills.reduce((a, s) => a + s.pct, 0) / group.skills.length)}%
        </div>
      </div>

      {/* Skill bars */}
      <div className="space-y-3">
        {group.skills.map((s, i) => (
          <SkillBar
            key={s.name}
            name={s.name}
            pct={s.pct}
            color={group.color}
            animate={visible}
            delay={groupDelay + i * 80}
          />
        ))}
      </div>
    </div>
  );
}

const TOOLS = [
  'SQL Server','Azure Data Factory','SSIS','SSAS','Power BI','Erwin','ER Studio',
  'Azure Synapse','T-SQL','PL/SQL','SSMS','Azure DevOps','Git','Kimball','Data Vault',
  'Star Schema','SCD Type 2','CDC','ADLS Gen2','Azure SQL','Power Query','DAX',
];

export default function SkillsSection() {
  const [secRef, visible] = useReveal(0.05);

  return (
    <section id="skills" ref={secRef} className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-12">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[02]</span>
            <span>PROCESSING_LAYER</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Skills &amp; Expertise</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-emerald-400/60 to-transparent" />
        </header>

        {/* Skill cards grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SKILL_GROUPS.map((group, i) => (
            <SkillGroupCard
              key={group.title}
              group={group}
              visible={visible}
              groupDelay={i * 100}
            />
          ))}
        </div>

        {/* Tool tag cloud */}
        <div className="mt-10">
          <div className="font-mono text-xs text-slate-500 uppercase tracking-wider mb-4">
            Tools &amp; Technologies
          </div>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((tool, i) => (
              <span
                key={tool}
                className="chip"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.4s ease ${300 + i * 30}ms`,
                  color: ['#22d3ee','#34d399','#a78bfa','#f472b6','#fbbf24','#06d6a0'][i % 6],
                  borderColor: ['rgba(34,211,238,0.3)','rgba(52,211,153,0.3)','rgba(167,139,250,0.3)',
                                'rgba(244,114,182,0.3)','rgba(251,191,36,0.3)','rgba(6,214,160,0.3)'][i % 6],
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
