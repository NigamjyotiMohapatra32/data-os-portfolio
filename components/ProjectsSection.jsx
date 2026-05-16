import React, { useEffect, useRef, useState } from 'react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

const PROJECTS = [
  {
    title: 'Insurance Data Warehouse',
    org: 'EY GDS',
    period: 'Oct 2025 → Present',
    color: '#22d3ee',
    status: 'LIVE',
    statusColor: '#34d399',
    metrics: [
      { label: 'Perf Gain', value: '+35%' },
      { label: 'Fact Tables', value: '18' },
      { label: 'Dim Tables', value: '42' },
    ],
    summary:
      'Enterprise insurance DWH supporting full policy lifecycle — underwriting, claims, renewals — with SCD Type 2 historisation for customer and policy dimensions. Power BI dashboards cut reporting cycle from 2 days to 4 hours.',
    stack: ['Azure ADF','SQL Server 2022','T-SQL','SSIS','SSAS Tabular','Power BI','Star Schema','SCD 2'],
    highlights: [
      'Designed 60-table star schema from scratch (conceptual → physical)',
      'Built metadata-driven ADF pipelines with parameterised datasets',
      'Implemented SCD Type 2 for 6 core dimensions with audit columns',
      'Query optimisation reduced avg dashboard load from 28s → 4s',
    ],
  },
  {
    title: 'Retail Data Modelling Framework',
    org: 'Circana India',
    period: 'Sep 2024 → Sep 2025',
    color: '#a78bfa',
    status: 'COMPLETED',
    statusColor: '#a78bfa',
    metrics: [
      { label: 'Perf Gain', value: '+30%' },
      { label: 'Markets', value: '14' },
      { label: 'Records/day', value: '5M+' },
    ],
    summary:
      'Retail analytics model spanning 14 markets for sales performance, customer segmentation, and inventory behaviour. Snowflake schema with a shared conformed dimension layer enabling cross-market OLAP analysis.',
    stack: ['Azure Synapse','ADF','T-SQL','Power BI','Snowflake Schema','Erwin','SSAS','Python'],
    highlights: [
      'Designed conformed dimension layer reused across 14 regional pipelines',
      'Implemented Kimball Bus Matrix for cross-subject-area querying',
      'CDC-based incremental loads processing 5M+ daily transactions',
      'Self-hosted IR setup for on-premise SQL Server integration',
    ],
  },
  {
    title: 'Telecom OLAP Platform',
    org: 'TCS',
    period: 'Jul 2021 → Aug 2024',
    color: '#34d399',
    status: 'COMPLETED',
    statusColor: '#34d399',
    metrics: [
      { label: 'Subscribers', value: '20M+' },
      { label: 'Tables', value: '80+' },
      { label: 'SLA Uptime', value: '99.4%' },
    ],
    summary:
      'Large-scale telecom DWH covering subscriber lifecycle, network KPIs, revenue assurance, and churn prediction data layers. Served as the single source of truth for 7 downstream BI applications.',
    stack: ['SQL Server 2019','SSIS','SSAS','T-SQL','Power BI','SSRS','Oracle','Erwin','ER Studio'],
    highlights: [
      'Built 80+ table schema supporting 20M+ subscriber records',
      'Designed SCD Type 1/2/3 strategy for subscriber dimension',
      'SSIS packages with full error handling, audit tables, and retry logic',
      'Created SSAS cube enabling sub-second MDX query response',
    ],
  },
  {
    title: 'ETL Metadata Framework',
    org: 'TCS (Internal)',
    period: '2022 → 2023',
    color: '#fbbf24',
    status: 'INTERNAL',
    statusColor: '#fbbf24',
    metrics: [
      { label: 'Pipeline Reuse', value: '80%' },
      { label: 'Dev Time', value: '-60%' },
      { label: 'Tables Driven', value: '200+' },
    ],
    summary:
      'Generic metadata-driven ETL framework eliminating hard-coded SSIS packages. Configuration tables drive source/target mappings, transformations, SCD type selection, and scheduling — a single pipeline template covers 200+ table loads.',
    stack: ['SSIS','T-SQL','SQL Server','ADF','Metadata Tables','Generic Framework','Stored Procedures'],
    highlights: [
      'Single parameterised SSIS master package replaces 200+ bespoke packages',
      'Metadata config tables drive all source-to-target mapping logic',
      'SCD type (1/2/3) selection driven entirely from configuration',
      '60% reduction in development time for new table onboarding',
    ],
  },
];

function ProjectCard({ project, visible, delay }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="glass rounded-2xl overflow-hidden group hover:border-white/20 transition-all duration-500"
      style={{
        borderColor: `${project.color}20`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.3s`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-display font-bold text-lg md:text-xl text-slate-100 leading-snug group-hover:text-white transition">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-slate-400">{project.org}</span>
              <span className="text-slate-700">·</span>
              <span className="font-mono text-xs text-slate-500">{project.period}</span>
            </div>
          </div>
          <span
            className="flex-shrink-0 font-mono text-[10px] px-2 py-1 rounded-full border"
            style={{ color: project.statusColor, borderColor: `${project.statusColor}40`, background: `${project.statusColor}10` }}
          >
            {project.status}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex gap-3 mb-4">
          {project.metrics.map((m) => (
            <div
              key={m.label}
              className="flex-1 rounded-lg px-3 py-2 text-center"
              style={{ background: `${project.color}08`, border: `1px solid ${project.color}20` }}
            >
              <div className="font-mono font-bold text-sm" style={{ color: project.color }}>{m.value}</div>
              <div className="font-mono text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{project.summary}</p>

        {/* Expandable highlights */}
        {expanded && (
          <ul className="space-y-1.5 mb-4">
            {project.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span style={{ color: project.color, marginTop: '2px', flexShrink: 0 }}>▸</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="font-mono text-[11px] transition mb-4"
          style={{ color: project.color }}
        >
          {expanded ? '▲ Hide details' : '▼ Show highlights'}
        </button>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((t) => (
            <span
              key={t}
              className="font-mono text-[10px] px-2 py-0.5 rounded"
              style={{
                color: '#94a3b8',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ProjectsSection() {
  const [secRef, visible] = useReveal();

  return (
    <section id="projects" ref={secRef} className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-12">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[03]</span>
            <span>DATA_PIPELINES</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Projects</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-violet-400/60 to-transparent" />
          <p className="mt-4 text-slate-400 text-sm max-w-2xl">
            Enterprise data warehouse projects spanning insurance, retail, and telecom — delivering
            optimised dimensional models, ADF pipelines, and OLAP-ready layers.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.title} project={p} visible={visible} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}
