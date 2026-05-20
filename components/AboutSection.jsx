import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

const STRENGTHS = [
  {
    icon: '🏗',
    color: '#22d3ee',
    title: 'Dimensional Modeling',
    desc: 'Design conceptual → logical → physical models. Star & Snowflake schemas, Kimball methodology, grain definition, conformed dimensions, surrogate & natural keys.',
  },
  {
    icon: '🛠',
    color: '#34d399',
    title: 'ERwin & ER/Studio',
    desc: 'Enterprise modeling using ERwin Data Modeler and ER/Studio — forward engineering, reverse engineering, DDL review, SQL Server schema alignment, and model documentation.',
  },
  {
    icon: '🗄',
    color: '#a78bfa',
    title: 'SQL Development',
    desc: 'T-SQL mastery — window functions, CTEs, stored procedures, views, UDFs, query tuning, execution plan analysis, and index optimization for high-performance reporting.',
  },
  {
    icon: '📐',
    color: '#f472b6',
    title: 'Data Warehouse Design',
    desc: 'Enterprise DWH across Insurance, Retail/CPG, and Vendor SLA domains. SCD Type 1, 2 & 3 implementation, fact & dimension design, OLAP-ready physical schemas.',
  },
  {
    icon: '🔄',
    color: '#fbbf24',
    title: 'Source-to-Target Mapping',
    desc: 'End-to-end STM documentation, data lineage, metadata management, data dictionary authoring, data quality standards — partnering with BAs and data engineers.',
  },
  {
    icon: '📊',
    color: '#06d6a0',
    title: 'BI & Reporting',
    desc: 'Power BI dashboard optimization and KPI reporting. Dimensional schema tuning that directly feeds analytics layers — achieving 30–35% performance gains across projects.',
  },
];

const CERTS = [
  { name: 'Advanced SQL & Database Training', vendor: 'QSpiders, Bangalore · 2019–2021', color: '#34d399' },
  { name: 'B.Tech — Computer Science / IT', vendor: 'Odisha Engineering College, BPUT · 2015–2019', color: '#22d3ee' },
  { name: 'ERwin & ER/Studio — Enterprise Data Modeling', vendor: 'On-the-job · EY GDS / Circana / TCS', color: '#a78bfa' },
];

export default function AboutSection() {
  const [secRef, secVisible] = useReveal();

  return (
    <section
      id="about"
      ref={secRef}
      className="relative py-24 px-4 md:px-8"
    >
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
            <span className="text-cyan-300">[01]</span>
            <span>SOURCE_NODE</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">About Me</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-cyan-400/60 to-transparent" />
        </motion.header>

        <div className="grid lg:grid-cols-5 gap-8 relative z-10">

          {/* ── Bio ─────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                     style={{ background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.25)' }}>
                  👨‍💻
                </div>
                <div>
                  <div className="font-display font-semibold text-slate-100">Nigamjyoti Mohapatra</div>
                  <div className="font-mono text-xs text-slate-500">Data Modeler / SQL Developer · EY GDS</div>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                I'm a <span className="text-cyan-300 font-semibold">Data Modeler / SQL Developer</span> with
                <span className="text-slate-100"> 5 years</span> of experience designing and delivering enterprise
                data warehouse solutions across insurance, retail/CPG, and vendor reporting domains.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                My core strength is translating complex business requirements into clean, scalable
                <span className="text-slate-200"> dimensional models</span> — from conceptual ERDs
                through to production-grade physical schemas. I partner closely with architects and
                BI teams to ensure the data layer directly drives dashboard performance and analytical agility.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                I use <span className="text-slate-200">ERwin & ER/Studio</span> for model maintenance,
                implement <span className="text-slate-200">SCD Type 1, 2 & 3</span> historisation strategies,
                optimise T-SQL workloads with execution-plan analysis, and author
                <span className="text-slate-200"> source-to-target mappings</span> and data dictionaries —
                delivering 30–35% reporting performance improvements.
              </p>
            </div>

            {/* Location / availability */}
            <div className="glass rounded-xl px-5 py-4 flex flex-wrap gap-6 text-sm">
              {[
                { icon: '📍', label: 'Location', value: 'Bengaluru · 30-day notice' },
                { icon: '🏢', label: 'Current', value: 'EY GDS' },
                { icon: '✅', label: 'Status', value: 'Open to opportunities', color: '#34d399' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="font-mono text-[10px] text-slate-500 mb-1 uppercase tracking-wider">{item.label}</div>
                  <div className={`font-medium`} style={{ color: item.color || '#e2e8f0' }}>
                    {item.icon} {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Certs & Quick Facts ──────────────── */}
          <div className="lg:col-span-2 space-y-5">

            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-slate-500 uppercase tracking-wider mb-4">Certifications</div>
              <div className="space-y-3">
                {CERTS.map((c) => (
                  <div key={c.name} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                         style={{ background: c.color, boxShadow:`0 0 8px ${c.color}` }} />
                    <div>
                      <div className="text-sm text-slate-200 leading-snug">{c.name}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{c.vendor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-slate-500 uppercase tracking-wider mb-4">Quick Facts</div>
              <div className="space-y-2.5 text-sm">
                {[
                  ['Education', 'B.Tech · Odisha Engineering College'],
                  ['Domains', 'Insurance · Retail/CPG · Vendor SLA'],
                  ['Tools', 'ERwin · ER/Studio · SSMS · Power BI · Git'],
                  ['Databases', 'SQL Server · Snowflake · Azure Synapse'],
                  ['Languages', 'English · Hindi · Odia'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{k}</span>
                    <span className="text-slate-300 text-right text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Strengths Grid ─────────────────────── */}
        <div className="mt-10">
          <div className="font-mono text-xs text-slate-500 uppercase tracking-wider mb-6">Core Competencies</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STRENGTHS.map((s, i) => (
              <motion.div
                key={s.title}
                className="glass rounded-xl p-5 hover:border-white/20 group cursor-default"
                style={{ borderColor: `${s.color}20` }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                whileHover={{ y: -4, borderColor: `${s.color}40` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}
                  >
                    {s.icon}
                  </div>
                  <h3 className="font-display font-semibold text-sm text-slate-100">{s.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                <div className="mt-3 h-px w-0 group-hover:w-full transition-all duration-500"
                     style={{ background:`linear-gradient(90deg, ${s.color}60, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
