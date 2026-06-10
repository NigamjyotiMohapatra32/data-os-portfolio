import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionVideoBackground from './SectionVideoBackground';

const THINKING_STEPS = [
  {
    id: 'process',
    step: 'Step 1',
    title: 'Define Business Process',
    question: 'What events or operations generate the transaction metrics?',
    desc: 'Focus on transactional events rather than departmental silos. Examples include policy claims intimation, checkout scans, or customer inventory movements.',
    tip: 'Kimball Best Practice: Never mix different transactional events inside a single fact table if they happen at different points in time or have different business keys.',
    check: 'Is this process atomic, discrete, and easily captured in operational source logs?'
  },
  {
    id: 'grain',
    step: 'Step 2',
    title: 'Declare the Atomic Grain',
    question: 'What does a single row in your fact table represent?',
    desc: 'Declare the absolute most atomic grain possible (e.g., "One claim transaction line adjustment" or "One point-of-sale receipt item line"). Never start with aggregated data.',
    tip: 'Architect Tippet: A fine-grained atomic fact table allows for unlimited downstream slice-and-dice queries. Aggregated summary tables can always be built as physical views later.',
    check: 'Can we drill down from this grain to the ultimate transaction receipt level?'
  },
  {
    id: 'dimensions',
    step: 'Step 3',
    title: 'Identify Dimensions',
    question: 'What conformed entities capture the "who, what, where, when, why" of the event?',
    desc: 'Bind descriptive context tables like DimCustomer, DimProduct, DimLocation, and DimDate around the fact table to formulate the Star Schema.',
    tip: 'Stewardship Guideline: Ensure dimensions are conformed—sharing identical primary surrogate keys and value attributes across claims and inventory processes.',
    check: 'Are these dimensions reusable across other company fact tables (e.g. Sales, Logistics)?'
  },
  {
    id: 'facts',
    step: 'Step 4',
    title: 'Identify Facts & Measures',
    question: 'What numeric quantities are we summing, averaging, or profiling?',
    desc: 'Map the quantitative attributes resulting from the event, such as claim_amount, approved_amount, or cost_of_goods_sold. Identify if they are fully additive, semi-additive, or non-additive.',
    tip: 'Dimensional Rule: Store fully additive facts (values that can be summed across all dimensions, like currency) directly in the fact table. Avoid pre-calculating ratios.',
    check: 'Are non-additive ratios (like loss ratios) defined as downstream metadata formulas rather than static values?'
  },
  {
    id: 'history',
    step: 'Step 5',
    title: 'Define History Tracking (SCD)',
    question: 'How do we track changes to dimension attributes over time?',
    desc: 'Establish the Slowly Changing Dimension (SCD) path. Select SCD Type 1 (overwrite), SCD Type 2 (historical row timeline with surrogate keys), or SCD Type 3 (prior/current columns).',
    tip: 'Kimball Recommendation: Use SCD Type 2 for vital transactional attributes (like customer addresses or policy terms) to maintain accurate historical timeline partitions.',
    check: 'Are the effective_date and expiry_date columns correctly configured with surrogate key increments?'
  },
  {
    id: 'performance',
    step: 'Step 6',
    title: 'Partition & Scale Tuning',
    question: 'How will the physical database partition, index, and cache these massive tables?',
    desc: 'Design the physical structures—indexing clustered indexes on Date keys, distributing fact partitions by regional hashes, and creating aggregated pre-indexed views for downstream Power BI reporting.',
    tip: 'DB Master tip: Ensure that surrogate keys in the fact table are integers (not strings) to optimize memory joins and index lookups in SQL Server, Synapse, or Databricks.',
    check: 'Have we achieved partition pruning so queries only scan relevant date folders?'
  }
];

export default function ModelingThinkingAssistant() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = THINKING_STEPS[activeStepIdx];

  return (
    <section id="thinking-assistant" className="relative py-24 px-4 md:px-8 border-t border-white/5 bg-slate-950 overflow-hidden">
      {/* Subtle deep neural network looping backdrop */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-numbers-31908-large.mp4"
        fallbackType="violet"
        overlayOpacity={0.93}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="font-mono text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-300">[03]</span>
            <span>MODELING_THOUGHT_PROCESS</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl grad-text">
            Kimball Modeling Thought Assistant
          </h2>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-violet-400 to-transparent mx-auto" />
          <p className="mt-5 text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
            Data modeling is a methodical discipline. Follow this step-by-step interactive workflow map, designed 
            to trace how senior architects analyze, decompose, and map business requirements into high-performance star schemas.
          </p>
        </header>

        {/* Step Progression Map */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-10 overflow-x-auto relative">
          <div className="min-w-[850px] flex justify-between items-center py-6 px-4 relative">
            
            {/* Connection SVG Pathway */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width="100%" height="100%" className="overflow-visible">
                <line 
                  x1="5%" 
                  y1="50%" 
                  x2="95%" 
                  y2="50%" 
                  stroke="rgba(167,139,250,0.18)" 
                  strokeWidth="2" 
                  strokeDasharray="4 6"
                />
                
                {/* Active progress path */}
                <line 
                  x1="5%" 
                  y1="50%" 
                  x2={`${5 + (activeStepIdx / (THINKING_STEPS.length - 1)) * 90}%`} 
                  y2="50%" 
                  stroke="#a78bfa" 
                  strokeWidth="2.5" 
                  style={{ filter: 'drop-shadow(0 0 8px #a78bfa)', transition: 'x2 0.5s ease-in-out' }}
                />
              </svg>
            </div>

            {/* Step trigger nodes */}
            {THINKING_STEPS.map((s, idx) => {
              const isActive = idx === activeStepIdx;
              const isPast = idx < activeStepIdx;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStepIdx(idx)}
                  className="flex flex-col items-center gap-3 relative z-10 focus:outline-none transition group"
                  style={{ width: '13%' }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono border-2"
                    style={{
                      background: isActive ? 'rgba(167,139,250,0.2)' : '#080c14',
                      borderColor: isActive ? '#a78bfa' : isPast ? '#60a5fa' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#fff' : isPast ? '#60a5fa' : '#64748b',
                      boxShadow: isActive ? '0 0 20px rgba(167,139,250,0.4)' : 'none',
                    }}
                    whileHover={{ scale: 1.15, borderColor: '#a78bfa' }}
                  >
                    {s.step.split(' ')[1]}
                  </motion.div>

                  <span
                    className="text-[10px] font-mono text-center leading-tight tracking-tight uppercase"
                    style={{
                      color: isActive ? '#a78bfa' : isPast ? '#60a5fa' : '#475569',
                      fontWeight: isActive ? '700' : '500',
                      transition: 'color 0.2s',
                    }}
                  >
                    {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                  </span>
                </button>
              );
            })}

          </div>
        </div>

        {/* Dynamic Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="glass-premium rounded-2xl p-6 md:p-10 border relative overflow-hidden"
            style={{ borderColor: 'rgba(167,139,250,0.3)', boxShadow: '0 20px 80px -20px rgba(167,139,250,0.2)' }}
          >
            <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
              
              {/* Left Column: Stage, Question, & Core Description */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-violet-400 font-bold px-2 py-0.5 rounded border border-violet-400/30 bg-violet-400/5">
                    {activeStep.step.toUpperCase()}
                  </span>
                  <span className="text-slate-400">/ KIMBALL DIMENSIONAL METHODOLOGY</span>
                </div>
                
                <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-100 uppercase tracking-tight">
                  {activeStep.title}
                </h3>

                <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-1">
                  <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Critical Design Question</span>
                  <p className="text-slate-200 text-sm md:text-base font-semibold leading-relaxed">
                    💡 &quot;{activeStep.question}&quot;
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Architectural Objective</span>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                    {activeStep.desc}
                  </p>
                </div>
              </div>

              {/* Right Column: Kimball Tips & Validation Checklist */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-6 lg:border-l lg:border-white/5 lg:pl-8">
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-violet-400/5 border border-violet-400/25 space-y-2">
                    <span className="font-mono text-[9px] text-violet-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      ★ Kimball Methodology Guideline
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed italic">
                      {activeStep.tip}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-2">
                    <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Architect Quality Checklist</span>
                    <div className="flex items-start gap-2 text-xs text-slate-400 leading-normal">
                      <span className="text-emerald-400 font-bold">✔</span>
                      <span>{activeStep.check}</span>
                    </div>
                  </div>
                </div>

                {/* Progress control buttons */}
                <div className="flex gap-2">
                  <button
                    disabled={activeStepIdx === 0}
                    onClick={() => setActiveStepIdx(i => Math.max(0, i - 1))}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    ◀ PREV STEP
                  </button>
                  <button
                    disabled={activeStepIdx === THINKING_STEPS.length - 1}
                    onClick={() => setActiveStepIdx(i => Math.min(THINKING_STEPS.length - 1, i + 1))}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-lg bg-violet-500 hover:bg-violet-400 text-white shadow-[0_0_15px_rgba(167,139,250,0.3)] transition"
                  >
                    NEXT STEP ▶
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
