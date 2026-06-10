import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionVideoBackground from './SectionVideoBackground';

const PIPELINE_STEPS = [
  {
    id: 'sources',
    name: 'Source Systems',
    icon: '🔌',
    color: '#60a5fa',
    tech: ['OLTP DBs', 'REST APIs', 'IoT Streams', 'SaaS Apps', 'Web Logs'],
    concepts: ['CDC (Change Data Capture)', 'Streaming Ingestion', 'Data Contracts'],
    description: 'The foundation layer. Captures raw structural, semi-structured, and streaming data from production boundaries. Data Contracts validate schemas at the ingest perimeter to guarantee quality.',
    details: 'Implements native log-based Change Data Capture (CDC) via Debezium to replicate database transactions in real-time with zero query overhead on transactional source systems.',
    metric: 'Ingest Rate: ~25k events/sec'
  },
  {
    id: 'ingestion',
    name: 'Ingestion Layer',
    icon: '📥',
    color: '#38bdf8',
    tech: ['Azure Data Factory', 'Apache Kafka', 'Flink', 'Spark Streaming'],
    concepts: ['Event-Driven Pipelines', 'Schema Registry', 'Metadata-Driven ETL'],
    description: 'Orchestrates the landing of batch and high-throughput real-time events. Employs dynamic, metadata-driven pipelines to adapt dynamically without pipeline downtime.',
    details: 'Decoupled orchestration layer utilizing Kafka message brokers and Azure Data Factory triggers to manage high-velocity data loads from disparate geographical networks.',
    metric: 'Pipeline Uptime: 99.98%'
  },
  {
    id: 'bronze',
    name: 'Landing / Bronze Layer',
    icon: '🟫',
    color: '#b45309',
    tech: ['Delta Lake', 'ADLS Gen2', 'Parquet Format'],
    concepts: ['Medallion Bronze', 'Append-Only Raw Logs', 'Schema Evolution'],
    description: 'The landing zone of the Lakehouse. Stores immutable raw data exactly as received from source streams. Delta Lake format ensures structural ACID transaction integrity.',
    details: 'Preserves the absolute historical record of transactional state. Append-only storage format protects against upstream failures while supporting historical replays.',
    metric: 'Raw Storage Vol: 48 TB'
  },
  {
    id: 'validation',
    name: 'Data Quality & Validation',
    icon: '⚖️',
    color: '#fbbf24',
    tech: ['Great Expectations', 'AI Data Profiler', 'SODA SQL'],
    concepts: ['Data Assertions', 'Schema Enforcement', 'Circuit Breakers'],
    description: 'Automated data validation gate. Compares structural ingress against data quality rules, alerting and routing corrupt payloads into quarantine partitions.',
    details: 'Uses ML-driven anomaly detection to identify null spikes, schema drift, and unexpected metric bounds. Acts as a gatekeeper prior to Silver enrichment.',
    metric: 'Validation Accuracy: 99.99%'
  },
  {
    id: 'transformation',
    name: 'Transformation Layer',
    icon: '🔄',
    color: '#34d399',
    tech: ['dbt Core / Cloud', 'Azure Databricks', 'Apache Spark'],
    concepts: ['Incremental Processing', 'SQL Transformation', 'CI/CD Pipelines'],
    description: 'Cleans, transforms, and standardizes data. Spark SQL engines run massive parallel joins, timestamps normalization, and business rule applications.',
    details: 'Converts unstructured strings and varied dates into uniform types. Implements conformed reference dimensions and hashes keys for rapid joins in downstream structures.',
    metric: 'Processing Uptime: ~140ms'
  },
  {
    id: 'silver',
    name: 'Silver / Conformed Layer',
    icon: '⬜',
    color: '#94a3b8',
    tech: ['Delta Lake', '3NF Normalization', 'Cleaned Schema'],
    concepts: ['Enriched Schemas', 'Conformed Structures', 'Enterprise View'],
    description: 'The conformed logical storage layer. Houses clean, verified, and normalized enterprise records, ready for advanced analysis or analytical dimensional modeling.',
    details: 'Eliminates duplication and conforms customer, product, and regional definitions across varied source lines. The single source of truth for corporate operational systems.',
    metric: 'Enriched Rows: 1.8B+'
  },
  {
    id: 'modeling',
    name: 'Data Modeling Layer',
    icon: '📐',
    color: '#818cf8',
    tech: ['ERwin Data Modeler', 'ER/Studio', 'Kimball Star Schema'],
    concepts: ['Dimensional Modeling', 'SCD Type 1/2/3', 'Fact/Dimension Design'],
    description: 'The strategic brain of the architecture. Translates complex logical relationships into highly optimized dimensional physical schemas consisting of facts & dimensions.',
    details: 'Structures Star & Snowflake models, conformed dimensions, surrogate keys, and SCD historical change logic. Nigamjyoti Mohapatra specializes in managing this specific critical layer.',
    metric: 'Data Models Built: 30+'
  },
  {
    id: 'gold',
    name: 'Gold / Semantic Layer',
    icon: '🟨',
    color: '#facc15',
    tech: ['Databricks SQL', 'Snowflake', 'Azure Synapse'],
    concepts: ['Medallion Gold', 'Aggregated Metrics', 'Semantic Models'],
    description: 'The analytical consumption layer. Pre-aggregates core Key Performance Indicators (KPIs) into high-performance reporting-ready marts organized by business line.',
    details: 'Houses clean Kimball facts and dimensional views tailored to specific organizational verticals. Highly index-tuned and cached to achieve low-latency query results.',
    metric: 'Query Latency: <150ms'
  },
  {
    id: 'serving',
    name: 'Serving Layer & APIs',
    icon: '🌐',
    color: '#a78bfa',
    tech: ['GraphQL', 'FastAPI', 'Snowflake Secure Share'],
    concepts: ['REST API Delivery', 'Secure Data Exchange', 'Semantic Cache'],
    description: 'Exposes conformed analytical endpoints securely. Supports real-time application access, downstream SaaS syncs, and zero-copy secure data shares.',
    details: 'Provides high-concurrency servability utilizing API Gateways and secure credentials, removing direct database access overhead from client-side apps.',
    metric: 'API Uptime: 99.99%'
  },
  {
    id: 'reporting',
    name: 'Reporting & BI',
    icon: '📊',
    color: '#f472b6',
    tech: ['Power BI Premium', 'Tableau Desktop', 'Excel'],
    concepts: ['OLAP Cubes', 'Interactive Dashboards', 'Self-Service BI'],
    description: 'Visual intelligence platform. Feeds executive dashboards and self-service metrics analyzers, allowing rapid visual diagnostics with near-instant query returns.',
    details: 'Power BI Premium workspaces leverage conformed gold models. Dimensional optimizations designed by Nigamjyoti improve query workloads by up to 35% on dashboard loads.',
    metric: 'Dashboard Load Gain: +35%'
  },
  {
    id: 'aiml',
    name: 'AI/ML & Analytics',
    icon: '🧠',
    color: '#ec4899',
    tech: ['Python / Pandas', 'Azure ML', 'GenAI Insights Layer'],
    concepts: ['Feature Store Ingestion', 'Predictive Analysis', 'LLM Contexts'],
    description: 'Advanced data-science launchpad. Feeds predictive machine learning algorithms, model training pipelines, and GenAI LLM contexts with clean conformed feature data.',
    details: 'Enables real-time fraud detection, customer churn forecasting, and context-aware LLM agents that query conformed metadata libraries safely.',
    metric: 'ML Model Precision: 94.2%'
  },
  {
    id: 'consumers',
    name: 'Business Consumers',
    icon: '🎯',
    color: '#f43f5e',
    tech: ['Decision Systems', 'Executives', 'Operational Ops'],
    concepts: ['Data-Driven Strategy', 'Workflow Automation', 'Business Value ROI'],
    description: 'The end-goal of data engineering. Refines raw inputs into automated operational actions, strategic corporate decisions, and massive ROI improvements.',
    details: 'Powers high-stakes insurance claims triage, retail price optimizations, and vendor SLA adjustments automatically based on served insight metrics.',
    metric: 'Corporate ROI Boost: ~42%'
  }
];

export default function EnterpriseEDWPipeline() {
  const [activeStep, setActiveStep] = useState('sources');
  const [pulsePosition, setPulsePosition] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePosition((p) => (p + 1) % 100);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const activeIndex = PIPELINE_STEPS.findIndex((s) => s.id === activeStep);
  const activeDetails = PIPELINE_STEPS[activeIndex];

  return (
    <section id="edw-pipeline" className="relative py-24 px-4 md:px-8 border-t border-white/5 bg-slate-950 overflow-hidden">
      
      {/* High-fidelity lazy-loaded cyber matrix video background */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-digital-grids-and-data-matrix-loop-31907-large.mp4"
        fallbackType={activeDetails.id === 'sources' || activeDetails.id === 'ingestion' || activeDetails.id === 'validation' ? 'cyan' : activeDetails.id === 'bronze' || activeDetails.id === 'silver' ? 'amber' : activeDetails.id === 'modeling' || activeDetails.id === 'gold' ? 'violet' : 'emerald'}
        overlayOpacity={0.93}
      />

      <div className="max-w-7xl mx-auto relative z-10" ref={containerRef}>
        
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="font-mono text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-300">[02]</span>
            <span>END_TO_END_PIPELINE</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl grad-text">
            Enterprise Lakehouse &amp; Medallion Pipeline
          </h2>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto" />
          <p className="mt-5 text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
            Click on any phase of the modern Data Lakehouse pipeline below to explore architectural concepts, 
            ingested formats, structural transformation rules, and server-side BI consumption mechanics.
          </p>
        </header>

        {/* ── Interactive SVG Flow Visualizer ───────────────── */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8 overflow-x-auto relative">
          <div className="min-w-[900px] flex justify-between items-center py-6 px-4 relative">
            
            {/* SVG Connecting Paths & Pulse Packets */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width="100%" height="100%" className="overflow-visible">
                <defs>
                  <linearGradient id="svgGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                
                {/* Connection line through steps */}
                <line 
                  x1="5%" 
                  y1="50%" 
                  x2="95%" 
                  y2="50%" 
                  stroke="url(#svgGrad)" 
                  strokeWidth="3" 
                  strokeDasharray="6 8"
                  className="flow-line"
                />

                {/* Pulse particles passing along path */}
                <circle 
                  cx={`${pulsePosition}%`} 
                  cy="50%" 
                  r="5" 
                  fill="#00fff0" 
                  style={{ filter: 'drop-shadow(0 0 8px #00fff0)' }}
                />
                <circle 
                  cx={`${(pulsePosition + 33) % 100}%`} 
                  cy="50%" 
                  r="5" 
                  fill="#ff00c8" 
                  style={{ filter: 'drop-shadow(0 0 8px #ff00c8)' }}
                />
                <circle 
                  cx={`${(pulsePosition + 66) % 100}%`} 
                  cy="50%" 
                  r="5" 
                  fill="#c2ff00" 
                  style={{ filter: 'drop-shadow(0 0 8px #c2ff00)' }}
                />
              </svg>
            </div>

            {/* Steps buttons */}
            {PIPELINE_STEPS.map((step, _idx) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className="flex flex-col items-center gap-3 relative z-10 focus:outline-none transition group"
                  style={{ width: '8%' }}
                >
                  {/* Step bubble */}
                  <motion.div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2"
                    style={{
                      background: isActive ? `${step.color}20` : '#0f172a',
                      borderColor: isActive ? step.color : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#fff' : '#64748b',
                      boxShadow: isActive ? `0 0 25px ${step.color}50` : 'none',
                    }}
                    whileHover={{ scale: 1.15, borderColor: step.color }}
                    animate={isActive ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
                  >
                    {step.icon}
                  </motion.div>

                  {/* Step text */}
                  <span
                    className="text-[10px] font-mono text-center leading-tight tracking-tight uppercase"
                    style={{
                      color: isActive ? step.color : '#475569',
                      fontWeight: isActive ? '700' : '500',
                      transition: 'color 0.2s',
                    }}
                  >
                    {step.name}
                  </span>

                  {/* Step connection dot */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-slate-900 mt-1" 
                    style={{ 
                      background: isActive ? step.color : '#1e293b',
                      boxShadow: isActive ? `0 0 10px ${step.color}` : 'none'
                    }} 
                  />
                </button>
              );
            })}

          </div>
        </div>

        {/* ── Detailed Phase Description Card ───────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-12 gap-8 glass rounded-2xl p-6 md:p-10 border relative overflow-hidden"
            style={{ borderColor: `${activeDetails.color}35`, boxShadow: `0 20px 80px -20px ${activeDetails.color}25` }}
          >
            {/* Ambient visual card background overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle at 10% 10%, ${activeDetails.color}, transparent 65%)` }}
            />

            {/* Left Column: Title & Technology stack */}
            <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border"
                  style={{ background: `${activeDetails.color}15`, borderColor: `${activeDetails.color}40`, boxShadow: `0 0 20px ${activeDetails.color}30` }}
                >
                  {activeDetails.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-100 uppercase tracking-tight">
                    {activeDetails.name}
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span style={{ color: activeDetails.color }}>●</span> Phase {activeIndex + 1} of 12
                  </div>
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2.5">
                  Technologies Utilized
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeDetails.tech.map((t) => (
                    <span 
                      key={t}
                      className="font-mono text-xs px-3 py-1 rounded-lg border border-white/5 bg-white/2"
                      style={{ color: activeDetails.color }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Architectural Concepts */}
              <div>
                <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2.5">
                  Core Architectural Concepts
                </h4>
                <ul className="space-y-1.5">
                  {activeDetails.concepts.map((concept, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <span style={{ color: activeDetails.color }}>✦</span>
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Architectural Explanations & Metrics */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6 relative z-10 lg:border-l lg:border-white/5 lg:pl-8">
              
              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Functional Overview
                  </h4>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {activeDetails.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Implementation Architecture
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {activeDetails.details}
                  </p>
                </div>
              </div>

              {/* KPI highlight card */}
              <div 
                className="rounded-xl p-4 flex items-center justify-between border"
                style={{ 
                  background: `${activeDetails.color}05`, 
                  borderColor: `${activeDetails.color}20`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📈</span>
                  <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                    Pipeline Analytics
                  </span>
                </div>
                <div 
                  className="font-mono font-bold text-base md:text-lg"
                  style={{ color: activeDetails.color }}
                >
                  {activeDetails.metric}
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      <style>{`
        .flow-line {
          animation: svgLineFlow 25s linear infinite;
        }
        @keyframes svgLineFlow {
          to { stroke-dashoffset: -300; }
        }
      `}</style>
    </section>
  );
}
