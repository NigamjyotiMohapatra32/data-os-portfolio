import React, { useEffect, useRef, useState } from 'react';

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
    desc: 'Design conceptual → logical → physical models. Star & Snowflake schemas, Data Vault 2.0, Kimball & Inmon methodologies.',
  },
  {
    icon: '⚡',
    color: '#34d399',
    title: 'Azure Data Factory',
    desc: 'Metadata-driven pipelines, parameterized datasets, linked services, triggers, monitoring & self-hosted IRs on Azure.',
  },
  {
    icon: '🗄',
    color: '#a78bfa',
    title: 'SQL Development',
    desc: 'T-SQL & PL/SQL mastery — window functions, CTEs, stored procedures, query tuning, execution plans, index strategies.',
  },
  {
    icon: '📐',
    color: '#f472b6',
    title: 'Data Architecture',
    desc: 'Enterprise DWH design, OLAP cube structuring, SSAS tabular models, aggregation strategies, slowly changing dimensions.',
  },
  {
    icon: '🔄',
    color: '#fbbf24',
    title: 'ETL / ELT Engineering',
    desc: 'SSIS package development, incremental loads, delta capture, error handling, audit logging & pipeline orchestration.',
  },
  {
    icon: '📊',
    color: '#06d6a0',
    title: 'BI & Reporting',
    desc: 'Power BI semantic layers, DAX measures, KPI dashboards, drill-through reports wired directly to optimised OLAP layers.',
  },
];

const CERTS = [
  { name: 'Microsoft Certified: Azure Data Engineer Associate', vendor: 'Microsoft', color: '#22d3ee' },
  { name: 'Data Modelling & Architecture Fundamentals', vendor: 'DAMA', color: '#a78bfa' },
  { name: 'Advanced T-SQL for Data Professionals', vendor: 'QSpiders', color: '#34d399' },
];

export default function AboutSection() {
  const [secRef, secVisible] = useReveal();

  return (
    <section
      id="about"
      ref={secRef}
      className={`relative py-24 px-4 md:px-8 transition-all duration-700 ${secVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-12">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[01]</span>
            <span>SOURCE_NODE</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">About Me</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-cyan-400/60 to-transparent" />
        </header>

        <div className="grid lg:grid-cols-5 gap-8">

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
                  <div className="font-mono text-xs text-slate-500">Data Modeler · Azure Data Engineer</div>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                I'm a <span className="text-cyan-300 font-semibold">Data Modeler &amp; Azure Data Engineer</span> with
                <span className="text-slate-100"> 4.5+ years</span> of experience designing and delivering enterprise
                data warehouse solutions across insurance, retail, and telecom domains.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                My core strength is translating complex business requirements into clean, scalable
                <span className="text-slate-200"> dimensional models</span> — from conceptual ERDs
                through to production-grade physical schemas. I partner closely with architects and
                BI teams to ensure the data layer directly drives dashboard performance and analytical agility.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                On the engineering side, I build <span className="text-slate-200">metadata-driven ADF pipelines</span>,
                implement <span className="text-slate-200">SCD Type 2</span> historisation strategies, optimise
                T-SQL workloads with execution-plan analysis, and architect SSAS tabular models for
                high-performance OLAP queries — reducing average dashboard load time by 30–38%.
              </p>
            </div>

            {/* Location / availability */}
            <div className="glass rounded-xl px-5 py-4 flex flex-wrap gap-6 text-sm">
              {[
                { icon: '📍', label: 'Location', value: 'Bengaluru, India' },
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
                  ['Domains', 'Insurance · Retail · Telecom'],
                  ['Tools', 'Erwin · ER Studio · SSMS · ADF'],
                  ['Databases', 'SQL Server · Oracle · Azure Synapse'],
                  ['Languages', 'T-SQL · PL/SQL · Python (basic)'],
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
              <div
                key={s.title}
                className="glass rounded-xl p-5 hover:border-white/20 transition-all duration-300 group"
                style={{
                  borderColor: `${s.color}20`,
                  transitionDelay: `${i * 60}ms`,
                  opacity: secVisible ? 1 : 0,
                  transform: secVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms, border-color 0.3s`
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{s.icon}</div>
                  <h3 className="font-display font-semibold text-sm text-slate-100">{s.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                <div className="mt-3 h-px w-0 group-hover:w-full transition-all duration-500"
                     style={{ background:`linear-gradient(90deg, ${s.color}60, transparent)` }} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
