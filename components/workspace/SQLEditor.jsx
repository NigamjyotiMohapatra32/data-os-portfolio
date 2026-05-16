import React, { useState } from 'react';

const sqlTemplates = [
  {
    name: 'SELECT Profile',
    code: `SELECT name, role, location, experience_years
FROM portfolio.engineer
WHERE status = 'active';`,
  },
  {
    name: 'Count Skills',
    code: `SELECT category, COUNT(*) as skill_count
FROM portfolio.skills
GROUP BY category
ORDER BY skill_count DESC;`,
  },
  {
    name: 'Project Performance',
    code: `SELECT
  org,
  project_name,
  perf_improvement_pct,
  created_date
FROM portfolio.projects
ORDER BY perf_improvement_pct DESC;`,
  },
];

export default function SQLEditor({ onQueryRun }) {
  const [code, setCode] = useState(sqlTemplates[0].code);
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [execTime, setExecTime] = useState(0);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleExecute = () => {
    setExecuting(true);
    setResult(null);
    const start = performance.now();

    setTimeout(() => {
      if (!mountedRef.current) return;
      const end = performance.now();
      setExecTime(Math.round(end - start));
      setResult({
        rows: [
          ['Nigamjyoti Mohapatra', 'Data Modeler', 'Bengaluru', '4.5'],
        ],
        cols: ['name', 'role', 'location', 'experience_years'],
      });
      setExecuting(false);
      onQueryRun?.();
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Template picker */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(10, 16, 32, 0.8)',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        fontSize: '11px'
      }}>
        {sqlTemplates.map((tpl, i) => (
          <button
            key={i}
            onClick={() => setCode(tpl.code)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              background: code === tpl.code ? 'rgba(34, 211, 238, 0.2)' : 'transparent',
              color: code === tpl.code ? '#22d3ee' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.2s'
            }}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          background: '#050913',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'auto',
          padding: '1rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          color: '#e2e8f0',
          lineHeight: '1.6'
        }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Controls */}
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 16, 32, 0.8)',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={handleExecute}
            disabled={executing}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              background: 'rgba(52, 211, 153, 0.1)',
              color: '#34d399',
              cursor: executing ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.2s',
              opacity: executing ? 0.6 : 1
            }}
          >
            {executing ? 'Executing...' : '▶ Run Query'}
          </button>
          {execTime > 0 && (
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 'auto',
              alignSelf: 'center'
            }}>
              Executed in {execTime}ms
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#34d399',
              marginBottom: '0.75rem',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              ✓ {result.rows.length} row{result.rows.length !== 1 ? 's' : ''} returned
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {result.cols.map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '0.5rem',
                        textAlign: 'left',
                        color: '#22d3ee',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: '600'
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          padding: '0.5rem',
                          color: '#e2e8f0'
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!result && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            Click "Run Query" to execute
          </div>
        )}
      </div>
    </div>
  );
}
