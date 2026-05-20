import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
    title: 'Insurance Data Warehouse & Reporting',
    org: 'EY GDS',
    period: 'Oct 2025 → Present',
    color: '#22d3ee',
    status: 'LIVE',
    statusColor: '#34d399',
    metrics: [
      { label: 'Perf Gain', value: '+35%' },
      { label: 'Subject Areas', value: '5' },
      { label: 'Domains', value: 'Insurance' },
    ],
    summary:
      'Designed conceptual, logical, and physical data models for Policy, Claims, Customer, Agent, and Product subject areas in an enterprise insurance DWH. Used ERwin and ER/Studio for model maintenance, DDL review, and SQL Server schema alignment.',
    stack: ['ERwin','ER/Studio','SQL Server','T-SQL','Star Schema','SCD Type 1/2','Power BI','Source-to-Target Mapping'],
    highlights: [
      'Designed CDM → LDM → PDM for Policy, Claims, Customer, Agent, and Product subject areas',
      'Implemented SCD Type 1 & 2 patterns with effective-date logic and current-record indicators',
      'Built T-SQL stored procedures, CTEs, and window functions for Power BI dashboard feeds',
      'Authored source-to-target mappings, data dictionary, metadata, and data lineage documentation',
      '35% reporting performance improvement via schema redesign and index optimization',
    ],
  },
  {
    title: 'Retail Data Modelling Framework',
    org: 'Circana India Pvt. Ltd.',
    period: 'Sept 2024 → Sept 2025',
    color: '#a78bfa',
    status: 'COMPLETED',
    statusColor: '#a78bfa',
    metrics: [
      { label: 'Perf Gain', value: '+30%' },
      { label: 'Subject Areas', value: '5' },
      { label: 'Domain', value: 'Retail/CPG' },
    ],
    summary:
      'Designed logical and physical dimensional models for Sales, Product, Customer, Store, and Time subject areas supporting retail, e-commerce, and CPG analytics. Implemented SCD Type 2 for product hierarchy and customer attribute tracking.',
    stack: ['Star Schema','Snowflake Schema','SCD Type 2','T-SQL','SQL Server','Power BI','Conformed Dims','Surrogate Keys'],
    highlights: [
      'Designed fact and dimension tables for Sales, Product, Customer, Store, and Time subject areas',
      'Implemented SCD Type 2 with surrogate key strategy and historical change capture',
      'Built T-SQL transformation queries, stored procedures, and views for Power BI dashboards',
      'Standardised naming conventions, metadata documentation, and data dictionary across reporting layers',
      '30% dashboard performance improvement through dimensional modeling and indexing review',
    ],
  },
  {
    title: 'SCMT Global Vendor & SLA Reporting',
    org: 'TCS (Tata Consultancy Services)',
    period: 'May 2021 → Sept 2024',
    color: '#34d399',
    status: 'COMPLETED',
    statusColor: '#34d399',
    metrics: [
      { label: 'Duration', value: '3.3 yrs' },
      { label: 'Domain', value: 'Vendor SLA' },
      { label: 'Tools', value: 'ERwin' },
    ],
    summary:
      'Designed dimensional data models for a global vendor, SLA, and tool inventory reporting platform tracking vendor performance, SLA compliance, business metrics, and operational KPIs. Used ERwin for logical and physical model development.',
    stack: ['ERwin','SQL Server','T-SQL','SSMS','Star Schema','SCD Type 1/2/3','DDL Review','Stored Procedures'],
    highlights: [
      'Designed dimensional models for Vendor, SLA, Tool, Time, and Status reporting subject areas',
      'Used ERwin to develop logical/physical models, generate DDL scripts, and reverse-engineer legacy schemas',
      'Created T-SQL stored procedures, views, and UDFs consumed by SQL-based reporting and analytics teams',
      'Performed data validation, query optimization, indexing analysis, and execution-plan review',
      'Contributed to Agile sprint delivery, Git version control, Jira tracking, and model review practices',
    ],
  },
  {
    title: 'Data Modeling Best Practices — STM & Data Dictionary',
    org: 'TCS / Circana / EY GDS',
    period: '2021 → Present',
    color: '#fbbf24',
    status: 'ONGOING',
    statusColor: '#fbbf24',
    metrics: [
      { label: 'Companies', value: '3' },
      { label: 'Years', value: '5+' },
      { label: 'Artifacts', value: 'STM · DD' },
    ],
    summary:
      'Cross-company practice of authoring source-to-target mappings, data lineage documentation, metadata management, and data dictionary standards — ensuring consistency, governance, and audit-readiness across all data warehouse projects.',
    stack: ['Source-to-Target Mapping','Data Dictionary','Metadata Management','Data Lineage','Data Governance','Naming Standards','Data Quality','Jira'],
    highlights: [
      'Authored STM documents collaborating with business analysts, data engineers, and BI developers',
      'Maintained data dictionary and metadata standards across all three employers',
      'Defined naming conventions and model review practices for reporting layer consistency',
      'Supported data quality and data profiling initiatives across Insurance, Retail/CPG, and Vendor domains',
    ],
  },
];

function ProjectCard({ project, visible, delay }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      className="glass rounded-2xl overflow-hidden group"
      style={{ borderColor: `${project.color}20` }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: delay / 1000 }}
      whileHover={{ y: -4, borderColor: `${project.color}40` }}
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
    </motion.article>
  );
}

export default function ProjectsSection() {
  const [secRef, visible] = useReveal();

  return (
    <section id="projects" ref={secRef} className="relative py-24 px-4 md:px-8">
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
            <span className="text-cyan-300">[03]</span>
            <span>DATA_PIPELINES</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Projects</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-violet-400/60 to-transparent" />
          <p className="mt-4 text-slate-400 text-sm max-w-2xl">
            Enterprise data warehouse projects spanning insurance, retail/CPG, and vendor SLA domains — delivering
            optimised dimensional models, T-SQL workloads, and OLAP-ready physical schemas.
          </p>
        </motion.header>

        <div className="grid md:grid-cols-2 gap-6">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.title} project={p} visible={visible} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}
