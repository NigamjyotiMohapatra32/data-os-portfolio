import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg   = this.state.error?.message || 'Unknown error';
      const stack = this.state.error?.stack   || '';
      return (
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', background:'#06080f',
          color:'#e2e8f0', fontFamily:"'JetBrains Mono', monospace",
          padding:'2rem', textAlign:'center', gap:'1.5rem' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize:'14px', color:'#f472b6' }}>RUNTIME_ERROR</div>
          <div style={{ fontSize:'13px', color:'#fca5a5', maxWidth:'700px', textAlign:'left',
            background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.3)',
            borderRadius:'8px', padding:'12px 16px', lineHeight:1.6 }}>
            {msg}
          </div>
          {stack ? (
            <pre style={{ fontSize:'10px', color:'#475569', maxWidth:'700px', textAlign:'left',
              background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'8px', padding:'12px', overflow:'auto', maxHeight:'240px',
              lineHeight:1.6, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
              {stack.split('\n').slice(0,12).join('\n')}
            </pre>
          ) : null}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding:'0.6rem 1.2rem', borderRadius:'8px',
              border:'1px solid rgba(34,211,238,0.4)', background:'rgba(34,211,238,0.08)',
              color:'#22d3ee', cursor:'pointer', fontSize:'12px',
              fontFamily:"'JetBrains Mono', monospace" }}>
            ↺ Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
