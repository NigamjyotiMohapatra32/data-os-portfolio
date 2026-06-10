import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionVideoBackground from './SectionVideoBackground';

const KPIS = [
  {
    id: 'loss_ratio',
    name: '1. Actuarial Loss Ratio',
    value: '64.2%',
    trend: '-2.4% MoM',
    color: '#22d3ee',
    formula: 'SUM(claim_amount_approved) / SUM(policy_earned_premium)',
    sources: ['Salesforce CRM', 'OLTP Claims DB'],
    fact: 'FactClaims',
    dims: ['DimPolicy', 'DimDate', 'DimCustomer'],
    freq: 'Daily (02:00 UTC)',
    owner: 'Actuarial Underwriting Team',
    sla: 'Active (SLA < 1.2s)',
    downstream: ['Claims Executive Summary', 'Financial Actuarial Loss Forecasting'],
    chartData: [68.1, 67.4, 66.2, 65.5, 64.8, 64.2]
  },
  {
    id: 'settlement_time',
    name: '2. Claims Settlement Velocity',
    value: '4.8 Days',
    trend: '-0.9 Days MoM',
    color: '#fbbf24',
    formula: 'AVG(claim_settlement_date - claim_intimation_date)',
    sources: ['ERP Staging', 'Claims Log CDC'],
    fact: 'FactClaims',
    dims: ['DimCustomer', 'DimAgent', 'DimDate'],
    freq: 'Daily (Hourly Incremental)',
    owner: 'Claims Operations Team',
    sla: 'Active (SLA < 900ms)',
    downstream: ['Operations SLA Adherence', 'Agent Performance Scorecards'],
    chartData: [5.9, 5.5, 5.2, 5.0, 4.9, 4.8]
  },
  {
    id: 'inventory_turn',
    name: '3. Inventory Turn Rate',
    value: '12.4x',
    trend: '+1.2x MoM',
    color: '#a78bfa',
    formula: 'Cost of Goods Sold / Average Inventory Value',
    sources: ['SAP ERP', 'WMS Scanners'],
    fact: 'FactInventory',
    dims: ['DimProduct', 'DimLocation', 'DimDate'],
    freq: 'Near Real-Time (10m Refresh)',
    owner: 'Supply Chain Operations',
    sla: 'Active (SLA < 1.5s)',
    downstream: ['Warehouse Inventory Optimizer', 'Retail Store Stock Forecasting'],
    chartData: [10.8, 11.2, 11.5, 12.0, 12.2, 12.4]
  },
  {
    id: 'vendor_sla',
    name: '4. Vendor SLA Adherence',
    value: '94.8%',
    trend: '+0.5% MoM',
    color: '#34d399',
    formula: 'COUNT(deliveries_on_time) / COUNT(total_deliveries)',
    sources: ['SAP Logistics', 'IoT Sensor Gateways'],
    fact: 'FactLogistics',
    dims: ['DimAgent', 'DimDate', 'DimLocation'],
    freq: 'Streaming (Flink Pipeline)',
    owner: 'Vendor Management Team',
    sla: 'Warning (Latency Spike)',
    downstream: ['Logistics Performance Board', 'Vendor Renewal Audit Sheets'],
    chartData: [93.1, 93.8, 94.0, 94.2, 94.5, 94.8]
  }
];

export default function KPIIntelligence() {
  const [activeKpiId, setActiveKpiId] = useState('loss_ratio');
  const activeKpi = KPIS.find(k => k.id === activeKpiId);

  return (
    <section id="kpi-intelligence" className="relative py-24 px-4 md:px-8 border-t border-white/5 bg-slate-900 overflow-hidden">
      {/* Background data stream loops */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-grid-loop-31911-large.mp4"
        fallbackType={activeKpi.id === 'loss_ratio' ? 'cyan' : activeKpi.id === 'settlement_time' ? 'amber' : activeKpi.id === 'inventory_turn' ? 'violet' : 'emerald'}
        overlayOpacity={0.92}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="font-mono text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-300">[04]</span>
            <span>KPI_METRICS_LINEAGE</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl grad-text">
            Enterprise KPI Intelligence &amp; Metric Lineage
          </h2>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-violet-400 to-transparent mx-auto" />
          <p className="mt-5 text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
            Every Kimball table is designed with an end-goal: answering business metrics. 
            Select an executive KPI below to inspect its formulas, warehouse fact/dimension mapping, and downstream lineage.
          </p>
        </header>

        {/* Workspace Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Staggered Interactive KPI Cards */}
          <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {KPIS.map((k) => {
              const isActive = k.id === activeKpiId;
              return (
                <button
                  key={k.id}
                  onClick={() => setActiveKpiId(k.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 focus:outline-none flex flex-col justify-between relative group overflow-hidden ${isActive ? 'glass-premium' : 'bg-slate-950/40 hover:bg-slate-900 border-white/5'}`}
                  style={{ borderColor: isActive ? `${k.color}40` : 'rgba(255,255,255,0.05)', minHeight: '140px' }}
                >
                  <div className="flex justify-between items-start w-full relative z-10">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest leading-none">
                      {k.name}
                    </span>
                    <span 
                      className="font-mono text-[9px] px-2 py-0.5 rounded-full border"
                      style={{ color: k.color, borderColor: `${k.color}30`, background: `${k.color}08` }}
                    >
                      {k.freq.split(' ')[0]}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between w-full relative z-10">
                    <span className="font-display font-bold text-3xl text-slate-100">
                      {k.value}
                    </span>
                    <span className="font-mono text-xs text-emerald-400 font-semibold">
                      {k.trend}
                    </span>
                  </div>

                  {/* Tiny chart sparkline */}
                  <div className="mt-3 h-1.5 w-full bg-slate-900 rounded overflow-hidden relative">
                    <div 
                      className="h-full rounded transition-all duration-700" 
                      style={{ 
                        width: '100%', 
                        background: `linear-gradient(90deg, ${k.color} 0%, ${k.color}80 100%)`,
                        boxShadow: `0 0 8px ${k.color}`
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Complete Metric Lineage & Metadata Sheet */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKpiId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="glass-premium rounded-2xl p-6 md:p-8 border h-full flex flex-col justify-between relative overflow-hidden"
                style={{ borderColor: `${activeKpi.color}35`, boxShadow: `0 20px 80px -20px ${activeKpi.color}25` }}
              >
                {/* Visual Ambient */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 10% 90%, ${activeKpi.color}, transparent 65%)` }}
                />

                <div className="space-y-6 relative z-10">
                  {/* KPI header details */}
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <div>
                      <h3 className="font-display font-bold text-xl md:text-2xl text-slate-100 uppercase tracking-tight">
                        {activeKpi.name.split('. ')[1]}
                      </h3>
                      <div className="font-mono text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                        Business Domain Stewardship: <span style={{ color: activeKpi.color }}>{activeKpi.owner}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span 
                        className="font-mono text-xs px-2.5 py-1 rounded border uppercase font-bold"
                        style={{ 
                          color: activeKpi.sla.includes('Warning') ? '#f59e0b' : '#34d399', 
                          borderColor: activeKpi.sla.includes('Warning') ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)',
                          background: activeKpi.sla.includes('Warning') ? 'rgba(245,158,11,0.05)' : 'rgba(52,211,153,0.05)'
                        }}
                      >
                        {activeKpi.sla}
                      </span>
                    </div>
                  </div>

                  {/* SQL formula container */}
                  <div>
                    <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                      KPI Technical Formula (dbt / SQL)
                    </h4>
                    <div className="bg-slate-950 border border-white/5 rounded-xl p-3.5 font-mono text-xs text-slate-200 overflow-x-auto select-all">
                      <span className="text-slate-500 select-none">SELECT</span> {activeKpi.formula} <span className="text-slate-500 select-none">AS metric_val</span>
                    </div>
                  </div>

                  {/* Metadata Mapping (Sources -> Facts -> Dims) */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-1">
                      <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Source Systems</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeKpi.sources.map(s => (
                          <span key={s} className="text-xs text-slate-300 font-semibold">● {s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-1">
                      <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Fact Table Query</span>
                      <span className="text-xs text-slate-200 font-bold block mt-1" style={{ color: activeKpi.color }}>
                        ★ {activeKpi.fact}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-1">
                      <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider">Conformed Dims Used</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeKpi.dims.map(d => (
                          <span key={d} className="text-[11px] text-slate-300 font-mono">◆ {d}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Metric Lineage SVG Map */}
                  <div>
                    <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                      End-to-End Metric Lineage Flow
                    </h4>
                    
                    <div className="glass bg-slate-950/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 relative">
                      {/* Flow nodes visual */}
                      <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-between font-mono text-[10px]">
                        
                        {/* 1. Sources */}
                        <div className="flex flex-col items-center p-2 rounded border border-white/10 bg-slate-900 w-full md:w-[28%] text-center">
                          <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px]">Ingest Sources</span>
                          <span className="text-slate-300 font-bold truncate w-full">{activeKpi.sources[0]}</span>
                        </div>

                        <div className="text-slate-600 hidden md:block">──▶</div>

                        {/* 2. Fact Table */}
                        <div 
                          className="flex flex-col items-center p-2 rounded border w-full md:w-[32%] text-center"
                          style={{ borderColor: `${activeKpi.color}40`, background: `${activeKpi.color}08` }}
                        >
                          <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px]">Gold Kimball DWH</span>
                          <span className="font-bold truncate w-full" style={{ color: activeKpi.color }}>{activeKpi.fact}</span>
                        </div>

                        <div className="text-slate-600 hidden md:block">──▶</div>

                        {/* 3. Downstream Report */}
                        <div className="flex flex-col items-center p-2 rounded border border-white/10 bg-slate-900 w-full md:w-[32%] text-center">
                          <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px]">Power BI Dashboard</span>
                          <span className="text-slate-300 font-bold truncate w-full">{activeKpi.downstream[0]}</span>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>

                <div className="font-mono text-[10px] text-slate-500 border-t border-white/5 pt-4 mt-6">
                  * Dynamic conformed schemas ensure that the Actuarial loss ratios and inventory velocity metrics are aggregated on-the-fly under 1.5 seconds.
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
