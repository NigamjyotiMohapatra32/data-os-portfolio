import React from 'react';

export default function SQLPlayground() {
  return (
    <section id="sql" className="relative py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
            <span className="text-cyan-300">[05]</span>
            <span>SQL_PLAYGROUND</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl mt-2">SQL Playground</h2>
        </header>
        <div className="glass rounded-2xl p-6">
          <div className="font-mono text-sm text-slate-400 mb-4">
            SELECT * FROM portfolio WHERE passion = &apos;data_modeling&apos;;
          </div>
          <div className="text-slate-300">
            <p>Interactive SQL queries against my portfolio data. Click &quot;Launch Data OS&quot; to access the full SQL editor with real execution capabilities.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
