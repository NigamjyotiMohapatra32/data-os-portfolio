import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionVideoBackground from './SectionVideoBackground';

// 1. Unified Metadata Schemas & Business glossary mappings
const SCHEMA_TABLES = {
  fact_claims: {
    name: 'FactClaims',
    type: 'fact',
    color: '#fb923c', // Orange
    grain: 'One individual insurance claim transaction intimation line item.',
    freshness: '15m refresh latency',
    glossary: 'Fact table storing numeric claim measurements and conformed dimensional foreign keys.',
    columns: [
      { name: 'claim_key', type: 'INT', role: 'PK / Surrogate', desc: 'Unique surrogate key for each claim row' },
      { name: 'policy_key', type: 'INT', role: 'FK -> DimPolicy', desc: 'Refers to DimPolicy conformed surrogate' },
      { name: 'customer_key', type: 'INT', role: 'FK -> DimCustomer', desc: 'Refers to DimCustomer conformed surrogate' },
      { name: 'agent_key', type: 'INT', role: 'FK -> DimAgent', desc: 'Refers to DimAgent conformed surrogate' },
      { name: 'date_key', type: 'INT', role: 'FK -> DimDate', desc: 'Refers to DimDate static dimension key' },
      { name: 'claim_amount', type: 'DECIMAL(14,2)', role: 'Measure', desc: 'Gross amount intimated by customer' },
      { name: 'approved_amount', type: 'DECIMAL(14,2)', role: 'Measure', desc: 'Net amount approved by underwriter' },
      { name: 'status', type: 'VARCHAR(30)', role: 'Attribute (Degenerate)', desc: 'Operational status (e.g. APPROVED, IN_Triage)' }
    ]
  },
  dim_customer: {
    name: 'DimCustomer',
    type: 'dim',
    color: '#22d3ee', // Cyan
    grain: 'One individual corporate customer record.',
    freshness: 'Daily incremental refresh',
    glossary: 'Slowly Changing Dimension tracking customer biographical details.',
    columns: [
      { name: 'customer_key', type: 'INT', role: 'PK / Surrogate', desc: 'System generated unique integer key' },
      { name: 'customer_no', type: 'VARCHAR(30)', role: 'Natural Key', desc: 'Unique identifier from source CRM' },
      { name: 'full_name', type: 'VARCHAR(120)', role: 'Attribute', desc: 'Customer conformed legal name' },
      { name: 'dob', type: 'DATE', role: 'Attribute', desc: 'Customer date of birth' },
      { name: 'email', type: 'VARCHAR(120)', role: 'Attribute', desc: 'Validated email contact address' },
      { name: 'segment', type: 'VARCHAR(40)', role: 'Attribute', desc: 'Marketing cohort category assignment' }
    ]
  },
  dim_policy: {
    name: 'DimPolicy',
    type: 'dim',
    color: '#a78bfa', // Purple
    grain: 'One unique insurance contract agreement.',
    freshness: 'Hourly incremental refresh',
    glossary: 'Shared dimensional model detailing coverage types and limits.',
    columns: [
      { name: 'policy_key', type: 'INT', role: 'PK / Surrogate', desc: 'Generated policy surrogate identifier' },
      { name: 'policy_no', type: 'VARCHAR(30)', role: 'Natural Key', desc: 'Contract code from core insurance engine' },
      { name: 'policy_type', type: 'VARCHAR(50)', role: 'Attribute', desc: 'Insurance category (e.g. Auto, Home, Health)' },
      { name: 'inception_date', type: 'DATE', role: 'Attribute', desc: 'Effective start date of policy coverage' },
      { name: 'expiry_date', type: 'DATE', role: 'Attribute', desc: 'Maturity end date of policy coverage' }
    ]
  },
  dim_date: {
    name: 'DimDate',
    type: 'dim',
    color: '#60a5fa', // Blue
    grain: 'One calendar day record.',
    freshness: 'Static load (10 years pre-generated)',
    glossary: 'Conformed static time dimension mapped to calendar and fiscal years.',
    columns: [
      { name: 'date_key', type: 'INT', role: 'PK / Static', desc: 'Smart key format YYYYMMDD' },
      { name: 'full_date', type: 'DATE', role: 'Attribute', desc: 'Calendar date date-type value' },
      { name: 'year', type: 'INT', role: 'Attribute', desc: 'Calendar year numeric representation' },
      { name: 'quarter', type: 'INT', role: 'Attribute', desc: 'Fiscal quarter (1 to 4)' },
      { name: 'month', type: 'INT', role: 'Attribute', desc: 'Calendar month number (1 to 12)' },
      { name: 'is_holiday', type: 'BOOLEAN', role: 'Attribute', desc: 'True if date is corporate national holiday' }
    ]
  },
  dim_agent: {
    name: 'DimAgent',
    type: 'dim',
    color: '#34d399', // Emerald
    grain: 'One individual sales advisor or underwriting broker.',
    freshness: 'Weekly refresh',
    glossary: 'Tracks licensed brokers and internal agents routing transaction orders.',
    columns: [
      { name: 'agent_key', type: 'INT', role: 'PK / Surrogate', desc: 'Agent unique surrogate identifier' },
      { name: 'agent_code', type: 'VARCHAR(20)', role: 'Natural Key', desc: 'Broker license identifier from portal CRM' },
      { name: 'agent_name', type: 'VARCHAR(120)', role: 'Attribute', desc: 'Agent conformed legal name' },
      { name: 'branch', type: 'VARCHAR(80)', role: 'Attribute', desc: 'Regional office cluster assignment' }
    ]
  },
  dim_customer_demographics: {
    name: 'DimDemographics',
    type: 'snow',
    color: '#06d6a0', // Teal
    grain: 'Normalized demographics bucket per customer.',
    freshness: 'Monthly recalculation',
    glossary: 'Normalized branch tracking credit scores and risk indexes.',
    columns: [
      { name: 'customer_key', type: 'INT', role: 'FK -> DimCustomer', desc: 'Links demographics details back' },
      { name: 'income_band', type: 'VARCHAR(40)', role: 'Attribute', desc: 'Customer household income range' },
      { name: 'credit_score', type: 'INT', role: 'Attribute', desc: 'Monitored fiscal trustworthiness score' },
      { name: 'risk_profile', type: 'VARCHAR(30)', role: 'Attribute', desc: 'Actuarial profile assignment' }
    ]
  },
  dim_agent_region: {
    name: 'DimRegion',
    type: 'snow',
    color: '#f472b6', // Pink
    grain: 'Normalized regional territory definition.',
    freshness: 'Static load',
    glossary: 'Normalized branch tracking regional maps and state codes.',
    columns: [
      { name: 'branch', type: 'VARCHAR(80)', role: 'FK -> DimAgent', desc: 'Links agent branch details back' },
      { name: 'region_name', type: 'VARCHAR(60)', role: 'Attribute', desc: 'Corporate territory cluster' },
      { name: 'country', type: 'VARCHAR(60)', role: 'Attribute', desc: 'Sovereign nation string code' },
      { name: 'postal_code', type: 'VARCHAR(10)', role: 'Attribute', desc: 'State zip or routing code' }
    ]
  }
};

// 2. Kimball SCD Timeline Transaction Sandbox Data
const SCD_OVERVIEW = {
  type1: {
    title: 'SCD Type 1 (Overwrite History)',
    description: 'When an attribute changes, the old value is directly overwritten in place. Historical records are NOT kept. Great for correcting errors, but loses temporal trends.',
    table_headers: ['customer_key', 'full_name', 'city', 'last_updated'],
    before: [
      { key: '101', name: 'Nigamjyoti Mohapatra', city: 'Bangalore', date: '2021-05-10' }
    ],
    after: [
      { key: '101', name: 'Nigamjyoti Mohapatra', city: 'Mumbai (Overwritten)', date: '2024-11-20' }
    ],
    sql: `-- Compilation Success (Latency: 1ms)
UPDATE dbo.dim_customer 
SET city = 'Mumbai', last_updated = '2024-11-20' 
WHERE customer_key = 101;`,
    highlight: 'Notice that Nigamjyoti\'s key stays 101, and the City is updated directly. History of "Bangalore" is permanently erased.'
  },
  type2: {
    title: 'SCD Type 2 (Historical Row Timeline)',
    description: 'When an attribute changes, the existing row is marked expired (is_current = 0, expiry_date = change_date), and a brand-new row is inserted (is_current = 1, effective_date = change_date, expiry_date = 9999-12-31) with a new Surrogate Key. This is Kimball\'s best practice for preserving history.',
    table_headers: ['customer_key', 'full_name', 'city', 'effective_date', 'expiry_date', 'is_current'],
    before: [
      { key: '101', name: 'Nigamjyoti Mohapatra', city: 'Bangalore', start: '2021-05-10', end: '9999-12-31', cur: '1' }
    ],
    after: [
      { key: '101', name: 'Nigamjyoti Mohapatra', city: 'Bangalore', start: '2021-05-10', end: '2024-11-20', cur: '0', expired: true },
      { key: '102', name: 'Nigamjyoti Mohapatra', city: 'Mumbai (New Row)', start: '2024-11-20', end: '9999-12-31', cur: '1', active: true }
    ],
    sql: `-- Compilation Success (Latency: 4ms)
UPDATE dbo.dim_customer 
SET expiry_date = '2024-11-20', is_current = 0 
WHERE customer_key = 101;

INSERT INTO dbo.dim_customer (customer_key, full_name, city, effective_date, expiry_date, is_current)
VALUES (102, 'Nigamjyoti Mohapatra', 'Mumbai', '2024-11-20', '9999-12-31', 1);`,
    highlight: 'Notice a new Surrogate Key (102) is generated for Mumbai, while row 101 is expired. We can perfectly query historical metrics for both periods!'
  },
  type3: {
    title: 'SCD Type 3 (Prior / Current Columns)',
    description: 'When an attribute changes, the prior value is pushed into a "prior" column, and the "current" column is updated. Only tracks the immediate past change, keeping a slim footprint.',
    table_headers: ['customer_key', 'full_name', 'city_current', 'city_prior', 'last_updated'],
    before: [
      { key: '101', name: 'Nigamjyoti Mohapatra', current: 'Bangalore', prior: 'NULL', date: '2021-05-10' }
    ],
    after: [
      { key: '101', name: 'Nigamjyoti Mohapatra', current: 'Mumbai (Current)', prior: 'Bangalore (Prior)', date: '2024-11-20' }
    ],
    sql: `-- Compilation Success (Latency: 2ms)
UPDATE dbo.dim_customer 
SET city_prior = city_current, city_current = 'Mumbai', last_updated = '2024-11-20' 
WHERE customer_key = 101;`,
    highlight: 'Both current ("Mumbai") and prior ("Bangalore") values are saved side-by-side in the same customer row. No new keys or rows are created.'
  }
};

export default function DataModelingShowcase() {
  const [modelType, setModelType] = useState('star'); // star vs snowflake
  const [selectedTable, setSelectedTable] = useState('fact_claims');
  const [scdType, setScdType] = useState('type2'); // type1, type2, type3
  const [scdStep, setScdStep] = useState('before'); // before vs after
  const [hoveredTable, setHoveredTable] = useState(null);

  // Immersive Mode States
  const [isImmersive, setIsImmersive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragStart, setDragStart] = useState(null);

  // Shape library custom tables spawned list
  const [spawnedTables, setSpawnedTables] = useState([]);
  const [joinSuggestions, setJoinSuggestions] = useState(false);

  const isSnowflake = modelType === 'snowflake';
  const tableData = SCHEMA_TABLES[selectedTable] || spawnedTables.find(t => t.id === selectedTable);

  // Mouse Pan Handlers for immersive canvas
  const handleMouseDown = (e) => {
    if (!isImmersive) return;
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };
  const handleMouseMove = (e) => {
    if (!isImmersive || !dragStart) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };
  const handleMouseUp = () => {
    setDragStart(null);
  };

  // Spawn custom library template
  const spawnLibraryTable = (type) => {
    const spawnedCount = spawnedTables.length + 1;
    const newTable = {
      id: `spawn_${type}_${spawnedCount}`,
      name: type === 'sales' ? `FactSales_${spawnedCount}` : `DimProduct_${spawnedCount}`,
      type: type === 'sales' ? 'fact' : 'dim',
      color: type === 'sales' ? '#fb72b6' : '#06d6a0',
      grain: type === 'sales' ? 'One individual sales receipt transaction line item.' : 'One product catalog serial item.',
      freshness: '10m streaming fresh',
      glossary: 'Interactive spawned template table.',
      columns: type === 'sales' 
        ? [
            { name: 'sales_key', type: 'INT', role: 'PK / Surrogate', desc: 'Spawned sales primary key' },
            { name: 'customer_key', type: 'INT', role: 'FK -> DimCustomer', desc: 'Links back to conformed DimCustomer' },
            { name: 'product_key', type: 'INT', role: 'FK -> DimProduct', desc: 'Links to conformed DimProduct' },
            { name: 'quantity', type: 'INT', role: 'Measure', desc: 'Sales order quantity amount' },
            { name: 'sales_amount', type: 'DECIMAL(12,2)', role: 'Measure', desc: 'Gross transactional amount value' }
          ]
        : [
            { name: 'product_key', type: 'INT', role: 'PK / Surrogate', desc: 'Spawned product primary key' },
            { name: 'sku', type: 'VARCHAR(40)', role: 'Natural Key', desc: 'Stock keeping unit identifier' },
            { name: 'product_name', type: 'VARCHAR(120)', role: 'Attribute', desc: 'Retail catalog label descriptor' },
            { name: 'unit_price', type: 'DECIMAL(10,2)', role: 'Attribute', desc: 'Product standardized pricing amount' }
          ]
    };
    setSpawnedTables([...spawnedTables, newTable]);
    setSelectedTable(newTable.id);
  };

  // Naming Standard Validator Checker
  const checkNamingHealth = () => {
    let score = 100;
    const errors = [];
    Object.values(SCHEMA_TABLES).forEach(t => {
      if (t.type === 'fact' && !t.name.toLowerCase().startsWith('fact')) {
        score -= 10;
        errors.push(`Table ${t.name} must start with 'Fact' prefix.`);
      }
      if ((t.type === 'dim' || t.type === 'snow') && !t.name.toLowerCase().startsWith('dim')) {
        score -= 10;
        errors.push(`Table ${t.name} must start with 'Dim' prefix.`);
      }
      const hasPK = t.columns.some(c => c.role.includes('PK'));
      if (!hasPK) {
        score -= 15;
        errors.push(`Table ${t.name} is missing a Primary Key (PK).`);
      }
    });
    return { score: Math.max(0, score), errors };
  };

  const validation = checkNamingHealth();

  return (
    <section id="modeling-showcase" className="relative py-24 px-4 md:px-8 border-t border-white/5 bg-slate-900 overflow-hidden">
      {/* Background visual loop */}
      <SectionVideoBackground 
        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-digital-grids-and-data-matrix-loop-31907-large.mp4"
        fallbackType="violet"
        overlayOpacity={0.93}
      />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Section Header */}
        <header className="mb-14 text-center">
          <div className="font-mono text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-300">[05]</span>
            <span>DATA_MODELING_LAB</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl grad-text">
            Enterprise Interactive Data Modeling Platform
          </h2>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-violet-400 to-transparent mx-auto" />
          <p className="mt-5 text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
            A comprehensive, interactive corporate modeling workbench. 
            Toggle layouts, trigger slowly changing dimension transaction logs, spawn shape libraries, or inspect schemas in full-page immersive studio mode.
          </p>
        </header>

        {/* ── Sub-Section 1: Enterprise Schema Canvas Workspace ── */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* Left Column: Interactive Diagram Canvas (Supports Immersive Full Screen modal) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Controller toolbar */}
            <div className="glass rounded-xl p-4 flex justify-between items-center flex-wrap gap-4 border border-white/5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-300 uppercase tracking-wider font-bold">
                  Interactive ER Canvas
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DWH Layer: conformed
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModelType('star')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono border transition ${!isSnowflake ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}
                >
                  Star Schema
                </button>
                <button
                  onClick={() => setModelType('snowflake')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono border transition ${isSnowflake ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}
                >
                  Snowflake Schema
                </button>
                <button
                  onClick={() => setIsImmersive(true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono border border-violet-400/40 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20 shadow-[0_0_12px_rgba(167,139,250,0.15)] transition"
                  title="Open full page immersive modeling workspace studio"
                >
                  ⚡ Immersive Studio Mode
                </button>
              </div>
            </div>

            {/* Main Interactive Diagram Canvas container */}
            <div className="glass rounded-2xl p-6 bg-slate-950/90 aspect-[1.5] flex items-center justify-center relative overflow-hidden border border-white/5">
              
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button 
                  onClick={() => spawnLibraryTable('sales')}
                  className="px-2.5 py-1 rounded bg-white/2 border border-white/5 text-[10px] font-mono hover:bg-white/5 text-slate-300 flex items-center gap-1"
                >
                  ➕ Spawn Fact Table
                </button>
                <button 
                  onClick={() => spawnLibraryTable('product')}
                  className="px-2.5 py-1 rounded bg-white/2 border border-white/5 text-[10px] font-mono hover:bg-white/5 text-slate-300 flex items-center gap-1"
                >
                  ➕ Spawn Dim Table
                </button>
                <button 
                  onClick={() => setJoinSuggestions(!joinSuggestions)}
                  className={`px-2.5 py-1 rounded border text-[10px] font-mono transition ${joinSuggestions ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/5 bg-white/2 text-slate-300'}`}
                >
                  ⚡ Suggest Joins
                </button>
              </div>

              {/* ER SVG Connection Lines grid */}
              <div className="w-full h-full relative flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  <defs>
                    <linearGradient id="pathGlowGrad" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>

                  {/* Schema connection vectors with animated dynamic paths */}
                  <g stroke="#ffffff10" strokeWidth="1.5">
                    {/* FactClaims <-> DimCustomer */}
                    <path 
                      d="M 50% 50% Q 35% 38% 20% 25%" 
                      stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_customer' || selectedTable === 'dim_customer') ? '#22d3ee' : '#ffffff10'}
                      strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_customer' || selectedTable === 'dim_customer') ? '3.5' : '1.5'}
                      fill="none"
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />
                    
                    {/* FactClaims <-> DimPolicy */}
                    <path 
                      d="M 50% 50% Q 65% 38% 80% 25%" 
                      stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_policy' || selectedTable === 'dim_policy') ? '#a78bfa' : '#ffffff10'}
                      strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_policy' || selectedTable === 'dim_policy') ? '3.5' : '1.5'}
                      fill="none"
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />

                    {/* FactClaims <-> DimDate */}
                    <path 
                      d="M 50% 50% Q 35% 62% 20% 75%" 
                      stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_date' || selectedTable === 'dim_date') ? '#60a5fa' : '#ffffff10'}
                      strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_date' || selectedTable === 'dim_date') ? '3.5' : '1.5'}
                      fill="none"
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />

                    {/* FactClaims <-> DimAgent */}
                    <path 
                      d="M 50% 50% Q 65% 62% 80% 75%" 
                      stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_agent' || selectedTable === 'dim_agent') ? '#34d399' : '#ffffff10'}
                      strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_agent' || selectedTable === 'dim_agent') ? '3.5' : '1.5'}
                      fill="none"
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />

                    {/* Normalized branches (Snowflake only) */}
                    {isSnowflake && (
                      <>
                        <path 
                          d="M 20% 25% L 7% 10%" 
                          stroke={(hoveredTable === 'dim_customer' || hoveredTable === 'dim_customer_demographics' || selectedTable === 'dim_customer_demographics') ? '#06d6a0' : '#ffffff15'}
                          strokeWidth={(hoveredTable === 'dim_customer' || hoveredTable === 'dim_customer_demographics' || selectedTable === 'dim_customer_demographics') ? '3' : '1.2'}
                          fill="none"
                        />
                        <path 
                          d="M 80% 75% L 93% 90%" 
                          stroke={(hoveredTable === 'dim_agent' || hoveredTable === 'dim_agent_region' || selectedTable === 'dim_agent_region') ? '#f472b6' : '#ffffff15'}
                          strokeWidth={(hoveredTable === 'dim_agent' || hoveredTable === 'dim_agent_region' || selectedTable === 'dim_agent_region') ? '3' : '1.2'}
                          fill="none"
                        />
                      </>
                    )}

                    {/* Suggested Joins visually glowing path */}
                    {joinSuggestions && spawnedTables.length > 0 && (
                      <path 
                        d="M 50% 50% C 50% 20% 10% 20% 7% 10%" 
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        fill="none"
                        className="flow-line"
                      />
                    )}
                  </g>
                </svg>

                {/* Table nodes positioning mapping */}
                
                {/* FactClaims (Center node) */}
                <motion.button
                  onClick={() => setSelectedTable('fact_claims')}
                  onMouseEnter={() => setHoveredTable('fact_claims')}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`absolute w-36 h-20 rounded-xl border flex flex-col justify-center items-center shadow-lg transition duration-200 focus:outline-none ${selectedTable === 'fact_claims' ? 'border-orange-400 bg-orange-400/10 shadow-[0_0_25px_rgba(251,146,60,0.35)]' : 'border-white/10 bg-slate-900 hover:border-orange-400/40 text-slate-300'}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ top: 'calc(50% - 40px)', left: 'calc(50% - 72px)' }}
                >
                  <span className="text-xl mb-0.5">★</span>
                  <span className="font-mono text-xs font-bold leading-none">FactClaims</span>
                  <span className="text-[8px] text-orange-400/80 font-mono tracking-widest mt-1 uppercase">FACT</span>
                </motion.button>

                {/* Dim Customer */}
                <motion.button
                  onClick={() => setSelectedTable('dim_customer')}
                  onMouseEnter={() => setHoveredTable('dim_customer')}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg transition focus:outline-none ${selectedTable === 'dim_customer' ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10 bg-slate-900 hover:border-cyan-400/40 text-slate-300'}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ top: '15%', left: '7%' }}
                >
                  <span className="font-mono text-xs font-bold leading-none">DimCustomer</span>
                  <span className="text-[8px] text-cyan-400/80 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                </motion.button>

                {/* Dim Policy */}
                <motion.button
                  onClick={() => setSelectedTable('dim_policy')}
                  onMouseEnter={() => setHoveredTable('dim_policy')}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg transition focus:outline-none ${selectedTable === 'dim_policy' ? 'border-violet-400 bg-violet-400/10 shadow-[0_0_20px_rgba(167,139,250,0.3)]' : 'border-white/10 bg-slate-900 hover:border-violet-400/40 text-slate-300'}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ top: '15%', right: '7%' }}
                >
                  <span className="font-mono text-xs font-bold leading-none">DimPolicy</span>
                  <span className="text-[8px] text-violet-400/80 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                </motion.button>

                {/* Dim Date */}
                <motion.button
                  onClick={() => setSelectedTable('dim_date')}
                  onMouseEnter={() => setHoveredTable('dim_date')}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg transition focus:outline-none ${selectedTable === 'dim_date' ? 'border-blue-400 bg-blue-400/10 shadow-[0_0_20px_rgba(96,105,250,0.3)]' : 'border-white/10 bg-slate-900 hover:border-blue-400/40 text-slate-300'}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ bottom: '15%', left: '7%' }}
                >
                  <span className="font-mono text-xs font-bold leading-none">DimDate</span>
                  <span className="text-[8px] text-blue-400/80 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                </motion.button>

                {/* Dim Agent */}
                <motion.button
                  onClick={() => setSelectedTable('dim_agent')}
                  onMouseEnter={() => setHoveredTable('dim_agent')}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg transition focus:outline-none ${selectedTable === 'dim_agent' ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-white/10 bg-slate-900 hover:border-emerald-400/40 text-slate-300'}`}
                  whileHover={{ scale: 1.05 }}
                  style={{ bottom: '15%', right: '7%' }}
                >
                  <span className="font-mono text-xs font-bold leading-none">DimAgent</span>
                  <span className="text-[8px] text-emerald-400/80 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                </motion.button>

                {/* Spawned library tables nodes */}
                {spawnedTables.map((sTable, _idx) => (
                  <motion.button
                    key={sTable.id}
                    onClick={() => setSelectedTable(sTable.id)}
                    className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md transition focus:outline-none`}
                    style={{ 
                      top: '2%', 
                      left: '35%',
                      borderColor: selectedTable === sTable.id ? sTable.color : 'rgba(255,255,255,0.08)',
                      background: selectedTable === sTable.id ? `${sTable.color}15` : '#0f172a'
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="font-mono text-[10px] font-bold truncate w-full px-1 text-center">{sTable.name}</span>
                    <span className="text-[7px] font-mono mt-0.5" style={{ color: sTable.color }}>SPAWNED</span>
                  </motion.button>
                ))}

                {/* Snowflake Normalized sub-dimensions */}
                <AnimatePresence>
                  {isSnowflake && (
                    <>
                      {/* Demographics off Customer */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSelectedTable('dim_customer_demographics')}
                        className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md transition focus:outline-none ${selectedTable === 'dim_customer_demographics' ? 'border-teal-400 bg-teal-400/10 shadow-[0_0_15px_rgba(6,214,160,0.3)]' : 'border-white/5 bg-slate-950 text-slate-400 hover:border-teal-400/40'}`}
                        style={{ top: '2%', left: '0%' }}
                      >
                        <span className="font-mono text-[9px] font-bold">DimDemographics</span>
                        <span className="text-[6.5px] text-teal-400 font-mono mt-0.5 tracking-wider uppercase">SNOWFLAKE</span>
                      </motion.button>

                      {/* Region off Agent */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSelectedTable('dim_agent_region')}
                        className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md transition focus:outline-none ${selectedTable === 'dim_agent_region' ? 'border-pink-400 bg-pink-400/10 shadow-[0_0_15px_rgba(244,114,182,0.3)]' : 'border-white/5 bg-slate-950 text-slate-400 hover:border-pink-400/40'}`}
                        style={{ bottom: '2%', right: '0%' }}
                      >
                        <span className="font-mono text-[9px] font-bold">DimRegion</span>
                        <span className="text-[6.5px] text-pink-400 font-mono mt-0.5 tracking-wider uppercase">SNOWFLAKE</span>
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>

          {/* Right Column: Column Schema Inspector & Glossary Info Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Health Score / Validator indicator */}
            <div className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">
                  Naming &amp; Schema Health
                </span>
                <span className="text-slate-300 font-bold block mt-1 font-mono">
                  Score: {validation.score}%
                </span>
              </div>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${validation.score > 85 ? 'border-emerald-400 bg-emerald-400/5 text-emerald-400' : 'border-amber-400 bg-amber-400/5 text-amber-400'}`}>
                {validation.score > 85 ? 'EXCELLENT' : 'WARN'}
              </span>
            </div>

            {/* Main Table details card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTable}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="glass rounded-2xl p-5 border flex flex-col justify-between"
                style={{ borderColor: `${tableData.color}35`, minHeight: '380px' }}
              >
                <div>
                  <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/5">
                    <span 
                      className="font-mono text-sm font-bold uppercase tracking-tight"
                      style={{ color: tableData.color }}
                    >
                      {tableData.name}
                    </span>
                    <span 
                      className="font-mono text-[8px] px-2 py-0.5 rounded border uppercase"
                      style={{ color: tableData.color, borderColor: `${tableData.color}40`, background: `${tableData.color}08` }}
                    >
                      {tableData.type}
                    </span>
                  </div>

                  {/* Business definitions & grain details */}
                  <div className="mb-4 space-y-1 bg-white/2 border border-white/5 p-2.5 rounded-lg text-xs leading-normal">
                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block">Atomic Grain</span>
                    <span className="text-slate-300 block">{tableData.grain}</span>
                    
                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block mt-2">Business Glossary Definition</span>
                    <p className="text-slate-400 block text-[11px] leading-tight italic">{tableData.glossary}</p>
                  </div>

                  {/* Schema Columns list */}
                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {tableData.columns.map((col, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded bg-white/2 border border-white/5 font-mono text-[11px] hover:border-white/10 group cursor-default"
                        title={col.desc}
                      >
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: tableData.color }}>
                            {col.role.includes('PK') ? '🔑' : col.role.includes('FK') ? '🔗' : '▫️'}
                          </span>
                          <span className="text-slate-200 font-bold group-hover:text-cyan-300 transition-colors">{col.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[9px]">{col.type}</span>
                          <span 
                            className="text-[8px] px-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                            style={{ color: col.role.includes('PK') || col.role.includes('FK') ? tableData.color : '#64748b' }}
                          >
                            {col.role.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="font-mono text-[9px] text-slate-500 border-t border-white/5 pt-3 mt-4">
                  * Data Freshness SLA: <span style={{ color: tableData.color }}>{tableData.freshness}</span>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Sub-Section 2: Kimball Slowly Changing Dimension (SCD) Sandbox ── */}
        <div className="glass rounded-2xl p-6 md:p-8 border border-white/5 bg-slate-950/90 relative overflow-hidden">
          {/* Subtle violet overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />

          <header className="mb-8 flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4 relative z-10">
            <div>
              <h3 className="font-display font-semibold text-lg md:text-xl text-slate-100">
                Slowly Changing Dimension (SCD) Database Sandbox
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Trigger database updates in real-time to visualize Kimball Type 1, 2, and 3 address updates.
              </p>
            </div>
            {/* SCD Type selectors */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(SCD_OVERVIEW).map(([key, _item]) => (
                <button
                  key={key}
                  onClick={() => { setScdType(key); setScdStep('before'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${scdType === key ? 'border-violet-400 bg-violet-400/10 text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.25)]' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          {/* Sandbox content grid */}
          <div className="grid lg:grid-cols-12 gap-8 mb-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-mono text-xs text-violet-400 uppercase tracking-widest font-bold">
                {SCD_OVERVIEW[scdType].title}
              </h4>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {SCD_OVERVIEW[scdType].description}
              </p>
              <div className="font-mono text-[11px] text-amber-300/90 bg-amber-400/5 border border-amber-400/20 p-3 rounded-lg flex items-start gap-2">
                <span className="text-xs">⚠️</span>
                <span>
                  <strong>Scenario:</strong> Nigamjyoti Mohapatra moves his residence from <strong>Bangalore</strong> to <strong>Mumbai</strong> on November 20, 2024.
                </span>
              </div>
            </div>

            {/* Run transaction trigger button */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center gap-3 bg-slate-900/50 border border-white/5 rounded-xl p-5">
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                Analytics DWH Engine
              </span>
              <button
                onClick={() => setScdStep(scdStep === 'before' ? 'after' : 'before')}
                className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold border transition ${scdStep === 'before' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : 'border-rose-400 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20 shadow-[0_0_20px_rgba(244,114,182,0.15)]'}`}
              >
                {scdStep === 'before' ? '▶ Trigger UPDATE dim_customer' : '🔄 Rollback Transaction'}
              </button>
              <div className="text-[8.5px] text-slate-500 font-mono text-center leading-none">
                {scdStep === 'before' ? 'Current state: Bangalore (Before update)' : 'Current state: Mumbai (After transaction)'}
              </div>
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto rounded-lg border border-white/5 mb-6 relative z-10">
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-left border-b border-white/10">
                  {SCD_OVERVIEW[scdType].table_headers.map((h) => (
                    <th key={h} className="p-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {(scdStep === 'before' ? SCD_OVERVIEW[scdType].before : SCD_OVERVIEW[scdType].after).map((row, idx) => (
                    <motion.tr
                      key={row.key || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`border-b border-white/5 transition-colors ${row.active ? 'bg-emerald-500/5' : row.expired ? 'bg-slate-950 text-slate-600' : 'bg-transparent'}`}
                    >
                      {SCD_OVERVIEW[scdType].table_headers.map((colName) => {
                        let cellVal = '';
                        if (scdType === 'type1') {
                          if (colName === 'customer_key') cellVal = row.key;
                          if (colName === 'full_name') cellVal = row.name;
                          if (colName === 'city') cellVal = row.city;
                          if (colName === 'last_updated') cellVal = row.date;
                        } else if (scdType === 'type2') {
                          if (colName === 'customer_key') cellVal = row.key;
                          if (colName === 'full_name') cellVal = row.name;
                          if (colName === 'city') cellVal = row.city;
                          if (colName === 'effective_date') cellVal = row.start;
                          if (colName === 'expiry_date') cellVal = row.end;
                          if (colName === 'is_current') cellVal = row.cur;
                        } else if (scdType === 'type3') {
                          if (colName === 'customer_key') cellVal = row.key;
                          if (colName === 'full_name') cellVal = row.name;
                          if (colName === 'city_current') cellVal = row.current;
                          if (colName === 'city_prior') cellVal = row.prior;
                          if (colName === 'last_updated') cellVal = row.date;
                        }
                        
                        const isHighlight = colName.includes('city') && scdStep === 'after' && cellVal.includes('Mumbai');

                        return (
                          <td key={colName} className="p-3">
                            <span 
                              className={`transition-all duration-500 px-1.5 py-0.5 rounded ${isHighlight ? 'bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]' : ''}`}
                            >
                              {cellVal}
                            </span>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Real-time T-SQL transaction compiler emulator */}
          <div className="space-y-2 relative z-10 mb-6">
            <div className="flex justify-between items-center font-mono text-[9px] text-slate-500">
              <span>SQL Server 2022 / T-SQL DML Compiler</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DML active
              </span>
            </div>
            <div className="bg-slate-950/80 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-cyan-300/90 shadow-[inset_0_0_20px_rgba(34,211,238,0.03)] overflow-x-auto max-h-[150px]">
              <div className="text-slate-500 select-none border-b border-white/5 pb-1.5 mb-2">
                -- Simulated transaction console logs --
              </div>
              {scdStep === 'before' ? (
                <span className="text-slate-500">-- Awaiting DML transaction trigger...</span>
              ) : (
                <pre className="text-cyan-300 select-all leading-normal">{SCD_OVERVIEW[scdType].sql}</pre>
              )}
            </div>
          </div>

          <div className="font-mono text-[10px] text-slate-400 bg-white/2 p-3.5 rounded-lg border border-white/5 relative z-10 leading-relaxed">
            💡 <strong>Observation:</strong> {scdStep === 'before' ? 'The customer record represents the initial address prior to any modification.' : SCD_OVERVIEW[scdType].highlight}
          </div>

        </div>

      </div>

      {/* ── Immersive Full Screen ER Studio Modal ── */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950 flex flex-col"
          >
            {/* Modal Header Controls */}
            <header className="h-16 px-6 bg-slate-900 border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <span className="text-2xl">💎</span>
                <div>
                  <h3 className="font-display font-bold text-slate-100 uppercase tracking-tight text-sm">
                    Immersive Data Modeling Studio
                  </h3>
                  <p className="text-[9.5px] font-mono text-slate-500 leading-none">
                    Nigamjyoti Mohapatra · Dimensional Architecture Studio
                  </p>
                </div>
              </div>

              {/* Navigation scale sliders */}
              <div className="flex items-center gap-6 font-mono text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Zoom:</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-24 accent-violet-400"
                  />
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <button 
                  onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                  className="px-2 py-1 rounded bg-white/2 border border-white/10 hover:border-white/20 text-slate-300"
                >
                  Reset View
                </button>
              </div>

              <button
                onClick={() => setIsImmersive(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] transition"
              >
                ✕ Close Studio
              </button>
            </header>

            {/* Studio Workspace container */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Left Panel: Entity Spawner shape library */}
              <div className="w-64 border-r border-white/5 bg-slate-950 p-5 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                    Shape Library
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => spawnLibraryTable('sales')}
                      className="w-full p-4 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 hover:border-violet-500/30 text-left transition flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-orange-400/10 text-orange-400 border border-orange-400/20 group-hover:shadow-[0_0_10px_rgba(251,146,60,0.2)]">
                        ★
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-200 block">Fact Table</span>
                        <span className="text-[9px] text-slate-500 block leading-tight">Sales / Metrics Template</span>
                      </div>
                    </button>

                    <button
                      onClick={() => spawnLibraryTable('product')}
                      className="w-full p-4 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 hover:border-violet-500/30 text-left transition flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                        ◆
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-200 block">Dimension Table</span>
                        <span className="text-[9px] text-slate-500 block leading-tight">Product / Shared context</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* join suggester */}
                <div>
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                    Relationship tools
                  </h4>
                  <button
                    onClick={() => setJoinSuggestions(!joinSuggestions)}
                    className={`w-full py-2.5 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${joinSuggestions ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/5 bg-white/2 text-slate-300 hover:border-white/10'}`}
                  >
                    ⚡ {joinSuggestions ? 'Suggest Joins: active' : 'Suggest Join Pathways'}
                  </button>
                </div>

                {/* Naming rules validator details */}
                <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-2">
                  <span className="font-mono text-[9px] text-slate-500 uppercase block tracking-wider leading-none">
                    Architect Naming Rules
                  </span>
                  <ul className="space-y-1.5 font-mono text-[10px]">
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-emerald-400">✔</span> fact_ tables snake_case
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-emerald-400">✔</span> dim_ tables snake_case
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-emerald-400">✔</span> PK constraints exist
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Panoramic Interactive Canvas Area */}
              <div 
                className="flex-1 bg-slate-900 bg-grid relative overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div className="absolute top-4 left-4 z-10 bg-slate-950/80 px-3 py-1.5 rounded border border-white/10 text-[10px] font-mono text-slate-400 select-none">
                  🖱 Drag to Pan canvas | Use mousewheel or slider to Zoom
                </div>

                {/* SVG/HTML actual interactive schema network */}
                <div 
                  className="absolute inset-0 origin-center flex items-center justify-center"
                  style={{ 
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transition: dragStart ? 'none' : 'transform 0.15s ease-out',
                    width: '2000px',
                    height: '2000px',
                    top: '-500px',
                    left: '-500px'
                  }}
                >
                  <div className="w-[1000px] h-[600px] relative">
                    {/* SVG Connections lines inside modal */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <g stroke="#ffffff10" strokeWidth="2" strokeDasharray="3 3">
                        <line x1="50%" y1="50%" x2="20%" y2="25%" stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_customer') ? '#22d3ee' : '#ffffff10'} strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_customer') ? '4' : '2'} />
                        <line x1="50%" y1="50%" x2="80%" y2="25%" stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_policy') ? '#a78bfa' : '#ffffff10'} strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_policy') ? '4' : '2'} />
                        <line x1="50%" y1="50%" x2="20%" y2="75%" stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_date') ? '#60a5fa' : '#ffffff10'} strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_date') ? '4' : '2'} />
                        <line x1="50%" y1="50%" x2="80%" y2="75%" stroke={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_agent') ? '#34d399' : '#ffffff10'} strokeWidth={(hoveredTable === 'fact_claims' || hoveredTable === 'dim_agent') ? '4' : '2'} />

                        {/* Snowflake Normalized sub-dimensions */}
                        {isSnowflake && (
                          <>
                            <line x1="20%" y1="25%" x2="7%" y2="10%" stroke={(hoveredTable === 'dim_customer' || hoveredTable === 'dim_customer_demographics') ? '#06d6a0' : '#ffffff15'} strokeWidth="2.5" />
                            <line x1="80%" y1="75%" x2="93%" y2="90%" stroke={(hoveredTable === 'dim_agent' || hoveredTable === 'dim_agent_region') ? '#f472b6' : '#ffffff15'} strokeWidth="2.5" />
                          </>
                        )}

                        {/* Suggested Joins visual inside immersive canvas */}
                        {joinSuggestions && spawnedTables.length > 0 && (
                          <path 
                            d="M 50% 50% C 50% 10% 10% 15% 7% 10%" 
                            stroke="#fbbf24"
                            strokeWidth="3.5"
                            strokeDasharray="5 5"
                            fill="none"
                            className="flow-line"
                          />
                        )}
                      </g>
                    </svg>

                    {/* Nodes within immersive canvas */}
                    
                    {/* FactClaims */}
                    <button
                      onClick={() => setSelectedTable('fact_claims')}
                      onMouseEnter={() => setHoveredTable('fact_claims')}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute w-36 h-20 rounded-xl border flex flex-col justify-center items-center shadow-lg focus:outline-none ${selectedTable === 'fact_claims' ? 'border-orange-400 bg-orange-400/20 shadow-[0_0_30px_rgba(251,146,60,0.45)]' : 'border-white/10 bg-slate-950 text-slate-300'}`}
                      style={{ top: 'calc(50% - 40px)', left: 'calc(50% - 72px)' }}
                    >
                      <span className="text-xl mb-0.5">★</span>
                      <span className="font-mono text-xs font-bold leading-none">FactClaims</span>
                      <span className="text-[8px] text-orange-400 font-mono tracking-widest mt-1 uppercase">FACT</span>
                    </button>

                    {/* Dim Customer */}
                    <button
                      onClick={() => setSelectedTable('dim_customer')}
                      onMouseEnter={() => setHoveredTable('dim_customer')}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg focus:outline-none ${selectedTable === 'dim_customer' ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.4)]' : 'border-white/10 bg-slate-950 text-slate-300'}`}
                      style={{ top: '15%', left: '7%' }}
                    >
                      <span className="font-mono text-xs font-bold leading-none">DimCustomer</span>
                      <span className="text-[8px] text-cyan-400 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                    </button>

                    {/* Dim Policy */}
                    <button
                      onClick={() => setSelectedTable('dim_policy')}
                      onMouseEnter={() => setHoveredTable('dim_policy')}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg focus:outline-none ${selectedTable === 'dim_policy' ? 'border-violet-400 bg-violet-400/20 shadow-[0_0_25px_rgba(167,139,250,0.4)]' : 'border-white/10 bg-slate-950 text-slate-300'}`}
                      style={{ top: '15%', right: '7%' }}
                    >
                      <span className="font-mono text-xs font-bold leading-none">DimPolicy</span>
                      <span className="text-[8px] text-violet-400 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                    </button>

                    {/* Dim Date */}
                    <button
                      onClick={() => setSelectedTable('dim_date')}
                      onMouseEnter={() => setHoveredTable('dim_date')}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg focus:outline-none ${selectedTable === 'dim_date' ? 'border-blue-400 bg-blue-400/20 shadow-[0_0_25px_rgba(96,105,250,0.4)]' : 'border-white/10 bg-slate-950 text-slate-300'}`}
                      style={{ bottom: '15%', left: '7%' }}
                    >
                      <span className="font-mono text-xs font-bold leading-none">DimDate</span>
                      <span className="text-[8px] text-blue-400 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                    </button>

                    {/* Dim Agent */}
                    <button
                      onClick={() => setSelectedTable('dim_agent')}
                      onMouseEnter={() => setHoveredTable('dim_agent')}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`absolute w-32 h-16 rounded-xl border flex flex-col justify-center items-center shadow-lg focus:outline-none ${selectedTable === 'dim_agent' ? 'border-emerald-400 bg-emerald-400/20 shadow-[0_0_25px_rgba(52,211,153,0.4)]' : 'border-white/10 bg-slate-950 text-slate-300'}`}
                      style={{ bottom: '15%', right: '7%' }}
                    >
                      <span className="font-mono text-xs font-bold leading-none">DimAgent</span>
                      <span className="text-[8px] text-emerald-400 font-mono tracking-widest mt-1 uppercase">DIMENSION</span>
                    </button>

                    {/* Spawned tables inside immersive canvas */}
                    {spawnedTables.map((sTable, _idx) => (
                      <button
                        key={sTable.id}
                        onClick={() => setSelectedTable(sTable.id)}
                        className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md focus:outline-none`}
                        style={{ 
                          top: '2%', 
                          left: '35%',
                          borderColor: selectedTable === sTable.id ? sTable.color : 'rgba(255,255,255,0.08)',
                          background: selectedTable === sTable.id ? `${sTable.color}20` : '#080c14'
                        }}
                      >
                        <span className="font-mono text-[10px] font-bold truncate w-full px-1 text-center">{sTable.name}</span>
                        <span className="text-[7px] font-mono mt-0.5" style={{ color: sTable.color }}>SPAWNED</span>
                      </button>
                    ))}

                    {/* Snowflake Normalized sub-dimensions */}
                    {isSnowflake && (
                      <>
                        <button
                          onClick={() => setSelectedTable('dim_customer_demographics')}
                          className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md focus:outline-none ${selectedTable === 'dim_customer_demographics' ? 'border-teal-400 bg-teal-400/20' : 'border-white/5 bg-slate-950 text-slate-400'}`}
                          style={{ top: '2%', left: '0%' }}
                        >
                          <span className="font-mono text-[9px] font-bold">DimDemographics</span>
                          <span className="text-[6.5px] text-teal-400 font-mono mt-0.5 tracking-wider uppercase">SNOWFLAKE</span>
                        </button>

                        <button
                          onClick={() => setSelectedTable('dim_agent_region')}
                          className={`absolute w-28 h-12 rounded-xl border flex flex-col justify-center items-center shadow-md focus:outline-none ${selectedTable === 'dim_agent_region' ? 'border-pink-400 bg-pink-400/20' : 'border-white/5 bg-slate-950 text-slate-400'}`}
                          style={{ bottom: '2%', right: '0%' }}
                        >
                          <span className="font-mono text-[9px] font-bold">DimRegion</span>
                          <span className="text-[6.5px] text-pink-400 font-mono mt-0.5 tracking-wider uppercase">SNOWFLAKE</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel: Immersive Metadata Inspector */}
              <div className="w-80 border-l border-white/5 bg-slate-950 p-5 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                      Metadata Inspector
                    </h4>
                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                      <span 
                        className="font-mono text-sm font-bold uppercase tracking-tight"
                        style={{ color: tableData.color }}
                      >
                        {tableData.name}
                      </span>
                      <span className="font-mono text-[8px] px-2 py-0.5 rounded border border-white/10 uppercase bg-white/2 text-slate-400">
                        {tableData.type}
                      </span>
                    </div>
                  </div>

                  {/* Grain detail */}
                  <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-1.5 text-xs">
                    <span className="font-mono text-[8.5px] text-slate-500 uppercase tracking-wider block">Target Process Grain</span>
                    <p className="text-slate-300 leading-normal">{tableData.grain}</p>
                  </div>

                  {/* Schema Columns inspect list */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {tableData.columns.map((col, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-900 border border-white/5 font-mono text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: tableData.color }}>
                            {col.role.includes('PK') ? '🔑' : col.role.includes('FK') ? '🔗' : '▫️'}
                          </span>
                          <span className="text-slate-200 font-bold">{col.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[8.5px]">{col.type}</span>
                          <span className="text-[8px] px-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                            {col.role.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="font-mono text-[9px] text-slate-500 border-t border-white/5 pt-4 mt-6">
                  Data Refresh: <span style={{ color: tableData.color }}>{tableData.freshness}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
