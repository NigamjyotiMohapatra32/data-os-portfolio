import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WelcomeSequence from './WelcomeSequence';
import AuthCheckScreen from './AuthCheckScreen';

/* ─── Particle canvas ───────────────────────────────────── */
function LoginCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let W, H, pts, rafId;
    const N = 70;

    function resize() {
      W = canvas.width  = window.innerWidth  * dpr;
      H = canvas.height = window.innerHeight * dpr;
    }
    function init() {
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: Math.random() * 1.5 + 0.5,
        hue: Math.random() > 0.6 ? 200 : 270, // cyan or violet
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const maxD = 130 * dpr, maxD2 = maxD * maxD;
      for (let i = 0; i < N; i++) {
        const a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        for (let j = i + 1; j < N; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
          if (d2 < maxD2) {
            const op = (1 - Math.sqrt(d2) / maxD) * 0.2;
            ctx.strokeStyle = `hsla(${a.hue},90%,65%,${op})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `hsla(${a.hue},90%,65%,0.6)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r * dpr, 0, Math.PI * 2); ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} aria-hidden />;
}

/* ─── Typing effect ─────────────────────────────────────── */
function useTyping(text, speed = 45) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return out;
}

/* ─── Scan line ─────────────────────────────────────────── */
function ScanLine() {
  return (
    <div style={{
      position:'absolute', inset:0, overflow:'hidden', borderRadius:'inherit',
      pointerEvents:'none', zIndex:30
    }}>
      <div style={{
        position:'absolute', left:0, right:0, height:'2px',
        background:'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
        animation:'scanline 3s linear infinite', top:0,
      }} />
      <style>{`
        @keyframes scanline {
          0%   { top: 0%;   opacity:0.8; }
          50%  { opacity: 1; }
          100% { top: 100%; opacity:0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Hex clock ─────────────────────────────────────────── */
function HexClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hex = now.getTime().toString(16).toUpperCase().slice(-8);
      setTime(`0x${hex}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#22d3ee', fontSize:'11px' }}>{time}</span>;
}

/* ─── Input field ───────────────────────────────────────── */
function CyberInput({ id, label, type, value, onChange, icon, disabled, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label htmlFor={id} style={{
        display:'block', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px',
        color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'6px',
      }}>
        {icon} &nbsp;{label}
      </label>
      <div style={{ position:'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={64}
          style={{
            width:'100%', boxSizing:'border-box',
            padding:'12px 14px',
            background: focused ? 'rgba(34,211,238,0.05)' : 'rgba(255,255,255,0.03)',
            border:`1px solid ${focused ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:'8px',
            color:'#e2e8f0',
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:'13px',
            outline:'none',
            transition:'border-color 0.25s, background 0.25s, box-shadow 0.25s',
            boxShadow: focused ? '0 0 20px rgba(34,211,238,0.15)' : 'none',
          }}
        />
        {/* Corner accents when focused */}
        {focused && <>
          <span style={{ position:'absolute', top:-1, left:-1, width:8, height:8,
            borderTop:'2px solid #22d3ee', borderLeft:'2px solid #22d3ee' }} />
          <span style={{ position:'absolute', top:-1, right:-1, width:8, height:8,
            borderTop:'2px solid #22d3ee', borderRight:'2px solid #22d3ee' }} />
          <span style={{ position:'absolute', bottom:-1, left:-1, width:8, height:8,
            borderBottom:'2px solid #22d3ee', borderLeft:'2px solid #22d3ee' }} />
          <span style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8,
            borderBottom:'2px solid #22d3ee', borderRight:'2px solid #22d3ee' }} />
        </>}
      </div>
    </div>
  );
}

/* ─── Main LoginPage ────────────────────────────────────── */
export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname ?? '/workspace';

  const [userId,   setUserId]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  // Pre-populate error with any session-expired message passed from ProtectedRoute
  const [error,    setError]    = useState(location.state?.authMessage || '');
  const [shake,    setShake]    = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authedUser, setAuthedUser]   = useState('');
  const [mounted,  setMounted]  = useState(false);

  const subtitle = useTyping('IDENTITY VERIFICATION REQUIRED', 40);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(from, { replace: true });
  }, [authLoading, isAuthenticated, navigate, from]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 620);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('NODE_ID and PASSKEY are required.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');

    // Small delay to show the "verifying..." state
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(userId, password);

    if (!result.ok) {
      setLoading(false);
      setError(result.error ?? 'Authentication failed.');
      triggerShake();
      return;
    }

    setLoading(false);
    setAuthedUser(userId);
    setShowWelcome(true);
  }, [userId, password, login, triggerShake]);

  const handleWelcomeDone = () => {
    navigate(from, { replace: true });
  };

  if (authLoading) {
    return <AuthCheckScreen message="Checking session…" />;
  }

  if (showWelcome) {
    return <WelcomeSequence user={authedUser} onDone={handleWelcomeDone} />;
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9000,
      background:'radial-gradient(ellipse at 20% 50%, #0d1a2e 0%, #06080f 60%, #0a0214 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Inter',sans-serif",
      overflow:'hidden',
    }}>
      {/* Animated particle background */}
      <LoginCanvas />

      {/* Grid overlay */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
        backgroundImage:`
          linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)`,
        backgroundSize:'48px 48px',
      }} />

      {/* Ambient glow orbs */}
      <div style={{
        position:'absolute', top:'15%', left:'10%', zIndex:1,
        width:400, height:400, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
        animation:'orbFloat 6s ease-in-out infinite',
      }} />
      <div style={{
        position:'absolute', bottom:'10%', right:'8%', zIndex:1,
        width:350, height:350, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)',
        animation:'orbFloat 8s ease-in-out infinite reverse',
      }} />

      {/* ── Login card ──────────────────────────────── */}
      <div
        role="main"
        style={{
          position:'relative', zIndex:10,
          width: '100%', maxWidth:'440px',
          margin:'1rem',
          transform: shake
            ? 'translateX(0)'
            : mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          opacity: mounted ? 1 : 0,
          transition: shake ? 'none' : 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1), opacity 0.6s ease',
          animation: shake ? 'cardShake 0.55s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
        }}
      >
        {/* Glowing border wrapper */}
        <div style={{
          position:'absolute', inset:-1, borderRadius:'20px', zIndex:-1,
          background:'linear-gradient(135deg, rgba(34,211,238,0.35), rgba(167,139,250,0.2), rgba(244,114,182,0.15))',
          filter:'blur(1px)',
        }} />

        {/* Card body */}
        <div style={{
          background:'linear-gradient(180deg, rgba(12,19,34,0.97) 0%, rgba(8,12,22,0.97) 100%)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:'18px',
          overflow:'hidden',
          boxShadow:'0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <ScanLine />

          {/* ── Card header ── */}
          <div style={{
            padding:'24px 28px 20px',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
            background:'rgba(10,16,30,0.6)',
          }}>
            {/* Window dots */}
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {['#ef4444','#f59e0b','#10b981'].map((c,i) => (
                <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c, opacity:0.85 }} />
              ))}
              <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace",
                             fontSize:'10px', color:'#64748b' }}>
                data-os / auth
              </span>
            </div>

            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.1))',
                border:'1px solid rgba(34,211,238,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                boxShadow:'0 0 20px rgba(34,211,238,0.25)',
                animation:'logoPulse 3s ease-in-out infinite',
              }}>
                ◈
              </div>
              <div>
                <div style={{
                  fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18,
                  background:'linear-gradient(135deg, #22d3ee, #a78bfa)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  letterSpacing:'0.06em',
                }}>
                  DATA OS
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#64748b', letterSpacing:'0.08em' }}>
                  v2.0 · Intelligence Platform
                </div>
              </div>
              {/* Online indicator */}
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399',
                               boxShadow:'0 0 8px #34d399', animation:'pulse 1.8s infinite' }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#34d399' }}>ONLINE</span>
              </div>
            </div>

            {/* Subtitle typewriter */}
            <div style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#94a3b8',
              letterSpacing:'0.1em', minHeight:'16px',
            }}>
              <span style={{ color:'#22d3ee' }}>›&nbsp;</span>{subtitle}
              <span style={{
                display:'inline-block', width:2, height:11,
                background:'#22d3ee', marginLeft:2, verticalAlign:'middle',
                animation:'cursorBlink 0.9s step-end infinite',
              }} />
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ padding:'24px 28px' }} noValidate>

            <CyberInput
              id="userId"
              label="NODE_ID"
              type="text"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setError(''); }}
              icon="◈"
              disabled={loading}
              placeholder="Enter your node identifier..."
              autoComplete="username"
            />

            <CyberInput
              id="password"
              label="PASSKEY"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              icon="🔐"
              disabled={loading}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom:'1rem', padding:'10px 14px',
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.35)',
                borderRadius:'8px', display:'flex', alignItems:'center', gap:8,
                fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#f87171',
                animation:'fadeIn 0.25s ease',
              }}>
                <span style={{ fontSize:14 }}>⚠</span> {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'14px',
                borderRadius:'10px', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'13px',
                letterSpacing:'0.12em', textTransform:'uppercase',
                background: loading
                  ? 'rgba(34,211,238,0.15)'
                  : 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.15))',
                border:'1px solid rgba(34,211,238,0.4)',
                color: loading ? '#64748b' : '#22d3ee',
                boxShadow: loading ? 'none' : '0 0 30px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                transition:'all 0.25s',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.25))';
                  e.currentTarget.style.boxShadow = '0 0 45px rgba(34,211,238,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.15))';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ display:'inline-block', width:14, height:14,
                    border:'2px solid rgba(34,211,238,0.3)', borderTopColor:'#22d3ee',
                    borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  VERIFYING IDENTITY...
                </span>
              ) : (
                <span>⚡&nbsp; INITIALIZE SESSION</span>
              )}
            </button>

            {/* Bottom status strip */}
            <div style={{
              marginTop:20, paddingTop:16,
              borderTop:'1px solid rgba(255,255,255,0.05)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#475569' }}>
                <span style={{ color:'#34d399' }}>● </span>SECURE · SHA-256 VERIFIED
              </div>
              <HexClock />
            </div>
          </form>
        </div>

        {/* Corner decorations */}
        {[
          { top:-6, left:-6, borderTop:'2px solid #22d3ee', borderLeft:'2px solid #22d3ee' },
          { top:-6, right:-6, borderTop:'2px solid #22d3ee', borderRight:'2px solid #22d3ee' },
          { bottom:-6, left:-6, borderBottom:'2px solid #22d3ee', borderLeft:'2px solid #22d3ee' },
          { bottom:-6, right:-6, borderBottom:'2px solid #22d3ee', borderRight:'2px solid #22d3ee' },
        ].map((s, i) => (
          <div key={i} style={{ position:'absolute', width:16, height:16, ...s, pointerEvents:'none' }} />
        ))}
      </div>

      {/* Back to portfolio */}
      <button
        onClick={() => navigate('/')}
        style={{
          position:'fixed', top:24, left:24, zIndex:20,
          fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#64748b',
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:8, padding:'8px 14px', cursor:'pointer',
          transition:'all 0.2s',
          display:'flex', alignItems:'center', gap:6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color='#22d3ee'; e.currentTarget.style.borderColor='rgba(34,211,238,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
      >
        ← portfolio
      </button>

      <style>{`
        @keyframes orbFloat {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-20px) scale(1.03); }
        }
        @keyframes logoPulse {
          0%,100% { box-shadow:0 0 20px rgba(34,211,238,0.25); }
          50%      { box-shadow:0 0 35px rgba(34,211,238,0.5); }
        }
        @keyframes cardShake {
          0%,100% { transform:translateX(0); }
          15%      { transform:translateX(-9px); }
          30%      { transform:translateX(7px); }
          45%      { transform:translateX(-7px); }
          60%      { transform:translateX(5px); }
          75%      { transform:translateX(-4px); }
          90%      { transform:translateX(3px); }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        @keyframes pulse {
          0%,100% { box-shadow:0 0 0 0 rgba(52,211,153,0.5); }
          50%      { box-shadow:0 0 0 5px rgba(52,211,153,0); }
        }
        @keyframes cursorBlink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
