import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionVideoBackground from './SectionVideoBackground';

const BUSINESS_DOMAINS = [
  {
    id: 'strategy',
    title: '1. Strategic Corporate Mission & Core Intent',
    icon: '🎯',
    color: '#22d3ee',
    questions: [
      { q: "What is the primary business problem?", a: "Inefficient claims handling and inventory leakage due to disconnected source systems, causing customer churn and delayed analytics." },
      { q: "What company does at its core?", a: "Serves as a top-tier multi-line insurance provider and retail supply chain distributor managing high-frequency transactions." },
      { q: "Why is this dimensional warehouse needed?", a: "To consolidate disparate operational databases into a single, unified conformed source of truth for real-time reporting." },
      { q: "What operational process generates the data?", a: "Insurance policy bookings, claims updates, warehouse inventory scans, and transactional order registers." },
      { q: "Which core departments use this data?", a: "Claims Operations, Actuarial Underwriters, Supply Chain Planners, Finance Directors, and C-Suite Executives." }
    ],
    metric: { value: '35%', label: 'Claim Process Optimization', icon: '⚡' },
    diagram: 'Operational Sources (OLTP) ──[ Log-CDC Ingestion ]──> Bronze Staging ──> Silver Conformed'
  },
  {
    id: 'modeling',
    title: '2. Data Grain, Dimensional Scope & KPIs',
    icon: '📊',
    color: '#fbbf24',
    questions: [
      { q: "What decisions depend on this data?", a: "Dynamic retail pricing adjustments, fraud profiling in insurance claims, and real-time vendor SLA audits." },
      { q: "What reports & dashboards are needed?", a: "Underwriting loss ratio trends, customer risk scoring matrixes, and logistics delivery velocity maps." },
      { q: "What is the atomic business grain required?", a: "A single transaction item line level (e.g. one claims adjustment record or one individual point-of-sale receipt line)." },
      { q: "What history retention is needed?", a: "10 years of immutable historical change logs, managed seamlessly via slowly changing dimension (SCD) timelines." },
      { q: "What core KPIs are important?", a: "Loss Ratio (%), Claim Settlement Time, Inventory Turn Rate, and Vendor Lead Time." }
    ],
    metric: { value: '< 1.4s', label: 'Dashboard Query Latency', icon: '⏱' },
    diagram: 'Atomic Transactions ──[ Kimball Fact Tables ]──> Aggregate Semantic Layer ──> Power BI'
  },
  {
    id: 'architecture',
    title: '3. Modeling Relationships & Scalability',
    icon: '📐',
    color: '#a78bfa',
    questions: [
      { q: "What relationships exist in the business model?", a: "Many-to-one bindings from transactional facts to conformed dimensions (Customer, Product, Date, Location)." },
      { q: "Which dimensions are reusable (conformed)?", a: "DimCustomer, DimDate, DimProduct, and DimGeography are shared globally across claims, sales, and logistics." },
      { q: "What strict business rules govern the model?", a: "A policy must be active during the claim date boundary; claims amounts cannot exceed initial coverage limits." },
      { q: "What future scalability is required?", a: "The layout must support scaling from 1B rows to 10B rows without query degradation, using partition-pruned schemas." },
      { q: "What future analytical expansion is possible?", a: "Seamless integration of IoT shipping sensors and automated claim chatbot logging streams without rebuilding schemas." }
    ],
    metric: { value: '1.8B+', label: 'Enriched Rows Supported', icon: '💾' },
    diagram: 'Conformed Dimension (DimCustomer) ──[ Shared Key Map ]──> Claims Fact & Sales Fact'
  },
  {
    id: 'operations',
    title: '4. Source Infrastructure, Security & SLAs',
    icon: '🛡',
    color: '#34d399',
    questions: [
      { q: "What source systems are involved?", a: "Salesforce CRM, SAP ERP, Azure CosmosDB, on-prem SQL databases, and Apache Kafka clickstreams." },
      { q: "What data quality challenges exist?", a: "Address format inconsistencies, missing customer emails, duplicate accounts, and timestamp time-zone mismatches." },
      { q: "What compliance & security levels are needed?", a: "Strict HIPAA/GDPR alignment using column-level data masking, dynamic RBAC, and transparent data encryption (TDE)." },
      { q: "What operational SLAs are required?", a: "99.98% pipeline uptime with data refreshed and processed at a target latency of under 10 minutes (near real-time)." },
      { q: "What analytical use cases exist?", a: "Machine learning forecasting of customer attrition and Generative AI chatbot context ingestion." }
    ],
    metric: { value: '99.99%', label: 'Governance Accuracy', icon: '✔' }
  }
];

export default function BusinessAnalysis() {
  const [activeDomain, setActiveDomain] = useState('strategy');

  const domain = BUSINESS_DOMAINS.find(d => d.id === activeDomain);

  return (
    <section id="business-strategy" className="relative py-24 px-4 md:px-8 border-t border-white/5 bg-slate-950 overflow-hidden">
      {/* Dynamic backdrop loop */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-numbers-31908-large.mp4"
        fallbackType={domain.id === 'strategy' ? 'cyan' : domain.id === 'modeling' ? 'amber' : domain.id === 'architecture' ? 'violet' : 'emerald'}
        overlayOpacity={0.92}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="font-mono text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-300">[01]</span>
            <span>BUSINESS_INTELLIGENCE_WORKSPACE</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl grad-text">
            Enterprise Business Understanding &amp; Strategy
          </h2>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto" />
          <p className="mt-5 text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
            Before a single table is mapped, a Senior Data Architect must master the enterprise ecosystem. 
            Explore the 20 strategic questions answered interactively across 4 dimensional domains.
          </p>
        </header>

        {/* Strategy Workspace Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Domain Selection Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {BUSINESS_DOMAINS.map((d) => {
              const isActive = d.id === activeDomain;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDomain(d.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 focus:outline-none relative group ${isActive ? 'glass-premium' : 'bg-slate-900/50 hover:bg-slate-900 border-white/5'}`}
                  style={{ borderColor: isActive ? `${d.color}40` : 'rgba(255,255,255,0.05)' }}
                >
                  {/* Subtle active glow */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl"
                      style={{ background: `radial-gradient(circle at 10% 50%, ${d.color}, transparent 65%)` }}
                    />
                  )}
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                      style={{ background: isActive ? `${d.color}15` : '#080c14', borderColor: isActive ? `${d.color}50` : 'rgba(255,255,255,0.05)' }}
                    >
                      {d.icon}
                    </div>
                    <div>
                      <h3 
                        className="font-display font-semibold text-sm md:text-base leading-tight uppercase transition"
                        style={{ color: isActive ? '#fff' : '#94a3b8' }}
                      >
                        {d.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-tight">
                        {d.questions.length} critical architectural answers
                      </p>
                    </div>
                  </div>

                  {/* Staggered progress indicator inside active card */}
                  {isActive && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded bg-cyan-400"
                         style={{ background: d.color, boxShadow: `0 0 10px ${d.color}` }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: AI Insights Panel & Question Breakdown */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDomain}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-premium rounded-2xl p-6 md:p-8 border relative overflow-hidden"
                style={{ borderColor: `${domain.color}35`, boxShadow: `0 20px 80px -20px ${domain.color}25` }}
              >
                {/* Visual Accent */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 90% 10%, ${domain.color}, transparent 65%)` }}
                />

                <div className="flex flex-col gap-6 relative z-10">
                  
                  {/* Title & Domain KPI */}
                  <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{domain.icon}</span>
                      <h4 className="font-display font-bold text-lg md:text-xl text-slate-100 uppercase tracking-tight">
                        {domain.title.split('. ')[1]}
                      </h4>
                    </div>
                    
                    {domain.metric && (
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/2 border border-white/5">
                        <span className="text-lg">{domain.metric.icon}</span>
                        <div className="font-mono">
                          <span className="font-bold text-sm block" style={{ color: domain.color }}>
                            {domain.metric.value}
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase block tracking-wider leading-none">
                            {domain.metric.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flow Diagram (if exists) */}
                  {domain.diagram && (
                    <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 font-mono text-[10px] md:text-xs text-center text-slate-400 flex items-center justify-center gap-2">
                      <span className="text-cyan-400">⚡</span>
                      <span>{domain.diagram}</span>
                    </div>
                  )}

                  {/* Strategic Questions List */}
                  <div className="space-y-4">
                    {domain.questions.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-1.5 hover:border-white/10 transition">
                        <div className="flex items-start gap-2.5 font-mono text-xs">
                          <span className="text-amber-400 font-bold">Q{idx + 1}:</span>
                          <span className="text-slate-200 font-semibold">{item.q}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs md:text-sm pl-6 text-slate-400 leading-relaxed border-l border-white/5">
                          <span style={{ color: domain.color }}>▶</span>
                          <span>{item.a}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
