import React, { useEffect, useRef, useState } from 'react';

function useReveal(threshold = 0.1) {
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

const TIMELINE = [
  {
    period: '2015 — 2019',
    color: '#94a3b8',
    dot: '🎓',
    title: 'B.Tech — Computer Science',
    org: 'Odisha Engineering College',
    type: 'Education',
    tags: ['C/C++','DBMS Fundamentals','Data Structures','OS'],
    detail: 'Built a strong engineering foundation in data structures, relational database fundamentals, and algorithm design.',
  },
  {
    period: '2019 — 2021',
    color: '#22d3ee',
    dot: '📚',
    title: 'Advanced SQL & Database Training',
    org: 'QSpiders, Bangalore',
    type: 'Training',
    tags: ['T-SQL','Joins','Indexes','Stored Procs','SSIS intro'],
    detail: 'Mastered SQL query writing, database design concepts, SSIS basics, and performance tuning techniques under hands-on mentorship.',
  },
  {
    period: 'May 2021 — Sept 2024',
    color: '#34d399',
    dot: '💼',
    title: 'Data Modeler / SQL Developer',
    org: 'TCS (Tata Consultancy Services)',
    type: 'Work · 3.3 yrs',
    tags: ['Global Vendor SLA','ERwin','T-SQL','SSMS','Star Schema','SCD 1/2/3','DDL Review'],
    detail: 'Designed dimensional data models for a global vendor, SLA, and tool inventory reporting platform. Used ERwin for logical/physical models, DDL scripts, and reverse engineering of legacy SQL Server schemas. Built T-SQL stored procedures, views, and UDFs for analytics.',
  },
  {
    period: 'Sep 2024 — Sep 2025',
    color: '#a78bfa',
    dot: '🚀',
    title: 'Azure Data Engineer / Data Modeler',
    org: 'Circana India',
    type: 'Work · 1 yr',
    tags: ['Azure ADF','Synapse','Snowflake Schema','Conformed Dims','Python','Power BI'],
    detail: 'Designed retail analytics model for 14+ markets. Built ADF pipelines with CDC-based incremental loads, conformed dimension layers, and cross-market OLAP cubes. 30% performance improvement.',
  },
  {
    period: 'Oct 2025 — Present',
    color: '#f472b6',
    dot: '⭐',
    title: 'Senior Data Modeler / Data Architect',
    org: 'EY GDS (Ernst & Young)',
    type: 'Work · Current',
    tags: ['Insurance DWH','Azure ADF','Star Schema','SCD 2','SSAS Tabular','Power BI','Data Architecture'],
    detail: 'Architecting enterprise insurance data warehouse from scratch. Leading dimensional modelling, ADF pipeline design, SCD implementations, and OLAP layer for Power BI dashboards. 35% performance gain achieved.',
  },
];

function TimelineItem({ item, idx, visible }) {
  const isRight = idx % 2 === 0;

  return (
    <div
      className="relative grid md:grid-cols-2 gap-4 md:gap-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${idx * 150}ms, transform 0.6s ease ${idx * 150}ms`,
      }}
    >
      {/* Timeline dot (centered on desktop) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 z-10 flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
          style={{
            background: `${item.color}18`,
            borderColor: item.color,
            boxShadow: `0 0 20px ${item.color}50`,
          }}
        >
          {item.dot}
        </div>
      </div>

      {/* Left side — period & type */}
      <div className={`${isRight ? 'md:text-right' : 'md:order-last md:text-left'} flex flex-col justify-center`}>
        <div className="font-mono text-sm font-bold" style={{ color: item.color }}>
          {item.period}
        </div>
        <div
          className="inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded-full border mt-1 w-fit"
          style={{
            color: item.color,
            borderColor: `${item.color}40`,
            background: `${item.color}10`,
            marginLeft: isRight ? 'auto' : '0',
            marginRight: !isRight && idx % 2 !== 0 ? 'auto' : '0',
          }}
        >
          {item.type}
        </div>
      </div>

      {/* Right side — card */}
      <div className={`${isRight ? '' : 'md:order-first'}`}>
        <div
          className="glass rounded-xl p-5 hover:border-white/20 transition-all duration-300 group"
          style={{ borderColor: `${item.color}20` }}
        >
          {/* Mobile dot */}
          <div className="md:hidden flex items-center gap-2 mb-3">
            <span className="text-xl">{item.dot}</span>
            <div className="font-mono text-xs" style={{ color: item.color }}>{item.period}</div>
          </div>

          <h3 className="font-display font-semibold text-slate-100 leading-snug">{item.title}</h3>
          <div className="font-mono text-xs text-slate-400 mt-0.5 mb-3">{item.org}</div>

          <p className="text-xs text-slate-400 leading-relaxed mb-3">{item.detail}</p>

          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{
                  color: item.color,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Hover line */}
          <div
            className="mt-3 h-px w-0 group-hover:w-full transition-all duration-500"
            style={{ background: `linear-gradient(90deg, ${item.color}60, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TimelineSection() {
  const [secRef, visible] = useReveal(0.05);

  return (
    <section id="timeline" ref={secRef} className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-14">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[04]</span>
            <span>CAREER_TIMELINE</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Career Pipeline</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-rose-400/60 to-transparent" />
          <p className="mt-4 text-slate-400 text-sm max-w-xl">
            From engineering foundations to senior data architecture — 5 years of progressive expertise
            across TCS, Circana, and EY GDS.
          </p>
        </header>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line — desktop only */}
          <div
            className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 w-px"
            style={{
              height: visible ? '100%' : '0%',
              background: 'linear-gradient(180deg, #22d3ee40, #a78bfa40, #f472b640)',
              transition: 'height 1.2s ease 0.3s',
            }}
          />

          <div className="space-y-10 md:space-y-14">
            {TIMELINE.map((item, i) => (
              <TimelineItem key={item.title} item={item} idx={i} visible={visible} />
            ))}
          </div>
        </div>

        {/* Currently available banner */}
        <div
          className="mt-16 glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            borderColor: 'rgba(52,211,153,0.25)',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.05), rgba(34,211,238,0.03))',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 1s',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="dot text-emerald-400 bg-emerald-400" />
            <div>
              <div className="font-display font-semibold text-slate-100">Currently at EY GDS · Open to connect</div>
              <div className="font-mono text-xs text-slate-400 mt-0.5">
                Senior Data Modeler / Architect · Bengaluru, India
              </div>
            </div>
          </div>
          <a href="#contact" className="btn btn-lime flex-shrink-0 !text-xs">↗ Get in Touch</a>
        </div>

      </div>
    </section>
  );
}
