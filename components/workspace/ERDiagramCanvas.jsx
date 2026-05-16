import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ENTITY_W = 220;
const HEADER_H = 44;
const COL_H    = 28;
const FOOTER_H = 28;
const GRID     = 20;
const SNAP     = 20;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const HISTORY_LIMIT = 50;
const RIGHT_PANEL_DEFAULT = 300;
const ENTITY_W_CDM = 220;

// ─── Enterprise Layer + Stereotype Config ───────────────────────────────────
const LAYER_CONFIG = {
  CDM: { name:'Conceptual', abbr:'CDM', color:'#22d3ee',  desc:'Business entities & concepts'    },
  LDM: { name:'Logical',    abbr:'LDM', color:'#a78bfa',  desc:'Normalized attributes & keys'    },
  PDM: { name:'Physical',   abbr:'PDM', color:'#34d399',  desc:'DB-specific implementation'      },
  DWH: { name:'DWH',        abbr:'DWH', color:'#fbbf24',  desc:'Dimensional / star / snowflake'  },
  DV:  { name:'Data Vault', abbr:'DV',  color:'#f472b6',  desc:'Hub-Link-Satellite vault model'  },
};

const STEREOTYPE = {
  ENTITY:    { label:'ENTITY',    color:'#22d3ee', icon:'⬛' },
  TABLE:     { label:'TABLE',     color:'#34d399', icon:'▦'  },
  FACT:      { label:'FACT',      color:'#f59e0b', icon:'★'  },
  DIMENSION: { label:'DIM',       color:'#a78bfa', icon:'◆'  },
  HUB:       { label:'HUB',       color:'#22d3ee', icon:'●'  },
  LINK:      { label:'LINK',      color:'#f472b6', icon:'◈'  },
  SATELLITE: { label:'SAT',       color:'#64748b', icon:'○'  },
  BRIDGE:    { label:'BRIDGE',    color:'#fb923c', icon:'⬡'  },
};

const NOTATION = { crowfoot:"Crow's Foot", idef1x:'IDEF1X', uml:'UML' };


// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 9);
const snap = (v) => Math.round(v / SNAP) * SNAP;

const mkCol = (name, type, opts = {}) => ({
  id: uid(), name, type,
  pk: opts.pk || false, fk: opts.fk || false,
  nn: opts.nn !== undefined ? opts.nn : true,
  uq: opts.uq || false,
  length: opts.length || '',
  precision: opts.precision || '',
  scale: opts.scale || '',
  defaultVal: opts.default || '',
  identity: opts.identity || false,
  check: opts.check || '',
  comment: opts.comment || '',
  description: opts.description || '',
  indexed: opts.indexed || false,
});

const entityH = (e) => HEADER_H + e.columns.length * COL_H + FOOTER_H;

const entityPorts = (e) => {
  const h = entityH(e);
  return {
    left:   { x: e.x,              y: e.y + h / 2 },
    right:  { x: e.x + ENTITY_W,   y: e.y + h / 2 },
    top:    { x: e.x + ENTITY_W/2, y: e.y },
    bottom: { x: e.x + ENTITY_W/2, y: e.y + h },
  };
};

const bestPorts = (a, b) => {
  const ap = entityPorts(a), bp = entityPorts(b);
  const sides = ['left','right','top','bottom'];
  let best = null, bestDist = Infinity;
  for (const s1 of sides) for (const s2 of sides) {
    const d = Math.hypot(ap[s1].x - bp[s2].x, ap[s1].y - bp[s2].y);
    if (d < bestDist) { bestDist = d; best = { s1, s2 }; }
  }
  return { p1: ap[best.s1], side1: best.s1, p2: bp[best.s2], side2: best.s2 };
};

const bezierPath = (p1, side1, p2, side2) => {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const off  = Math.min(Math.max(dist * 0.38, 55), 220);
  const d    = { left:[-1,0], right:[1,0], top:[0,-1], bottom:[0,1] };
  const [dx1,dy1] = d[side1]; const [dx2,dy2] = d[side2];
  return `M${p1.x},${p1.y} C${p1.x+dx1*off},${p1.y+dy1*off} ${p2.x+dx2*off},${p2.y+dy2*off} ${p2.x},${p2.y}`;
};

// ─── Crow's Foot Notation (vector-math, no CSS transforms) ─────────────────
// card: one | one_and_only | zero_or_one | many | one_or_many | zero_or_many
function CrowFoot({ x, y, side, card, color }) {
  const c  = color || '#64748b';
  const sw = 1.8;
  const DIR = { right:[1,0], left:[-1,0], bottom:[0,1], top:[0,-1] };
  const [dx, dy] = DIR[side] || [1,0];
  const [px, py] = [-dy, dx];
  const pt = (a, b) => [x + dx*a + px*b, y + dy*a + py*b];
  const L=14, H=9, LB=19, LB2=25, RC=4.5, LC=25;
  const [r0x,r0y]=pt(0,0);
  const [t1x,t1y]=pt(L,-H); const [t2x,t2y]=pt(L,H); const [t3x,t3y]=pt(L,0);
  const [b1ax,b1ay]=pt(LB,-H); const [b1bx,b1by]=pt(LB,H);
  const [b2ax,b2ay]=pt(LB2,-H); const [b2bx,b2by]=pt(LB2,H);
  const [ocx,ocy]=pt(LC,0);
  const crow  = (<><line x1={r0x} y1={r0y} x2={t1x} y2={t1y} stroke={c} strokeWidth={sw}/><line x1={r0x} y1={r0y} x2={t2x} y2={t2y} stroke={c} strokeWidth={sw}/><line x1={r0x} y1={r0y} x2={t3x} y2={t3y} stroke={c} strokeWidth={sw}/></>);
  const bar1  = <line x1={b1ax} y1={b1ay} x2={b1bx} y2={b1by} stroke={c} strokeWidth={sw}/>;
  const bar2  = <line x1={b2ax} y1={b2ay} x2={b2bx} y2={b2by} stroke={c} strokeWidth={sw}/>;
  const oCirc = <circle cx={ocx} cy={ocy} r={RC} fill="rgba(6,13,26,0.92)" stroke={c} strokeWidth={1.5}/>;
  const S = {
    one:          bar1,
    one_and_only: <>{bar2}{bar1}</>,
    zero_or_one:  <>{oCirc}{bar1}</>,
    many:         crow,
    one_or_many:  <>{bar1}{crow}</>,
    zero_or_many: <>{oCirc}{crow}</>,
  };
  return <g style={{pointerEvents:'none'}}>{S[card] || S.many}</g>;
}

// ─── SQL Generator (Enterprise — dialect-aware) ───────────────────────────────
function generateSQL(entities, rels, dialect = 'PostgreSQL') {
  const lines = [];
  const q = (n) => dialect === 'MySQL' ? `\`${n}\`` : `"${n}"`;
  const typeMap = (col) => {
    const t = (col.type || 'VARCHAR').toUpperCase();
    const len = col.length ? `(${col.length})` : '';
    if (dialect === 'PostgreSQL') {
      if (col.identity) return 'SERIAL';
      if (t === 'VARCHAR' && !col.length) return 'VARCHAR(255)';
      if (['TEXT','BOOLEAN','JSON','JSONB','UUID','SERIAL','INT','BIGINT','SMALLINT','FLOAT','DATE','TIMESTAMP'].includes(t)) return t;
      return t + len;
    }
    if (dialect === 'MySQL') {
      if (col.identity) return (t==='BIGINT'?'BIGINT':'INT') + ' AUTO_INCREMENT';
      if (t==='BOOLEAN') return 'TINYINT(1)'; if (t==='UUID') return 'CHAR(36)';
      if (t==='JSONB') return 'JSON'; if (t==='TIMESTAMP') return 'DATETIME';
      if (['TEXT','DATE','DATETIME','INT','BIGINT','SMALLINT','FLOAT'].includes(t)) return t;
      return t + len;
    }
    if (dialect === 'SQL Server') {
      if (col.identity) return (t==='BIGINT'?'BIGINT':'INT') + ' IDENTITY(1,1)';
      if (t==='VARCHAR') return col.length ? `NVARCHAR(${col.length})` : 'NVARCHAR(255)';
      if (t==='TEXT') return 'NVARCHAR(MAX)'; if (t==='BOOLEAN') return 'BIT';
      if (t==='JSONB'||t==='JSON') return 'NVARCHAR(MAX)'; if (t==='TIMESTAMP') return 'DATETIME2';
      if (t==='SERIAL') return 'INT IDENTITY(1,1)';
      return t + len;
    }
    if (dialect === 'Oracle') {
      if (['INT','BIGINT','SMALLINT','SERIAL'].includes(t)) return 'NUMBER(10)';
      if (t==='DECIMAL'||t==='NUMERIC') return 'NUMBER' + len;
      if (t==='VARCHAR') return col.length ? `VARCHAR2(${col.length})` : 'VARCHAR2(255)';
      if (t==='TEXT'||t==='CLOB') return 'CLOB'; if (t==='BOOLEAN') return 'NUMBER(1)';
      if (t==='JSONB'||t==='JSON') return 'CLOB';
      return t + len;
    }
    if (dialect === 'Snowflake') {
      if (col.identity) return (t==='BIGINT'?'BIGINT':'NUMBER') + ' AUTOINCREMENT';
      if (t==='JSON'||t==='JSONB') return 'VARIANT'; if (t==='TEXT') return 'VARCHAR(16777216)';
      if (['INT','BIGINT','SMALLINT'].includes(t)) return 'NUMBER';
      return t + (len||'');
    }
    // SQLite
    if (['INT','BIGINT','SERIAL'].includes(t)||col.identity) return 'INTEGER';
    if (t==='BOOLEAN') return 'INTEGER';
    return t + len;
  };
  if (dialect === 'Oracle') {
    for (const e of entities) {
      if (e.columns.some(c=>c.identity))
        lines.push(`CREATE SEQUENCE seq_${e.name.toLowerCase()} START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;\n`);
    }
  }
  for (const e of entities) {
    if (e.description) lines.push(`-- ${e.description.replace(/\n/g,' ')}`);
    if (e.stereotype && e.stereotype !== 'ENTITY') lines.push(`-- Stereotype: ${e.stereotype}`);
    lines.push(`CREATE TABLE ${q(e.name)} (`);
    const colDefs = e.columns.map(c => {
      let def = `  ${q(c.name)} ${typeMap(c)}`;
      if (c.nn && !c.identity) def += ' NOT NULL';
      if (c.uq && !c.pk) def += ' UNIQUE';
      if (c.defaultVal) def += ` DEFAULT ${c.defaultVal}`;
      return def;
    });
    const pks = e.columns.filter(c=>c.pk).map(c=>q(c.name));
    if (pks.length) colDefs.push(`  CONSTRAINT pk_${e.name} PRIMARY KEY (${pks.join(', ')})`);
    lines.push(colDefs.join(',\n'));
    lines.push(dialect === 'MySQL' ? `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n` : `);\n`);
  }
  lines.push('-- Foreign Key Constraints');
  for (const r of rels) {
    const from = entities.find(e=>e.id===r.fromId);
    const to   = entities.find(e=>e.id===r.toId);
    if (!from||!to) continue;
    const fkCols = from.columns.filter(c=>c.fk);
    const toPk   = to.columns.find(c=>c.pk);
    if (!fkCols.length||!toPk) continue;
    for (const fkCol of fkCols)
      lines.push(`ALTER TABLE ${q(from.name)}\n  ADD CONSTRAINT fk_${from.name}_${to.name}_${fkCol.name}\n  FOREIGN KEY (${q(fkCol.name)})\n  REFERENCES ${q(to.name)}(${q(toPk.name)});\n`);
  }
  if (entities.some(e=>(e.indexes||[]).length>0 || e.columns.some(c=>c.fk))) {
    lines.push('\n-- Indexes');
    for (const e of entities) {
      for (const c of e.columns.filter(c=>c.fk))
        lines.push(`CREATE INDEX idx_${e.name}_${c.name} ON ${q(e.name)}(${q(c.name)});\n`);
      for (const idx of (e.indexes||[]))
        lines.push(`CREATE ${idx.unique?'UNIQUE ':''}INDEX ${q(idx.name)} ON ${q(e.name)}((idx.columns||[]).map(n=>q(n)).join(', '));\n`);
    }
  }
  return lines.join('\n');
}

// ─── Model Validation (Enterprise — 15+ rules) ────────────────────────────────
function validateModel(entities, rels) {
  const issues = [];
  const SQL_KW = new Set(['SELECT','FROM','WHERE','TABLE','INDEX','CREATE','ALTER','DROP','INSERT','UPDATE',
    'DELETE','JOIN','ON','AS','INT','VARCHAR','ORDER','GROUP','BY','HAVING','UNION','ALL','DISTINCT',
    'CASE','WHEN','THEN','ELSE','END','NULL','NOT','AND','OR','IN','IS','LIKE','BETWEEN','EXISTS',
    'KEY','CONSTRAINT','FOREIGN','PRIMARY','REFERENCES','DEFAULT','CHECK','UNIQUE','VIEW','SCHEMA',
    'TRIGGER','PROCEDURE','FUNCTION','DATABASE','GRANT','REVOKE','COMMIT','ROLLBACK','TRANSACTION']);
  for (const e of entities) {
    if (!e.columns.some(c=>c.pk))
      issues.push({ level:'error', msg:`"${e.name}" — no Primary Key defined`, entity:e.id });
    if (e.columns.length === 0)
      issues.push({ level:'warn', msg:`"${e.name}" — no columns defined`, entity:e.id });
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(e.name))
      issues.push({ level:'error', msg:`"${e.name}" — invalid identifier (letters, digits, underscore only)` });
    if (e.name.length > 128)
      issues.push({ level:'warn', msg:`"${e.name}" — name exceeds 128 characters` });
    if (SQL_KW.has(e.name.toUpperCase()))
      issues.push({ level:'warn', msg:`"${e.name}" — SQL reserved word; consider renaming or prefixing` });
    const colNames = e.columns.map(c=>c.name);
    colNames.filter((n,i)=>colNames.indexOf(n)!==i).forEach(n=>
      issues.push({ level:'error', msg:`"${e.name}" — duplicate column: "${n}"` }));
    e.columns.filter(c=>c.pk&&!c.nn).forEach(c=>
      issues.push({ level:'warn', msg:`"${e.name}.${c.name}" — PK column should be NOT NULL` }));
    e.columns.forEach(c => {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(c.name))
        issues.push({ level:'warn', msg:`"${e.name}.${c.name}" — column name is not a valid identifier` });
    });
    if (e.columns.some(c=>c.fk) && rels.filter(r=>r.fromId===e.id||r.toId===e.id).length===0)
      issues.push({ level:'warn', msg:`"${e.name}" — has FK columns but no relationships defined` });
  }
  const names = entities.map(e=>e.name);
  names.filter((n,i)=>names.indexOf(n)!==i).forEach(n=>
    issues.push({ level:'error', msg:`Duplicate table name: "${n}"` }));
  const MM_CARDS = ['many','zero_or_many','one_or_many'];
  for (const r of rels) {
    const from = entities.find(e=>e.id===r.fromId);
    const to   = entities.find(e=>e.id===r.toId);
    if (!from||!to) { issues.push({ level:'error', msg:`Orphan relationship references missing entity` }); continue; }
    if (r.fromId===r.toId&&!r.label)
      issues.push({ level:'warn', msg:`"${from.name}" — self-referencing relationship has no label` });
    if (MM_CARDS.includes(r.fromCard)&&MM_CARDS.includes(r.toCard))
      issues.push({ level:'warn', msg:`M:M between "${from.name}" and "${to.name}" — consider a bridge table` });
  }
  entities.forEach(e => {
    if (rels.filter(r=>r.fromId===e.id||r.toId===e.id).length===0)
      issues.push({ level:'info', msg:`"${e.name}" — isolated entity (no relationships)` });
  });
  if (!issues.some(i=>i.level==='error'||i.level==='warn'))
    issues.push({ level:'ok', msg:'Model validation passed — no errors or warnings ✓' });
  return issues;
}


// ─── Default Schema ───────────────────────────────────────────────────────────
const DEFAULT_ENTITIES = [
  {
    id: uid(), name: 'Customer', color: '#22d3ee', x: 80, y: 120,
    stereotype: 'ENTITY', subjectArea: 'Sales', description: 'Represents a person or organization that purchases products or services.',
    columns: [
      mkCol('customer_id',  'INT',          { pk:true, nn:true, identity:true }),
      mkCol('first_name',   'VARCHAR',      { nn:true, length:'50' }),
      mkCol('last_name',    'VARCHAR',      { nn:true, length:'50' }),
      mkCol('email',        'VARCHAR',      { nn:true, uq:true, length:'120' }),
      mkCol('phone',        'VARCHAR',      { length:'20' }),
      mkCol('created_at',   'TIMESTAMP',   { nn:true, default:'CURRENT_TIMESTAMP' }),
    ],
  },
  {
    id: uid(), name: 'Orders', color: '#a78bfa', x: 380, y: 80,
    stereotype: 'ENTITY', subjectArea: 'Sales', description: 'A purchase transaction placed by a customer.',
    columns: [
      mkCol('order_id',     'INT',          { pk:true, nn:true, identity:true }),
      mkCol('customer_id',  'INT',          { fk:true, nn:true }),
      mkCol('status',       'VARCHAR',      { nn:true, length:'20', default:"'pending'" }),
      mkCol('total_amount', 'DECIMAL',      { nn:true, length:'12,2' }),
      mkCol('order_date',   'TIMESTAMP',   { nn:true, default:'CURRENT_TIMESTAMP' }),
    ],
  },
  {
    id: uid(), name: 'Product', color: '#34d399', x: 680, y: 120,
    stereotype: 'ENTITY', subjectArea: 'Catalog', description: 'An item available for purchase in the product catalog.',
    columns: [
      mkCol('product_id',   'INT',          { pk:true, nn:true, identity:true }),
      mkCol('name',         'VARCHAR',      { nn:true, length:'100' }),
      mkCol('price',        'DECIMAL',      { nn:true, length:'10,2' }),
      mkCol('stock',        'INT',          { nn:true, default:'0' }),
      mkCol('category_id',  'INT',          { fk:true }),
    ],
  },
  {
    id: uid(), name: 'OrderItem', color: '#fbbf24', x: 380, y: 380,
    stereotype: 'ENTITY', subjectArea: 'Sales', description: 'A single line item within a customer order.',
    columns: [
      mkCol('item_id',      'INT',          { pk:true, nn:true, identity:true }),
      mkCol('order_id',     'INT',          { fk:true, nn:true }),
      mkCol('product_id',   'INT',          { fk:true, nn:true }),
      mkCol('quantity',     'INT',          { nn:true, default:'1' }),
      mkCol('unit_price',   'DECIMAL',      { nn:true, length:'10,2' }),
    ],
  },
  {
    id: uid(), name: 'Category', color: '#f472b6', x: 680, y: 420,
    stereotype: 'ENTITY', subjectArea: 'Catalog', description: 'A hierarchical classification grouping for products.',
    columns: [
      mkCol('category_id',  'INT',          { pk:true, nn:true, identity:true }),
      mkCol('name',         'VARCHAR',      { nn:true, uq:true, length:'80' }),
      mkCol('parent_id',    'INT',          { description:'Self-referencing' }),
    ],
  },
];

const buildDefaultRels = (entities) => {
  const find = (name) => entities.find(e => e.name === name);
  const C = find('Customer'), O = find('Orders'), P = find('Product'),
        OI = find('OrderItem'), Cat = find('Category');
  if (!C || !O || !P || !OI || !Cat) return [];
  return [
    { id: uid(), fromId: O.id,  toId: C.id,   fromCard:'many', toCard:'one',  label:'places' },
    { id: uid(), fromId: OI.id, toId: O.id,   fromCard:'many', toCard:'one',  label:'belongs_to' },
    { id: uid(), fromId: OI.id, toId: P.id,   fromCard:'many', toCard:'one',  label:'contains' },
    { id: uid(), fromId: P.id,  toId: Cat.id, fromCard:'many', toCard:'one',  label:'categorized_by' },
  ];
};

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = {
  'Star Schema': () => {
    const fact = { id:uid(), name:'FactSales', color:'#f59e0b', x:320, y:260, stereotype:'FACT', subjectArea:'Sales',
      description:'Central fact table for sales transactions.',
      columns:[mkCol('sale_id','INT',{pk:true,nn:true,identity:true}),mkCol('date_key','INT',{fk:true,nn:true}),
        mkCol('product_key','INT',{fk:true,nn:true}),mkCol('store_key','INT',{fk:true,nn:true}),
        mkCol('customer_key','INT',{fk:true,nn:true}),mkCol('quantity','INT',{nn:true,default:'1'}),
        mkCol('unit_price','DECIMAL',{nn:true,length:'12,4'}),mkCol('revenue','DECIMAL',{nn:true,length:'14,2'}),
        mkCol('discount_amt','DECIMAL',{length:'10,2'})]};
    const dimDate={id:uid(),name:'DimDate',color:'#60a5fa',x:60,y:60,stereotype:'DIMENSION',subjectArea:'Time',
      description:'Date dimension for time-based analysis.',
      columns:[mkCol('date_key','INT',{pk:true,nn:true}),mkCol('full_date','DATE',{nn:true}),
        mkCol('year','INT',{nn:true}),mkCol('quarter','INT',{nn:true}),mkCol('month','INT',{nn:true}),
        mkCol('month_name','VARCHAR',{length:'10'}),mkCol('week','INT'),mkCol('day_of_week','VARCHAR',{length:'10'}),
        mkCol('is_weekend','BOOLEAN',{default:'false'}),mkCol('is_holiday','BOOLEAN',{default:'false'})]};
    const dimProd={id:uid(),name:'DimProduct',color:'#34d399',x:620,y:60,stereotype:'DIMENSION',subjectArea:'Catalog',
      description:'Product dimension with categorization hierarchy.',
      columns:[mkCol('product_key','INT',{pk:true,nn:true}),mkCol('product_code','VARCHAR',{nn:true,length:'20',uq:true}),
        mkCol('name','VARCHAR',{nn:true,length:'150'}),mkCol('category','VARCHAR',{length:'60'}),
        mkCol('subcategory','VARCHAR',{length:'60'}),mkCol('brand','VARCHAR',{length:'80'}),
        mkCol('unit_cost','DECIMAL',{length:'12,4'}),mkCol('is_active','BOOLEAN',{default:'true'})]};
    const dimStore={id:uid(),name:'DimStore',color:'#a78bfa',x:60,y:500,stereotype:'DIMENSION',subjectArea:'Geography',
      description:'Store/location dimension.',
      columns:[mkCol('store_key','INT',{pk:true,nn:true}),mkCol('store_code','VARCHAR',{nn:true,length:'20'}),
        mkCol('store_name','VARCHAR',{nn:true,length:'100'}),mkCol('city','VARCHAR',{length:'60'}),
        mkCol('state','VARCHAR',{length:'40'}),mkCol('country','VARCHAR',{length:'60'}),
        mkCol('region','VARCHAR',{length:'40'}),mkCol('is_active','BOOLEAN',{default:'true'})]};
    const dimCust={id:uid(),name:'DimCustomer',color:'#f472b6',x:620,y:500,stereotype:'DIMENSION',subjectArea:'Customer',
      description:'Customer dimension with demographic attributes.',
      columns:[mkCol('customer_key','INT',{pk:true,nn:true}),mkCol('customer_code','VARCHAR',{nn:true,length:'20'}),
        mkCol('full_name','VARCHAR',{nn:true,length:'120'}),mkCol('email','VARCHAR',{length:'120',uq:true}),
        mkCol('segment','VARCHAR',{length:'40'}),mkCol('city','VARCHAR',{length:'60'}),
        mkCol('country','VARCHAR',{length:'60'}),mkCol('joined_date','DATE')]};
    const entities=[fact,dimDate,dimProd,dimStore,dimCust];
    const rels=[
      {id:uid(),fromId:fact.id,toId:dimDate.id,fromCard:'many',toCard:'one',label:'on date',relType:'identifying'},
      {id:uid(),fromId:fact.id,toId:dimProd.id,fromCard:'many',toCard:'one',label:'for product',relType:'identifying'},
      {id:uid(),fromId:fact.id,toId:dimStore.id,fromCard:'many',toCard:'one',label:'at store',relType:'identifying'},
      {id:uid(),fromId:fact.id,toId:dimCust.id,fromCard:'many',toCard:'one',label:'by customer',relType:'identifying'},
    ];
    return {entities,rels};
  },

  'Data Vault': () => {
    const custHub={id:uid(),name:'HubCustomer',color:'#22d3ee',x:80,y:220,stereotype:'HUB',subjectArea:'Customer',
      description:'Customer Hub — business key registry.',
      columns:[mkCol('customer_hk','CHAR',{pk:true,nn:true,length:'32'}),mkCol('customer_bk','VARCHAR',{nn:true,length:'50',uq:true}),
        mkCol('load_date','TIMESTAMP',{nn:true}),mkCol('record_source','VARCHAR',{nn:true,length:'100'})]};
    const orderHub={id:uid(),name:'HubOrder',color:'#22d3ee',x:560,y:220,stereotype:'HUB',subjectArea:'Orders',
      description:'Order Hub — business key registry.',
      columns:[mkCol('order_hk','CHAR',{pk:true,nn:true,length:'32'}),mkCol('order_bk','VARCHAR',{nn:true,length:'50',uq:true}),
        mkCol('load_date','TIMESTAMP',{nn:true}),mkCol('record_source','VARCHAR',{nn:true,length:'100'})]};
    const link={id:uid(),name:'LinkCustomerOrder',color:'#f472b6',x:320,y:220,stereotype:'LINK',subjectArea:'Orders',
      description:'Link between Customer and Order hubs.',
      columns:[mkCol('cust_order_hk','CHAR',{pk:true,nn:true,length:'32'}),
        mkCol('customer_hk','CHAR',{fk:true,nn:true,length:'32'}),mkCol('order_hk','CHAR',{fk:true,nn:true,length:'32'}),
        mkCol('load_date','TIMESTAMP',{nn:true}),mkCol('record_source','VARCHAR',{nn:true,length:'100'})]};
    const custSat={id:uid(),name:'SatCustomerDetails',color:'#64748b',x:80,y:460,stereotype:'SATELLITE',subjectArea:'Customer',
      description:'Customer satellite — descriptive attributes over time.',
      columns:[mkCol('customer_hk','CHAR',{pk:true,fk:true,nn:true,length:'32'}),
        mkCol('load_date','TIMESTAMP',{pk:true,nn:true}),mkCol('load_end_date','TIMESTAMP'),
        mkCol('first_name','VARCHAR',{nn:true,length:'60'}),mkCol('last_name','VARCHAR',{nn:true,length:'60'}),
        mkCol('email','VARCHAR',{length:'120'}),mkCol('phone','VARCHAR',{length:'20'}),
        mkCol('hash_diff','CHAR',{nn:true,length:'32'}),mkCol('record_source','VARCHAR',{nn:true,length:'100'})]};
    const orderSat={id:uid(),name:'SatOrderDetails',color:'#64748b',x:560,y:460,stereotype:'SATELLITE',subjectArea:'Orders',
      description:'Order satellite — order state and amounts.',
      columns:[mkCol('order_hk','CHAR',{pk:true,fk:true,nn:true,length:'32'}),
        mkCol('load_date','TIMESTAMP',{pk:true,nn:true}),mkCol('load_end_date','TIMESTAMP'),
        mkCol('status','VARCHAR',{nn:true,length:'30'}),mkCol('total_amount','DECIMAL',{nn:true,length:'14,2'}),
        mkCol('order_date','DATE',{nn:true}),mkCol('hash_diff','CHAR',{nn:true,length:'32'}),
        mkCol('record_source','VARCHAR',{nn:true,length:'100'})]};
    const entities=[custHub,orderHub,link,custSat,orderSat];
    const rels=[
      {id:uid(),fromId:link.id,toId:custHub.id,fromCard:'many',toCard:'one',label:'references',relType:'identifying'},
      {id:uid(),fromId:link.id,toId:orderHub.id,fromCard:'many',toCard:'one',label:'references',relType:'identifying'},
      {id:uid(),fromId:custSat.id,toId:custHub.id,fromCard:'many',toCard:'one',label:'describes',relType:'identifying'},
      {id:uid(),fromId:orderSat.id,toId:orderHub.id,fromCard:'many',toCard:'one',label:'describes',relType:'identifying'},
    ];
    return {entities,rels};
  },

  'HR System': () => {
    const dept={id:uid(),name:'Department',color:'#22d3ee',x:400,y:60,stereotype:'ENTITY',subjectArea:'HR',
      description:'Organizational department or business unit.',
      columns:[mkCol('dept_id','INT',{pk:true,nn:true,identity:true}),mkCol('name','VARCHAR',{nn:true,length:'80'}),
        mkCol('code','VARCHAR',{nn:true,length:'10',uq:true}),mkCol('manager_id','INT',{fk:true}),
        mkCol('budget','DECIMAL',{length:'14,2'}),mkCol('created_at','TIMESTAMP',{nn:true})]};
    const emp={id:uid(),name:'Employee',color:'#a78bfa',x:100,y:280,stereotype:'ENTITY',subjectArea:'HR',
      description:'Employee record including personal and employment details.',
      columns:[mkCol('emp_id','INT',{pk:true,nn:true,identity:true}),mkCol('first_name','VARCHAR',{nn:true,length:'60'}),
        mkCol('last_name','VARCHAR',{nn:true,length:'60'}),mkCol('email','VARCHAR',{nn:true,uq:true,length:'120'}),
        mkCol('dept_id','INT',{fk:true,nn:true}),mkCol('job_title','VARCHAR',{length:'80'}),
        mkCol('salary','DECIMAL',{length:'12,2'}),mkCol('hire_date','DATE',{nn:true}),
        mkCol('is_active','BOOLEAN',{default:'true'})]};
    const proj={id:uid(),name:'Project',color:'#34d399',x:700,y:280,stereotype:'ENTITY',subjectArea:'Projects',
      description:'Business project or initiative.',
      columns:[mkCol('project_id','INT',{pk:true,nn:true,identity:true}),mkCol('title','VARCHAR',{nn:true,length:'120'}),
        mkCol('dept_id','INT',{fk:true}),mkCol('budget','DECIMAL',{length:'14,2'}),
        mkCol('start_date','DATE'),mkCol('end_date','DATE'),mkCol('status','VARCHAR',{length:'20',default:"'active'"})]};
    const assign={id:uid(),name:'Assignment',color:'#fbbf24',x:400,y:500,stereotype:'ENTITY',subjectArea:'HR',
      description:'Employee assignment to a project with role and time allocation.',
      columns:[mkCol('assign_id','INT',{pk:true,nn:true,identity:true}),mkCol('emp_id','INT',{fk:true,nn:true}),
        mkCol('project_id','INT',{fk:true,nn:true}),mkCol('role','VARCHAR',{length:'60'}),
        mkCol('allocated_hours','DECIMAL',{length:'8,2'}),mkCol('start_date','DATE'),mkCol('end_date','DATE')]};
    const entities=[dept,emp,proj,assign];
    const rels=[
      {id:uid(),fromId:emp.id,toId:dept.id,fromCard:'many',toCard:'one',label:'belongs to',relType:'non-identifying'},
      {id:uid(),fromId:proj.id,toId:dept.id,fromCard:'many',toCard:'one',label:'owned by',relType:'non-identifying'},
      {id:uid(),fromId:assign.id,toId:emp.id,fromCard:'many',toCard:'one',label:'assigned to',relType:'identifying'},
      {id:uid(),fromId:assign.id,toId:proj.id,fromCard:'many',toCard:'one',label:'works on',relType:'identifying'},
    ];
    return {entities,rels};
  },

  'E-Commerce': () => {
    const cust={id:uid(),name:'Customer',color:'#22d3ee',x:60,y:60,stereotype:'ENTITY',subjectArea:'CRM',
      description:'Registered customer account.',
      columns:[mkCol('customer_id','INT',{pk:true,nn:true,identity:true}),mkCol('email','VARCHAR',{nn:true,uq:true,length:'120'}),
        mkCol('first_name','VARCHAR',{nn:true,length:'60'}),mkCol('last_name','VARCHAR',{nn:true,length:'60'}),
        mkCol('phone','VARCHAR',{length:'20'}),mkCol('created_at','TIMESTAMP',{nn:true}),mkCol('deleted_at','TIMESTAMP')]};
    const cat={id:uid(),name:'Category',color:'#34d399',x:620,y:60,stereotype:'ENTITY',subjectArea:'Catalog',
      description:'Product category with optional parent for hierarchical taxonomy.',
      columns:[mkCol('category_id','INT',{pk:true,nn:true,identity:true}),mkCol('name','VARCHAR',{nn:true,length:'80'}),
        mkCol('parent_id','INT',{fk:true}),mkCol('slug','VARCHAR',{nn:true,uq:true,length:'100'})]};
    const prod={id:uid(),name:'Product',color:'#34d399',x:620,y:280,stereotype:'ENTITY',subjectArea:'Catalog',
      description:'Product listed in the store catalog.',
      columns:[mkCol('product_id','INT',{pk:true,nn:true,identity:true}),mkCol('sku','VARCHAR',{nn:true,uq:true,length:'50'}),
        mkCol('name','VARCHAR',{nn:true,length:'150'}),mkCol('category_id','INT',{fk:true}),
        mkCol('price','DECIMAL',{nn:true,length:'12,4'}),mkCol('stock_qty','INT',{nn:true,default:'0'}),
        mkCol('is_active','BOOLEAN',{default:'true'}),mkCol('created_at','TIMESTAMP',{nn:true})]};
    const order={id:uid(),name:'Order',color:'#a78bfa',x:60,y:280,stereotype:'ENTITY',subjectArea:'Sales',
      description:'Customer purchase transaction.',
      columns:[mkCol('order_id','INT',{pk:true,nn:true,identity:true}),mkCol('customer_id','INT',{fk:true,nn:true}),
        mkCol('status','VARCHAR',{nn:true,length:'20',default:"'pending'"}),
        mkCol('subtotal','DECIMAL',{nn:true,length:'14,2'}),mkCol('tax','DECIMAL',{length:'10,2'}),
        mkCol('total','DECIMAL',{nn:true,length:'14,2'}),mkCol('ordered_at','TIMESTAMP',{nn:true}),
        mkCol('shipped_at','TIMESTAMP'),mkCol('notes','TEXT')]};
    const item={id:uid(),name:'OrderItem',color:'#fbbf24',x:340,y:280,stereotype:'ENTITY',subjectArea:'Sales',
      description:'Individual line item within an order.',
      columns:[mkCol('item_id','INT',{pk:true,nn:true,identity:true}),mkCol('order_id','INT',{fk:true,nn:true}),
        mkCol('product_id','INT',{fk:true,nn:true}),mkCol('quantity','INT',{nn:true,default:'1'}),
        mkCol('unit_price','DECIMAL',{nn:true,length:'12,4'}),mkCol('discount_pct','DECIMAL',{length:'5,2',default:'0'})]};
    const addr={id:uid(),name:'Address',color:'#60a5fa',x:60,y:500,stereotype:'ENTITY',subjectArea:'CRM',
      description:'Customer delivery or billing address.',
      columns:[mkCol('address_id','INT',{pk:true,nn:true,identity:true}),mkCol('customer_id','INT',{fk:true,nn:true}),
        mkCol('type','VARCHAR',{length:'10',default:"'shipping'"}),mkCol('line1','VARCHAR',{nn:true,length:'120'}),
        mkCol('line2','VARCHAR',{length:'80'}),mkCol('city','VARCHAR',{nn:true,length:'60'}),
        mkCol('state','VARCHAR',{length:'40'}),mkCol('zip','VARCHAR',{length:'20'}),
        mkCol('country','VARCHAR',{nn:true,length:'60'}),mkCol('is_default','BOOLEAN',{default:'false'})]};
    const review={id:uid(),name:'Review',color:'#f472b6',x:620,y:500,stereotype:'ENTITY',subjectArea:'Catalog',
      description:'Customer product review and rating.',
      columns:[mkCol('review_id','INT',{pk:true,nn:true,identity:true}),mkCol('product_id','INT',{fk:true,nn:true}),
        mkCol('customer_id','INT',{fk:true,nn:true}),mkCol('rating','INT',{nn:true}),
        mkCol('title','VARCHAR',{length:'120'}),mkCol('body','TEXT'),mkCol('created_at','TIMESTAMP',{nn:true}),
        mkCol('is_verified','BOOLEAN',{default:'false'})]};
    const entities=[cust,cat,prod,order,item,addr,review];
    const rels=[
      {id:uid(),fromId:order.id,toId:cust.id,fromCard:'many',toCard:'one',label:'placed by',relType:'non-identifying'},
      {id:uid(),fromId:addr.id,toId:cust.id,fromCard:'many',toCard:'one',label:'belongs to',relType:'identifying'},
      {id:uid(),fromId:item.id,toId:order.id,fromCard:'many',toCard:'one',label:'part of',relType:'identifying'},
      {id:uid(),fromId:item.id,toId:prod.id,fromCard:'many',toCard:'one',label:'references',relType:'non-identifying'},
      {id:uid(),fromId:prod.id,toId:cat.id,fromCard:'many',toCard:'one',label:'in category',relType:'non-identifying'},
      {id:uid(),fromId:review.id,toId:prod.id,fromCard:'many',toCard:'one',label:'reviews',relType:'non-identifying'},
      {id:uid(),fromId:review.id,toId:cust.id,fromCard:'many',toCard:'one',label:'written by',relType:'non-identifying'},
    ];
    return {entities,rels};
  },

  'Blank': () => ({ entities: [], rels: [] }),
};


// ─── Subject Area Layer ──────────────────────────────────────────────────────
function SubjectAreaLayer({ areas, selectedArea, onSelect, onDragArea }) {
  if (!areas || !areas.length) return null;
  return (
    <g>
      {areas.map(a => (
        <g key={a.id} onClick={e=>{e.stopPropagation();onSelect&&onSelect(a.id);}} style={{cursor:'pointer'}}>
          <rect x={a.x-12} y={a.y-28} width={a.w+24} height={a.h+40} rx={12}
            fill={a.color+'14'} stroke={a.color+(selectedArea===a.id?'99':'33')} strokeWidth={selectedArea===a.id?1.5:1}
            strokeDasharray={selectedArea===a.id?'none':'6 3'}/>
          <rect x={a.x-12} y={a.y-28} width={Math.min(a.name.length*7.5+16,180)} height={20} rx={6}
            fill={a.color+'33'}/>
          <text x={a.x-4} y={a.y-13} fill={a.color} fontSize={11}
            fontFamily="'JetBrains Mono',monospace" fontWeight="700"
            style={{userSelect:'none',pointerEvents:'none'}}>
            {a.name}
          </text>
        </g>
      ))}
    </g>
  );
}

// ─── Model Layer Badge (canvas overlay) ──────────────────────────────────────
function ModelLayerBadge({ layer, notation }) {
  const cfg = LAYER_CONFIG[layer];
  if (!cfg) return null;
  return (
    <div style={{ position:'absolute', top:10, left:60, zIndex:15, display:'flex',
      alignItems:'center', gap:6, pointerEvents:'none' }}>
      <div style={{ background:'rgba(6,13,26,0.88)', border:`1px solid ${cfg.color}55`,
        borderRadius:6, padding:'3px 10px', display:'flex', alignItems:'center', gap:6,
        backdropFilter:'blur(8px)' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.color,
          boxShadow:`0 0 6px ${cfg.color}` }}/>
        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
          color:cfg.color, fontWeight:700, letterSpacing:'0.08em' }}>{cfg.abbr}</span>
        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
          color:'#475569' }}>{cfg.name}</span>
      </div>
      {notation !== 'crowfoot' && (
        <div style={{ background:'rgba(6,13,26,0.88)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:6, padding:'3px 10px', backdropFilter:'blur(8px)' }}>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'#64748b' }}>
            {NOTATION[notation] || ''}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Notation Legend ──────────────────────────────────────────────────────────
function NotationLegend({ notation, layer }) {
  const items = notation === 'crowfoot' ? [
    { sym:'─|──', desc:'One (mandatory)' },
    { sym:'─o──', desc:'Zero or one' },
    { sym:'─{──', desc:'Many' },
    { sym:'─{o─', desc:'Zero or many' },
  ] : notation === 'uml' ? [
    { sym:'1', desc:'One' }, { sym:'*', desc:'Many' }, { sym:'0..1', desc:'Optional' },
  ] : [
    { sym:'┤├', desc:'One-and-only' }, { sym:'o┤', desc:'Zero-or-one' },
    { sym:'┤{', desc:'One-or-many' }, { sym:'o{', desc:'Zero-or-many' },
  ];
  return (
    <div style={{ position:'absolute', bottom:40, left:60, zIndex:15,
      background:'rgba(6,13,26,0.88)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:8, padding:'6px 10px', backdropFilter:'blur(8px)', pointerEvents:'none' }}>
      {items.map((it,i)=>(
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:i<items.length-1?3:0 }}>
          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
            color:'#22d3ee', minWidth:28 }}>{it.sym}</span>
          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
            color:'#475569' }}>{it.desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GridBackground({ vpX, vpY, scale }) {
  const gridSize = GRID * scale;
  const offsetX  = ((vpX % gridSize) + gridSize) % gridSize;
  const offsetY  = ((vpY % gridSize) + gridSize) % gridSize;
  return (
    <defs>
      <pattern id="grid-pat" x={offsetX} y={offsetY} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
      </pattern>
      <pattern id="grid-major" x={offsetX} y={offsetY} width={gridSize*5} height={gridSize*5} patternUnits="userSpaceOnUse">
        <rect width={gridSize*5} height={gridSize*5} fill="url(#grid-pat)"/>
        <path d={`M ${gridSize*5} 0 L 0 0 0 ${gridSize*5}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1}/>
      </pattern>
    </defs>
  );
}

function RelationshipLayer({ entities, rels, selectedRel, onSelectRel,
                             hoveredRel, onHoverRel, onRelContextMenu }) {
  return (
    <g>
      {rels.map(r => {
        const from = entities.find(e => e.id === r.fromId);
        const to   = entities.find(e => e.id === r.toId);
        if (!from || !to) return null;
        const { p1, side1, p2, side2 } = bestPorts(from, to);
        const d = bezierPath(p1, side1, p2, side2);
        const isSel = selectedRel === r.id;
        const isHov = hoveredRel  === r.id;
        const isMM  = ['many','zero_or_many','one_or_many'].includes(r.fromCard) &&
                      ['many','zero_or_many','one_or_many'].includes(r.toCard);
        const stroke = isSel ? '#f59e0b' : isHov ? '#22d3ee' : isMM ? '#f472b6' : '#475569';
        const sw     = isSel ? 2.5 : isHov ? 2 : 1.5;
        const midX   = (p1.x + p2.x) / 2;
        const midY   = (p1.y + p2.y) / 2;
        const ellip  = (s,n) => s.length>n ? s.slice(0,n-1)+'…' : s;
        return (
          <g key={r.id}
             onClick={(e)=>{ e.stopPropagation(); onSelectRel(r.id); }}
             onMouseEnter={()=>onHoverRel && onHoverRel(r.id)}
             onMouseLeave={()=>onHoverRel && onHoverRel(null)}
             onContextMenu={(e)=>{ e.preventDefault(); e.stopPropagation();
               onRelContextMenu && onRelContextMenu(e,r.id); }}
             style={{cursor:'pointer'}}>
            <path d={d} fill="none" stroke="transparent" strokeWidth={14}/>
            {(isSel||isHov) && <path d={d} fill="none" stroke={stroke} strokeWidth={12} opacity={0.1}/>}
            <path d={d} fill="none" stroke={stroke} strokeWidth={sw}
              strokeDasharray={r.relType==='weak' ? '7 3' : 'none'}
              style={{transition:'stroke 0.15s,stroke-width 0.15s'}}/>
            <CrowFoot x={p1.x} y={p1.y} side={side1} card={r.fromCard||'many'} color={stroke}/>
            <CrowFoot x={p2.x} y={p2.y} side={side2} card={r.toCard  ||'one' } color={stroke}/>
            {r.label && (
              <g style={{pointerEvents:'none'}}>
                <rect x={midX-34} y={midY-9} width={68} height={15} rx={4}
                  fill="rgba(6,13,26,0.88)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
                <text x={midX} y={midY+1.5} textAnchor="middle"
                  fill={isSel||isHov ? stroke : '#64748b'} fontSize={9}
                  fontFamily="'JetBrains Mono',monospace" style={{userSelect:'none'}}>
                  {ellip(r.label,14)}
                </text>
              </g>
            )}
            {isMM && (
              <g style={{pointerEvents:'none'}}>
                <rect x={midX-14} y={midY-(r.label?26:12)} width={28} height={13} rx={4}
                  fill="rgba(244,114,182,0.15)" stroke="rgba(244,114,182,0.4)" strokeWidth={1}/>
                <text x={midX} y={midY-(r.label?16:2)} textAnchor="middle"
                  fill="#f472b6" fontSize={8} fontFamily="'JetBrains Mono',monospace"
                  style={{userSelect:'none'}}>M:M</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function EntityCard({ entity, isSelected, isMultiSelected, onMouseDown, onDoubleClick,
                      onConnectStart, onContextMenu, modelLayer }) {
  const h = entityH(entity);
  const typeColor = { INT:'#60a5fa',VARCHAR:'#34d399',DECIMAL:'#fbbf24',TIMESTAMP:'#a78bfa',
    DATE:'#f472b6',TEXT:'#22d3ee',BOOLEAN:'#4ade80',BIGINT:'#60a5fa',SERIAL:'#60a5fa',
    FLOAT:'#fbbf24',CHAR:'#34d399',JSON:'#fb923c',UUID:'#a78bfa',NUMBER:'#fbbf24',
    NVARCHAR:'#34d399' };
  const getTC = (t) => typeColor[t.split('(')[0].toUpperCase()] || '#94a3b8';
  const borderColor = isSelected||isMultiSelected ? entity.color : 'rgba(255,255,255,0.1)';
  const isCDM = modelLayer === 'CDM';
  const isLDM = modelLayer === 'LDM';
  const stereo = STEREOTYPE[entity.stereotype] || STEREOTYPE.ENTITY;
  const isDWH  = ['DWH','StarSchema','Snowflake'].includes(modelLayer);
  const isDV   = modelLayer === 'DV';
  // CDM: compact — show name + description only
  if (isCDM) {
    const cdmH = HEADER_H + (entity.description ? 50 : 20) + FOOTER_H;
    return (
      <g transform={`translate(${entity.x},${entity.y})`}
         onMouseDown={onMouseDown} onDoubleClick={onDoubleClick}
         onContextMenu={onContextMenu} style={{cursor:'move'}}>
        <rect width={ENTITY_W} height={cdmH} rx={12} fill="rgba(0,0,0,0.5)" transform="translate(3,5)" opacity={0.5}/>
        <rect width={ENTITY_W} height={cdmH} rx={12}
          fill="rgba(13,20,40,0.97)" stroke={borderColor} strokeWidth={isSelected?2.5:1}
          style={{filter:isSelected?`drop-shadow(0 0 8px ${entity.color}66)`:''}} />
        <defs><linearGradient id={`hdr_${entity.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={entity.color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={entity.color} stopOpacity="0.1"/>
        </linearGradient></defs>
        <rect width={ENTITY_W} height={HEADER_H} rx={0} fill={`url(#hdr_${entity.id})`}/>
        <rect x={0} y={HEADER_H-2} width={ENTITY_W} height={2} fill={entity.color} opacity={0.8}/>
        {/* Stereotype badge */}
        <rect x={8} y={10} width={stereo.label.length*6+10} height={16} rx={4}
          fill={stereo.color+'22'} stroke={stereo.color+'55'} strokeWidth={1}/>
        <text x={13} y={21} fontSize={9} fill={stereo.color} fontFamily="'JetBrains Mono',monospace"
          fontWeight="700" style={{userSelect:'none'}}>{stereo.icon} {stereo.label}</text>
        <text x={14} y={HEADER_H/2+18} fill={entity.color} fontSize={13} fontWeight="700"
          fontFamily="'JetBrains Mono',monospace" style={{userSelect:'none'}}>
          {entity.name.length>20?entity.name.slice(0,19)+'…':entity.name}
        </text>
        {entity.description && (
          <foreignObject x={8} y={HEADER_H+4} width={ENTITY_W-16} height={46}>
            <div xmlns="http://www.w3.org/1999/xhtml"
              style={{fontSize:9,color:'#64748b',fontFamily:"'JetBrains Mono',monospace",
                lineHeight:1.5,overflow:'hidden',maxHeight:46}}>
              {entity.description}
            </div>
          </foreignObject>
        )}
        {entity.subjectArea && (
          <text x={ENTITY_W-8} y={cdmH-8} fontSize={9} fill={entity.color+'99'}
            textAnchor="end" fontFamily="'JetBrains Mono',monospace" style={{userSelect:'none'}}>
            {entity.subjectArea}
          </text>
        )}
        <circle cx={ENTITY_W} cy={HEADER_H/2} r={6} fill={entity.color} opacity={0.8}
          style={{cursor:'crosshair'}}
          onMouseDown={(e)=>{ e.stopPropagation(); onConnectStart(e,entity.id); }}/>
      </g>
    );
  }
  // Standard / LDM / PDM rendering
  return (
    <g transform={`translate(${entity.x},${entity.y})`}
       onMouseDown={onMouseDown} onDoubleClick={onDoubleClick}
       onContextMenu={onContextMenu} style={{cursor:'move'}}>
      <rect width={ENTITY_W} height={h} rx={10} fill="rgba(0,0,0,0.5)" transform="translate(3,5)" opacity={0.6}/>
      <rect width={ENTITY_W} height={h} rx={10}
        fill="rgba(13,20,40,0.97)" stroke={borderColor} strokeWidth={isSelected?2.5:1}
        style={{filter:isSelected?`drop-shadow(0 0 12px ${entity.color}55)`:''}} />
      <defs>
        <linearGradient id={`hdr_${entity.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={entity.color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={entity.color} stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id={`body_${entity.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={entity.color} stopOpacity="0.04"/>
          <stop offset="100%" stopColor={entity.color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect width={ENTITY_W} height={HEADER_H} rx={0} fill={`url(#hdr_${entity.id})`}/>
      <rect x={0} y={HEADER_H} width={ENTITY_W} height={h-HEADER_H} fill={`url(#body_${entity.id})`}/>
      <rect x={0} y={HEADER_H-2} width={ENTITY_W} height={2} fill={entity.color} opacity={0.8}/>
      {/* DWH / DV stereotype badge */}
      {(isDWH||isDV) && entity.stereotype && entity.stereotype !== 'ENTITY' && entity.stereotype !== 'TABLE' && (
        <><rect x={ENTITY_W-stereo.label.length*6-16} y={8} width={stereo.label.length*6+12} height={15} rx={4}
            fill={stereo.color+'22'} stroke={stereo.color+'55'} strokeWidth={1}/>
          <text x={ENTITY_W-stereo.label.length*6-10} y={18.5} fontSize={8} fill={stereo.color}
            fontFamily="'JetBrains Mono',monospace" fontWeight="700" style={{userSelect:'none'}}>
            {stereo.icon} {stereo.label}
          </text></>
      )}
      {/* Entity name */}
      <text x={14} y={HEADER_H/2+5} fill={entity.color} fontSize={13} fontWeight="700"
        fontFamily="'JetBrains Mono',monospace" style={{userSelect:'none',letterSpacing:'0.02em'}}>
        {entity.name.length>18?entity.name.slice(0,17)+'…':entity.name}
      </text>
      {/* Columns */}
      {entity.columns.map((col,i) => {
        const cy = HEADER_H + i*COL_H;
        const isLast = i===entity.columns.length-1;
        return (
          <g key={col.id}>
            <rect x={0} y={cy} width={ENTITY_W} height={COL_H}
              fill={i%2===0?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.1)'} stroke="none"/>
            {!isLast && <line x1={0} y1={cy+COL_H} x2={ENTITY_W} y2={cy+COL_H}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>}
            {col.pk && <text x={10} y={cy+18} fontSize={11} fill="#fbbf24" style={{userSelect:'none'}}>🔑</text>}
            {col.fk&&!col.pk && <text x={10} y={cy+18} fontSize={11} fill="#94a3b8" style={{userSelect:'none'}}>🔗</text>}
            {!col.pk&&!col.fk && <circle cx={15} cy={cy+COL_H/2} r={3}
              fill={col.nn?'#475569':'#1e293b'} stroke="#475569" strokeWidth={1}/>}
            {col.indexed && !col.pk && (
              <text x={ENTITY_W-22} y={cy+18} fontSize={8} fill="#f59e0b" style={{userSelect:'none'}}>idx</text>
            )}
            <text x={28} y={cy+18} fontSize={11} fill={col.pk?'#e2e8f0':'#94a3b8'}
              fontFamily="'JetBrains Mono',monospace" fontWeight={col.pk?'600':'400'}
              style={{userSelect:'none'}}>
              {col.name.length>18?col.name.slice(0,17)+'…':col.name}
            </text>
            {!isLDM && (
              <text x={ENTITY_W-8} y={cy+18} fontSize={10} fill={getTC(col.type)}
                fontFamily="'JetBrains Mono',monospace" textAnchor="end" style={{userSelect:'none'}}>
                {col.type}{col.length?`(${col.length})`:''}
              </text>
            )}
          </g>
        );
      })}
      {/* Footer */}
      <rect x={0} y={HEADER_H+entity.columns.length*COL_H} width={ENTITY_W} height={FOOTER_H} rx={0}
        fill="rgba(0,0,0,0.2)"/>
      <text x={10} y={HEADER_H+entity.columns.length*COL_H+18} fontSize={10}
        fill="#475569" fontFamily="'JetBrains Mono',monospace" style={{userSelect:'none'}}>
        {entity.columns.length} {isLDM?'attr':'col'}{entity.columns.length!==1?'s':''}
        {entity.columns.filter(c=>c.pk).length>0?` · ${entity.columns.filter(c=>c.pk).length} PK`:''}
        {entity.columns.filter(c=>c.fk).length>0?` · ${entity.columns.filter(c=>c.fk).length} FK`:''}
        {entity.indexes&&entity.indexes.length?` · ${entity.indexes.length} idx`:''}
      </text>
      <circle cx={ENTITY_W} cy={HEADER_H/2} r={6} fill={entity.color} opacity={0.8}
        style={{cursor:'crosshair'}}
        onMouseDown={(e)=>{ e.stopPropagation(); onConnectStart(e,entity.id); }}/>
    </g>
  );
}
EntityCard = React.memo(EntityCard);

// ─── MiniMap ──────────────────────────────────────────────────────────────────
function MiniMap({ entities, viewport, canvasW, canvasH }) {
  const W = 160, H = 100, PAD = 10;
  if (!entities.length) return null;

  const allX = entities.map(e => e.x), allY = entities.map(e => e.y);
  const minX = Math.min(...allX) - 40, minY = Math.min(...allY) - 40;
  const maxX = Math.max(...allX) + ENTITY_W + 40;
  const maxY = Math.max(...allY) + 200;
  const worldW = Math.max(maxX - minX, 100), worldH = Math.max(maxY - minY, 100);
  const sx = (W - PAD*2) / worldW, sy = (H - PAD*2) / worldH;
  const s  = Math.min(sx, sy);
  const toMM = (x, y) => ({ x: PAD + (x - minX) * s, y: PAD + (y - minY) * s });

  const vpRect = {
    x: PAD + (-viewport.x / viewport.scale - minX) * s,
    y: PAD + (-viewport.y / viewport.scale - minY) * s,
    w: (canvasW / viewport.scale) * s,
    h: (canvasH / viewport.scale) * s,
  };

  return (
    <div style={{ position:'absolute', bottom:40, right:16, zIndex:20,
      background:'rgba(10,15,30,0.92)', border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:8, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
      <svg width={W} height={H}>
        <rect width={W} height={H} fill="rgba(15,23,42,0.8)"/>
        {entities.map(e => {
          const mm = toMM(e.x, e.y);
          return <rect key={e.id} x={mm.x} y={mm.y}
            width={Math.max(ENTITY_W*s, 4)} height={Math.max(entityH(e)*s, 3)}
            rx={1} fill={e.color} opacity={0.6}/>;
        })}
        <rect x={vpRect.x} y={vpRect.y} width={Math.max(vpRect.w,4)} height={Math.max(vpRect.h,4)}
          fill="none" stroke="#22d3ee" strokeWidth={1.5} opacity={0.8}/>
      </svg>
    </div>
  );
}

// ─── Properties Panel (tabbed: Columns | Indexes | Details | Relationships) ───
function PropertiesPanel({ entity, rels, entities, onUpdate, onAddCol, onDelCol, onUpdateCol,
                           onDeleteEntity, onAddRel, onDeleteRel, dialect, setDialect }) {
  const [tab, setTab] = React.useState('cols');
  const [editingName, setEditingName] = React.useState(false);
  const [nameVal, setNameVal] = React.useState(entity?.name || '');
  const [newColName, setNewColName] = React.useState('');
  const [newColType, setNewColType] = React.useState('VARCHAR');
  const [newIdxName, setNewIdxName] = React.useState('');
  const [newIdxCols, setNewIdxCols] = React.useState([]);
  const [newIdxUniq, setNewIdxUniq] = React.useState(false);

  React.useEffect(() => {
    setNameVal(entity?.name || '');
    setEditingName(false);
    setTab('cols');
  }, [entity?.id]);

  const inp = {
    background:'rgba(15,23,42,0.85)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:6, color:'#e2e8f0', padding:'5px 8px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", outline:'none', width:'100%', boxSizing:'border-box',
  };
  const btn = (c='#22d3ee') => ({
    background:`${c}22`, border:`1px solid ${c}44`, borderRadius:6,
    color:c, cursor:'pointer', padding:'5px 10px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.2s',
  });
  const lbl = { fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3, display:'block' };
  const sec = { marginBottom:12 };
  const TYPES = ['INT','BIGINT','SMALLINT','VARCHAR','CHAR','TEXT','DECIMAL','NUMERIC','FLOAT',
    'DOUBLE','DATE','DATETIME','TIMESTAMP','BOOLEAN','JSON','JSONB','UUID','SERIAL','BYTEA','CLOB','BLOB'];
  const COLORS = ['#22d3ee','#a78bfa','#34d399','#f472b6','#fbbf24','#60a5fa','#f87171','#fb923c'];
  const STEREOTYPES = ['ENTITY','TABLE','FACT','DIMENSION','HUB','LINK','SATELLITE','BRIDGE'];
  const entityRels = rels.filter(r => r.fromId === entity?.id || r.toId === entity?.id);
  const indexes = entity?.indexes || [];

  if (!entity) return (
    <div style={{ padding:20, color:'#334155', fontSize:12, fontFamily:"'JetBrains Mono',monospace",
      textAlign:'center', paddingTop:52, lineHeight:1.8 }}>
      <div style={{ fontSize:36, marginBottom:10, opacity:0.2 }}>◻</div>
      <div style={{ color:'#475569' }}>Select an entity</div>
      <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>to edit properties</div>
    </div>
  );

  const TABS = [
    { id:'cols', label:`Cols (${entity.columns.length})` },
    { id:'idx',  label:`Idx (${indexes.length})` },
    { id:'info', label:'Details' },
    { id:'rels', label:`Rels (${entityRels.length})` },
  ];
  const tabBtn = (active) => ({
    flex:1, padding:'7px 2px', fontSize:10, border:'none', cursor:'pointer',
    borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent',
    background: active ? 'rgba(34,211,238,0.05)' : 'none',
    color: active ? '#22d3ee' : '#475569',
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.15s',
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={sec}>
          <span style={lbl}>Table / Entity</span>
          {editingName ? (
            <div style={{ display:'flex', gap:4 }}>
              <input style={inp} value={nameVal} autoFocus
                onChange={e=>setNameVal(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){onUpdate({name:nameVal});setEditingName(false);}
                               if(e.key==='Escape')setEditingName(false);}}/>
              <button style={btn('#34d399')} onClick={()=>{onUpdate({name:nameVal});setEditingName(false);}}>✓</button>
              <button style={btn('#f87171')} onClick={()=>setEditingName(false)}>✕</button>
            </div>
          ) : (
            <div onClick={()=>setEditingName(true)}
              style={{ cursor:'text', background:'rgba(15,23,42,0.85)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:6, padding:'5px 8px', fontSize:13, fontWeight:700,
                color:entity.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {entity.name}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {COLORS.map(c=>(
            <div key={c} onClick={()=>onUpdate({color:c})}
              style={{ width:18, height:18, borderRadius:'50%', background:c, cursor:'pointer',
                border:entity.color===c?'2px solid white':'2px solid transparent',
                boxShadow:entity.color===c?`0 0 6px ${c}`:'none', transition:'all 0.2s' }}/>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(tab===t.id)}
            onMouseEnter={e=>{if(tab!==t.id)e.currentTarget.style.color='#94a3b8';}}
            onMouseLeave={e=>{if(tab!==t.id)e.currentTarget.style.color='#475569';}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:10 }}>

        {/* ── Columns ── */}
        {tab==='cols' && (
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:8 }}>
              {entity.columns.map(col => (
                <div key={col.id} style={{ background:'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'5px 6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:3 }}>
                    <span style={{ fontSize:10, minWidth:16, textAlign:'center' }}>
                      {col.pk ? '🔑' : col.fk ? '🔗' : col.uq ? '◈' : '·'}
                    </span>
                    <input value={col.name} onChange={e=>onUpdateCol(col.id,{name:e.target.value})}
                      style={{ ...inp, flex:1, padding:'2px 5px', fontSize:10 }}/>
                    <select value={col.type} onChange={e=>onUpdateCol(col.id,{type:e.target.value})}
                      style={{ ...inp, width:90, padding:'2px 4px', fontSize:9 }}>
                      {TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <button onClick={()=>onDelCol(col.id)}
                      style={{ ...btn('#f87171'), padding:'2px 5px', fontSize:9 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', gap:3, paddingLeft:18, flexWrap:'wrap' }}>
                    {[['PK',col.pk,'#fbbf24',{pk:!col.pk}],['FK',col.fk,'#60a5fa',{fk:!col.fk}],
                      ['NN',col.nn,'#34d399',{nn:!col.nn}],['UQ',col.uq,'#a78bfa',{uq:!col.uq}],
                      ['AI',col.identity,'#22d3ee',{identity:!col.identity}]
                    ].map(([label,active,color,patch])=>(
                      <button key={label} onClick={()=>onUpdateCol(col.id,patch)}
                        style={{ ...btn(active?color:'#334155'), padding:'1px 5px', fontSize:8,
                          background:active?`${color}22`:'rgba(255,255,255,0.03)' }}>
                        {label}
                      </button>
                    ))}
                    <input placeholder="len" value={col.length||''} onChange={e=>onUpdateCol(col.id,{length:e.target.value})}
                      style={{ ...inp, width:44, padding:'1px 4px', fontSize:8 }}
                      title="Length / precision (e.g. 50 or 10,2)"/>
                    <input placeholder="default" value={col.defaultVal||''} onChange={e=>onUpdateCol(col.id,{defaultVal:e.target.value})}
                      style={{ ...inp, flex:1, padding:'1px 4px', fontSize:8 }}
                      title="Default value"/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <input placeholder="column_name" value={newColName}
                onChange={e=>setNewColName(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&newColName.trim()){onAddCol(newColName.trim(),newColType);setNewColName('');}}}
                style={{ ...inp, flex:1 }}/>
              <select value={newColType} onChange={e=>setNewColType(e.target.value)}
                style={{ ...inp, width:80 }}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={()=>{if(newColName.trim()){onAddCol(newColName.trim(),newColType);setNewColName('');}}}
                style={btn('#22d3ee')}>+</button>
            </div>
          </div>
        )}

        {/* ── Indexes ── */}
        {tab==='idx' && (
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:10 }}>
              {indexes.length === 0 && (
                <div style={{ color:'#334155', fontSize:11, textAlign:'center', padding:'16px 0',
                  fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
                  No indexes defined<br/>
                  <span style={{ fontSize:10, color:'#1e293b' }}>Add indexes for query optimization</span>
                </div>
              )}
              {indexes.map((idx, i) => (
                <div key={idx.id||i} style={{ background:'rgba(255,255,255,0.02)',
                  border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'6px 8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, fontFamily:"'JetBrains Mono',monospace",
                      background: idx.unique ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                      color: idx.unique ? '#22d3ee' : '#64748b',
                      border:`1px solid ${idx.unique?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.08)'}` }}>
                      {idx.unique ? 'UNIQUE' : 'INDEX'}
                    </span>
                    <span style={{ fontSize:11, color:'#e2e8f0', fontFamily:"'JetBrains Mono',monospace", flex:1 }}>
                      {idx.name}
                    </span>
                    <button onClick={()=>{const ni=[...indexes];ni.splice(i,1);onUpdate({indexes:ni});}}
                      style={{ ...btn('#f87171'), padding:'2px 5px', fontSize:9 }}>✕</button>
                  </div>
                  <div style={{ fontSize:10, color:'#475569', fontFamily:"'JetBrains Mono',monospace" }}>
                    ON ({(idx.columns||[]).join(', ')||'—'})
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:6, padding:'8px 10px' }}>
              <span style={lbl}>New Index</span>
              <input placeholder={`idx_${entity.name.toLowerCase()}_col`} value={newIdxName}
                onChange={e=>setNewIdxName(e.target.value)}
                style={{ ...inp, marginBottom:6 }}/>
              <div style={{ marginBottom:6 }}>
                <span style={{ ...lbl, marginBottom:4 }}>Include Columns</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {entity.columns.map(c=>(
                    <label key={c.id} style={{ display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                      <input type="checkbox" checked={newIdxCols.includes(c.name)}
                        onChange={e=>setNewIdxCols(p=>e.target.checked?[...p,c.name]:p.filter(n=>n!==c.name))}/>
                      <span style={{ fontSize:10, color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ display:'flex', gap:4, alignItems:'center', cursor:'pointer',
                  fontSize:10, color:'#64748b', fontFamily:"'JetBrains Mono',monospace" }}>
                  <input type="checkbox" checked={newIdxUniq} onChange={e=>setNewIdxUniq(e.target.checked)}/>
                  UNIQUE constraint
                </label>
                <button onClick={()=>{
                  if(!newIdxName.trim()||newIdxCols.length===0) return;
                  const idx={id:uid(),name:newIdxName.trim(),columns:[...newIdxCols],unique:newIdxUniq};
                  onUpdate({indexes:[...(entity.indexes||[]),idx]});
                  setNewIdxName('');setNewIdxCols([]);setNewIdxUniq(false);
                }} style={{ ...btn('#34d399'), marginLeft:'auto', padding:'4px 10px' }}>
                  + Add Index
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Details ── */}
        {tab==='info' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={sec}>
              <span style={lbl}>Description</span>
              <textarea value={entity.description||''} onChange={e=>onUpdate({description:e.target.value})}
                placeholder="Business purpose of this entity…"
                style={{ ...inp, minHeight:68, resize:'vertical', lineHeight:1.6 }}/>
            </div>
            <div style={sec}>
              <span style={lbl}>Stereotype</span>
              <select value={entity.stereotype||'ENTITY'} onChange={e=>onUpdate({stereotype:e.target.value})}
                style={inp}>
                {STEREOTYPES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={sec}>
              <span style={lbl}>Subject Area</span>
              <input value={entity.subjectArea||''} onChange={e=>onUpdate({subjectArea:e.target.value})}
                placeholder="e.g. Sales, Finance, Catalog" style={inp}/>
            </div>
            <div style={sec}>
              <span style={lbl}>Domain Owner</span>
              <input value={entity.owner||''} onChange={e=>onUpdate({owner:e.target.value})}
                placeholder="e.g. Data Engineering Team" style={inp}/>
            </div>
            <div style={sec}>
              <span style={lbl}>Tags</span>
              <input value={entity.tags||''} onChange={e=>onUpdate({tags:e.target.value})}
                placeholder="e.g. core, pii, sensitive, audit" style={inp}/>
            </div>
            <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 0' }}/>
            <button onClick={onDeleteEntity}
              style={{ ...btn('#f87171'), width:'100%', padding:'8px', fontSize:11 }}>
              🗑 Delete Table
            </button>
          </div>
        )}

        {/* ── Relationships ── */}
        {tab==='rels' && (
          <div>
            {entityRels.length === 0 ? (
              <div style={{ color:'#334155', fontSize:11, textAlign:'center', padding:'20px 0',
                fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7 }}>
                No relationships yet<br/>
                <span style={{ fontSize:10, color:'#1e293b' }}>Use Connect tool or drag from the cyan ● handle</span>
              </div>
            ) : entityRels.map(r => {
              const other = entities.find(e=>e.id===(r.fromId===entity.id?r.toId:r.fromId));
              const dir   = r.fromId===entity.id ? '→' : '←';
              const card  = r.fromId===entity.id
                ? `${(r.fromCard||'?').replace(/_/g,' ')} : ${(r.toCard||'?').replace(/_/g,' ')}`
                : `${(r.toCard||'?').replace(/_/g,' ')} : ${(r.fromCard||'?').replace(/_/g,' ')}`;
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4,
                  background:'rgba(255,255,255,0.02)', borderRadius:6, padding:'6px 8px',
                  border:'1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color:'#475569', fontSize:13 }}>{dir}</span>
                  <span style={{ color:other?.color||'#22d3ee', fontSize:11, fontWeight:600,
                    fontFamily:"'JetBrains Mono',monospace", flex:1 }}>{other?.name||'?'}</span>
                  <span style={{ fontSize:9, color:'#475569', background:'rgba(255,255,255,0.04)',
                    padding:'2px 5px', borderRadius:3, fontFamily:"'JetBrains Mono',monospace" }}>{card}</span>
                  <button onClick={()=>onDeleteRel(r.id)}
                    style={{ ...btn('#f87171'), padding:'2px 5px', fontSize:9 }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}


// ─── SQL Panel (Enterprise — multi-dialect + export suite) ───────────────────
function SQLPanel({ entities, rels, dialect, setDialect }) {
  const [mode, setMode] = React.useState('sql');
  const [copied, setCopied] = React.useState(false);
  const DIALECTS = ['PostgreSQL','MySQL','SQLite','SQL Server','Oracle','Snowflake'];
  const inp = { background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:6, color:'#e2e8f0', padding:'5px 8px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", outline:'none' };
  const btn = (c='#22d3ee') => ({ background:`${c}22`, border:`1px solid ${c}44`, borderRadius:6,
    color:c, cursor:'pointer', padding:'5px 10px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.2s' });

  const sql = React.useMemo(() => generateSQL(entities, rels, dialect), [entities, rels, dialect]);

  const dataDictionary = React.useMemo(() => {
    let md = `# Data Dictionary\n\nGenerated: ${new Date().toISOString().split('T')[0]}\nDialect: ${dialect}\n\n`;
    for (const e of entities) {
      md += `## ${e.name}\n`;
      if (e.description) md += `> ${e.description}\n\n`;
      if (e.stereotype) md += `**Stereotype:** ${e.stereotype}  \n`;
      if (e.subjectArea) md += `**Subject Area:** ${e.subjectArea}  \n`;
      md += `\n| Column | Type | PK | FK | NN | UQ | Default | Description |\n`;
      md += `|--------|------|----|----|----|----|---------|-------------|\n`;
      for (const c of e.columns) {
        const t = c.length ? `${c.type}(${c.length})` : c.type;
        md += `| ${c.name} | ${t} | ${c.pk?'✓':''} | ${c.fk?'✓':''} | ${c.nn?'✓':''} | ${c.uq?'✓':''} | ${c.defaultVal||''} | |\n`;
      }
      if ((e.indexes||[]).length > 0) {
        md += `\n**Indexes:**\n`;
        for (const idx of e.indexes) md += `- \`${idx.name}\` ON (${(idx.columns||[]).join(', ')})${idx.unique?' UNIQUE':''}\n`;
      }
      md += '\n';
    }
    return md;
  }, [entities, dialect]);

  const jsonExport = React.useMemo(() => JSON.stringify({ dialect, entities, rels }, null, 2), [entities, rels, dialect]);

  const content = mode === 'sql' ? sql : mode === 'dict' ? dataDictionary : jsonExport;

  const copy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const download = (text, filename, mime='text/plain') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text],{type:mime}));
    a.download = filename; a.click();
  };

  const modeBtn = (m, label, color) => ({
    padding:'5px 10px', fontSize:10, border:'none', cursor:'pointer',
    borderBottom: mode===m ? `2px solid ${color}` : '2px solid transparent',
    background: mode===m ? `${color}11` : 'none',
    color: mode===m ? color : '#475569',
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.15s',
  });

  return (
    <div style={{ padding:10, height:'100%', display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:2 }}>
        <button style={modeBtn('sql','DDL SQL','#22d3ee')} onClick={()=>setMode('sql')}>DDL SQL</button>
        <button style={modeBtn('dict','Dictionary','#a78bfa')} onClick={()=>setMode('dict')}>Dictionary</button>
        <button style={modeBtn('json','JSON','#34d399')} onClick={()=>setMode('json')}>JSON</button>
      </div>
      <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
        {mode === 'sql' && (
          <select value={dialect} onChange={e=>setDialect(e.target.value)} style={{ ...inp, flex:1 }}>
            {DIALECTS.map(d=><option key={d}>{d}</option>)}
          </select>
        )}
        <button onClick={copy} style={btn(copied?'#34d399':'#22d3ee')}>{copied?'✓ Copied':'Copy'}</button>
        {mode === 'sql' && (
          <button onClick={()=>download(sql,`schema_${dialect.toLowerCase()}.sql`)}
            style={btn('#a78bfa')}>↓ .sql</button>
        )}
        {mode === 'dict' && (
          <button onClick={()=>download(dataDictionary,'data_dictionary.md','text/markdown')}
            style={btn('#a78bfa')}>↓ .md</button>
        )}
        {mode === 'json' && (
          <button onClick={()=>download(jsonExport,'schema.json','application/json')}
            style={btn('#a78bfa')}>↓ .json</button>
        )}
      </div>
      <pre style={{ flex:1, overflow:'auto', background:'rgba(0,0,0,0.35)', borderRadius:8, padding:10,
        fontSize:10, lineHeight:1.65, color:'#e2e8f0', fontFamily:"'JetBrains Mono',monospace",
        border:'1px solid rgba(255,255,255,0.06)', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
        {content}
      </pre>
    </div>
  );
}

// ─── Validation Panel (Enterprise — severity filter + grouped rules) ──────────
function ValidationPanel({ entities, rels }) {
  const [filter, setFilter] = React.useState('all');
  const allIssues = React.useMemo(() => validateModel(entities, rels), [entities, rels]);
  const issues = filter === 'all' ? allIssues : allIssues.filter(i=>i.level===filter);
  const counts = { error:0, warn:0, info:0, ok:0 };
  allIssues.forEach(i=>{ if(counts[i.level]!==undefined) counts[i.level]++; });
  const colors = { error:'#f87171', warn:'#fbbf24', info:'#60a5fa', ok:'#34d399' };
  const icons  = { error:'✗', warn:'⚠', info:'ℹ', ok:'✓' };
  const fBtn = (f, label, c) => ({
    background: filter===f ? `${c}22` : 'none',
    border: `1px solid ${filter===f ? c+'44' : 'rgba(255,255,255,0.08)'}`,
    borderRadius:5, color: filter===f ? c : '#475569',
    cursor:'pointer', padding:'3px 8px', fontSize:10,
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.15s',
  });
  return (
    <div style={{ padding:12 }}>
      <div style={{ display:'flex', gap:4, marginBottom:10, flexWrap:'wrap' }}>
        <button style={fBtn('all','All','#94a3b8')} onClick={()=>setFilter('all')}>All ({allIssues.length})</button>
        <button style={fBtn('error','Errors','#f87171')} onClick={()=>setFilter('error')}>✗ {counts.error}</button>
        <button style={fBtn('warn','Warnings','#fbbf24')} onClick={()=>setFilter('warn')}>⚠ {counts.warn}</button>
        <button style={fBtn('info','Info','#60a5fa')} onClick={()=>setFilter('info')}>ℹ {counts.info}</button>
      </div>
      {issues.length === 0 && (
        <div style={{ color:'#334155', fontSize:11, textAlign:'center', padding:'20px 0',
          fontFamily:"'JetBrains Mono',monospace" }}>No issues in this filter</div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {issues.map((iss,i) => (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start',
            background:`${colors[iss.level]||'#94a3b8'}0d`,
            border:`1px solid ${colors[iss.level]||'#94a3b8'}2a`,
            borderRadius:6, padding:'6px 8px' }}>
            <span style={{ color:colors[iss.level]||'#94a3b8', fontSize:12, minWidth:14, marginTop:1, flexShrink:0 }}>
              {icons[iss.level]||'·'}
            </span>
            <span style={{ fontSize:11, color:'#cbd5e1', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.55 }}>
              {iss.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Copilot Panel ─────────────────────────────────────────────────────────
function AIPanel({ entities, onApplySuggestion }) {
  const [mode, setMode] = React.useState('analyze');
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');

  const suggestions = [
    { icon:'📊', text:'Analyze schema quality and normalization' },
    { icon:'🔑', text:'Suggest indexes for all FK and query columns' },
    { icon:'📋', text:'Generate a markdown data dictionary' },
    { icon:'🔁', text:'Identify redundant or circular relationships' },
    { icon:'🏷', text:'Review naming conventions across all tables' },
    { icon:'⚡', text:'Estimate query performance bottlenecks' },
  ];

  const handleQuery = () => {
    if (!input.trim()) return;
    setLoading(true); setResult('');
    const ctx = entities.map(e =>
      `${e.name}(${e.columns.map(c=>`${c.name}:${c.type}${c.pk?'[PK]':c.fk?'[FK]':''}`).join(', ')})`
    ).join('\n');
    const totalCols = entities.reduce((s,e)=>s+e.columns.length,0);
    const tablesNoPK = entities.filter(e=>!e.columns.some(c=>c.pk)).length;
    const tablesWithFK = entities.filter(e=>e.columns.some(c=>c.fk)).length;
    setTimeout(() => {
      if (mode === 'generate') {
        setResult(
          `⚡ Schema Generation Request\n"${input}"\n\n` +
          `To generate schemas from natural language, connect an AI API key in Settings.\n\n` +
          `Current schema (${entities.length} tables, ${totalCols} columns):\n${ctx}\n\n` +
          `📌 Generation workflow:\n` +
          `  1. Parse business entities from description\n` +
          `  2. Infer cardinality (1:1, 1:M, M:M)\n` +
          `  3. Assign data types per target dialect\n` +
          `  4. Normalize to 3NF\n` +
          `  5. Generate bridge tables for M:M\n` +
          `  6. Add audit columns (created_at, updated_at)\n` +
          `  7. Suggest indexes for FK columns`
        );
      } else {
        setResult(
          `📊 Schema Analysis — ${entities.length} Tables, ${totalCols} Columns\n\n` +
          `Schema map:\n${ctx}\n\n` +
          `Query: "${input}"\n\n` +
          `🔍 Automated findings:\n` +
          `  • ${tablesNoPK} table${tablesNoPK!==1?'s':''} missing Primary Key\n` +
          `  • ${tablesWithFK} table${tablesWithFK!==1?'s':''} with FK columns\n` +
          `  • Avg columns per table: ${(totalCols/Math.max(entities.length,1)).toFixed(1)}\n\n` +
          `💡 Connect an AI API key in Settings for:\n` +
          `  • Intelligent normalization analysis\n` +
          `  • SQL query generation\n` +
          `  • Impact analysis\n` +
          `  • Schema-to-business-rule mapping`
        );
      }
      setLoading(false);
    }, 550);
  };

  const inp = { background:'rgba(15,23,42,0.85)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:6, color:'#e2e8f0', padding:'8px 10px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", outline:'none', width:'100%', boxSizing:'border-box' };
  const modeBtn = (m, label, color) => ({
    flex:1, padding:'6px', fontSize:10, border:'none', cursor:'pointer',
    borderBottom: mode===m ? `2px solid ${color}` : '2px solid transparent',
    background: mode===m ? `${color}0d` : 'none',
    color: mode===m ? color : '#475569',
    fontFamily:"'JetBrains Mono',monospace", transition:'all 0.15s',
  });

  return (
    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:2 }}>
        <button style={modeBtn('analyze','✨ Analyze','#a78bfa')} onClick={()=>{setMode('analyze');setResult('');}}>✨ Analyze</button>
        <button style={modeBtn('generate','⚡ Generate','#22d3ee')} onClick={()=>{setMode('generate');setResult('');}}>⚡ Generate</button>
      </div>

      {mode==='analyze' && (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {suggestions.map((s,i)=>(
            <button key={i} onClick={()=>setInput(s.text)}
              style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.12)',
                borderRadius:5, color:'#64748b', cursor:'pointer', padding:'5px 8px', fontSize:10,
                fontFamily:"'JetBrains Mono',monospace", textAlign:'left', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(167,139,250,0.12)';e.currentTarget.style.color='#a78bfa';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(167,139,250,0.05)';e.currentTarget.style.color='#64748b';}}>
              {s.icon} {s.text}
            </button>
          ))}
        </div>
      )}

      {mode==='generate' && (
        <div style={{ fontSize:10, color:'#475569', fontFamily:"'JetBrains Mono',monospace",
          background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.1)',
          borderRadius:6, padding:'7px 10px', lineHeight:1.6 }}>
          Describe your business domain. AI will infer entities, attributes, cardinality, and generate a normalized schema.
        </div>
      )}

      <textarea
        placeholder={mode==='generate'
          ? 'e.g. "E-commerce platform with customers, products in categories, orders with line items, reviews, and inventory per warehouse…"'
          : 'Ask anything about your schema…'}
        value={input} onChange={e=>setInput(e.target.value)}
        style={{ ...inp, minHeight:72, resize:'vertical', lineHeight:1.55 }}/>

      <button onClick={handleQuery} disabled={loading}
        style={{ background: loading ? 'rgba(255,255,255,0.03)' : 'rgba(167,139,250,0.12)',
          border: `1px solid ${loading?'rgba(255,255,255,0.06)':'rgba(167,139,250,0.35)'}`,
          borderRadius:6, color: loading?'#334155':'#a78bfa', cursor: loading?'not-allowed':'pointer',
          padding:'8px', fontSize:11, fontFamily:"'JetBrains Mono',monospace", transition:'all 0.2s' }}>
        {loading ? '⏳ Processing…' : mode==='generate' ? '⚡ Generate Schema' : '✨ Analyze Schema'}
      </button>

      {result && (
        <pre style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:8,
          padding:10, fontSize:10, color:'#cbd5e1', fontFamily:"'JetBrains Mono',monospace",
          whiteSpace:'pre-wrap', wordBreak:'break-word', lineHeight:1.65, margin:0,
          maxHeight:280, overflow:'auto' }}>
          {result}
        </pre>
      )}
    </div>
  );
}


// ─── Relationship Properties Panel ──────────────────────────────────────────
function RelationshipPanel({ rel, entities, onUpdate, onDelete }) {
  const [lbl, setLbl] = useState(rel?.label || '');
  useEffect(() => { setLbl(rel?.label || ''); }, [rel?.id]);
  const fromEnt = entities.find(e => e.id === rel?.fromId);
  const toEnt   = entities.find(e => e.id === rel?.toId);
  const CARDS = ['one','one_and_only','zero_or_one','many','one_or_many','zero_or_many'];
  const inp = { background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:6, color:'#e2e8f0', padding:'5px 8px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", outline:'none', width:'100%', boxSizing:'border-box' };
  const lbs = { fontSize:10, color:'#475569', textTransform:'uppercase',
    letterSpacing:'0.08em', display:'block', marginBottom:3 };
  if (!rel) return (
    <div style={{ padding:16, color:'#475569', fontSize:12,
      fontFamily:"'JetBrains Mono',monospace", textAlign:'center', paddingTop:40 }}>
      <div style={{ fontSize:28, marginBottom:8, opacity:0.4 }}>⟶</div>
      Select a relationship to edit
    </div>
  );
  return (
    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 10px',
        background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color:fromEnt?.color||'#22d3ee', fontSize:12, fontWeight:700,
          fontFamily:"'JetBrains Mono',monospace" }}>{fromEnt?.name||'?'}</span>
        <span style={{ color:'#475569', fontSize:12 }}>→</span>
        <span style={{ color:toEnt?.color||'#a78bfa', fontSize:12, fontWeight:700,
          fontFamily:"'JetBrains Mono',monospace" }}>{toEnt?.name||'?'}</span>
      </div>
      <div>
        <span style={lbs}>Label</span>
        <input value={lbl} onChange={e=>setLbl(e.target.value)}
          onBlur={()=>onUpdate({label:lbl})}
          onKeyDown={e=>e.key==='Enter'&&onUpdate({label:lbl})}
          style={inp} placeholder="e.g. places, contains…"/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div>
          <span style={lbs}>From ({fromEnt?.name})</span>
          <select value={rel.fromCard||'many'} onChange={e=>onUpdate({fromCard:e.target.value})} style={inp}>
            {CARDS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <span style={lbs}>To ({toEnt?.name})</span>
          <select value={rel.toCard||'one'} onChange={e=>onUpdate({toCard:e.target.value})} style={inp}>
            {CARDS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>
      <div>
        <span style={lbs}>Type</span>
        <select value={rel.relType||'non-identifying'} onChange={e=>onUpdate({relType:e.target.value})} style={inp}>
          <option value="non-identifying">Non-Identifying</option>
          <option value="identifying">Identifying (solid)</option>
          <option value="weak">Weak Entity (dashed)</option>
        </select>
      </div>
      <button onClick={onDelete}
        style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)',
          borderRadius:6, color:'#f87171', cursor:'pointer', padding:'8px', fontSize:11,
          fontFamily:"'JetBrains Mono',monospace" }}>
        🗑 Delete Relationship
      </button>
    </div>
  );
}


// ─── Connect Dialog ─────────────────────────────────────────────────────────
function ConnectDialog({ from, to, entities, onConfirm, onConfirmBridge, onClose }) {
  const [label,     setLabel]  = useState('');
  const [fromCard,  setFrom]   = useState('many');
  const [toCard,    setTo]     = useState('one');
  const [relType,   setRType]  = useState('non-identifying');
  const [bridge,    setBridge] = useState(false);
  const fromE = entities.find(e=>e.id===from);
  const toE   = entities.find(e=>e.id===to);
  const MM_CARDS = ['many','zero_or_many','one_or_many'];
  const isMM = MM_CARDS.includes(fromCard) && MM_CARDS.includes(toCard);
  React.useEffect(()=>{ setBridge(isMM); }, [isMM]);
  const PRESETS = [
    { lbl:'1:1',  from:'one_and_only', to:'one_and_only' },
    { lbl:'1:M',  from:'one',          to:'many'         },
    { lbl:'M:1',  from:'many',         to:'one'          },
    { lbl:'M:M',  from:'many',         to:'many'         },
    { lbl:'0..1', from:'zero_or_one',  to:'one'          },
    { lbl:'0..*', from:'one',          to:'zero_or_many' },
    { lbl:'1..*', from:'one',          to:'one_or_many'  },
  ];
  const CARDS = ['one','one_and_only','zero_or_one','many','one_or_many','zero_or_many'];
  const inp = { background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:6, color:'#e2e8f0', padding:'6px 8px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", outline:'none', width:'100%', boxSizing:'border-box' };
  const doConfirm = () => {
    const opts = { label, fromCard, toCard, relType };
    if (isMM && bridge) onConfirmBridge(opts);
    else onConfirm(opts);
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(10,15,30,0.98))',
        border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:24, width:400,
        boxShadow:'0 20px 60px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:4,
          fontFamily:"'JetBrains Mono',monospace" }}>Create Relationship</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16,
          fontSize:12, color:'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>
          <span style={{ color:'#22d3ee' }}>{fromE?.name}</span>
          <span>→</span>
          <span style={{ color:'#a78bfa' }}>{toE?.name}</span>
        </div>
        {/* Quick presets */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:6 }}>Quick Preset</div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {PRESETS.map(p=>(
              <button key={p.lbl} onClick={()=>{ setFrom(p.from); setTo(p.to); }}
                style={{ padding:'4px 9px', borderRadius:5, fontSize:10, cursor:'pointer',
                  fontFamily:"'JetBrains Mono',monospace", transition:'all 0.15s',
                  background: fromCard===p.from&&toCard===p.to ? 'rgba(34,211,238,0.18)' : 'rgba(255,255,255,0.04)',
                  border:     fromCard===p.from&&toCard===p.to ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color:      fromCard===p.from&&toCard===p.to ? '#22d3ee' : '#94a3b8' }}>
                {p.lbl}
              </button>
            ))}
          </div>
        </div>
        {/* Label */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:3 }}>Label</div>
          <input style={inp} placeholder="e.g. places, contains, belongs_to"
            value={label} onChange={e=>setLabel(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doConfirm()}/>
        </div>
        {/* Cardinality */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:3 }}>From ({fromE?.name})</div>
            <select style={inp} value={fromCard} onChange={e=>setFrom(e.target.value)}>
              {CARDS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:3 }}>To ({toE?.name})</div>
            <select style={inp} value={toCard} onChange={e=>setTo(e.target.value)}>
              {CARDS.map(c=><option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
        </div>
        {/* Type */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'#475569', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:3 }}>Relationship Type</div>
          <select style={inp} value={relType} onChange={e=>setRType(e.target.value)}>
            <option value="non-identifying">Non-Identifying</option>
            <option value="identifying">Identifying</option>
          </select>
        </div>
        {/* M:M bridge option */}
        {isMM && (
          <div style={{ marginBottom:14, padding:'10px 12px',
            background:'rgba(244,114,182,0.07)', border:'1px solid rgba(244,114,182,0.3)',
            borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#f472b6', fontFamily:"'JetBrains Mono',monospace",
              marginBottom:7, fontWeight:700 }}>⚡ Many-to-Many Detected</div>
            <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
              <input type="checkbox" checked={bridge} onChange={e=>setBridge(e.target.checked)}
                style={{ accentColor:'#f472b6', width:14, height:14, cursor:'pointer' }}/>
              <span style={{ fontSize:11, color:'#e2e8f0', fontFamily:"'JetBrains Mono',monospace" }}>
                Auto-create bridge table ({fromE?.name}_{toE?.name})
              </span>
            </label>
            {bridge && (
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:6,
                fontFamily:"'JetBrains Mono',monospace", lineHeight:1.6 }}>
                Creates junction table with composite PK + two identifying 1:M relationships
              </div>
            )}
          </div>
        )}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8, color:'#94a3b8', cursor:'pointer', padding:'8px 16px',
              fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>Cancel</button>
          <button onClick={doConfirm}
            style={{ background: isMM&&bridge ? 'rgba(244,114,182,0.15)' : 'rgba(34,211,238,0.15)',
              border: isMM&&bridge ? '1px solid rgba(244,114,182,0.4)' : '1px solid rgba(34,211,238,0.4)',
              borderRadius:8, color: isMM&&bridge ? '#f472b6' : '#22d3ee',
              cursor:'pointer', padding:'8px 16px', fontSize:12,
              fontFamily:"'JetBrains Mono',monospace" }}>
            {isMM&&bridge ? '⚡ Create Bridge Table' : 'Create Relationship'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);
  return (
    <div style={{ position:'fixed', left:x, top:y, zIndex:600,
      background:'rgba(15,23,42,0.97)', border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:10, padding:'4px 0', minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      backdropFilter:'blur(20px)' }}
      onClick={e=>e.stopPropagation()}>
      {items.map((item, i) => item === 'separator'
        ? <div key={i} style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'3px 0' }}/>
        : (
          <button key={i} onClick={()=>{ item.action(); onClose(); }}
            style={{ display:'block', width:'100%', padding:'7px 14px', background:'none',
              border:'none', color: item.danger?'#f87171':'#e2e8f0', cursor:'pointer', fontSize:12,
              fontFamily:"'JetBrains Mono',monospace", textAlign:'left', transition:'background 0.15s' }}
            onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.06)'}
            onMouseLeave={e=>e.target.style.background='none'}>
            {item.icon} {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ─── Toolbar (top) ─────────────────────────────────────────────────────────────
function TopToolbar({ tool, setTool, onNew, onTemplate, onUndo, onRedo, onFitView, onExportPNG,
                      onExportSVG, onExportJSON, zoom, canUndo, canRedo,
                      dialect, setDialect, onValidate, onAutoLayout,
                      modelLayer, setModelLayer, notation, setNotation,
                      showNotationLegend, setShowNotationLegend }) {
  const B = { background:'none', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:6, color:'#94a3b8', cursor:'pointer', padding:'4px 9px', fontSize:11,
    fontFamily:"'JetBrains Mono',monospace", display:'flex', alignItems:'center', gap:4,
    transition:'all 0.2s', whiteSpace:'nowrap', height:28 };
  const SELSTYLE = { ...B, background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.12)',
    color:'#e2e8f0', cursor:'pointer', fontSize:11, fontFamily:"'JetBrains Mono',monospace",
    outline:'none', height:28, padding:'0 8px', borderRadius:6 };
  const sep = <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)', margin:'0 4px' }}/>;
  const layerCfg = LAYER_CONFIG[modelLayer] || LAYER_CONFIG.PDM;
  return (
    <div style={{ height:44, background:'rgba(5,10,22,0.95)', borderBottom:'1px solid rgba(255,255,255,0.07)',
      display:'flex', alignItems:'center', padding:'0 10px', gap:4, flexShrink:0,
      backdropFilter:'blur(20px)', zIndex:30, overflowX:'auto' }}>
      {/* Model layer selector */}
      <div style={{ display:'flex', alignItems:'center', gap:3, marginRight:4 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:layerCfg.color,
          boxShadow:`0 0 6px ${layerCfg.color}`, flexShrink:0 }}/>
        <select value={modelLayer} onChange={e=>setModelLayer(e.target.value)}
          style={{ ...SELSTYLE, color:layerCfg.color, fontWeight:700, width:130,
            border:`1px solid ${layerCfg.color}44`, background:`${layerCfg.color}0f` }}>
          {Object.entries(LAYER_CONFIG).map(([k,v])=>(
            <option key={k} value={k}>{v.abbr} — {v.name}</option>
          ))}
        </select>
      </div>
      {sep}
      {/* File */}
      <span style={{ fontSize:9,color:'#2d3748',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:"'JetBrains Mono',monospace" }}>File</span>
      {[{ icon:'📄', label:'New',      fn:onNew          },
        { icon:'📋', label:'Template', fn:onTemplate     },
        { icon:'SVG', label:'SVG',    fn:onExportSVG    },
        { icon:'PNG', label:'PNG',    fn:onExportPNG    },
        { icon:'{}',  label:'JSON',   fn:onExportJSON   },
      ].map(btn=>(
        <button key={btn.label} onClick={btn.fn} style={B}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}
          onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>
          {btn.icon}
        </button>
      ))}
      {sep}
      {/* Edit */}
      <span style={{ fontSize:9,color:'#2d3748',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:"'JetBrains Mono',monospace" }}>Edit</span>
      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
        style={{...B, opacity:canUndo?1:0.35}}
        onMouseEnter={e=>{if(canUndo){e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>↩ Undo</button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
        style={{...B, opacity:canRedo?1:0.35}}
        onMouseEnter={e=>{if(canRedo){e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>↪ Redo</button>
      {sep}
      {/* View */}
      <span style={{ fontSize:9,color:'#2d3748',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:"'JetBrains Mono',monospace" }}>View</span>
      <button onClick={onFitView} style={B} title="Fit all (F)"
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>⊡ Fit</button>
      <span style={{fontSize:11,color:'#475569',fontFamily:"'JetBrains Mono',monospace",padding:'0 6px'}}>
        {Math.round(zoom*100)}%
      </span>
      {sep}
      {/* Tools */}
      <span style={{ fontSize:9,color:'#2d3748',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:"'JetBrains Mono',monospace" }}>Tools</span>
      <button onClick={onValidate} style={B}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>✓ Validate</button>
      <button onClick={onAutoLayout} style={B}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}>⬛ Layout</button>
      {sep}
      {/* Notation */}
      <span style={{ fontSize:9,color:'#2d3748',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:"'JetBrains Mono',monospace" }}>Notation</span>
      <select value={notation} onChange={e=>setNotation(e.target.value)} style={SELSTYLE} title="Change notation style">
        {Object.entries(NOTATION).map(([k,v])=>(
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button onClick={()=>setShowNotationLegend(p=>!p)}
        style={{...B, background:showNotationLegend?'rgba(34,211,238,0.1)':'none',
                borderColor:showNotationLegend?'rgba(34,211,238,0.4)':'rgba(255,255,255,0.08)',
                color:showNotationLegend?'#22d3ee':'#94a3b8'}}
        onMouseEnter={e=>{if(!showNotationLegend){e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#e2e8f0';}}}
        onMouseLeave={e=>{if(!showNotationLegend){e.currentTarget.style.background='none';e.currentTarget.style.color='#94a3b8';}}}>? Legend</button>
      {sep}
      {/* DB dialect */}
      <select value={dialect} onChange={e=>setDialect(e.target.value)} style={SELSTYLE}>
        {['PostgreSQL','MySQL','SQLite','SQL Server','Oracle','Snowflake'].map(d=>(
          <option key={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}


// ─── Left Tool Sidebar ────────────────────────────────────────────────────────
function LeftToolbar({ tool, setTool }) {
  const tools = [
    { id:'select',  icon:'↖', label:'Select (V)',   color:'#22d3ee' },
    { id:'add',     icon:'◻+', label:'Add Table (A)', color:'#34d399' },
    { id:'connect', icon:'↗', label:'Connect (C)',  color:'#a78bfa' },
    { id:'delete',  icon:'🗑', label:'Delete (Del)', color:'#f87171' },
  ];
  return (
    <div style={{ width:48, background:'rgba(8,12,22,0.9)', borderRight:'1px solid rgba(255,255,255,0.06)',
      display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', gap:4,
      flexShrink:0, zIndex:20 }}>
      {tools.map(t => (
        <button key={t.id} title={t.label} onClick={()=>setTool(t.id)}
          style={{ width:36, height:36, borderRadius:8, border: tool===t.id?`2px solid ${t.color}`:'1px solid rgba(255,255,255,0.06)',
            background: tool===t.id?`${t.color}22`:'none', color: tool===t.id?t.color:'#475569',
            cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s', boxShadow: tool===t.id?`0 0 10px ${t.color}44`:'none' }}>
          {t.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Status Bar (enterprise — shows layer, notation, entity/rel counts) ────────
function StatusBar({ zoom, entities, rels, selectedIds, tool, message, modelLayer, notation }) {
  const layerCfg = LAYER_CONFIG[modelLayer] || LAYER_CONFIG.PDM;
  const totalCols = entities.reduce((s,e)=>s+e.columns.length,0);
  const sep = <span style={{ color:'rgba(255,255,255,0.08)', padding:'0 2px' }}>│</span>;
  return (
    <div style={{ height:26, background:'rgba(6,8,18,0.97)', borderTop:'1px solid rgba(255,255,255,0.05)',
      display:'flex', alignItems:'center', padding:'0 10px', gap:8, flexShrink:0,
      fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'#334155', userSelect:'none' }}>
      {/* Layer badge */}
      <span style={{ background:`${layerCfg.color}22`, border:`1px solid ${layerCfg.color}44`,
        borderRadius:4, color:layerCfg.color, padding:'0 6px', fontSize:9, lineHeight:'18px' }}>
        {layerCfg.abbr}
      </span>
      {sep}
      <span style={{ color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontSize:9 }}>
        {NOTATION[notation]||'Crow\'s Foot'}
      </span>
      {sep}
      <span style={{ color:'#22d3ee' }}>TOOL: {tool.toUpperCase()}</span>
      {sep}
      <span>{Math.round(zoom*100)}%</span>
      {sep}
      <span style={{ color:'#475569' }}>{entities.length} tables · {rels.length} rels · {totalCols} cols</span>
      {selectedIds.length > 0 && <>{sep}<span style={{color:'#a78bfa'}}>{selectedIds.length} selected</span></>}
      {message && <>{sep}<span style={{color:'#34d399', animation:'none'}}>{message}</span></>}
      <span style={{ marginLeft:'auto', color:'#1e293b', fontSize:9 }}>Data OS — ER Diagram Studio v3.0</span>
    </div>
  );
}

// ─── Template Picker Modal ────────────────────────────────────────────────────
function TemplatePicker({ onApply, onClose }) {
  const [hovered, setHovered] = React.useState(null);
  const META = {
    'Star Schema':  { icon:'⭐', color:'#f59e0b', desc:'Fact + dimension tables for analytical reporting. Central fact table with date, product, store, customer dims.' },
    'Data Vault':   { icon:'🔐', color:'#22d3ee', desc:'Hub-Link-Satellite pattern for resilient enterprise data warehousing. Supports historical tracking and auditability.' },
    'HR System':    { icon:'👥', color:'#a78bfa', desc:'Employees, departments, projects, and assignments. Models org hierarchy and resource allocation.' },
    'E-Commerce':   { icon:'🛒', color:'#34d399', desc:'Full e-commerce schema: customers, products, orders, line items, reviews, and addresses.' },
    'Blank':        { icon:'◻',  color:'#475569', desc:'Start from a blank canvas and build your model from scratch.' },
  };
  const names = Object.keys(META);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'linear-gradient(135deg,rgba(12,20,40,0.99),rgba(6,10,22,0.99))',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:560, maxWidth:'94vw',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)', fontFamily:"'JetBrains Mono',monospace" }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#e2e8f0' }}>Schema Templates</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>Select a starting point for your model</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569',
            cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {names.map(name => {
            const m = META[name];
            const isHov = hovered === name;
            return (
              <div key={name}
                onClick={()=>onApply(name)}
                onMouseEnter={()=>setHovered(name)}
                onMouseLeave={()=>setHovered(null)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
                  borderRadius:10, cursor:'pointer', transition:'all 0.15s',
                  background: isHov ? `${m.color}14` : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${isHov ? m.color+'44' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
                  background:`${m.color}1a`, border:`1px solid ${m.color}33`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {m.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: isHov ? m.color : '#cbd5e1',
                    marginBottom:2, transition:'color 0.15s' }}>{name}</div>
                  <div style={{ fontSize:10, color:'#475569', lineHeight:1.5 }}>{m.desc}</div>
                </div>
                <div style={{ color: isHov ? m.color : '#334155', fontSize:16, transition:'all 0.15s',
                  transform: isHov ? 'translateX(2px)' : 'none' }}>→</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ERDiagramCanvas Component ──────────────────────────────────────────
export default function ERDiagramCanvas() {
  // ── Initial State (lazy initialisers so uid() runs once) ───────────────────
  const [entities,  setEntities]  = useState(() => DEFAULT_ENTITIES.map(e => ({...e})));
  const [rels,      setRels]      = useState(() => buildDefaultRels(DEFAULT_ENTITIES));
  const [viewport,  setViewport]  = useState({ x: 0, y: 0, scale: 0.85 });
  const [tool,      setTool]      = useState('select');
  const [selectedId,  setSelectedId]  = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRel, setSelectedRel] = useState(null);
  const [rightTab,  setRightTab]  = useState('props');
  const [dialect,   setDialect]   = useState('PostgreSQL');
  const [statusMsg, setStatusMsg] = useState('');
  const [rightPanelW, setRightPanelW] = useState(
    () => parseInt(localStorage.getItem('er_rightPanelW') || String(RIGHT_PANEL_DEFAULT))
  );
  const [history,  setHistory]  = useState([]);
  const [future,   setFuture]   = useState([]);
  const [dragState,    setDragState]    = useState(null);
  const [alignGuides,  setAlignGuides]  = useState({ x:null, y:null });
  const [connectDrag,  setConnectDrag]  = useState(null);
  const [connectDialog,setConnectDlg]  = useState(null);
  const [hoveredRel,   setHoveredRel]  = useState(null);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [rubber,       setRubber]       = useState(null);
  const [clipboard,    setClipboard]    = useState([]);
  const [modelLayer, setModelLayer]       = useState('PDM');
  const [notation,   setNotation]         = useState('crowfoot');
  const [subjectAreas, setSubjectAreas]   = useState([]);
  const [showNotationLegend, setShowNotationLegend] = useState(false);

  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const canvasSize   = useRef({ w: 1200, h: 800 });

  // Keep latest refs to avoid stale closures in event listeners
  const entitiesRef  = useRef(entities);
  const relsRef      = useRef(rels);
  const viewportRef  = useRef(viewport);
  const dragStateRef = useRef(dragState);
  const connectDragRef = useRef(connectDrag);

  useEffect(() => { entitiesRef.current  = entities;  }, [entities]);
  useEffect(() => { relsRef.current      = rels;      }, [rels]);
  useEffect(() => { viewportRef.current  = viewport;  }, [viewport]);
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
  useEffect(() => { connectDragRef.current = connectDrag; }, [connectDrag]);

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries)
        canvasSize.current = { w: entry.contentRect.width, h: entry.contentRect.height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Non-passive wheel (using ref to avoid stale closure) ───────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const vp   = viewportRef.current;
      const rect = el.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1.12 : 0.9;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, vp.scale * delta));
      setViewport({
        x: mx - (mx - vp.x) * (newScale / vp.scale),
        y: my - (my - vp.y) * (newScale / vp.scale),
        scale: newScale,
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []); // only once — uses viewportRef for fresh value

  // ── Persist right panel width ───────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('er_rightPanelW', rightPanelW);
  }, [rightPanelW]);

  // ── History helpers (NO nested setState calls) ─────────────────────────────
  const pushHistory = useCallback((ents, rs) => {
    setHistory(h => [...h.slice(-HISTORY_LIMIT), { entities: ents, rels: rs }]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    const histSnap = history[history.length - 1];
    if (!histSnap) return;
    setFuture(f => [{ entities: entitiesRef.current, rels: relsRef.current }, ...f.slice(0, HISTORY_LIMIT)]);
    setHistory(h => h.slice(0, -1));
    setEntities(histSnap.entities);
    setRels(histSnap.rels);
  }, [history]);

  const redo = useCallback(() => {
    const futSnap = future[0];
    if (!futSnap) return;
    setHistory(h => [...h, { entities: entitiesRef.current, rels: relsRef.current }]);
    setFuture(f => f.slice(1));
    setEntities(futSnap.entities);
    setRels(futSnap.rels);
  }, [future]);

  // ── Mutation helpers (flat setState — no nesting) ──────────────────────────
  const mutateEntities = useCallback((fn) => {
    const cur = entitiesRef.current;
    const next = fn(cur);
    pushHistory(cur, relsRef.current);
    setEntities(next);
  }, [pushHistory]);

  const mutateRels = useCallback((fn) => {
    const cur = relsRef.current;
    const next = fn(cur);
    pushHistory(entitiesRef.current, cur);
    setRels(next);
  }, [pushHistory]);

  const showStatus = useCallback((msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const addEntity = useCallback((x, y) => {
    const ents  = entitiesRef.current;
    const name  = `Table_${ents.length + 1}`;
    const COLORS = ['#22d3ee','#a78bfa','#34d399','#f472b6','#fbbf24','#60a5fa','#f87171','#fb923c'];
    const color = COLORS[ents.length % COLORS.length];
    const e = { id: uid(), name, color, x: snap(x), y: snap(y),
      columns: [mkCol('id','INT',{pk:true,nn:true,identity:true})] };
    mutateEntities(prev => [...prev, e]);
    setSelectedId(e.id);
    setSelectedIds([e.id]);
    showStatus(`Added table "${name}"`);
    return e.id;
  }, [mutateEntities, showStatus]);

  const deleteEntity = useCallback((id) => {
    const ents = entitiesRef.current, rs = relsRef.current;
    pushHistory(ents, rs);
    setEntities(prev => prev.filter(e => e.id !== id));
    setRels(prev => prev.filter(r => r.fromId !== id && r.toId !== id));
    setSelectedId(s => s === id ? null : s);
    setSelectedIds(s => s.filter(x => x !== id));
    showStatus('Table deleted');
  }, [pushHistory, showStatus]);

  const updateEntity = useCallback((id, patch) => {
    mutateEntities(prev => prev.map(e => e.id === id ? {...e, ...patch} : e));
  }, [mutateEntities]);

  const addColumn = useCallback((entityId, name, type) => {
    mutateEntities(prev => prev.map(e => e.id !== entityId ? e : {
      ...e, columns: [...e.columns, mkCol(name, type)]
    }));
  }, [mutateEntities]);

  const deleteColumn = useCallback((entityId, colId) => {
    mutateEntities(prev => prev.map(e => e.id !== entityId ? e : {
      ...e, columns: e.columns.filter(c => c.id !== colId)
    }));
  }, [mutateEntities]);

  const updateColumn = useCallback((entityId, colId, patch) => {
    mutateEntities(prev => prev.map(e => e.id !== entityId ? e : {
      ...e, columns: e.columns.map(c => c.id !== colId ? c : {...c, ...patch})
    }));
  }, [mutateEntities]);

  const addRelationship = useCallback((fromId, toId, opts) => {
    const r = { id: uid(), fromId, toId, ...opts };
    mutateRels(prev => [...prev, r]);
    showStatus('Relationship created');
  }, [mutateRels, showStatus]);

  const deleteRelationship = useCallback((id) => {
    mutateRels(prev => prev.filter(r => r.id !== id));
    setSelectedRel(s => s === id ? null : s);
  }, [mutateRels]);

  const updateRelationship = useCallback((id, patch) => {
    mutateRels(prev => prev.map(r => r.id === id ? {...r, ...patch} : r));
  }, [mutateRels]);

  const addMMBridgeTable = useCallback((fromId, toId, opts) => {
    const fromEnt = entitiesRef.current.find(e => e.id === fromId);
    const toEnt   = entitiesRef.current.find(e => e.id === toId);
    if (!fromEnt || !toEnt) return;
    const bName = fromEnt.name + '_' + toEnt.name;
    const bridge = {
      id: uid(), name: bName, color: '#f59e0b',
      x: snap((fromEnt.x + toEnt.x) / 2 - ENTITY_W / 2),
      y: snap((fromEnt.y + toEnt.y) / 2 + 60),
      columns: [
        mkCol(fromEnt.name.toLowerCase() + '_id', 'INT', { pk:true, fk:true, nn:true }),
        mkCol(toEnt.name.toLowerCase()   + '_id', 'INT', { pk:true, fk:true, nn:true }),
      ],
    };
    const r1 = { id:uid(), fromId, toId:bridge.id,
      fromCard:'one', toCard:'many', label:'has', relType:'identifying' };
    const r2 = { id:uid(), fromId:toId, toId:bridge.id,
      fromCard:'one', toCard:'many', label:'has', relType:'identifying' };
    const curE = entitiesRef.current, curR = relsRef.current;
    pushHistory(curE, curR);
    setEntities(prev => [...prev, bridge]);
    setRels(prev => [...prev, r1, r2]);
    setSelectedId(bridge.id); setSelectedIds([bridge.id]);
    showStatus('Bridge table "' + bName + '" created');
  }, [pushHistory, showStatus]);


  // ── Auto-layout ─────────────────────────────────────────────────────────────
  const autoLayout = useCallback(() => {
    const ents = entitiesRef.current;
    const cols = Math.ceil(Math.sqrt(ents.length));
    const gapX = ENTITY_W + 80, gapY = 280;
    pushHistory(ents, relsRef.current);
    setEntities(prev => prev.map((e, i) => ({
      ...e, x: snap(60 + (i % cols) * gapX), y: snap(60 + Math.floor(i / cols) * gapY),
    })));
    showStatus('Auto-layout applied');
  }, [pushHistory, showStatus]);

  // ── Fit view ────────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    const ents = entitiesRef.current;
    if (!ents.length) return;
    const { w, h } = canvasSize.current;
    const allX = ents.map(e => e.x), allY = ents.map(e => e.y);
    const minX = Math.min(...allX) - 60, minY = Math.min(...allY) - 60;
    const maxX = Math.max(...allX) + ENTITY_W + 60;
    const maxY = Math.max(...allY) + 280;
    const newScale = Math.min((w / (maxX - minX)), (h / (maxY - minY)), 1.3);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setViewport({ x: w / 2 - cx * newScale, y: h / 2 - cy * newScale, scale: newScale });
  }, []);

  // ── Exports ──────────────────────────────────────────────────────────────────
  const exportSVG = useCallback(() => {
    const ents = entitiesRef.current;
    if (!ents.length || !svgRef.current) return;
    const allX = ents.map(e => e.x), allY = ents.map(e => e.y);
    const pad = 60;
    const minX = Math.min(...allX) - pad, minY = Math.min(...allY) - pad;
    const maxX = Math.max(...allX) + ENTITY_W + pad;
    const maxY = Math.max(...allY) + 320;
    const W = maxX - minX, H = maxY - minY;
    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute('viewBox', `${minX} ${minY} ${W} ${H}`);
    clone.setAttribute('width', W); clone.setAttribute('height', H);
    clone.style.background = '#060d1a';
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'er_diagram.svg'; a.click();
    showStatus('SVG exported');
  }, [showStatus]);

  const exportPNG = useCallback(() => {
    const ents = entitiesRef.current;
    if (!ents.length || !svgRef.current) return;
    const allX = ents.map(e => e.x), allY = ents.map(e => e.y);
    const pad = 60;
    const minX = Math.min(...allX) - pad, minY = Math.min(...allY) - pad;
    const W = Math.max(...allX) + ENTITY_W + pad - minX;
    const H = Math.max(...allY) + 320 - minY;
    const scale = 2; // retina
    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute('viewBox', `${minX} ${minY} ${W} ${H}`);
    clone.setAttribute('width', W * scale); clone.setAttribute('height', H * scale);
    const svgStr = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W * scale; canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#060d1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'er_diagram.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    showStatus('PNG exported');
  }, [showStatus]);

  const exportJSON = useCallback(() => {
    const data = { version:'3.0', dialect, modelLayer, notation,
      entities: entitiesRef.current, rels: relsRef.current,
      exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'er_schema.json'; a.click();
    showStatus('JSON exported');
  }, [showStatus, dialect, modelLayer, notation]);

  // ── Copy / Paste ─────────────────────────────────────────────────────────────
  const copySelected = useCallback(() => {
    const toCopy = entitiesRef.current.filter(e => selectedIds.includes(e.id));
    setClipboard(toCopy);
    showStatus(`Copied ${toCopy.length} table(s)`);
  }, [selectedIds, showStatus]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard.length) return;
    const idMap = {};
    const pasted = clipboard.map(e => {
      const newId = uid(); idMap[e.id] = newId;
      return { ...e, id: newId, x: e.x + 40, y: e.y + 40, columns: e.columns.map(c => ({ ...c, id: uid() })) };
    });
    pushHistory(entitiesRef.current, relsRef.current);
    setEntities(prev => [...prev, ...pasted]);
    setSelectedIds(pasted.map(e => e.id));
    setSelectedId(pasted[pasted.length - 1].id);
    showStatus(`Pasted ${pasted.length} table(s)`);
  }, [clipboard, pushHistory, showStatus]);

  // ── SVG coordinate helper ───────────────────────────────────────────────────
  const svgPoint = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const vp = viewportRef.current;
    return {
      x: (clientX - rect.left  - vp.x) / vp.scale,
      y: (clientY - rect.top   - vp.y) / vp.scale,
    };
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey) { setTool('select'); return; }
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) { setTool('add');    return; }
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey) { setTool('connect');return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelected(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selIds = selectedIds;
        const selRel = selectedRel;
        if (selIds.length) { selIds.forEach(id => deleteEntity(id)); return; }
        if (selRel) { deleteRelationship(selRel); return; }
      }
      if (e.key === 'Escape') {
        setSelectedId(null); setSelectedIds([]); setSelectedRel(null);
        setConnectDrag(null); setContextMenu(null); setConnectDlg(null);
      }
      if (e.key === 'f' || e.key === 'F') fitView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, copySelected, pasteClipboard, selectedIds, selectedRel, deleteEntity, deleteRelationship, fitView]);

  // ── Canvas mouse down ───────────────────────────────────────────────────────
  const onCanvasMouseDown = useCallback((e) => {
    if (e.button === 2) return;
    setContextMenu(null);
    const pt = svgPoint(e.clientX, e.clientY);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setDragState({ type: 'pan', startX: e.clientX, startY: e.clientY, vpX: viewportRef.current.x, vpY: viewportRef.current.y });
      return;
    }
    if (tool === 'add') { addEntity(pt.x - ENTITY_W / 2, pt.y - HEADER_H / 2); return; }
    if (tool === 'select') {
      setSelectedId(null); setSelectedIds([]); setSelectedRel(null);
      setRubber({ startX: pt.x, startY: pt.y, x: pt.x, y: pt.y, w: 0, h: 0 });
      setDragState({ type: 'rubber', startPtX: pt.x, startPtY: pt.y });
    }
  }, [tool, svgPoint, addEntity]);

  // ── Entity mouse down ───────────────────────────────────────────────────────
  const onEntityMouseDown = useCallback((e, entityId) => {
    e.stopPropagation();
    if (e.button === 2) return;
    setContextMenu(null);
    const ents = entitiesRef.current;
    const entity = ents.find(en => en.id === entityId);
    if (!entity) return;
    const pt = svgPoint(e.clientX, e.clientY);

    if (tool === 'delete') { deleteEntity(entityId); return; }
    if (tool === 'connect') return;

    const newIds = e.shiftKey
      ? (selectedIds.includes(entityId) ? selectedIds.filter(id => id !== entityId) : [...selectedIds, entityId])
      : (selectedIds.includes(entityId) ? selectedIds : [entityId]);

    if (!e.shiftKey) { setSelectedId(entityId); setSelectedIds([entityId]); }
    else setSelectedIds(newIds);
    setSelectedRel(null);

    const draggingIds = newIds.length ? newIds : [entityId];
    setDragState({
      type: 'entity', ids: draggingIds, draggingIds,
      startPtX: pt.x, startPtY: pt.y,
      startPositions: draggingIds.map(id => {
        const en = ents.find(en2 => en2.id === id);
        return en ? { id, x: en.x, y: en.y } : { id, x: 0, y: 0 };
      }),
      moved: false,
    });
  }, [tool, selectedIds, svgPoint, deleteEntity]);

  // ── Connect handle ──────────────────────────────────────────────────────────
  const onConnectStart = useCallback((e, entityId) => {
    e.stopPropagation();
    e.preventDefault();
    const ent = entitiesRef.current.find(en => en.id === entityId);
    if (!ent) return;
    setConnectDrag({ fromId: entityId, x1: ent.x + ENTITY_W, y1: ent.y + HEADER_H / 2, x2: ent.x + ENTITY_W, y2: ent.y + HEADER_H / 2 });
    setDragState({ type: 'connect', fromId: entityId });
  }, []);

  // ── Mouse move ───────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    const ds = dragStateRef.current;
    if (!ds) return;
    const pt = svgPoint(e.clientX, e.clientY);

    if (ds.type === 'pan') {
      const dx = e.clientX - ds.startX, dy = e.clientY - ds.startY;
      setViewport(vp => ({ ...vp, x: ds.vpX + dx, y: ds.vpY + dy }));
      return;
    }
    if (ds.type === 'entity') {
      const dx = pt.x - ds.startPtX, dy = pt.y - ds.startPtY;
      const others = entitiesRef.current.filter(en => !ds.draggingIds?.includes(en.id));
      const GUIDE_THRESH = 6 / viewportRef.current.scale;
      let gx = null, gy = null;
      setEntities(prev => prev.map(en => {
        const start = ds.startPositions.find(sp => sp.id === en.id);
        if (!start) return en;
        const nx = snap(start.x + dx), ny = snap(start.y + dy);
        // Compute alignment guides from the primary dragged entity only
        if (start.id === ds.draggingIds?.[0]) {
          for (const o of others) {
            if (gx === null && Math.abs(nx - o.x) < GUIDE_THRESH) gx = o.x;
            else if (gx === null && Math.abs(nx + ENTITY_W - (o.x + ENTITY_W)) < GUIDE_THRESH) gx = o.x;
            if (gy === null && Math.abs(ny - o.y) < GUIDE_THRESH) gy = o.y;
          }
        }
        return { ...en, x: nx, y: ny };
      }));
      setAlignGuides({ x: gx, y: gy });
      setDragState(d => d ? { ...d, moved: true } : d);
      return;
    }
    if (ds.type === 'rubber') {
      const x = Math.min(pt.x, ds.startPtX), y = Math.min(pt.y, ds.startPtY);
      const w = Math.abs(pt.x - ds.startPtX), h = Math.abs(pt.y - ds.startPtY);
      setRubber({ startX: ds.startPtX, startY: ds.startPtY, x, y, w, h });
      const inBox = entitiesRef.current.filter(en =>
        en.x < x + w && en.x + ENTITY_W > x && en.y < y + h && en.y + entityH(en) > y
      ).map(en => en.id);
      setSelectedIds(inBox);
      return;
    }
    if (ds.type === 'connect') {
      setConnectDrag(cd => cd ? { ...cd, x2: pt.x, y2: pt.y } : null);
    }
  }, [svgPoint]);

  // ── Mouse up ─────────────────────────────────────────────────────────────────
  const onMouseUp = useCallback((e) => {
    const ds = dragStateRef.current;
    if (!ds) return;

    setAlignGuides({ x: null, y: null });
    if (ds.type === 'entity' && ds.moved) {
      // snapshot the post-drag positions into history
      pushHistory(ds.startPositions.map(sp => {
        const en = entitiesRef.current.find(x => x.id === sp.id);
        return en || sp;
      }), relsRef.current);
    }
    if (ds.type === 'rubber') {
      setRubber(null);
      const cur = entitiesRef.current.filter(en => selectedIds.includes(en.id));
      if (cur.length === 1) setSelectedId(cur[0].id);
    }
    if (ds.type === 'connect') {
      const cd = connectDragRef.current;
      if (cd) {
        const pt = svgPoint(e.clientX, e.clientY);
        const target = entitiesRef.current.find(en =>
          pt.x >= en.x && pt.x <= en.x + ENTITY_W &&
          pt.y >= en.y && pt.y <= en.y + entityH(en) &&
          en.id !== cd.fromId
        );
        if (target) setConnectDlg({ fromId: cd.fromId, toId: target.id });
        setConnectDrag(null);
      }
    }
    setDragState(null);
  }, [pushHistory, selectedIds, svgPoint]);

  // ── Right-click context menus ────────────────────────────────────────────────
  const onEntityContextMenu = useCallback((e, entityId) => {
    e.preventDefault(); e.stopPropagation();
    const entity = entitiesRef.current.find(en => en.id === entityId);
    if (!entity) return;
    setContextMenu({ x: e.clientX, y: e.clientY, items: [
      { icon: '✏️', label: 'Edit Properties', action: () => { setSelectedId(entityId); setSelectedIds([entityId]); setRightTab('props'); }},
      { icon: '📋', label: 'Duplicate', action: () => {
        const clone = { ...entity, id: uid(), x: entity.x + 40, y: entity.y + 40, columns: entity.columns.map(c => ({ ...c, id: uid() })) };
        pushHistory(entitiesRef.current, relsRef.current);
        setEntities(prev => [...prev, clone]);
        showStatus(`Duplicated "${entity.name}"`);
      }},
      { icon: '📌', label: 'Copy', action: () => { setClipboard([entity]); showStatus('Copied'); }},
      'separator',
      { icon: '↗',  label: 'Connect From Here', action: () => setTool('connect') },
      { icon: '🔎', label: 'View SQL',           action: () => { setSelectedId(entityId); setSelectedIds([entityId]); setRightTab('sql'); }},
      'separator',
      { icon: '🗑',  label: 'Delete Table', danger: true, action: () => deleteEntity(entityId) },
    ]});
  }, [pushHistory, deleteEntity, showStatus]);

  const onRelContextMenu = useCallback((e, relId) => {
    e.preventDefault(); e.stopPropagation();
    const rel     = relsRef.current.find(r => r.id === relId);
    if (!rel) return;
    const fromEnt = entitiesRef.current.find(en => en.id === rel.fromId);
    const toEnt   = entitiesRef.current.find(en => en.id === rel.toId);
    setContextMenu({ x: e.clientX, y: e.clientY, items: [
      { icon:'✏️', label:'Edit Relationship', action:() => {
        setSelectedRel(relId); setSelectedId(null); setSelectedIds([]); setRightTab('props');
      }},
      { icon:'↔',  label:'Swap Direction', action:() => {
        mutateRels(prev => prev.map(r => r.id!==relId ? r : {
          ...r, fromId:r.toId, toId:r.fromId, fromCard:r.toCard, toCard:r.fromCard,
        }));
      }},
      { icon:'🏷',  label:'Edit Label…', action:() => {
        const newLbl = prompt('Relationship label:', rel.label||'');
        if (newLbl !== null) mutateRels(prev => prev.map(r => r.id===relId ? {...r,label:newLbl} : r));
      }},
      'separator',
      { icon:'🗑',  label:'Delete Relationship', danger:true, action:() => deleteRelationship(relId) },
    ]});
  }, [mutateRels, deleteRelationship]);

  const onCanvasContextMenu = useCallback((e) => {
    e.preventDefault();
    if (tool !== 'select') return;
    const pt = svgPoint(e.clientX, e.clientY);
    setContextMenu({ x: e.clientX, y: e.clientY, items: [
      { icon: '◻+', label: 'Add Table Here',  action: () => addEntity(pt.x - ENTITY_W / 2, pt.y - HEADER_H / 2) },
      { icon: '📋', label: 'Paste',            action: pasteClipboard },
      'separator',
      { icon: '⊡',  label: 'Fit All',          action: fitView },
      { icon: '⬛', label: 'Auto-Layout',      action: autoLayout },
      { icon: '✓',  label: 'Validate Model',   action: () => setRightTab('validation') },
    ]});
  }, [tool, svgPoint, addEntity, pasteClipboard, fitView, autoLayout]);

  // ── Right panel resize ───────────────────────────────────────────────────────
  const onResizeHandleDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX, startW = rightPanelW;
    const onMove = (ev) => setRightPanelW(Math.max(220, Math.min(560, startW + startX - ev.clientX)));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [rightPanelW]);


  // ── Derived state ────────────────────────────────────────────────────────────
  const selectedEntity = entities.find(e => e.id === selectedId) || null;

  const RIGHT_TABS = [
    { id: 'props',      label: 'Props',    icon: '⚙' },
    { id: 'sql',        label: 'SQL',      icon: '{}' },
    { id: 'ai',         label: 'AI',       icon: '✨' },
    { id: 'validation', label: 'Validate', icon: '✓'  },
  ];

  const tabStyle = (active) => ({
    flex: 1, padding: '7px 4px', border: 'none',
    borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent',
    background: 'none', color: active ? '#22d3ee' : '#475569', cursor: 'pointer',
    fontSize: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
    letterSpacing: '0.06em', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', background: '#060d1a' }}>

      {/* ── Top Toolbar ── */}
      <TopToolbar
        tool={tool} setTool={setTool}
        onNew={() => { if (window.confirm('Reset diagram? This cannot be undone.')) { pushHistory(entities, rels); setEntities([]); setRels([]); setSelectedId(null); setSelectedIds([]); }}}
        onTemplate={() => setShowTemplate(true)}
        onUndo={undo}   canUndo={history.length > 0}
        onRedo={redo}   canRedo={future.length > 0}
        onFitView={fitView}
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onExportJSON={exportJSON}
        zoom={viewport.scale}
        dialect={dialect} setDialect={setDialect}
        onValidate={() => setRightTab('validation')}
        onAutoLayout={autoLayout}
        modelLayer={modelLayer} setModelLayer={setModelLayer}
        notation={notation} setNotation={setNotation}
        showNotationLegend={showNotationLegend} setShowNotationLegend={setShowNotationLegend}
      />

      {/* ── Main Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left Toolbar */}
        <LeftToolbar tool={tool} setTool={setTool} />

        {/* ── Canvas ── */}
        <div
          ref={containerRef}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onContextMenu={onCanvasContextMenu}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0,
            cursor: tool === 'add' || tool === 'connect' ? 'crosshair'
                  : dragState?.type === 'pan' ? 'grabbing' : 'default',
            userSelect: 'none',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(15,28,60,0.9) 0%, #060d1a 100%)',
          }}
        >
          {/* SVG layer */}
          <svg ref={svgRef} width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <GridBackground vpX={viewport.x} vpY={viewport.y} scale={viewport.scale} />
            <rect width="100%" height="100%" fill="url(#grid-major)" />

            <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.scale})`}>
              {/* Subject Areas */}
              <SubjectAreaLayer areas={subjectAreas} selectedArea={null} onSelect={()=>{}} onDragArea={()=>{}} />

              {/* Relationships */}
              <RelationshipLayer
                entities={entities} rels={rels}
                selectedRel={selectedRel}
                onSelectRel={(id) => { setSelectedRel(id); setSelectedId(null); setSelectedIds([]); }}
                hoveredRel={hoveredRel}
                onHoverRel={setHoveredRel}
                onRelContextMenu={onRelContextMenu}
              />

              {/* Entities */}
              {entities.map(entity => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedId === entity.id}
                  isMultiSelected={selectedIds.includes(entity.id) && selectedId !== entity.id}
                  onMouseDown={(e) => onEntityMouseDown(e, entity.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelectedId(entity.id); setSelectedIds([entity.id]); setRightTab('props'); }}
                  onConnectStart={(e) => onConnectStart(e, entity.id)}
                  onContextMenu={(e) => onEntityContextMenu(e, entity.id)}
                  modelLayer={modelLayer}
                />
              ))}

              {/* Live connect-drag preview */}
              {connectDrag && (
                <g style={{ pointerEvents: 'none' }}>
                  <line
                    x1={connectDrag.x1} y1={connectDrag.y1}
                    x2={connectDrag.x2} y2={connectDrag.y2}
                    stroke="#22d3ee" strokeWidth={2}
                    strokeDasharray="6 3" opacity={0.85}
                  />
                  <circle cx={connectDrag.x2} cy={connectDrag.y2} r={5} fill="#22d3ee" opacity={0.7} />
                </g>
              )}

              {/* Rubber-band selection box */}
              {rubber && rubber.w > 4 && rubber.h > 4 && (
                <rect
                  x={rubber.x} y={rubber.y} width={rubber.w} height={rubber.h}
                  fill="rgba(34,211,238,0.05)" stroke="#22d3ee"
                  strokeWidth={1} strokeDasharray="4 2"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Alignment guides */}
              {alignGuides.x !== null && (
                <line x1={alignGuides.x} y1={-5000} x2={alignGuides.x} y2={5000}
                  stroke="#22d3ee" strokeWidth={0.6} strokeDasharray="4 3" opacity={0.45}
                  style={{pointerEvents:'none'}}/>
              )}
              {alignGuides.y !== null && (
                <line x1={-5000} y1={alignGuides.y} x2={5000} y2={alignGuides.y}
                  stroke="#22d3ee" strokeWidth={0.6} strokeDasharray="4 3" opacity={0.45}
                  style={{pointerEvents:'none'}}/>
              )}
            </g>
          </svg>

          {/* Model Layer Badge */}
          <ModelLayerBadge layer={modelLayer} notation={notation} />
          {/* Notation Legend */}
          {showNotationLegend && <NotationLegend notation={notation} layer={modelLayer} />}

          {/* MiniMap */}
          <MiniMap entities={entities} viewport={viewport} canvasW={canvasSize.current.w} canvasH={canvasSize.current.h} />

          {/* Zoom buttons */}
          <div style={{ position: 'absolute', bottom: 44, left: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { label: '+',    title: 'Zoom in',    fn: () => setViewport(vp => ({ ...vp, scale: Math.min(MAX_ZOOM, vp.scale * 1.2) })) },
              { label: '−',    title: 'Zoom out',   fn: () => setViewport(vp => ({ ...vp, scale: Math.max(MIN_ZOOM, vp.scale / 1.2) })) },
              { label: '⊡',   title: 'Fit all (F)', fn: fitView },
              { label: '1:1',  title: 'Reset zoom',  fn: () => setViewport(vp => ({ ...vp, scale: 1 })) },
            ].map(btn => (
              <button key={btn.label} title={btn.title} onClick={btn.fn}
                style={{
                  width: 30, height: 30, borderRadius: 6, fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(6,13,26,0.92)', color: '#64748b',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono',monospace", backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Tool hint overlay */}
          {tool !== 'select' && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(6,13,26,0.88)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '4px 12px', fontSize: 10, color: '#94a3b8',
              fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}>
              {tool === 'add'     && '◻+ Click canvas to add table · ESC to cancel'}
              {tool === 'connect' && '↗ Drag from cyan ● handle to target table · ESC to cancel'}
              {tool === 'delete'  && '🗑 Click a table to delete it · ESC to cancel'}
            </div>
          )}
        </div>

        {/* ── Resize handle ── */}
        <div
          onMouseDown={onResizeHandleDown}
          style={{ width: 4, flexShrink: 0, background: 'rgba(255,255,255,0.04)', cursor: 'col-resize', zIndex: 20, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.35)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        />

        {/* ── Right Panel ── */}
        <div style={{ width: rightPanelW, flexShrink: 0, background: 'rgba(6,13,26,0.97)', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,8,18,0.9)', flexShrink: 0 }}>
            {RIGHT_TABS.map(tab => (
              <button key={tab.id} onClick={() => setRightTab(tab.id)} style={tabStyle(rightTab === tab.id)}
                onMouseEnter={e => { if (rightTab !== tab.id) e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={e => { if (rightTab !== tab.id) e.currentTarget.style.color = '#475569'; }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {rightTab === 'props' && selectedRel ? (
              <RelationshipPanel
                rel={rels.find(r => r.id === selectedRel)}
                entities={entities}
                onUpdate={(patch) => updateRelationship(selectedRel, patch)}
                onDelete={() => { deleteRelationship(selectedRel); }}
              />
            ) : rightTab === 'props' ? (
              <PropertiesPanel
                entity={selectedEntity}
                rels={rels} entities={entities}
                onUpdate={(patch) => selectedEntity && updateEntity(selectedEntity.id, patch)}
                onAddCol={(name, type) => selectedEntity && addColumn(selectedEntity.id, name, type)}
                onDelCol={(colId) => selectedEntity && deleteColumn(selectedEntity.id, colId)}
                onUpdateCol={(colId, patch) => selectedEntity && updateColumn(selectedEntity.id, colId, patch)}
                onDeleteEntity={() => selectedEntity && deleteEntity(selectedEntity.id)}
                onAddRel={addRelationship}
                onDeleteRel={deleteRelationship}
                dialect={dialect} setDialect={setDialect}
              />
            ) : null}
            {rightTab === 'sql'        && <SQLPanel        entities={entities} rels={rels} dialect={dialect} setDialect={setDialect} />}
            {rightTab === 'ai'         && <AIPanel         entities={entities} onApplySuggestion={() => {}} />}
            {rightTab === 'validation' && <ValidationPanel entities={entities} rels={rels} />}
          </div>
        </div>

      </div>{/* end main body */}

      {/* ── Status Bar ── */}
      <StatusBar zoom={viewport.scale} entities={entities} rels={rels} selectedIds={selectedIds} tool={tool} message={statusMsg} modelLayer={modelLayer} notation={notation} />

      {/* ── Modals ── */}
      {showTemplate && (
        <TemplatePicker
          onApply={(name) => {
            const { entities: ents, rels: rs } = TEMPLATES[name]();
            pushHistory(entities, rels);
            setEntities(ents); setRels(rs);
            setSelectedId(null); setSelectedIds([]);
            setShowTemplate(false);
            setTimeout(fitView, 150);
            showStatus(`Loaded: ${name}`);
          }}
          onClose={() => setShowTemplate(false)}
        />
      )}
      {connectDialog && (
        <ConnectDialog
          from={connectDialog.fromId} to={connectDialog.toId} entities={entities}
          onConfirm={(opts) => { addRelationship(connectDialog.fromId, connectDialog.toId, opts); setConnectDlg(null); }}
          onConfirmBridge={(opts) => { addMMBridgeTable(connectDialog.fromId, connectDialog.toId, opts); setConnectDlg(null); }}
          onClose={() => setConnectDlg(null)}
        />
      )}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
}
