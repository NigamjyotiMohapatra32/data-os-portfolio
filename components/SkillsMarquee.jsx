import React from 'react';

/**
 * SkillsMarquee — signature full-width ticker.
 *
 * An infinite, seamless band of tools/skills scrolling between the hero
 * and the first content section — the "stock ticker" of the data stack.
 * Pure CSS animation (transform only), pauses on hover, renders as a
 * static row under prefers-reduced-motion.
 */
const ITEMS = [
  ['ERwin', '#22d3ee'], ['ER/Studio', '#a78bfa'], ['T-SQL', '#34d399'],
  ['Star Schema', '#fbbf24'], ['Snowflake Schema', '#22d3ee'], ['Kimball', '#f472b6'],
  ['SCD 1/2/3', '#a78bfa'], ['SQL Server', '#34d399'], ['Power BI', '#fbbf24'],
  ['Azure Synapse', '#22d3ee'], ['Data Vault', '#f472b6'], ['Conformed Dims', '#a78bfa'],
  ['OLAP Cubes', '#34d399'], ['Data Dictionary', '#22d3ee'], ['Source-to-Target', '#fbbf24'],
];

function Row() {
  return (
    <>
      {ITEMS.map(([label, color], i) => (
        <span key={i} className="marquee-item" style={{ '--mc': color }}>
          <span className="marquee-dot" />
          {label}
        </span>
      ))}
    </>
  );
}

export default function SkillsMarquee() {
  return (
    <div className="marquee-band" aria-label="Tools and specialisations">
      <div className="marquee-track">
        <Row />
        <Row aria-hidden="true" />
      </div>
    </div>
  );
}
