import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
      { name: 'Normalization / 3NF / Denormalization', pct: 93 },
      { name: 'Grain Definition & Conformed Dims', pct: 90 },
      { name: 'Fact & Dimension Table Design', pct: 94 },
    ],
  },
  {
    title: 'ERwin & ER/Studio',
    color: '#34d399',
    icon: '🛠',
    skills: [
      { name: 'ERwin Data Modeler', pct: 88 },
      { name: 'ER/Studio', pct: 85 },
      { name: 'Forward & Reverse Engineering', pct: 87 },
      { name: 'DDL Review & Schema Alignment', pct: 88 },
      { name: 'Source-to-Target Mapping (STM)', pct: 90 },
      { name: 'Data Dictionary & Metadata Mgmt', pct: 89 },
    ],
  },
  {
    title: 'SQL Development',
    color: '#a78bfa',
    icon: '🗄',
    skills: [
      { name: 'T-SQL (Advanced)', pct: 96 },
      { name: 'Window Functions & CTEs', pct: 94 },
      { name: 'Stored Procedures & Views & UDFs', pct: 90 },
      { name: 'Query Tuning & Execution Plans', pct: 88 },
      { name: 'Indexing & Performance Tuning', pct: 87 },
      { name: 'Dynamic SQL & DDL Scripting', pct: 85 },
    ],
  },
  {
    title: 'Data Governance & Documentation',
    color: '#fbbf24',
    icon: '📋',
    skills: [
      { name: 'Data Lineage & Traceability', pct: 88 },
      { name: 'Naming Standards & Conventions', pct: 90 },
      { name: 'Data Quality & Data Profiling', pct: 82 },
      { name: 'Model Review & Stakeholder Collab', pct: 87 },
      { name: 'Agile / Jira / Sprint Delivery', pct: 80 },
      { name: 'Git Version Control', pct: 76 },
    ],
  },
  {
    title: 'BI & Reporting',
    color: '#f472b6',
    icon: '📊',
    skills: [
      { name: 'Power BI (Desktop + Service)', pct: 85 },
      { name: 'KPI Dashboards & Reporting', pct: 85 },
      { name: 'OLAP-Ready Layer Design', pct: 88 },
      { name: 'Advanced Excel (Pivot / VLOOKUP)', pct: 82 },
      { name: 'Reporting Performance Optimization', pct: 87 },
    ],
  },
  {
    title: 'Databases & Cloud Familiarity',
    color: '#06d6a0',
    icon: '☁️',
    skills: [
      { name: 'SQL Server (2016–2022)', pct: 94 },
      { name: 'SSMS / SQL Server Management Studio', pct: 95 },
      { name: 'Snowflake (Familiarity)', pct: 60 },
      { name: 'Azure Synapse (Familiarity)', pct: 58 },
      { name: 'Azure Data Factory (Familiarity)', pct: 62 },
      { name: 'Databricks / Data Lake (Awareness)', pct: 50 },
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
    <motion.div
      className="glass rounded-2xl p-5 group relative overflow-hidden"
      style={{ borderColor: `${group.color}20` }}
      whileHover={{ y: -6, borderColor: `${group.color}50`, boxShadow: `0 20px 40px -12px ${group.color}30` }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* subtle inner glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top, ${group.color}08, transparent 60%)` }}
      />
      {/* Card header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5 relative z-10">
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
      <div className="space-y-3 relative z-10">
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
    </motion.div>
  );
}

const TOOLS = [
  'ERwin Data Modeler','ER/Studio','SQL Server','SSMS','T-SQL','Star Schema','Snowflake Schema',
  'SCD Type 1/2/3','Conformed Dimensions','Surrogate Keys','Source-to-Target Mapping',
  'Data Dictionary','Data Lineage','Power BI','Kimball Methodology','Git','Jira',
  'Advanced Excel','Pivot Tables','VLOOKUP','Power Query',
];

export default function SkillsSection() {
  const [secRef, visible] = useReveal(0.05);

  return (
    <section id="skills" ref={secRef} className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[02]</span>
            <span>PROCESSING_LAYER</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Skills &amp; Expertise</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-emerald-400/60 to-transparent" />
        </motion.header>

        {/* Skill cards grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SKILL_GROUPS.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <SkillGroupCard
                group={group}
                visible={visible}
                groupDelay={i * 100}
              />
            </motion.div>
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
