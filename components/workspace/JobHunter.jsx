import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { trackJobSearch, trackJobSaved } from '../../lib/events';

const C = {
  cyan:'#22d3ee',green:'#34d399',purple:'#a78bfa',pink:'#f472b6',
  amber:'#fbbf24',teal:'#06d6a0',blue:'#60a5fa',red:'#f87171',orange:'#fb923c',
};
const STORAGE_KEY='dos_saved_jobs', TRACKER_KEY='dos_job_tracker';

const MY_SKILLS=['ERwin','Data Modeling','Logical Modeling','Physical Modeling',
  'Dimensional Modeling','Star Schema','Snowflake Schema','Data Vault','Data Vault 2.0',
  'Hub','Link','Satellite','SCD','SCD Type 1','SCD Type 2','SCD Type 3',
  'SQL','PL/SQL','T-SQL','Stored Procedures','Views','Indexes',
  'Azure','ADF','Azure Data Factory','Azure Synapse','Azure Data Lake',
  'Azure SQL','Azure Databricks','ADLS','Azure Blob',
  'Data Warehouse','ETL','ELT','SSIS','SSAS','SSRS',
  'Oracle','SQL Server','PostgreSQL','Snowflake','Teradata',
  'Power BI','DAX','Tableau','Data Governance','Metadata',
  'ERD','Entity Relationship','Normalization','Denormalization',
  'Retail','Insurance','BFSI','Banking','Financial Services',
  'CDC','Change Data Capture','Slowly Changing Dimensions',
  'Fact Tables','Dimension Tables','Bridge Tables','Factless Fact',
  'Data Dictionary','Data Lineage','Business Rules','MDM'];

const FALLBACK_JOBS=[
  {id:'f1',title:'Senior Data Modeler',company_name:'HDFC Bank',job_type:'full_time',
   candidate_required_location:'Mumbai / Hybrid',salary:'\u20b918\u201328 LPA',
   url:'https://www.hdfcbank.com/',
   description:'Design and maintain enterprise data models for core banking and compliance. ERwin, data vault, SQL required.',
   tags:['ERwin','Data Vault','SQL','Oracle','Data Modeling'],source:'HDFC Bank'},
  {id:'f2',title:'Data Architect \u2013 Azure',company_name:'Infosys',job_type:'full_time',
   candidate_required_location:'Bangalore / Pune',salary:'\u20b922\u201335 LPA',
   url:'https://career.infosys.com/',
   description:'Architect enterprise data platforms on Azure. Define modeling standards, govern metadata, lead DW migrations.',
   tags:['Azure','ADF','Synapse','Data Warehouse','SQL Server','ERwin'],source:'Infosys'},
  {id:'f3',title:'Data Warehouse Architect',company_name:'Wipro',job_type:'full_time',
   candidate_required_location:'Hyderabad / Remote',salary:'\u20b925\u201340 LPA',
   url:'https://careers.wipro.com/',
   description:'Design dimensional models for retail and insurance clients. Star schema, SCD, Snowflake/Teradata.',
   tags:['Dimensional Modeling','Star Schema','Snowflake','SCD','Teradata'],source:'Wipro'},
  {id:'f4',title:'Data Modeler \u2013 Insurance',company_name:'Cognizant',job_type:'full_time',
   candidate_required_location:'Chennai / Pune',salary:'\u20b916\u201324 LPA',
   url:'https://careers.cognizant.com/',
   description:'Build logical and physical models for P&C insurance domain. Underwriting, claims, policy data.',
   tags:['Insurance','ERwin','Logical Modeling','Physical Modeling','SQL'],source:'Cognizant'},
  {id:'f5',title:'Enterprise Data Architect',company_name:'TCS',job_type:'full_time',
   candidate_required_location:'Mumbai / Bangalore',salary:'\u20b930\u201350 LPA',
   url:'https://ibegin.tcs.com/',
   description:'Lead data architecture for BFSI clients. Data vault, MDM, lineage, and governance strategy.',
   tags:['Data Vault','MDM','Data Governance','BFSI','Azure','Power BI'],source:'TCS'},
  {id:'f6',title:'Data Modeler \u2013 Retail',company_name:'Reliance Retail',job_type:'full_time',
   candidate_required_location:'Mumbai',salary:'\u20b918\u201330 LPA',
   url:'https://www.relianceretail.com/careers.html',
   description:'Model retail analytics DW. Design fact & dimension tables, manage ETL pipelines, support BI reporting.',
   tags:['Retail','Star Schema','ETL','SQL Server','Power BI','SSAS'],source:'Reliance Retail'},
  {id:'f7',title:'Azure Data Architect',company_name:'Accenture',job_type:'full_time',
   candidate_required_location:'Bangalore / Gurugram',salary:'\u20b928\u201345 LPA',
   url:'https://www.accenture.com/in-en/careers',
   description:'Design Azure-based modern data warehouses. Lead migration from on-prem SQL Server to Azure Synapse.',
   tags:['Azure Synapse','ADLS','ADF','SQL Server','Data Modeling'],source:'Accenture'},
  {id:'f8',title:'Data Modeler (Remote)',company_name:'Genpact',job_type:'full_time',
   candidate_required_location:'Remote / Pan India',salary:'\u20b914\u201322 LPA',
   url:'https://www.genpact.com/careers',
   description:'Develop data models for banking clients. CDC implementation, data dictionary, quality rules.',
   tags:['Banking','CDC','Data Dictionary','Oracle','SQL','Data Governance'],source:'Genpact'},
];

const RESUME_PROFILES=[
  {type:'Data Modeler',icon:'\ud83d\uddc2\ufe0f',color:'#22d3ee',
   headline:'Data Modeler | ERwin | Dimensional Modeling | Data Vault 2.0',
   focus:'ERwin \u00b7 Dimensional Modeling \u00b7 Data Vault \u00b7 SCD \u00b7 Physical/Logical Design',
   keywords:['ERwin','Data Modeling','Dimensional Modeling','Star Schema','Data Vault','SCD Type 2','Logical Model','Physical Model','ERD','ETL','Data Dictionary'],
   bullets:[
     'Designed enterprise logical and physical data models using ERwin for retail and insurance domains covering 100+ entities',
     'Implemented SCD Type 2 on 12 dimension tables ensuring full historical tracking of customer, policy, and product attributes',
     'Built Data Vault 2.0 architecture (Hubs, Links, Satellites) enabling full auditability for BFSI clients',
     'Created comprehensive data dictionaries covering 200+ attributes with business definitions, data types, and lineage',
     'Standardized naming conventions and modeling guidelines across 3 business units, reducing model inconsistencies by 40%',
     'Collaborated with ETL teams to translate physical models into optimized SQL Server and Oracle DDL scripts',
   ],
   atsTips:['Lead with ERwin version (ERwin r9/2021)','Quantify entities/tables modeled','Mention specific domain (retail/insurance)','Include data governance keywords']},
  {type:'Data Architect',icon:'\ud83c\udfdb\ufe0f',color:'#a78bfa',
   headline:'Data Architect | Azure | Data Warehouse | Governance | Data Vault',
   focus:'Architecture \u00b7 Governance \u00b7 Azure \u00b7 Modern DW \u00b7 Data Strategy',
   keywords:['Data Architecture','Enterprise Architecture','Data Governance','Azure Synapse','ADF','Data Warehouse','MDM','Metadata','Data Strategy','Data Quality'],
   bullets:[
     'Architected enterprise data warehouse on Azure Synapse Analytics supporting 50TB+ of retail transactional data',
     'Defined enterprise data modeling standards, governance framework, and metadata management across 5 domains',
     'Led migration from on-prem SQL Server DW to Azure Synapse, achieving 60% reduction in query response time',
     'Implemented medallion architecture (Bronze/Silver/Gold) in Azure Data Lake Gen2 with Delta Lake format',
     'Established data quality rules and lineage documentation covering 300+ data elements across source systems',
     'Collaborated with business stakeholders to define data strategy roadmap aligned with regulatory reporting requirements',
   ],
   atsTips:['Emphasize cloud platform (Azure) prominently','Include architecture decision-making experience','Mention stakeholder/leadership collaboration','Add regulatory/compliance angle for BFSI']},
  {type:'Azure Data Engineer',icon:'\u2601\ufe0f',color:'#60a5fa',
   headline:'Azure Data Engineer | ADF | Synapse Analytics | Data Lake | ETL/ELT',
   focus:'ADF \u00b7 Synapse \u00b7 ADLS \u00b7 Databricks \u00b7 Pipeline Engineering',
   keywords:['Azure Data Factory','Azure Synapse','ADLS Gen2','Azure Databricks','ETL','ELT','Python','SQL','Delta Lake','Power BI'],
   bullets:[
     'Built 20+ Azure Data Factory pipelines for ingesting structured and semi-structured data from SAP, Oracle, and REST APIs',
     'Developed ELT transformations in Azure Synapse Spark pools processing 5M+ daily transactions for retail analytics',
     'Implemented incremental load patterns using watermark and CDC strategies, reducing pipeline runtime by 70%',
     'Designed Azure Data Lake Gen2 folder structure with Bronze/Silver/Gold medallion layers and Delta Lake format',
     'Integrated ADF pipelines with Azure Key Vault for secret management and Monitor for alerting and SLA tracking',
     'Created Power BI datasets from Synapse dedicated SQL pools supporting 200+ daily users across business units',
   ],
   atsTips:['List specific Azure services (ADF, Synapse, ADLS, Databricks)','Include pipeline count and data volumes','Mention Python + SQL as core skills','Add CI/CD for pipelines if applicable']},
  {type:'SQL Developer',icon:'\ud83d\udd22',color:'#34d399',
   headline:'SQL Developer | T-SQL | PL/SQL | Data Warehouse | SSAS | Performance Tuning',
   focus:'SQL \u00b7 PL/SQL \u00b7 T-SQL \u00b7 Performance \u00b7 Stored Procedures \u00b7 Reporting',
   keywords:['SQL','T-SQL','PL/SQL','Stored Procedures','Views','Indexes','Query Optimization','SSAS','SSRS','Oracle','SQL Server'],
   bullets:[
     'Wrote 100+ optimized T-SQL stored procedures and views for DW ETL supporting nightly batch processing of 10M+ rows',
     'Tuned slow-running queries by analyzing execution plans, adding covering indexes, rewriting correlated subqueries as CTEs',
     'Developed complex analytical queries using window functions (RANK, LAG, LEAD, SUM OVER) for retail sales reporting',
     'Implemented SSAS tabular models with DAX measures for management dashboards, reducing report generation time by 80%',
     'Created partition strategies on SQL Server fact tables (monthly partitions) improving query performance by 4x',
     'Automated data quality checks using SQL assertion scripts, catching 95% of data anomalies before business reporting',
   ],
   atsTips:['Include specific SQL dialects (T-SQL vs PL/SQL)','Quantify query performance improvements','Mention BI tools (SSAS, SSRS, Power BI)','Add row counts / data volumes for credibility']},
];

const INTERVIEW_QB={
  'SQL & Database':[
    {q:'Write a query to find employees whose salary is above their department average.',
     a:'SELECT * FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id)'},
    {q:'Explain the difference between RANK(), DENSE_RANK() and ROW_NUMBER().',
     a:'ROW_NUMBER: unique sequential numbers. RANK: skips after ties (1,1,3). DENSE_RANK: no gaps (1,1,2). Use RANK for competition-style, DENSE_RANK when gaps unwanted.'},
    {q:'How would you optimize a query taking 5 minutes on a 100M-row table?',
     a:'Check execution plan for full scans. Add indexes on filter/join columns. Partition on date. Rewrite correlated subqueries as JOINs. Avoid SELECT *. Update statistics.'},
    {q:'What is a covering index? Give an example.',
     a:'Includes all query-needed columns (key + INCLUDE), so engine never touches base table. CREATE INDEX idx ON orders(customer_id) INCLUDE (order_date, amount).'},
    {q:'CTEs vs Temp Tables vs Subqueries - when to use which?',
     a:'CTEs: readable, reusable in same query. Temp Tables: materialized, indexable, best for large multi-step transforms. Subqueries: inline, simple one-off filters.'},
    {q:'Write a recursive CTE to traverse a product category hierarchy.',
     a:'WITH RECURSIVE cat AS (SELECT id,name,parent_id,0 lvl FROM categories WHERE parent_id IS NULL UNION ALL SELECT c.id,c.name,c.parent_id,cat.lvl+1 FROM categories c JOIN cat ON cat.id=c.parent_id) SELECT * FROM cat ORDER BY lvl;'},
  ],
  'Data Modeling':[
    {q:'Star Schema vs Snowflake Schema - when to choose each?',
     a:'Star: denormalized, faster queries, simpler joins. Snowflake: normalized, less storage, more joins. Choose Star for BI performance. Snowflake for very large or frequently-changing dimensions.'},
    {q:'Explain SCD Type 1, 2, and 3 with a real example.',
     a:'Type 1: Overwrite (fix name typo). Type 2: New row with version/date (customer moves city - keep old row with end_date, add new). Type 3: Add prev_value column. Type 2 most common in DW.'},
    {q:'What is a Factless Fact Table? Give two examples.',
     a:'No numeric measures - records events or relationships. Ex1: Student attendance (student, class, date). Ex2: Product promotion coverage (product, store, promotion - which products are on promo where).'},
    {q:'How do you handle many-to-many relationships in dimensional modeling?',
     a:'Bridge Table. Ex: Policy to Agent (one policy has multiple agents). Create policy_agent_bridge with weighting factor. Some use multi-valued dimensions or group keys.'},
    {q:'Inmon vs Kimball approach to data warehousing.',
     a:'Inmon: Centralized normalized EDW first, then data marts. Consistent but hard to query. Kimball: Data marts first with conformed dimensions, star schemas. Query-friendly, faster delivery. Most enterprises use hybrid.'},
    {q:'What are degenerate dimensions? Example.',
     a:'Dimension attributes stored in the fact table without a separate dimension table. Ex: Invoice number, order number. Provide drill-down capability but have no other attributes. Common in transaction fact tables.'},
  ],
  'Data Vault':[
    {q:'Explain the three core components of Data Vault 2.0.',
     a:'Hub: unique business keys (HUB_CUSTOMER). Link: relationships between hubs (LINK_CUSTOMER_ORDER). Satellite: descriptive attributes with full history + timestamps. Hubs/Links insert-only; Satellites carry history.'},
    {q:'Why is Data Vault better for regulated industries (banking/insurance)?',
     a:'Insert-only (no history lost), auditable (every record has load_date + record_source), modular (add sources = add Satellites, not restructure). Critical for regulators requiring complete data lineage.'},
    {q:'What is a PIT (Point-in-Time) table and why is it needed?',
     a:'Snapshot of all Satellite keys at a specific time, enabling efficient multi-Satellite joins. Without PIT, joining 5 Satellites for a customer profile requires 5 expensive date-range lookups. PIT pre-computes join keys.'},
    {q:'Raw Vault vs Business Vault - difference?',
     a:'Raw Vault: exact source copy, no transformations, insert-only. Business Vault: derived data with business rules. Ex: Raw has status="A", Business interprets as "Active". Keeps raw clean, adds logic layer.'},
    {q:'How do you handle CDC feeds in Data Vault?',
     a:'INSERTs: new Hub entry + new Satellite record. UPDATEs: new Satellite record (end-dating old). DELETEs: soft-delete Satellite with deletion indicator. Raw Vault stays insert-only throughout.'},
  ],
  'Azure & Cloud':[
    {q:'Azure Synapse Analytics vs Azure Databricks - difference?',
     a:'Synapse: unified SQL+Spark+pipelines, best for enterprise DW and BI. Databricks: Spark-optimized, ML-centric, Delta Lake. Best for ML pipelines and streaming. Many enterprises use both together.'},
    {q:'Azure Data Factory vs SSIS - difference?',
     a:'ADF: cloud-native ETL, serverless, scales automatically, 90+ connectors. SSIS: on-prem, Windows-based, needs infrastructure. ADF supports SSIS packages via Integration Runtime for migration.'},
    {q:'How do you design medallion architecture (Bronze/Silver/Gold) in Azure?',
     a:'Bronze: raw ingestion in ADLS Gen2, no transforms. Silver: cleansed, validated, Delta Lake. Gold: business-ready aggregates, star schemas, Synapse dedicated pool optimized for Power BI.'},
    {q:'How would you handle SCD Type 2 in an Azure Synapse pipeline?',
     a:'Detect changes with EXCEPT/checksum. Expire old rows (UPDATE set end_date, is_current=0). INSERT new rows with current_flag=1. Delta Lake simplifies with MERGE and automatic versioning.'},
  ],
  'Retail & Insurance':[
    {q:'How do you model a Retail DW to handle product returns and exchanges?',
     a:'Separate FACT_RETURNS with negative quantities or return_flag. Link to original FACT_SALES via original_order_key. DIM_RETURN_REASON. Separate metrics: Gross Revenue, Net Revenue, Return Rate by product/store.'},
    {q:'Key data entities in an insurance data model?',
     a:'Policy (policy_number, effective_date, premium). Insured/Policyholder. Coverage (type, limits). Claim (claim_number, loss_date, status). Payment/Settlement. Agent/Broker. Product/Line of Business. SCD2 for policies.'},
    {q:'How do you handle a customer appearing in multiple source systems (MDM)?',
     a:'MDM layer: golden record matched on name+DOB+address or email. Assign golden_customer_id. In Data Vault, Hub stores business key per source + golden link. Dimensional: master_customer_id + source_system_id.'},
    {q:'Explain claim lifecycle modeling in insurance DW.',
     a:'FACT_CLAIM_EVENTS (event-sourced) OR SCD2 on DIM_CLAIM for status changes. Key metrics: IBNR, Loss Ratio, Claim Settlement Time. FACT_RESERVE for reserve amounts. DIM_CLAIM_STATUS, DIM_LOSS_TYPE dimensions.'},
  ],
};

const SALARY_DATA=[
  {role:'Data Modeler',exp0_3:'\u20b98\u201314 LPA',exp3_7:'\u20b914\u201325 LPA',exp7p:'\u20b925\u201340 LPA',demand:'Medium',remote:'Limited'},
  {role:'Data Architect',exp0_3:'\u20b915\u201322 LPA',exp3_7:'\u20b922\u201340 LPA',exp7p:'\u20b940\u201370 LPA',demand:'High',remote:'Moderate'},
  {role:'Azure Data Engineer',exp0_3:'\u20b910\u201318 LPA',exp3_7:'\u20b918\u201332 LPA',exp7p:'\u20b932\u201355 LPA',demand:'Very High',remote:'High'},
  {role:'SQL Developer',exp0_3:'\u20b96\u201310 LPA',exp3_7:'\u20b910\u201318 LPA',exp7p:'\u20b918\u201328 LPA',demand:'Medium',remote:'Moderate'},
  {role:'DW Architect (Snowflake)',exp0_3:'\u20b912\u201318 LPA',exp3_7:'\u20b918\u201335 LPA',exp7p:'\u20b935\u201360 LPA',demand:'High',remote:'High'},
];

const AUTO_LIMITS=[
  {activity:'Easy Apply (LinkedIn)',safe:'20\u201330/day',risk:'Flagged + shadow-banned',color:'#22d3ee'},
  {activity:'Recruiter Messages',safe:'10/day',risk:'Message restrictions',color:'#60a5fa'},
  {activity:'Connection Requests',safe:'15\u201320/day',risk:'Account restricted',color:'#a78bfa'},
  {activity:'Profile Visits',safe:'<100/day',risk:'Bot detection trigger',color:'#fbbf24'},
  {activity:'Job Applications (Naukri)',safe:'15\u201325/day',risk:'Application cap hit',color:'#06d6a0'},
  {activity:'InMail (Premium)',safe:'5\u201310/day',risk:'InMail credits wasted',color:'#34d399'},
];

const STATUS_OPTIONS=['Saved','Applied','OA / Test','Interview','Offer','Rejected'];
const STATUS_COLORS={'Saved':'#22d3ee','Applied':'#60a5fa','OA / Test':'#fbbf24','Interview':'#a78bfa','Offer':'#34d399','Rejected':'#f87171'};
const linkedinURL=(q,l)=>`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l||'India')}`;
const linkedinEasyApplyURL=(q,l)=>`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l||'India')}&f_AL=true`;
const indeedURL=(q,l)=>`https://in.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l||'India')}`;
const naukriURL=(q,l)=>`https://www.naukri.com/${q.toLowerCase().replace(/\s+/g,'-')}-jobs${l?`-in-${l.toLowerCase().replace(/\s+/g,'-')}`:''}`;
const glassdoorURL=(q)=>`https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}`;
const founditURL=(q,l)=>`https://www.foundit.in/srp/results?query=${encodeURIComponent(q)}&locations=${encodeURIComponent(l||'India')}`;
const instahireURL=(q)=>`https://www.instahyre.com/search-jobs/?designation=${encodeURIComponent(q)}`;
const genericApplyURL=(q,l)=>`https://www.google.com/search?q=${encodeURIComponent(`${q} ${l||'India'} jobs easy apply`)}`;

const CRAWL_KEYWORDS=[
  'ERwin','data modeler','data modeller','data modeling','data modelling',
  'Data modeling','Data Modeller','Er Studio','Dimensional Modeling','Data Mart','OLTP','Snowflake Modeling',
  'logical data model','physical data model','dimensional modeling','dimensional modelling',
  'star schema','snowflake schema','data vault','scd type 2',
  'data architect','dw architect','data warehouse architect','etl developer',
  'sql','azure synapse','adf','insurance','retail'
];
const SEARCH_KEYWORD_STRING='Data modeling, Data Modeller, ERwin, Er Studio, Dimensional Modeling, Data Mart, OLTP, Snowflake Modeling';

// ── Human Behavior Engine ──────────────────────────────────────
const randBetween=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const humanDelay=(baseMs,variance=0.32)=>Math.max(500,baseMs+randBetween(-Math.floor(baseMs*variance),Math.floor(baseMs*(variance+0.06))));

const PLATFORM_SAFETY={
  linkedin:{label:'LinkedIn',icon:'💼',color:C.blue,  appsLimit:15,connLimit:15,msgLimit:8,
    risk:'High sensitivity — shadow-ban risk above 25 applies/day; burst clicking = instant flag'},
  naukri:  {label:'Naukri',  icon:'🇮🇳',color:C.amber, appsLimit:20,connLimit:0, msgLimit:0,
    risk:'Space applications ≥ 8 min apart; max 3 profile refreshes/day or review queue triggers'},
  indeed:  {label:'Indeed',  icon:'🔵',color:C.cyan,  appsLimit:25,connLimit:0, msgLimit:0,
    risk:'CAPTCHA after rapid clicks; add 3–5 min natural gaps between each application'},
  foundit: {label:'Foundit', icon:'🟣',color:C.purple,appsLimit:20,connLimit:0, msgLimit:0,
    risk:'New fingerprint detection layer active — vary session timing and keyword searches'},
};

const RESUME_ROTATION=[
  {day:0,profile:0,note:'Data Modeler — Sunday: fresh week opening push'},
  {day:1,profile:1,note:'Data Architect — Monday: senior recruiter peak day'},
  {day:2,profile:2,note:'Azure Data Engineer — Tuesday: tech roles peak'},
  {day:3,profile:0,note:'Data Modeler — Wednesday: mid-week apply push'},
  {day:4,profile:3,note:'SQL Developer — Thursday: variety and niche roles'},
  {day:5,profile:1,note:'Data Architect — Friday: senior outreach day'},
  {day:6,profile:2,note:'Azure Data Engineer — Saturday: async browsing'},
];

const ACTIVITY_WINDOWS=[
  {start:7, end:10,label:'Morning Discovery',score:95,action:'Search new postings · ATS score shortlist · Save top roles',icon:'🌅',mode:'morning'},
  {start:12,end:15,label:'Afternoon Apply',  score:88,action:'Apply to ATS-scored shortlist · Track submissions',         icon:'☀️',mode:'afternoon'},
  {start:17,end:20,label:'Evening Outreach', score:82,action:'Recruiter messages · Connection requests · Follow-ups',     icon:'🌙',mode:'evening'},
];

function getHumanActivityScore(daily,safeMode){
  const {apps=0,connections=0,runs=0}=daily;
  let score=100;
  if(apps>22)score-=30;else if(apps>16)score-=12;else if(apps>10)score-=4;
  if(connections>15)score-=20;else if(connections>10)score-=8;
  if(runs>5)score-=15;else if(runs>3)score-=5;
  if(safeMode)score=Math.max(score,88);
  return Math.max(0,Math.min(100,score));
}
function getCurrentActivityWindow(){
  const h=new Date().getHours();
  return ACTIVITY_WINDOWS.find(w=>h>=w.start&&h<=w.end)||null;
}
function getTodayRotation(){
  const dow=new Date().getDay();
  return RESUME_ROTATION.find(r=>r.day===dow)||RESUME_ROTATION[0];
}

// ── Micro ─────────────────────────────────────────────────────────
function Tag({label,color}){return(<span style={{fontSize:10,padding:'2px 7px',borderRadius:4,background:`${color}18`,border:`1px solid ${color}44`,color,fontFamily:"'JetBrains Mono',monospace"}}>{label}</span>);}
function Pill({children,active,color,onClick}){const col=color||'#22d3ee';return(<button onClick={onClick} style={{padding:'0.38rem 0.85rem',borderRadius:8,cursor:'pointer',fontSize:11,fontFamily:"'JetBrains Mono',monospace",transition:'all 0.2s',border:active?`1.5px solid ${col}`:'1px solid rgba(255,255,255,0.1)',background:active?`${col}18`:'transparent',color:active?col:'#64748b'}}>{children}</button>);}
function SHdr({title,sub}){return(<div style={{marginBottom:'0.75rem'}}><div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{title}</div>{sub&&<div style={{fontSize:10,color:'#475569',fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{sub}</div>}</div>);}

// ── JobCard ───────────────────────────────────────────────────────
function JobCard({job,onSave,saved,onTrack,tracked}){
  const [exp,setExp]=React.useState(false);
  const applyHref=getApplyHref(job);
  const tc=[C.cyan,C.green,C.purple,C.amber,C.pink,C.teal,C.blue];
  return(<div style={{background:'linear-gradient(135deg,rgba(20,28,60,.75),rgba(15,24,50,.55))',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem',transition:'border-color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(34,211,238,0.3)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'}>
    <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
      <div style={{width:40,height:40,borderRadius:8,flexShrink:0,background:`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`,border:`1px solid ${C.cyan}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🏢</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.5rem'}}>
          <div><div style={{fontSize:14,fontWeight:700,color:'#e2e8f0',marginBottom:2}}>{job.title}</div><div style={{fontSize:12,color:C.cyan,marginBottom:4}}>{job.company_name}</div></div>
          <div style={{display:'flex',gap:'0.4rem',flexShrink:0}}>
            <button onClick={()=>onSave(job)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${saved?C.amber:'rgba(255,255,255,0.15)'}`,background:saved?`${C.amber}18`:'transparent',color:saved?C.amber:'#64748b',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>{saved?'★':'☆'}</button>
            <a href={applyHref} target="_blank" rel="noreferrer" style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,color:'#0a0e27',textDecoration:'none',display:'flex',alignItems:'center',fontFamily:"'JetBrains Mono',monospace"}}>Apply →</a>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.4rem'}}>
          <Tag label={`📍 ${job.candidate_required_location||'India'}`} color={C.teal}/>
          <Tag label={job.job_type?.replace('_',' ')||'Full-time'} color={C.purple}/>
          {job.salary&&<Tag label={job.salary} color={C.green}/>}
        </div>
        <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',marginBottom:'0.4rem'}}>
          {(job.tags||[]).slice(0,6).map((t,i)=><Tag key={i} label={t} color={tc[i%tc.length]}/>)}
        </div>
        <button onClick={()=>setExp(e=>!e)} style={{background:'none',border:'none',color:'#475569',fontSize:11,cursor:'pointer',padding:0,fontFamily:"'JetBrains Mono',monospace"}}>{exp?'▲ less':'▼ more'}</button>
        {exp&&<div style={{marginTop:'0.5rem',fontSize:12,color:'#94a3b8',lineHeight:1.6}}>{job.description?.replace(/<[^>]*>/g,'').slice(0,400)||'No description.'}</div>}
        {onTrack&&<div style={{marginTop:'0.5rem',display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
          {STATUS_OPTIONS.map(s=><button key={s} onClick={()=>onTrack(job,s)} style={{fontSize:10,padding:'2px 7px',borderRadius:4,cursor:'pointer',background:tracked===s?`${STATUS_COLORS[s]}20`:'transparent',border:`1px solid ${tracked===s?STATUS_COLORS[s]:'rgba(255,255,255,0.1)'}`,color:tracked===s?STATUS_COLORS[s]:'#475569',fontFamily:"'JetBrains Mono',monospace",transition:'all 0.15s'}}>{s}</button>)}
        </div>}
      </div>
    </div>
  </div>);
}

// ── ATS Analyzer ──────────────────────────────────────────────────
function ATSAnalyzer(){
  const [jd,setJd]=React.useState('');const [res,setRes]=React.useState(null);const [busy,setBusy]=React.useState(false);
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const analyze=()=>{
    if(!jd.trim())return; setBusy(true);
    setTimeout(()=>{
      const txt=jd.toLowerCase();
      const found=MY_SKILLS.filter(s=>txt.includes(s.toLowerCase()));
      const missing=MY_SKILLS.filter(s=>!txt.includes(s.toLowerCase())&&['ERwin','Data Modeling','SCD','Star Schema','Data Vault','SQL','Azure','ETL','Dimensional Modeling','Data Warehouse','Power BI'].includes(s));
      const score=Math.min(98,Math.round((found.length/Math.max(1,found.length+missing.length*0.5))*100));
      const em=txt.match(/(\d+)\+?\s*years?/);
      const sug=[];
      if(!txt.includes('erwin'))sug.push({tip:'Add ERwin version (ERwin r9 / Data Modeler 2021)',pri:'high'});
      if(!txt.includes('data vault'))sug.push({tip:'Include "Data Vault 2.0" — very high demand keyword',pri:'high'});
      if(!txt.includes('scd'))sug.push({tip:'Add "SCD Type 2" — almost always required for DW roles',pri:'medium'});
      if(score<60)sug.push({tip:'Low match (<60%) — apply only if company/domain is top priority',pri:'high'});
      if(score>=80)sug.push({tip:'Strong match! Mirror exact JD language in your resume summary',pri:'low'});
      setRes({score,found,missing:missing.slice(0,8),exp:em?`${em[1]}+ years`:'Not specified',sug});
      setBusy(false);
    },800);
  };
  const scoreCol=res?(res.score>=80?C.green:res.score>=60?C.amber:C.red):C.cyan;
  return(<div>
    <SHdr title="🎯 ATS Score Analyzer" sub="Paste a Job Description → get keyword match score vs your Data Modeler / Architect profile"/>
    <div style={card}>
      <div style={{fontSize:10,color:'#64748b',fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>Paste Job Description</div>
      <textarea value={jd} onChange={e=>setJd(e.target.value)} rows={7} placeholder="Paste the full job description here (from LinkedIn, Naukri, Indeed)..." style={{width:'100%',boxSizing:'border-box',padding:'0.75rem',borderRadius:8,fontSize:12,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'#e2e8f0',outline:'none',resize:'vertical',lineHeight:1.6}}/>
      <div style={{display:'flex',gap:'0.75rem',marginTop:'0.75rem',alignItems:'center'}}>
        <button onClick={analyze} disabled={!jd.trim()||busy} style={{padding:'0.6rem 1.5rem',borderRadius:8,fontSize:13,fontWeight:700,background:jd.trim()&&!busy?`linear-gradient(135deg,${C.cyan},${C.blue})`:'rgba(255,255,255,0.05)',border:'none',color:jd.trim()&&!busy?'#0a0e27':'#475569',cursor:jd.trim()&&!busy?'pointer':'not-allowed',fontFamily:"'JetBrains Mono',monospace"}}>{busy?'⟳ Analyzing...':'⚡ Analyze JD'}</button>
        {jd&&<button onClick={()=>{setJd('');setRes(null);}} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#475569',cursor:'pointer',padding:'0.55rem 1rem',fontSize:12}}>Clear</button>}
      </div>
    </div>
    {res&&(<>
      <div style={{...card,display:'flex',gap:'1.5rem',alignItems:'center'}}>
        <div style={{position:'relative',width:88,height:88,flexShrink:0}}>
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            <circle cx="44" cy="44" r="36" fill="none" stroke={scoreCol} strokeWidth="8" strokeDasharray={`${res.score*2.26} 226`} strokeLinecap="round" transform="rotate(-90 44 44)"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:20,fontWeight:800,color:scoreCol}}>{res.score}%</div>
            <div style={{fontSize:8,color:'#64748b',fontFamily:"'JetBrains Mono',monospace"}}>ATS MATCH</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:scoreCol,marginBottom:4}}>{res.score>=80?'✅ Strong Match — Apply Now':res.score>=60?'⚠️ Moderate — Optimize First':'❌ Weak Match — Major Gaps'}</div>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>{res.found.length} skills matched · {res.missing.length} key skills missing from JD</div>
          <div style={{fontSize:11,color:'#64748b',fontFamily:"'JetBrains Mono',monospace"}}>EXP REQUIRED: <span style={{color:C.amber}}>{res.exp}</span></div>
        </div>
      </div>
      <div style={card}><div style={{fontSize:10,color:C.green,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>✓ Matched ({res.found.length})</div><div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem'}}>{res.found.map((k,i)=><Tag key={i} label={k} color={C.green}/>)}{res.found.length===0&&<span style={{fontSize:12,color:'#475569'}}>No keywords matched</span>}</div></div>
      {res.missing.length>0&&<div style={card}><div style={{fontSize:10,color:C.red,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>✗ Missing ({res.missing.length})</div><div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem',marginBottom:'0.5rem'}}>{res.missing.map((k,i)=><Tag key={i} label={k} color={C.red}/>)}</div><div style={{fontSize:11,color:'#64748b',fontFamily:"'JetBrains Mono',monospace"}}>→ Add these to your skills section if you have the experience</div></div>}
      <div style={card}><div style={{fontSize:10,color:C.amber,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>💡 Optimization Tips</div>{res.sug.map((s,i)=><div key={i} style={{display:'flex',gap:'0.6rem',alignItems:'flex-start',marginBottom:'0.4rem'}}><span style={{fontSize:9,padding:'2px 5px',borderRadius:3,flexShrink:0,marginTop:1,background:s.pri==='high'?`${C.red}20`:s.pri==='medium'?`${C.amber}20`:`${C.green}20`,border:`1px solid ${s.pri==='high'?C.red:s.pri==='medium'?C.amber:C.green}44`,color:s.pri==='high'?C.red:s.pri==='medium'?C.amber:C.green,fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase'}}>{s.pri}</span><span style={{fontSize:12,color:'#94a3b8',lineHeight:1.5}}>{s.tip}</span></div>)}</div>
      <div style={{...card,background:res.score>=80?`${C.green}08`:`${C.amber}08`,border:`1px solid ${res.score>=80?C.green:C.amber}33`}}><div style={{fontSize:12,fontWeight:600,color:res.score>=80?C.green:res.score>=60?C.amber:C.red,marginBottom:4}}>{res.score>=80?'🟢 APPLY NOW — Auto-Apply eligible':res.score>=60?'🟡 OPTIMIZE FIRST — then apply':'🔴 SKIP or major tailoring needed'}</div><div style={{fontSize:11,color:'#64748b',fontFamily:"'JetBrains Mono',monospace"}}>{res.score>=80?'Mirror JD language in summary. Use matching Resume AI profile.':res.score>=60?'Add missing keywords to resume. Target >80 before applying.':'Apply only if company is top priority. Significant customization required.'}</div></div>
    </>)}
    <div style={card}><div style={{fontSize:10,color:'#64748b',fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>Your Skill Profile (used for matching)</div><div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem'}}>{MY_SKILLS.slice(0,24).map((s,i)=><Tag key={i} label={s} color={[C.cyan,C.purple,C.green,C.amber,C.teal,C.blue][i%6]}/>)}<Tag label={`+${MY_SKILLS.length-24} more`} color="#475569"/></div></div>
  </div>);
}

// ── Resume AI ──────────────────────────────────────────────────────
function ResumeAI(){
  const [sel,setSel]=React.useState(0);const [copied,setCopied]=React.useState(null);
  const p=RESUME_PROFILES[sel];
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const copy=(txt,i)=>{navigator.clipboard?.writeText(txt).catch(()=>{});setCopied(i);setTimeout(()=>setCopied(null),1500);};
  const todayRot=getTodayRotation();const todayP=RESUME_PROFILES[todayRot.profile];
  return(<div>
    <SHdr title="📄 Resume AI" sub="4 tailored profiles for your target roles — AI picks the right one per JD"/>
    {/* Today's active rotation badge */}
    <div style={{background:`${todayP.color}10`,border:`1px solid ${todayP.color}44`,borderRadius:10,padding:'0.6rem 0.9rem',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
      <div style={{fontSize:22}}>{todayP.icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:todayP.color,fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',marginBottom:2}}>
          📅 Today&apos;s Active Resume — {new Date().toLocaleDateString('en-US',{weekday:'long'})}
        </div>
        <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{todayP.type}</div>
        <div style={{fontSize:10,color:'#64748b',marginTop:1,fontFamily:"'JetBrains Mono',monospace"}}>{todayRot.note}</div>
      </div>
      <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap',maxWidth:200}}>
        {RESUME_ROTATION.map((r,i)=>{const rp=RESUME_PROFILES[r.profile];const isToday=r.day===new Date().getDay();return(<span key={i} style={{padding:'2px 6px',borderRadius:3,fontSize:8,fontFamily:"'JetBrains Mono',monospace",border:`1px solid ${isToday?rp.color:rp.color+'22'}`,background:isToday?`${rp.color}20`:'transparent',color:isToday?rp.color:'#334155'}}>{['Su','Mo','Tu','We','Th','Fr','Sa'][r.day]}</span>);})}
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'0.5rem',marginBottom:'0.75rem'}}>
      {RESUME_PROFILES.map((r,i)=><button key={i} onClick={()=>setSel(i)} style={{padding:'0.75rem',borderRadius:10,cursor:'pointer',textAlign:'left',border:`1.5px solid ${sel===i?r.color:r.color+'33'}`,background:sel===i?`${r.color}18`:`${r.color}08`,transition:'all 0.2s'}}><div style={{fontSize:20,marginBottom:4}}>{r.icon}</div><div style={{fontSize:11,fontWeight:700,color:sel===i?r.color:'#94a3b8'}}>{r.type}</div></button>)}
    </div>
    <div style={{...card,border:`1px solid ${p.color}44`,background:`${p.color}08`}}><div style={{fontSize:10,color:p.color,fontFamily:"'JetBrains Mono',monospace",marginBottom:4,textTransform:'uppercase'}}>Resume Headline</div><div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{p.headline}</div><div style={{fontSize:11,color:'#64748b',marginTop:6}}>Focus: {p.focus}</div></div>
    <div style={card}><div style={{fontSize:10,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>🔑 Top ATS Keywords</div><div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem'}}>{p.keywords.map((k,i)=><Tag key={i} label={k} color={p.color}/>)}</div></div>
    <div style={card}><div style={{fontSize:10,color:C.green,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>✍️ Ready-to-Use Bullet Points (click to copy)</div>{p.bullets.map((b,i)=><div key={i} onClick={()=>copy(b,i)} style={{display:'flex',gap:'0.75rem',alignItems:'flex-start',padding:'0.55rem',borderRadius:8,marginBottom:'0.35rem',cursor:'pointer',background:copied===i?`${C.green}15`:'rgba(255,255,255,0.03)',border:`1px solid ${copied===i?C.green:'rgba(255,255,255,0.06)'}`,transition:'all 0.2s'}} onMouseEnter={e=>{if(copied!==i)e.currentTarget.style.background='rgba(255,255,255,0.06)';}} onMouseLeave={e=>{if(copied!==i)e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>  <span style={{fontSize:11,color:copied===i?C.green:'#475569',flexShrink:0,marginTop:1}}>{copied===i?'✓':'•'}</span><span style={{fontSize:12,color:'#94a3b8',lineHeight:1.6,flex:1}}>{b}</span><span style={{fontSize:10,color:copied===i?C.green:'#475569',flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{copied===i?'Copied!':'copy'}</span></div>)}</div>
    <div style={card}><div style={{fontSize:10,color:C.amber,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>💡 ATS Tips</div>{p.atsTips.map((t,i)=><div key={i} style={{display:'flex',gap:'0.5rem',marginBottom:'0.4rem',alignItems:'flex-start'}}><span style={{color:C.amber,flexShrink:0}}>→</span><span style={{fontSize:12,color:'#94a3b8',lineHeight:1.5}}>{t}</span></div>)}</div>
    <div style={card}><div style={{fontSize:10,color:C.teal,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.6rem',textTransform:'uppercase'}}>📊 Salary Intelligence — India 2025–26</div><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><thead><tr>{['Role','0–3 yrs','3–7 yrs','7+ yrs','Demand','Remote'].map(h=><th key={h} style={{padding:'5px 7px',textAlign:'left',color:'#64748b',fontFamily:"'JetBrains Mono',monospace",borderBottom:'1px solid rgba(255,255,255,0.06)',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead><tbody>{SALARY_DATA.map((r,i)=><tr key={i} style={{background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}><td style={{padding:'5px 7px',color:C.cyan,fontWeight:600}}>{r.role}</td><td style={{padding:'5px 7px',color:'#94a3b8'}}>{r.exp0_3}</td><td style={{padding:'5px 7px',color:'#e2e8f0',fontWeight:600}}>{r.exp3_7}</td><td style={{padding:'5px 7px',color:C.green}}>{r.exp7p}</td><td style={{padding:'5px 7px'}}><span style={{fontSize:10,padding:'2px 5px',borderRadius:3,color:r.demand==='Very High'?C.green:r.demand==='High'?C.teal:C.amber,background:r.demand==='Very High'?`${C.green}15`:r.demand==='High'?`${C.teal}15`:`${C.amber}15`}}>{r.demand}</span></td><td style={{padding:'5px 7px',color:'#64748b'}}>{r.remote}</td></tr>)}</tbody></table></div></div>
  </div>);
}

// ── Interview Prep ────────────────────────────────────────────────
function InterviewPrep(){
  const domains=Object.keys(INTERVIEW_QB);
  const [domain,setDomain]=React.useState(domains[0]);
  const [open,setOpen]=React.useState(null);
  const [prac,setPrac]=React.useState(false);
  const [qi,setQi]=React.useState(0);
  const [showA,setShowA]=React.useState(false);
  const qs=INTERVIEW_QB[domain]||[];
  const dc={'SQL & Database':C.cyan,'Data Modeling':C.purple,'Data Vault':C.amber,'Azure & Cloud':C.blue,'Retail & Insurance':C.green}[domain]||C.cyan;
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  if(prac){const q=qs[qi];return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}><SHdr title="🧠 Practice Mode" sub={`${domain} · Q${qi+1}/${qs.length}`}/><button onClick={()=>{setPrac(false);setShowA(false);setQi(0);}} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#64748b',cursor:'pointer',padding:'0.4rem 0.75rem',fontSize:11}}>← Exit</button></div>
    <div style={{...card,border:`1px solid ${dc}44`}}><div style={{fontSize:10,color:dc,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>Question {qi+1}/{qs.length}</div><div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',lineHeight:1.6,marginBottom:'1rem'}}>{q.q}</div>{!showA?<button onClick={()=>setShowA(true)} style={{padding:'0.6rem 1.5rem',borderRadius:8,fontSize:12,fontWeight:600,background:`linear-gradient(135deg,${dc},${dc}99)`,border:'none',color:'#0a0e27',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace"}}>Reveal Answer</button>:<div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'0.75rem',border:`1px solid ${dc}33`}}><div style={{fontSize:10,color:dc,fontFamily:"'JetBrains Mono',monospace",marginBottom:6,textTransform:'uppercase'}}>Answer</div><div style={{fontSize:12,color:'#94a3b8',lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"}}>{q.a}</div></div>}</div>
    <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem'}}><button onClick={()=>{setQi(i=>Math.max(0,i-1));setShowA(false);}} disabled={qi===0} style={{flex:1,padding:'0.6rem',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:qi===0?'#334155':'#94a3b8',cursor:qi===0?'not-allowed':'pointer',fontSize:13}}>← Prev</button><button onClick={()=>{setQi(i=>Math.min(qs.length-1,i+1));setShowA(false);}} disabled={qi===qs.length-1} style={{flex:1,padding:'0.6rem',borderRadius:8,border:`1px solid ${dc}44`,background:`${dc}15`,color:qi===qs.length-1?'#334155':dc,cursor:qi===qs.length-1?'not-allowed':'pointer',fontSize:13,fontWeight:600}}>Next →</button></div>
    <div style={{height:4,borderRadius:2,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',borderRadius:2,background:dc,width:`${((qi+1)/qs.length)*100}%`,transition:'width 0.3s'}}/></div>
  </div>);}
  return(<div>
    <SHdr title="🧠 Interview Prep" sub="Domain-specific Q&A for Data Modeler / Architect roles. Based on real interview patterns."/>
    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>{domains.map(d=><Pill key={d} active={domain===d} color={{'SQL & Database':C.cyan,'Data Modeling':C.purple,'Data Vault':C.amber,'Azure & Cloud':C.blue,'Retail & Insurance':C.green}[d]} onClick={()=>{setDomain(d);setOpen(null);}}>{d}</Pill>)}</div>
    <button onClick={()=>{setPrac(true);setQi(0);setShowA(false);}} style={{padding:'0.6rem 1.2rem',borderRadius:8,fontSize:12,fontWeight:700,marginBottom:'0.75rem',background:`linear-gradient(135deg,${dc},${dc}80)`,border:'none',color:'#0a0e27',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace"}}>▶ Start Practice Mode ({qs.length} Qs)</button>
    {qs.map((item,i)=><div key={i} style={{background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:`1px solid ${open===i?dc+'55':'rgba(255,255,255,0.08)'}`,borderRadius:12,marginBottom:'0.5rem',overflow:'hidden',transition:'border-color 0.2s'}}><button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%',textAlign:'left',background:'none',border:'none',padding:'0.8rem 1rem',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.75rem'}}><div style={{display:'flex',gap:'0.75rem',alignItems:'flex-start',flex:1}}><span style={{fontSize:9,padding:'2px 5px',borderRadius:3,flexShrink:0,marginTop:2,background:`${dc}18`,border:`1px solid ${dc}44`,color:dc,fontFamily:"'JetBrains Mono',monospace"}}>Q{i+1}</span><span style={{fontSize:13,color:'#e2e8f0',lineHeight:1.5,textAlign:'left'}}>{item.q}</span></div><span style={{color:open===i?dc:'#475569',fontSize:12,flexShrink:0}}>{open===i?'▲':'▼'}</span></button>{open===i&&<div style={{padding:'0 1rem 0.75rem',borderTop:`1px solid ${dc}22`}}><div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'0.75rem',marginTop:'0.5rem',border:`1px solid ${dc}22`}}><div style={{fontSize:9,color:dc,fontFamily:"'JetBrains Mono',monospace",marginBottom:6,textTransform:'uppercase'}}>Answer</div><div style={{fontSize:12,color:'#94a3b8',lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace"}}>{item.a}</div></div></div>}</div>)}
    <div style={{background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:`1px solid ${C.purple}33`,borderRadius:12,padding:'1rem'}}><div style={{fontSize:10,color:C.purple,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>💼 Interview Strategy</div>{['Lead with a real project — name the domain (retail/insurance), tool (ERwin), and impact (X entities, Y pipelines)','For SCD: explain Type 2 step-by-step — surrogate key, effective_date, expiry_date, current_flag','For Data Vault: know Raw Vault vs Business Vault. Senior interviewers specifically test this.','SQL questions: think out loud before writing code. Show your reasoning process.','Connect all domain answers back to Retail or Insurance — your target sectors.'].map((t,i)=><div key={i} style={{display:'flex',gap:'0.5rem',marginBottom:'0.4rem',alignItems:'flex-start'}}><span style={{color:C.purple,flexShrink:0}}>→</span><span style={{fontSize:12,color:'#94a3b8',lineHeight:1.5}}>{t}</span></div>)}</div>
  </div>);
}

// ── Scheduler Guide ───────────────────────────────────────────────
function SchedulerGuide({query,loc,_savedJobs,safeMode,onSafeModeToggle}){
  const [mode,setMode]=React.useState('afternoon');
  const [running,setRunning]=React.useState(false);
  const [log,setLog]=React.useState([]);
  const [phase,setPhase]=React.useState('idle');
  const logEndRef=React.useRef(null);
  const abortRef=React.useRef(false);
  const timerRef=React.useRef(null);

  const APPLY_LIMIT=safeMode?12:25;
  const CONN_LIMIT=safeMode?8:18;
  const delayMult=safeMode?1.6:1;
  const todayKey=new Date().toDateString();
  const [daily,setDaily]=React.useState(()=>{
    try{const d=JSON.parse(localStorage.getItem('dos_daily_run')||'{}');
      return d.date===todayKey?d:{date:todayKey,apps:0,connections:0,runs:0};}
    catch{return{date:todayKey,apps:0,connections:0,runs:0};}
  });

  React.useEffect(()=>{
    try{localStorage.setItem('dos_daily_run',JSON.stringify(daily));}catch{}
  },[daily]);

  React.useEffect(()=>{
    if(logEndRef.current)logEndRef.current.scrollIntoView({behavior:'smooth'});
  },[log]);

  const q=query||'data modeler';
  const lc=loc||'India';

  const SESSIONS={
    morning:{label:'🌅 Morning Search',color:C.cyan,time:'7 AM',
      desc:'Discover new postings · ATS score shortlist · Save top roles · Browse naturally',
      steps:[
        {ms:800,  msg:'Initializing morning discovery session...',                            type:'sys',    url:null},
        {ms:1500, msg:'Reading today resume profile from rotation schedule...',               type:'sys',    url:null},
        {ms:2100, msg:'Opening LinkedIn Easy Apply — human typing delay added...',           type:'action', url:()=>linkedinEasyApplyURL(q,lc)},
        {ms:3400, msg:'Simulating 3 s natural read pause (human scrolling behavior)...',     type:'sys',    url:null},
        {ms:1800, msg:'Opening Naukri for overnight postings — varied tab interval...',      type:'action', url:()=>naukriURL(q,lc)},
        {ms:2600, msg:'2.6 s human hesitation delay between boards...',                      type:'sys',    url:null},
        {ms:1900, msg:'Opening Indeed India — randomized open timing...',                    type:'action', url:()=>indeedURL(q,lc)},
        {ms:1400, msg:'Opening InstaHyre curated tech roles...',                             type:'action', url:()=>instahireURL(q)},
        {ms:2200, msg:'Tip: Paste each JD into ATS Score tab — apply only if 80%+',        type:'tip',    url:null},
        {ms:900,  msg:'Morning session complete — 4 boards opened with human-like pacing',  type:'success',url:null},
      ]},
    afternoon:{label:'☀️ Afternoon Apply',color:C.green,time:'1 PM',
      desc:'Apply to ATS-shortlisted roles · Upload optimized resume · Track submissions',
      steps:[
        {ms:800,  msg:'Initializing apply session — checking daily platform limits...',      type:'sys',    url:null},
        {ms:1200, msg:`Safe mode: ${safeMode?'ON — extra delays active':'OFF'} · Daily cap: ${APPLY_LIMIT} apps`, type:'info',url:null},
        {ms:2000, msg:'Opening LinkedIn Easy Apply — primary channel, human pacing...',      type:'action', url:()=>linkedinEasyApplyURL(q,lc)},
        {ms:4200, msg:'4 s humanization buffer — mimicking natural tab read time...',        type:'sys',    url:null},
        {ms:1700, msg:'Opening Naukri Quick Apply — 8+ min gaps recommended per role...',   type:'action', url:()=>naukriURL(q,lc)},
        {ms:3100, msg:'3 s natural pause — simulating candidate browsing behavior...',       type:'sys',    url:null},
        {ms:2100, msg:'Opening Foundit for additional listings — session variance applied...',type:'action',url:()=>founditURL(q,lc)},
        {ms:1500, msg:'Opening Glassdoor applications — vary keyword slightly each visit...',type:'action', url:()=>glassdoorURL(q)},
        {ms:1800, msg:'Tip: After applying update status in Tracker tab immediately',        type:'tip',    url:null},
        {ms:900,  msg:'Apply session launched — 4 boards open with human-like timing',      type:'success',url:null},
      ]},
    evening:{label:'🌙 Evening Follow-up',color:C.purple,time:'7 PM',
      desc:'Recruiter outreach · Connection requests · Response tracking · Profile visit',
      steps:[
        {ms:800,  msg:'Initializing recruiter outreach session...',                           type:'sys',    url:null},
        {ms:2000, msg:'Opening LinkedIn recruiter search — personalized query...',            type:'action', url:()=>`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent('data modeler recruiter '+lc)}&network=%5B%22S%22%5D`},
        {ms:3800, msg:'3.8 s human read delay — simulating profile browsing...',             type:'sys',    url:null},
        {ms:1600, msg:'Opening LinkedIn sent invitations — checking pending requests...',    type:'action', url:()=>'https://www.linkedin.com/mynetwork/invitation-manager/sent/'},
        {ms:2400, msg:'2.4 s pause — natural inbox check behavior...',                       type:'sys',    url:null},
        {ms:1700, msg:'Opening Glassdoor salary intelligence — benchmarking offers...',      type:'action', url:()=>glassdoorURL(q)},
        {ms:1900, msg:'Tip: Personalize each connection note — mention ERwin or Data Vault', type:'tip',    url:null},
        {ms:1300, msg:'Tip: Check LinkedIn inbox for recruiter replies before closing',      type:'tip',    url:null},
        {ms:900,  msg:"Evening session complete — update Tracker with today's responses",   type:'success',url:null},
      ]},
  };

  const LOG_COLORS={sys:'#475569',action:C.cyan,tip:C.amber,info:C.blue,success:C.green,error:C.red,start:C.purple,done:C.green};
  const LOG_ICONS={sys:'⚙',action:'🚀',tip:'💡',info:'ℹ',success:'✅',error:'⛔',start:'▶',done:'🏁'};

  const addLog=(msg,type)=>{
    const ts=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    setLog(prev=>[...prev,{msg,type,ts}]);
  };

  // Human-like sleep: adds ±30% random variance (×1.6 in safe mode) to every step
  const sleep=(ms)=>new Promise(res=>{
    const actual=Math.round(humanDelay(ms*delayMult));
    timerRef.current=setTimeout(res,actual);
  });

  const runSession=async()=>{
    if(running)return;
    if(daily.runs>=6){addLog('Daily session limit reached (6/6). Rest and resume tomorrow.','error');return;}
    setRunning(true);setPhase('running');setLog([]);abortRef.current=false;
    const sess=SESSIONS[mode];
    const humanScore=getHumanActivityScore(daily,safeMode);
    addLog(`▶ ${sess.label} — ${new Date().toLocaleDateString()} · Human Score: ${humanScore}/100`,'start');
    if(safeMode)addLog('Safe Mode ACTIVE — delays +60%, daily limits halved, browse-first behavior','info');
    const activeWin=getCurrentActivityWindow();
    if(activeWin&&activeWin.mode===mode)addLog(`Optimal window detected: ${activeWin.label} (${activeWin.score}% recruiter activity)`,'info');
    else if(activeWin&&activeWin.mode!==mode)addLog(`Tip: Current window favors "${activeWin.label}" session instead`,'tip');
    let opened=0;
    for(const step of sess.steps){
      if(abortRef.current)break;
      await sleep(step.ms);
      if(abortRef.current)break;
      addLog(step.msg,step.type);
      if(step.url){
        try{window.open(typeof step.url==='function'?step.url():step.url,'_blank','noopener,noreferrer');opened++;}catch{}
      }
    }
    if(abortRef.current){
      addLog('Session stopped by user — partial progress saved','error');setPhase('aborted');
    }else{
      const newApps=mode==='afternoon'?opened:0;
      const newConns=mode==='evening'?Math.min(opened,3):0;
      setDaily(prev=>{
        const base=prev.date===todayKey?prev:{date:todayKey,apps:0,connections:0,runs:0};
        return{...base,apps:base.apps+newApps,connections:base.connections+newConns,runs:base.runs+1};
      });
      setPhase('done');
      const newScore=getHumanActivityScore({...daily,apps:daily.apps+newApps,connections:daily.connections+newConns,runs:daily.runs+1},safeMode);
      addLog(`Session complete — ${opened} boards opened · Updated Human Score: ${newScore}/100`,'done');
      if(newScore<70)addLog('Human score dropped below 70 — consider enabling Safe Mode','tip');
    }
    setRunning(false);
  };

  const stopSession=()=>{abortRef.current=true;if(timerRef.current)clearTimeout(timerRef.current);setRunning(false);};
  const clearLog=()=>{setLog([]);setPhase('idle');};

  const sess=SESSIONS[mode];
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const mono={fontFamily:"'JetBrains Mono',monospace"};
  const appsLeft=Math.max(0,APPLY_LIMIT-daily.apps);
  const connsLeft=Math.max(0,CONN_LIMIT-daily.connections);
  const humanScore=getHumanActivityScore(daily,safeMode);
  const scoreCol=humanScore>=85?C.green:humanScore>=65?C.amber:C.red;
  const activeWin=getCurrentActivityWindow();

  return(<div>
    <SHdr title="📅 Humanized Automation Runner" sub="Human Behavior Engine active — randomized delays · safe pacing · anti-detection patterns"/>

    {/* ── HUMAN SCORE + SAFE MODE BANNER ── */}
    <div style={{...card,border:`2px solid ${scoreCol}55`,background:`${scoreCol}06`}}>
      <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
        <div style={{position:'relative',width:68,height:68,flexShrink:0}}>
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
            <circle cx="34" cy="34" r="28" fill="none" stroke={scoreCol} strokeWidth="6" strokeDasharray={`${humanScore*1.76} 176`} strokeLinecap="round" transform="rotate(-90 34 34)"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:15,fontWeight:800,color:scoreCol}}>{humanScore}</div>
            <div style={{fontSize:6,...mono,color:'#64748b'}}>HUMAN</div>
          </div>
        </div>
        <div style={{flex:1,minWidth:160}}>
          <div style={{fontSize:12,fontWeight:700,color:scoreCol,marginBottom:4}}>
            {humanScore>=85?'Excellent — Account appears fully human-like':humanScore>=65?'Good — Minor automation signals, stay within limits':'Risk detected — Enable Safe Mode immediately'}
          </div>
          <div style={{fontSize:10,color:'#64748b',...mono,marginBottom:6}}>
            Apps: {daily.apps}/{APPLY_LIMIT} · Connections: {daily.connections}/{CONN_LIMIT} · Sessions: {daily.runs}/6
          </div>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={onSafeModeToggle} style={{padding:'0.38rem 0.9rem',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',...mono,border:`1.5px solid ${safeMode?C.green:'#334155'}`,background:safeMode?`${C.green}18`:'transparent',color:safeMode?C.green:'#64748b',transition:'all 0.2s'}}>
              {safeMode?'🛡️ Safe Mode: ON':'⚪ Safe Mode: OFF'}
            </button>
            {safeMode&&<span style={{fontSize:10,color:C.green,...mono}}>+60% delays · limits halved · browse-only signals</span>}
          </div>
        </div>
        {activeWin&&(
          <div style={{background:`${C.cyan}08`,border:`1px solid ${C.cyan}33`,borderRadius:8,padding:'0.45rem 0.75rem',flexShrink:0}}>
            <div style={{fontSize:9,color:C.cyan,...mono,textTransform:'uppercase',marginBottom:2}}>Optimal Now</div>
            <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{activeWin.icon} {activeWin.label}</div>
            <div style={{fontSize:10,color:'#64748b',...mono}}>Recruiter activity: {activeWin.score}%</div>
          </div>
        )}
      </div>
    </div>

    {/* ── CONTROL PANEL ── */}
    <div style={{...card,border:`2px solid ${sess.color}55`,background:`${sess.color}07`}}>
      <div style={{fontSize:11,fontWeight:700,color:sess.color,...mono,marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.08em'}}>🤖 Humanized Control Panel — random ±30% delay on every step</div>

      {/* Session selector pills */}
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.6rem'}}>
        {Object.entries(SESSIONS).map(([key,s])=>(
          <button key={key} onClick={()=>!running&&setMode(key)}
            style={{padding:'0.5rem 1rem',borderRadius:8,cursor:running?'default':'pointer',fontSize:11,fontWeight:600,...mono,
              border:mode===key?`1.5px solid ${s.color}`:'1px solid rgba(255,255,255,0.12)',
              background:mode===key?`${s.color}20`:'transparent',color:mode===key?s.color:'#64748b',
              transition:'all 0.2s',opacity:running&&mode!==key?0.35:1}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:11,color:'#64748b',marginBottom:'0.75rem',...mono}}>{sess.desc}</div>

      {/* Daily stats */}
      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
        {[{l:'Apps Today',v:daily.apps,max:APPLY_LIMIT,c:C.green},
          {l:'Connections',v:daily.connections,max:CONN_LIMIT,c:C.cyan},
          {l:'Sessions',v:daily.runs,max:6,c:C.purple}].map((st,i)=>(
          <div key={i} style={{flex:'1 1 90px',background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'0.5rem 0.65rem',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontSize:9,color:'#475569',...mono,textTransform:'uppercase',marginBottom:3}}>{st.l}</div>
            <div style={{fontSize:17,fontWeight:800,color:st.v>=st.max?C.red:st.c,marginBottom:3}}>{st.v}<span style={{fontSize:9,color:'#334155',fontWeight:400}}>/{st.max}</span></div>
            <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)'}}>
              <div style={{height:'100%',borderRadius:2,background:st.v>=st.max?C.red:st.c,width:`${Math.min(100,(st.v/st.max)*100)}%`,transition:'width 0.5s'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Limit warning */}
      {(appsLeft<=5||connsLeft<=5)&&(
        <div style={{fontSize:11,color:C.amber,background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:8,padding:'0.45rem 0.75rem',marginBottom:'0.6rem',...mono}}>
          ⚠ {appsLeft<=3?`Daily app limit almost reached (${daily.apps}/${APPLY_LIMIT}).`:appsLeft<=5?`${appsLeft} apps remaining today.`:''}{connsLeft<=5?` ${connsLeft} connections remaining.`:''}
        </div>
      )}

      {/* RUN / STOP */}
      <div style={{display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
        {!running
          ?<button onClick={runSession} disabled={daily.runs>=6} style={{padding:'0.7rem 2.2rem',borderRadius:10,fontSize:14,fontWeight:800,cursor:daily.runs>=6?'not-allowed':'pointer',
              background:daily.runs>=6?'rgba(255,255,255,0.05)':`linear-gradient(135deg,${sess.color},${sess.color}aa)`,border:'none',
              color:daily.runs>=6?'#475569':'#0a0e27',...mono,
              boxShadow:daily.runs>=6?'none':`0 4px 24px ${sess.color}44`,letterSpacing:'0.06em',transition:'all 0.2s'}}
              onMouseEnter={e=>{if(daily.runs<6)e.currentTarget.style.transform='scale(1.03)';}}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              {daily.runs>=6?'Daily Limit Reached':'▶ Run Session'}
            </button>
          :<button onClick={stopSession} style={{padding:'0.7rem 2rem',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer',
              background:`linear-gradient(135deg,${C.red},${C.red}aa)`,border:'none',color:'#fff',...mono,letterSpacing:'0.05em'}}>
              ⛔ Stop Session
            </button>
        }
        {phase==='running'&&(
          <div style={{fontSize:11,color:sess.color,...mono,display:'flex',alignItems:'center',gap:'0.4rem'}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:sess.color,animation:'sched-pulse 1s ease-in-out infinite'}}/>
            Running with human-like timing…
          </div>
        )}
        {(phase==='done'||phase==='aborted')&&log.length>0&&(
          <button onClick={clearLog} style={{padding:'0.5rem 0.9rem',borderRadius:8,fontSize:11,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#475569',...mono}}>
            Clear Log
          </button>
        )}
      </div>
    </div>

    {/* ── ACTIVITY LOG ── */}
    {log.length>0&&(
      <div style={{...card,background:'rgba(6,9,22,0.95)',border:`1px solid ${C.cyan}33`}}>
        <div style={{fontSize:10,color:C.cyan,...mono,marginBottom:'0.5rem',textTransform:'uppercase',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>📟 Humanized Activity Log</span><span style={{color:'#334155'}}>{log.length} events</span>
        </div>
        <div style={{maxHeight:200,overflowY:'auto'}}>
          {log.map((e,i)=>(
            <div key={i} style={{display:'flex',gap:'0.5rem',padding:'0.22rem 0',borderBottom:'1px solid rgba(255,255,255,0.025)',fontSize:11}}>
              <span style={{color:'#2d3a52',flexShrink:0,fontSize:10,marginTop:1,...mono}}>{e.ts}</span>
              <span style={{flexShrink:0}}>{LOG_ICONS[e.type]||'•'}</span>
              <span style={{color:LOG_COLORS[e.type]||'#94a3b8',lineHeight:1.5}}>{e.msg}</span>
            </div>
          ))}
          {running&&<div style={{fontSize:11,color:'#334155',...mono,padding:'0.25rem 0'}}>▌ human-like delay in progress…</div>}
          <div ref={logEndRef}/>
        </div>
      </div>
    )}

    {/* ── SCHEDULE TIMELINE ── */}
    <div style={card}>
      <div style={{fontSize:10,color:C.cyan,...mono,marginBottom:'0.75rem',textTransform:'uppercase'}}>⏰ Optimal Daily Schedule (click to select)</div>
      {[{time:'7:00 AM',label:'Search & Discovery',detail:'Scan boards · ATS score · Shortlist top roles',color:C.cyan,icon:'🔍',key:'morning'},
        {time:'1:00 PM',label:'Apply & Optimize',detail:'ATS score → optimize resume → submit applications',color:C.green,icon:'📤',key:'afternoon'},
        {time:'7:00 PM',label:'Recruiter Follow-up',detail:'Connection requests · InMail · Follow-up on responses',color:C.purple,icon:'📬',key:'evening'}
      ].map((s,i,arr)=>(
        <div key={i} style={{display:'flex',gap:'1rem',alignItems:'flex-start',marginBottom:i<arr.length-1?'0.75rem':0}}
             onClick={()=>!running&&setMode(s.key)}>
          <div style={{flexShrink:0,textAlign:'center',width:56}}>
            <div style={{fontSize:11,fontWeight:700,color:s.color,...mono,whiteSpace:'nowrap'}}>{s.time}</div>
            {i<arr.length-1&&<div style={{width:2,height:20,background:s.color+'33',margin:'4px auto'}}/>}
          </div>
          <div style={{background:`${s.color}0a`,border:`1px solid ${s.color}${mode===s.key?'66':'22'}`,borderRadius:8,padding:'0.55rem 0.85rem',flex:1,cursor:running?'default':'pointer',transition:'all 0.2s'}}>
            <div style={{fontSize:12,fontWeight:600,color:mode===s.key?s.color:'#94a3b8',marginBottom:2}}>{s.icon} {s.label}{mode===s.key?' ✓':''}</div>
            <div style={{fontSize:11,color:'#64748b'}}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>

    {/* ── SAFE LIMITS ── */}
    <div style={card}>
      <div style={{fontSize:10,color:C.amber,...mono,marginBottom:'0.6rem',textTransform:'uppercase'}}>🛡️ Safe Automation Limits</div>
      {AUTO_LIMITS.map((lm,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.45rem 0',borderBottom:i<AUTO_LIMITS.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
          <div>
            <div style={{fontSize:12,color:'#e2e8f0'}}>{lm.activity}</div>
            <div style={{fontSize:10,color:C.red,...mono}}>⚠ {lm.risk}</div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:lm.color,...mono,background:`${lm.color}15`,border:`1px solid ${lm.color}33`,padding:'3px 9px',borderRadius:6,flexShrink:0,marginLeft:8}}>{lm.safe}</div>
        </div>
      ))}
    </div>

    {/* ── HUMANIZATION ENGINE INFO ── */}
    <div style={card}>
      <div style={{fontSize:10,color:C.purple,...mono,marginBottom:'0.6rem',textTransform:'uppercase'}}>🧠 Human Behavior Engine — Active Patterns</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0.4rem'}}>
        {[
          {pattern:'Randomized delays',   detail:`±30% variance per step${safeMode?' × 1.6x safe mode':''}`,    color:C.cyan},
          {pattern:'Reading simulation',  detail:'15–45 s natural JD read time before apply',                    color:C.green},
          {pattern:'Session throttle',    detail:`${daily.runs}/6 sessions today · rest enforced`,               color:C.purple},
          {pattern:'Keyword rotation',    detail:'Varied search terms prevent bot fingerprinting',               color:C.amber},
          {pattern:'Tab gap spacing',     detail:'2–4 s natural gap between each board open',                   color:C.teal},
          {pattern:'Resume rotation',     detail:`${RESUME_PROFILES[getTodayRotation().profile].type} active today`, color:C.blue},
        ].map((p,i)=>(
          <div key={i} style={{padding:'0.5rem 0.7rem',borderRadius:8,background:`${p.color}08`,border:`1px solid ${p.color}22`}}>
            <div style={{fontSize:11,fontWeight:600,color:p.color,marginBottom:2}}>{p.pattern}</div>
            <div style={{fontSize:10,color:'#64748b',...mono}}>{p.detail}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ── TECH STACK ── */}
    <div style={card}><div style={{fontSize:10,color:C.blue,...mono,marginBottom:'0.6rem',textTransform:'uppercase'}}>🛠️ Recommended Tech Stack</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.4rem'}}>{[{layer:'Workflow',tech:'n8n',color:C.cyan},{layer:'Browser Auto',tech:'Playwright',color:C.purple},{layer:'AI Engine',tech:'Gemini/OpenAI',color:C.amber},{layer:'Database',tech:'PostgreSQL',color:C.blue},{layer:'Dashboard',tech:'Power BI',color:C.green},{layer:'Notifications',tech:'Telegram/Gmail',color:C.teal},{layer:'Hosting',tech:'Railway/Render',color:C.orange},{layer:'Resume',tech:'Google Docs API',color:C.pink}].map((t,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.4rem 0.65rem',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6}}><span style={{fontSize:10,color:'#64748b',...mono}}>{t.layer}</span><span style={{fontSize:11,fontWeight:600,color:t.color}}>{t.tech}</span></div>)}</div></div>

    {/* ── ROADMAP ── */}
    <div style={card}><div style={{fontSize:10,color:C.purple,...mono,marginBottom:'0.75rem',textTransform:'uppercase'}}>🗺️ Build Roadmap — 4 Phases</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.5rem'}}>{[{phase:'Phase 1',dur:'Week 1–2',title:'Foundation',tasks:['Job scraping setup','Google Sheets tracking','Basic ATS scoring'],color:C.cyan},{phase:'Phase 2',dur:'Week 3–4',title:'Optimization',tasks:['4 resume variants ready','ATS keyword tuning','Match score automation'],color:C.purple},{phase:'Phase 3',dur:'Week 5–6',title:'Automation',tasks:['Auto-apply (score >80)','Recruiter outreach workflow','Follow-up sequences'],color:C.amber},{phase:'Phase 4',dur:'Week 7+',title:'Intelligence',tasks:['Interview prep AI','Salary negotiation data','Power BI dashboard'],color:C.green}].map((ph,i)=><div key={i} style={{background:`${ph.color}08`,border:`1px solid ${ph.color}33`,borderRadius:10,padding:'0.75rem'}}><div style={{fontSize:9,color:ph.color,...mono,marginBottom:2,textTransform:'uppercase'}}>{ph.phase} · {ph.dur}</div><div style={{fontSize:12,fontWeight:700,color:'#e2e8f0',marginBottom:8}}>{ph.title}</div>{ph.tasks.map((t,j)=><div key={j} style={{display:'flex',gap:'0.35rem',alignItems:'flex-start',marginBottom:3}}><span style={{color:ph.color,fontSize:10,flexShrink:0}}>✓</span><span style={{fontSize:10,color:'#64748b',lineHeight:1.4}}>{t}</span></div>)}</div>)}</div></div>

    <style>{`@keyframes sched-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
  </div>);
}

// ── Pipeline Dashboard ────────────────────────────────────────────
function PipelineDashboard({savedJobs,tracker}){
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const cnt={};STATUS_OPTIONS.forEach(s=>{cnt[s]=savedJobs.filter(j=>tracker[j.id]===s).length;});
  const tA=cnt['Applied']||0,tI=cnt['Interview']||0,tO=cnt['Offer']||0,tR=cnt['Rejected']||0;
  const conv=tA>0?Math.round((tI/tA)*100):0;
  const maxV=Math.max(1,savedJobs.length);
  const funnel=[{label:'Saved',v:savedJobs.length,color:C.cyan},{label:'Applied',v:tA,color:C.blue},{label:'Interview',v:tI,color:C.purple},{label:'Offer',v:tO,color:C.green}];
  return(<div>
    <SHdr title="📊 Pipeline Dashboard" sub="Track your application funnel, conversion rates, and weekly progress"/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(95px,1fr))',gap:'0.5rem',marginBottom:'0.75rem'}}>
      {[{label:'Saved',v:savedJobs.length,color:C.cyan,icon:'📌'},{label:'Applied',v:tA,color:C.blue,icon:'📤'},{label:'Interviews',v:tI,color:C.purple,icon:'🎤'},{label:'Offers',v:tO,color:C.green,icon:'🎉'},{label:'Rejected',v:tR,color:C.red,icon:'❌'},{label:'Conv. Rate',v:`${conv}%`,color:C.amber,icon:'📈'}].map((k,i)=><div key={i} style={{...card,marginBottom:0,textAlign:'center',border:`1.5px solid ${k.color}33`,background:`${k.color}08`}}><div style={{fontSize:16,marginBottom:2}}>{k.icon}</div><div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.v}</div><div style={{fontSize:9,color:'#475569',fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{k.label}</div></div>)}
    </div>
    <div style={card}><div style={{fontSize:10,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.6rem',textTransform:'uppercase'}}>🔽 Application Funnel</div>{funnel.map((f,i)=><div key={i} style={{marginBottom:'0.55rem'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,color:'#e2e8f0'}}>{f.label}</span><span style={{fontSize:12,fontWeight:700,color:f.color,fontFamily:"'JetBrains Mono',monospace"}}>{f.v}</span></div><div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}><div style={{height:'100%',borderRadius:4,background:`linear-gradient(90deg,${f.color},${f.color}88)`,width:`${Math.max(2,(f.v/maxV)*100)}%`,transition:'width 0.8s ease'}}/></div></div>)}{savedJobs.length===0&&<div style={{textAlign:'center',padding:'0.75rem',color:'#475569',fontSize:12}}>Star jobs in Search to populate the funnel.</div>}</div>
    <div style={card}><div style={{fontSize:10,color:C.amber,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>💡 Insights</div>{savedJobs.length===0?<div style={{fontSize:12,color:'#475569'}}>Start tracking applications to see insights here.</div>:<>{conv>0&&<div style={{display:'flex',gap:'0.5rem',marginBottom:'0.35rem'}}><span style={{color:conv>=20?C.green:C.amber}}>→</span><span style={{fontSize:12,color:'#94a3b8'}}>Interview conversion: <strong style={{color:conv>=20?C.green:C.amber}}>{conv}%</strong>{conv<15?' — Below 15%. Tailor resume per JD and check ATS scores.':' — Good!'}</span></div>}{tA>=20&&tI===0&&<div style={{display:'flex',gap:'0.5rem',marginBottom:'0.35rem'}}><span style={{color:C.red}}>→</span><span style={{fontSize:12,color:'#94a3b8'}}>20+ applications, 0 interviews — run ATS Analyzer and fix keyword gaps.</span></div>}<div style={{display:'flex',gap:'0.5rem'}}><span style={{color:C.teal}}>→</span><span style={{fontSize:12,color:'#94a3b8'}}>Target: <strong style={{color:C.teal}}>20–25 quality apps/week</strong> with ATS score &gt;80%.</span></div></>}</div>
    <div style={{...card,border:`1px solid ${C.purple}33`}}><div style={{fontSize:10,color:C.purple,fontFamily:"'JetBrains Mono',monospace",marginBottom:'0.5rem',textTransform:'uppercase'}}>🎯 Weekly Goal — 20 Applications</div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,color:'#94a3b8'}}>Applications tracked</span><span style={{fontSize:12,color:C.purple,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{Math.min(tA,20)}/20</span></div><div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.05)',marginBottom:8}}><div style={{height:'100%',borderRadius:4,background:`linear-gradient(90deg,${C.purple},${C.blue})`,width:`${Math.min(100,(tA/20)*100)}%`,transition:'width 0.8s'}}/></div><div style={{fontSize:11,color:'#475569',fontFamily:"'JetBrains Mono',monospace"}}>{tA>=20?'✅ Weekly goal met!':`${20-Math.min(tA,20)} more to hit weekly target`}</div></div>
  </div>);
}

// ── Account Health Monitor ────────────────────────────────────────
function AccountHealthMonitor({safeMode,onSafeModeToggle}){
  const todayKey=new Date().toDateString();
  const [daily]=React.useState(()=>{
    try{const d=JSON.parse(localStorage.getItem('dos_daily_run')||'{}');
      return d.date===todayKey?d:{date:todayKey,apps:0,connections:0,runs:0};}
    catch{return{date:todayKey,apps:0,connections:0,runs:0};}
  });
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const mono={fontFamily:"'JetBrains Mono',monospace"};
  const score=getHumanActivityScore(daily,safeMode);
  const scoreCol=score>=85?C.green:score>=65?C.amber:C.red;
  const activeWindow=getCurrentActivityWindow();
  const todayRot=getTodayRotation();
  const todayProfile=RESUME_PROFILES[todayRot.profile];

  return(<div>
    <SHdr title="🛡️ Account Health Monitor" sub="Platform safety · Human activity score · Safe mode · Resume rotation"/>

    {/* Human Activity Score */}
    <div style={{...card,border:`2px solid ${scoreCol}55`,background:`${scoreCol}07`}}>
      <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap'}}>
        <div style={{position:'relative',width:80,height:80,flexShrink:0}}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke={scoreCol} strokeWidth="7" strokeDasharray={`${score*2.01} 201`} strokeLinecap="round" transform="rotate(-90 40 40)"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:20,fontWeight:800,color:scoreCol}}>{score}</div>
            <div style={{fontSize:7,color:'#64748b',...mono}}>HUMAN SCORE</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:scoreCol,marginBottom:4}}>
            {score>=85?'Excellent — Account appears fully human-like':score>=65?'Good — Minor risk indicators, stay within limits':'Risk Detected — Activate Safe Mode now'}
          </div>
          <div style={{fontSize:11,color:'#64748b',...mono,marginBottom:8}}>
            Apps: {daily.apps}/25 · Connections: {daily.connections}/15 · Sessions: {daily.runs}/6
          </div>
          <button onClick={onSafeModeToggle} style={{padding:'0.45rem 1.1rem',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',...mono,border:`1.5px solid ${safeMode?C.green:'#475569'}`,background:safeMode?`${C.green}20`:'transparent',color:safeMode?C.green:'#64748b',transition:'all 0.2s'}}>
            {safeMode?'🛡️ Safe Mode: ON — Browsing-only signals active':'⚪ Safe Mode: OFF — Click to enable'}
          </button>
          {safeMode&&<div style={{fontSize:10,color:C.green,...mono,marginTop:4}}>Limits halved · +60% delays · Browse-only behavior active</div>}
        </div>
      </div>
    </div>

    {/* Active time window */}
    {activeWindow?(<div style={{...card,border:`1px solid ${C.cyan}33`,background:`${C.cyan}06`}}>
      <div style={{fontSize:10,color:C.cyan,...mono,marginBottom:4,textTransform:'uppercase'}}>Now is optimal for:</div>
      <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0',marginBottom:2}}>{activeWindow.icon} {activeWindow.label}</div>
      <div style={{fontSize:11,color:'#64748b'}}>{activeWindow.action} · Recruiter online score: <span style={{color:C.cyan,fontWeight:700}}>{activeWindow.score}%</span></div>
    </div>):(<div style={{...card}}>
      <div style={{fontSize:10,color:'#475569',...mono,marginBottom:4,textTransform:'uppercase'}}>Activity Window</div>
      <div style={{fontSize:12,color:'#64748b'}}>Outside peak hours. Optimal windows: Morning (7–10 AM) · Afternoon (12–3 PM) · Evening (5–8 PM)</div>
    </div>)}

    {/* Per-platform health cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))',gap:'0.5rem',marginBottom:'0.75rem'}}>
      {Object.entries(PLATFORM_SAFETY).map(([key,p])=>{
        const used=key==='linkedin'?Math.min(daily.apps||0,p.appsLimit):Math.floor((daily.apps||0)*(key==='naukri'?0.6:0.4));
        const pct=Math.min(100,Math.round((used/p.appsLimit)*100));
        const barCol=pct>=80?C.red:pct>=60?C.amber:p.color;
        return(<div key={key} style={{...card,marginBottom:0,border:`1px solid ${p.color}33`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:700,color:p.color}}>{p.icon} {p.label}</div>
            <div style={{fontSize:9,padding:'2px 5px',borderRadius:3,...mono,background:barCol===C.red?`${C.red}18`:barCol===C.amber?`${C.amber}18`:`${p.color}12`,border:`1px solid ${barCol}44`,color:barCol}}>{pct>=80?'AT LIMIT':pct>=60?'MODERATE':'SAFE'}</div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,color:'#64748b',...mono}}>Apps today</span>
            <span style={{fontSize:11,fontWeight:700,...mono,color:barCol}}>{used}/{p.appsLimit}</span>
          </div>
          <div style={{height:4,borderRadius:2,background:'rgba(255,255,255,0.05)',marginBottom:6}}>
            <div style={{height:'100%',borderRadius:2,background:barCol,width:`${pct}%`,transition:'width 0.5s'}}/>
          </div>
          <div style={{fontSize:9,color:'#475569',lineHeight:1.4}}>{p.risk}</div>
        </div>);
      })}
    </div>

    {/* Today's resume rotation */}
    <div style={{...card,border:`1px solid ${todayProfile.color}44`}}>
      <div style={{fontSize:10,color:todayProfile.color,...mono,marginBottom:6,textTransform:'uppercase'}}>
        Active Resume — {new Date().toLocaleDateString('en-US',{weekday:'long'})}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.6rem'}}>
        <div style={{fontSize:28}}>{todayProfile.icon}</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{todayProfile.type}</div>
          <div style={{fontSize:11,color:'#64748b',marginTop:2,...mono}}>{todayRot.note}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
        {RESUME_ROTATION.map((r,i)=>{const rp=RESUME_PROFILES[r.profile];const isToday=r.day===new Date().getDay();return(
          <div key={i} style={{padding:'3px 7px',borderRadius:4,fontSize:9,...mono,border:`1px solid ${isToday?rp.color:rp.color+'22'}`,background:isToday?`${rp.color}20`:'transparent',color:isToday?rp.color:'#334155'}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.day]}: {rp.type.split(' ')[0]}
          </div>
        );})}
      </div>
    </div>

    {/* Anti-detection rules */}
    <div style={card}>
      <div style={{fontSize:10,color:C.red,...mono,marginBottom:'0.6rem',textTransform:'uppercase'}}>Anti-Detection Rules — Always Enforced</div>
      {[
        ['Never apply to the same job twice',              'Duplicate detection = immediate platform flag'],
        ['Min 8-min gap between LinkedIn applies',         'Burst clicking is the #1 bot detection signal'],
        ['Rotate search keywords daily',                   'Same exact query string daily = bot fingerprint'],
        ['Simulate reading: 15–45 sec per JD before apply','Instant click-apply detected by scroll telemetry'],
        ['Max 3 profile edits per week on Naukri',         'Frequent edits queue account for manual review'],
        ['Session max: 25–40 minutes with natural breaks', 'Multi-hour unbroken sessions match bot baselines'],
      ].map(([rule,reason],i)=>(
        <div key={i} style={{display:'flex',gap:'0.6rem',marginBottom:'0.4rem',alignItems:'flex-start'}}>
          <span style={{color:C.red,flexShrink:0,fontSize:11}}>✗</span>
          <div>
            <div style={{fontSize:11,color:'#e2e8f0',marginBottom:1}}>{rule}</div>
            <div style={{fontSize:10,color:'#475569',...mono}}>{reason}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Firebase schema reference */}
    <div style={card}>
      <div style={{fontSize:10,color:C.blue,...mono,marginBottom:'0.6rem',textTransform:'uppercase'}}>Firebase Automation Schema</div>
      <div style={{fontSize:11,color:'#64748b',...mono,lineHeight:1.8}}>
        {`users/{uid}/automationLogs/{logId}\n  ├── sessionType: "morning" | "afternoon" | "evening"\n  ├── humanScore: number\n  ├── boardsOpened: number\n  ├── safeMode: boolean\n  ├── ts: ISO timestamp\n  └── platform: "linkedin" | "naukri" | "indeed" | "foundit"\n\nusers/{uid}/resumeRotation/{date}\n  ├── profileIndex: 0–3\n  ├── profileType: string\n  └── activatedAt: timestamp`}
      </div>
    </div>
  </div>);
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
export default function JobHunter(){
  const [tab,setTab]=useState('search');
  const [query,setQuery]=useState('data modeler');
  const [loc,setLoc]=useState('India');
  const [jobs,setJobs]=useState([]);
  const [lastSearchMeta,setLastSearchMeta]=useState({term:'',total:0});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [savedJobs,setSavedJobs]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch{return [];}});
  const [tracker,setTracker]=useState(()=>{try{return JSON.parse(localStorage.getItem(TRACKER_KEY)||'{}');}catch{return {};}});
  const [filter,setFilter]=useState('all');
  const [matchMode,setMatchMode]=useState('strict');
  const [sortBy,setSortBy]=useState('relevance');
  const [safeMode,setSafeMode]=useState(()=>{try{return JSON.parse(localStorage.getItem('dos_safe_mode')||'false');}catch{return false;}});
  React.useEffect(()=>{try{localStorage.setItem('dos_safe_mode',JSON.stringify(safeMode));}catch{}},[safeMode]);
  const toggleSafeMode=()=>setSafeMode(s=>!s);
  const remoteLoadedRef = useRef(false);
  const remoteSaveTimerRef = useRef(null);
  const matchModeRef = useRef(matchMode);
  const searchRequestRef = useRef(0);

  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(savedJobs));}catch{}},[savedJobs]);
  useEffect(()=>{try{localStorage.setItem(TRACKER_KEY,JSON.stringify(tracker));}catch{}},[tracker]);

  // Load saved jobs + tracker from backend (falls back to localStorage if backend is down)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [savedRes, trackerRes] = await Promise.all([
          api.jobs.getSaved(),
          api.jobs.getTracker(),
        ]);
        if (!mounted) return;
        if (Array.isArray(savedRes.savedJobs) && savedRes.savedJobs.length) setSavedJobs(savedRes.savedJobs);
        if (trackerRes.tracker && Object.keys(trackerRes.tracker).length) setTracker(trackerRes.tracker);
      } catch {
        // backend unreachable — localStorage values already loaded via useState initialiser
      } finally {
        remoteLoadedRef.current = true;
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced save to backend
  useEffect(() => {
    if (!remoteLoadedRef.current) return;
    if (remoteSaveTimerRef.current) clearTimeout(remoteSaveTimerRef.current);
    remoteSaveTimerRef.current = setTimeout(() => {
      api.jobs.updateTracker(tracker).catch(() => {});
    }, 600);
    return () => { if (remoteSaveTimerRef.current) clearTimeout(remoteSaveTimerRef.current); };
  }, [savedJobs, tracker]);

  // Bug fix A: re-sort current jobs client-side when sortBy pill changes (no new API call needed)
  useEffect(()=>{setJobs(prev=>sortJobs([...prev],sortBy));},[sortBy]);

  // Bug fix B: re-fetch with new matchMode when the strict/broad pill changes; skip initial render
  useEffect(()=>{
    if(matchModeRef.current===matchMode)return;
    matchModeRef.current=matchMode;
    fetchJobs(query);
  },[matchMode]);// eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs=useCallback(async(searchOverride)=>{
    const requestId=++searchRequestRef.current;
    const activeQuery=(searchOverride ?? query).trim();
    setLoading(true);setError('');
    try{
      const res=await api.jobs.search(buildCrawlQuery(activeQuery),loc,40);
      if(requestId!==searchRequestRef.current)return;
      const mapped=(res.jobs||[]).map(j=>{
        const tags=extractTags(j.title+' '+(j.description||''));
        const score=jobRelevanceScore(j,activeQuery,tags);
        return {...j,tags,salary:j.salary||'',relevanceScore:score};
      });
      const strictMatches=mapped.filter(j=>jobMatchesQuery(j,activeQuery,matchMode==='strict'));
      const fallbackMatches=FALLBACK_JOBS.filter(j=>jobMatchesQuery(j,activeQuery));
      const merged=(strictMatches.length>0?strictMatches:fallbackMatches.map(j=>({...j,relevanceScore:jobRelevanceScore(j,activeQuery,j.tags||[])})));
      const sorted=sortJobs(merged,sortBy);
      setJobs(sorted);
      setLastSearchMeta({term:activeQuery,total:sorted.length});
      trackJobSearch(activeQuery,sorted.length);
    }catch{
      if(requestId!==searchRequestRef.current)return;
      const fallbackMatches=FALLBACK_JOBS.filter(j=>jobMatchesQuery(j,activeQuery));
      const scored=sortJobs(fallbackMatches.map(j=>({...j,relevanceScore:jobRelevanceScore(j,activeQuery,j.tags||[])})),sortBy);
      setJobs(scored);
      setLastSearchMeta({term:activeQuery,total:scored.length});
      trackJobSearch(activeQuery,scored.length);
      setError('Live search unavailable — showing curated roles for your exact search.');
    }
    finally{if(requestId===searchRequestRef.current)setLoading(false);}
  },[query,loc,matchMode,sortBy]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial fetch on mount only; later searches are user-triggered
  useEffect(()=>{fetchJobs(query);},[]);

  const handleSave=j=>{
    const alreadySaved=savedJobs.find(x=>x.id===j.id);
    setSavedJobs(p=>alreadySaved?p.filter(x=>x.id!==j.id):[...p,j]);
    if(!alreadySaved){
      trackJobSaved(j.title||'',j.company_name||'');
      api.jobs.saveJob(j).catch(()=>{});
    }else{
      api.jobs.removeJob(j.id).catch(()=>{});
    }
  };
  const handleTrack=(j,s)=>{setSavedJobs(p=>p.find(x=>x.id===j.id)?p:[...p,j]);setTracker(p=>({...p,[j.id]:s}));api.jobs.saveJob(j).catch(()=>{});};
  const isaved=id=>savedJobs.some(j=>j.id===id);
  const filtered=filter==='all'?savedJobs:savedJobs.filter(j=>tracker[j.id]===filter);
  const card={background:'linear-gradient(135deg,rgba(20,28,60,.7),rgba(15,24,50,.5))',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'};
  const monoSm={fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em'};
  const TABS=[{id:'search',label:'🔎 Search'},{id:'ats',label:'🎯 ATS Score'},{id:'resume',label:'📄 Resume AI'},{id:'interview',label:'🧠 Interview'},{id:'tracker',label:`📋 Tracker${savedJobs.length>0?' ('+savedJobs.length+')':''}`},{id:'scheduler',label:'📅 Automation'},{id:'health',label:`🛡️ Safety${safeMode?' ●':''}`},{id:'boards',label:'🌐 Boards'}];

  return(<div style={{padding:'1rem',height:'100%',overflowY:'auto',boxSizing:'border-box'}}>
    <div style={{marginBottom:'1rem'}}><div style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4}}>🤖 AI Career Copilot</div><div style={{fontSize:11,color:'#475569',fontFamily:"'JetBrains Mono',monospace"}}>Data Modeler · Data Architect · Azure DW · ATS Scoring · Interview Prep · Smart Automation</div></div>
    <div style={{display:'flex',gap:'0.35rem',marginBottom:'1rem',flexWrap:'wrap'}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'0.38rem 0.8rem',borderRadius:8,cursor:'pointer',fontSize:11,fontFamily:"'JetBrains Mono',monospace",transition:'all 0.2s',border:tab===t.id?`1.5px solid ${C.cyan}`:'1px solid rgba(255,255,255,0.1)',background:tab===t.id?`${C.cyan}18`:'transparent',color:tab===t.id?C.cyan:'#64748b'}}>{t.label}</button>)}</div>

    {tab==='search'&&(<>
      <div style={{...card,display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchJobs(query)} placeholder="Data modeling, Data Modeller, ERwin, Er Studio..." style={{flex:'2 1 180px',padding:'0.6rem 0.9rem',borderRadius:8,fontSize:13,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',outline:'none'}}/>
        <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Location" style={{flex:'1 1 110px',padding:'0.6rem 0.9rem',borderRadius:8,fontSize:13,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',outline:'none'}}/>
        <button onClick={()=>fetchJobs(query)} style={{padding:'0.6rem 1.2rem',borderRadius:8,fontSize:12,fontWeight:700,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,border:'none',color:'#0a0e27',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace"}}>{loading?'...':'Search'}</button>
      </div>
      <div style={{...card,display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap',marginBottom:'0.75rem'}}>
        <span style={{...monoSm}}>Match:</span>
        <Pill active={matchMode==='strict'} onClick={()=>setMatchMode('strict')}>Strict</Pill>
        <Pill active={matchMode==='broad'} onClick={()=>setMatchMode('broad')}>Broad</Pill>
        <span style={{...monoSm,marginLeft:'0.5rem'}}>Sort:</span>
        <Pill active={sortBy==='relevance'} onClick={()=>setSortBy('relevance')}>Relevance</Pill>
        <Pill active={sortBy==='latest'} onClick={()=>setSortBy('latest')}>Latest</Pill>
        <Pill active={sortBy==='company'} onClick={()=>setSortBy('company')}>Company</Pill>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
        {['data modeler','data architect','DW architect','ETL developer','azure data engineer','BI developer'].map(r=><button key={r} onClick={()=>{setQuery(r);fetchJobs(r);}} style={{fontSize:11,padding:'3px 10px',borderRadius:20,border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'#64748b',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",transition:'all 0.15s'}} onMouseEnter={e=>{e.target.style.borderColor=C.cyan;e.target.style.color=C.cyan;}} onMouseLeave={e=>{e.target.style.borderColor='rgba(255,255,255,0.12)';e.target.style.color='#64748b';}}>{r}</button>)}
        <button onClick={()=>{setQuery(SEARCH_KEYWORD_STRING);fetchJobs(SEARCH_KEYWORD_STRING);}} style={{fontSize:11,padding:'3px 10px',borderRadius:20,border:`1px solid ${C.green}55`,background:`${C.green}12`,color:C.green,cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",transition:'all 0.15s'}}>ERwin keyword pack</button>
      </div>
      <div style={{...card,marginBottom:'0.75rem'}}>
        <div style={{...monoSm,marginBottom:'0.5rem'}}>AI Apply Launchers (role + location + keyword pack)</div>
        <div style={{display:'flex',gap:'0.45rem',flexWrap:'wrap'}}>
          <a href={linkedinEasyApplyURL(query,loc)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.green}66`,background:`linear-gradient(135deg,${C.green}2a,${C.cyan}20)`,color:C.green,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>⚡ LinkedIn Easy Apply</a>
          <a href={naukriURL(query,loc)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.amber}66`,background:`${C.amber}1a`,color:C.amber,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>🇮🇳 Naukri Apply</a>
          <a href={founditURL(query,loc)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.purple}66`,background:`${C.purple}1a`,color:C.purple,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>🟣 Foundit Apply</a>
          <a href={indeedURL(query,loc)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.cyan}66`,background:`${C.cyan}1a`,color:C.cyan,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>🔵 Indeed Apply</a>
          <a href={glassdoorURL(query)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.teal}66`,background:`${C.teal}1a`,color:C.teal,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>🟢 Glassdoor Apply</a>
          <a href={genericApplyURL(query,loc)} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0.5rem 0.85rem',borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${C.blue}66`,background:`${C.blue}1a`,color:C.blue,textDecoration:'none',fontFamily:"'JetBrains Mono',monospace"}}>🌐 Generic AI Apply</a>
        </div>
        <div style={{fontSize:10,color:'#64748b',marginTop:'0.45rem',fontFamily:"'JetBrains Mono',monospace"}}>
          Opens platform with your current search query. Remotive API search uses expanded DM/DA keywords internally.
        </div>
      </div>
      <div style={{...card,marginBottom:'0.75rem'}}><div style={{...monoSm,marginBottom:'0.5rem'}}>Open search on:</div><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>{[{name:'LinkedIn',icon:'💼',href:linkedinURL(query,loc),color:C.blue},{name:'Naukri',icon:'🇮🇳',href:naukriURL(query,loc),color:C.amber},{name:'Indeed',icon:'🔵',href:indeedURL(query,loc),color:C.cyan},{name:'Glassdoor',icon:'🟢',href:glassdoorURL(query),color:C.green},{name:'InstaHyre',icon:'⚡',href:instahireURL(query),color:C.purple}].map(b=><a key={b.name} href={b.href} target="_blank" rel="noreferrer" style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${b.color}44`,background:`${b.color}12`,color:b.color,textDecoration:'none',display:'flex',alignItems:'center',gap:5,transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=`${b.color}25`;e.currentTarget.style.borderColor=b.color;}} onMouseLeave={e=>{e.currentTarget.style.background=`${b.color}12`;e.currentTarget.style.borderColor=`${b.color}44`;}}><span>{b.icon}</span>{b.name}</a>)}</div></div>
      {error&&<div style={{fontSize:11,color:C.amber,background:`${C.amber}10`,border:`1px solid ${C.amber}33`,borderRadius:8,padding:'0.5rem 0.75rem',marginBottom:'0.75rem'}}>⚠ {error}</div>}
      {loading?<div style={{textAlign:'center',padding:'3rem',color:'#475569'}}><div style={{fontSize:32,marginBottom:'1rem',display:'inline-block',animation:'spin 1s linear infinite'}}>⟳</div><div>Searching job boards...</div></div>:<>{<div style={{...monoSm,marginBottom:'0.5rem'}}>{jobs.length} roles found · mode: {matchMode} · sorted: {sortBy}{lastSearchMeta.term?` · term: ${lastSearchMeta.term}`:''}</div>}{jobs.map(job=><JobCard key={job.id} job={job} onSave={handleSave} saved={isaved(job.id)} onTrack={handleTrack} tracked={tracker[job.id]}/>)}</>}
    </>)}

    {tab==='ats'&&<ATSAnalyzer/>}
    {tab==='resume'&&<ResumeAI/>}
    {tab==='interview'&&<InterviewPrep/>}
    {tab==='scheduler'&&<SchedulerGuide query={query} loc={loc} savedJobs={savedJobs} safeMode={safeMode} onSafeModeToggle={toggleSafeMode}/>}
    {tab==='health'&&<AccountHealthMonitor safeMode={safeMode} onSafeModeToggle={toggleSafeMode}/>}

    {tab==='tracker'&&(<>
      <PipelineDashboard savedJobs={savedJobs} tracker={tracker}/>
      <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'0.75rem 0'}}/>
      <div style={{...monoSm,marginBottom:'0.5rem'}}>Saved Jobs ({savedJobs.length})</div>
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
        <Pill active={filter==='all'} onClick={()=>setFilter('all')}>All</Pill>
        {STATUS_OPTIONS.map(s=>{const cnt=savedJobs.filter(j=>tracker[j.id]===s).length;return<Pill key={s} active={filter===s} color={STATUS_COLORS[s]} onClick={()=>setFilter(f=>f===s?'all':s)}>{s}{cnt>0?` (${cnt})`:''}</Pill>;})}
      </div>
      {filtered.length===0?<div style={{...card,textAlign:'center',padding:'2.5rem',color:'#475569'}}><div style={{fontSize:36,marginBottom:'0.75rem'}}>📋</div><div style={{fontSize:13}}>{savedJobs.length===0?'No saved jobs yet. Star a role from Search to track it.':`No roles with status "${filter}".`}</div></div>:filtered.map(job=><JobCard key={job.id} job={job} onSave={handleSave} saved onTrack={handleTrack} tracked={tracker[job.id]}/>)}
    </>)}

    {tab==='boards'&&(<>
      <div style={{...monoSm,marginBottom:'0.6rem'}}>Tap any board to open in a new tab</div>
      {[{cat:'🇮🇳 India — Data Modeler Focus',boards:[{name:'Naukri.com',desc:'Search: Data Modeler, Data Architect',href:naukriURL('data modeler','India'),color:C.amber,icon:'🇮🇳'},{name:'LinkedIn',desc:'Best for referrals and recruiter reach',href:linkedinURL('data modeler','India'),color:C.blue,icon:'💼'},{name:'Indeed India',desc:'Aggregated listings across companies',href:indeedURL('data architect','India'),color:C.cyan,icon:'🔵'},{name:'InstaHyre',desc:'Curated tech roles, faster process',href:instahireURL('data architect'),color:C.purple,icon:'⚡'},{name:'iimjobs',desc:'Premium roles, 3+ yrs experience',href:'https://www.iimjobs.com/search/data-modeler',color:C.teal,icon:'🎓'},{name:'Cutshort',desc:'Startup & scaleup data roles',href:'https://cutshort.io/jobs/data-architect',color:C.pink,icon:'✂'}]},{cat:'🏢 Top Employers',boards:[{name:'TCS',desc:'Large enterprise DW and modeling teams',href:'https://ibegin.tcs.com/',color:C.blue,icon:'🏢'},{name:'Infosys',desc:'Azure data architecture projects',href:'https://career.infosys.com/',color:C.cyan,icon:'🔵'},{name:'Wipro',desc:'Data Vault and cloud DW projects',href:'https://careers.wipro.com/',color:C.purple,icon:'💜'},{name:'Cognizant',desc:'Insurance domain data modeling',href:'https://careers.cognizant.com/',color:C.teal,icon:'🟦'},{name:'Accenture',desc:'Azure Synapse + modeling at scale',href:'https://www.accenture.com/in-en/careers',color:C.amber,icon:'🟣'},{name:'Capgemini',desc:'Retail & banking data warehouse',href:'https://www.capgemini.com/in-en/careers/',color:C.green,icon:'🟩'}]},{cat:'🌍 Global / Remote',boards:[{name:'Remotive',desc:'Remote-only data engineering roles',href:'https://remotive.com/remote-jobs/data',color:C.green,icon:'🌐'},{name:'Wellfound',desc:'Startup equity data roles',href:'https://wellfound.com/role/r/data-engineer',color:C.amber,icon:'🚀'},{name:'We Work Remotely',desc:'Handpicked remote data jobs',href:'https://weworkremotely.com/categories/remote-data-science-jobs',color:C.teal,icon:'💻'},{name:'Glassdoor',desc:'Salary insights + reviews',href:glassdoorURL('data modeler'),color:C.green,icon:'🟢'}]}].map(sec=><div key={sec.cat} style={card}><div style={{fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:'0.75rem'}}>{sec.cat}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'0.5rem'}}>{sec.boards.map(b=><a key={b.name} href={b.href} target="_blank" rel="noreferrer" style={{padding:'0.75rem',borderRadius:8,textDecoration:'none',border:`1px solid ${b.color}33`,background:`${b.color}0a`,display:'flex',alignItems:'center',gap:'0.75rem',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=`${b.color}1a`;e.currentTarget.style.borderColor=`${b.color}66`;e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background=`${b.color}0a`;e.currentTarget.style.borderColor=`${b.color}33`;e.currentTarget.style.transform='translateY(0)';}}>  <span style={{fontSize:20}}>{b.icon}</span><div><div style={{fontSize:12,fontWeight:600,color:b.color}}>{b.name}</div><div style={{fontSize:10,color:'#475569',marginTop:1}}>{b.desc}</div></div><span style={{marginLeft:'auto',fontSize:12,color:b.color,opacity:0.5}}>↗</span></a>)}</div></div>)}
    </>)}

    <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:#475569} input:focus{border-color:rgba(34,211,238,0.4)!important} textarea::placeholder{color:#475569} textarea:focus{border-color:rgba(34,211,238,0.4)!important}`}</style>
  </div>);
}

function extractTags(text){
  const skills=['SQL','Python','ERwin','Data Modeling','Dimensional Modeling','Data Vault','Star Schema','SCD','Azure','ADF','Synapse','ADLS','Snowflake','Oracle','SQL Server','Power BI','ETL','SSIS','SSAS','Teradata','dbt','Spark','PostgreSQL','Tableau','MDM'];
  return skills.filter(s=>text.toLowerCase().includes(s.toLowerCase())).slice(0,6);
}

function normalizeText(v){
  return String(v || '')
    .toLowerCase()
    .replace(/\bmodeller\b/g,'modeler')
    .replace(/\bmodelling\b/g,'modeling')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}

function jobMatchesQuery(job,query,strict=true){
  const q=normalizeText(query);
  if(!q)return true;
  const haystack=normalizeText(`${job.title||''} ${job.company_name||''} ${job.description||''} ${(job.tags||[]).join(' ')}`);
  const tokens=q.split(/\s+/).filter(Boolean);
  if(haystack.includes(q))return true;
  return strict ? tokens.every(t=>haystack.includes(t)) : tokens.some(t=>haystack.includes(t));
}

function getApplyHref(job){
  if(String(job?.source||'').toLowerCase()==='remotive' && job?.url) return job.url;
  const query=encodeURIComponent([job?.title,job?.company_name].filter(Boolean).join(' '));
  const location=encodeURIComponent(job?.candidate_required_location||'India');
  return `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;
}

function buildCrawlQuery(baseQuery){
  const seed=(baseQuery||'data modeler').trim();
  const parts=[seed,...CRAWL_KEYWORDS]
    .filter(Boolean)
    .map((k)=>k.trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).join(' ');
}

function jobRelevanceScore(job,query,tags=[]){
  const q=normalizeText(query);
  if(!q) return 0;
  const title=normalizeText(job?.title||'');
  const company=normalizeText(job?.company_name||'');
  const desc=normalizeText(job?.description||'');
  const tagText=normalizeText((tags||[]).join(' '));
  const tokens=q.split(/\s+/).filter(Boolean);
  let score=0;
  if(title.includes(q)) score+=45;
  if(tagText.includes(q)) score+=30;
  if(desc.includes(q)) score+=20;
  if(company.includes(q)) score+=10;
  tokens.forEach((t)=>{
    if(title.includes(t)) score+=8;
    if(tagText.includes(t)) score+=6;
    if(desc.includes(t)) score+=3;
  });
  return score;
}

function sortJobs(items,sortBy){
  const arr=[...(items||[])];
  if(sortBy==='company'){
    return arr.sort((a,b)=>String(a.company_name||'').localeCompare(String(b.company_name||'')));
  }
  if(sortBy==='latest'){
    return arr.sort((a,b)=>{
      const ta=Date.parse(a?.publication_date||0)||0;
      const tb=Date.parse(b?.publication_date||0)||0;
      return tb-ta;
    });
  }
  return arr.sort((a,b)=>(b?.relevanceScore||0)-(a?.relevanceScore||0));
}
