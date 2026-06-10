import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackContactSubmit } from '../lib/events';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';

const CONTACTS = [
  {
    label: 'Email',
    value: 'nigamjob32@gmail.com',
    href: 'mailto:nigamjob32@gmail.com',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 7.125L2.25 6.75"/>
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+91 7008 667 185',
    href: 'tel:+917008667185',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z"/>
      </svg>
    ),
  },
  {
    label: 'Location',
    value: 'Bengaluru, India',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    value: '/in/nigamjyoti',
    href: 'https://in.linkedin.com/in/nigamjyoti',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
  },
];

// Floating particle background
function ContactParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let W, H, pts, rafId;
    const N = 28;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth  * dpr;
      H = canvas.height = canvas.offsetHeight * dpr;
    };
    const init = () => {
      pts = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.5 + 0.5) * dpr,
        hue: Math.random() < 0.5 ? 190 : Math.random() < 0.5 ? 270 : 330,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const maxD2 = (160 * dpr) ** 2;
      for (let i = 0; i < N; i++) {
        const a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        for (let j = i + 1; j < N; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const op = (1 - Math.sqrt(d2) / (160 * dpr)) * 0.12;
            ctx.strokeStyle = `hsla(${a.hue},90%,70%,${op})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `hsla(${a.hue},90%,70%,0.5)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); };
  }, []);
  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
  );
}

// Animated form field
function FormField({ label, error, children }) {
  return (
    <div className="group relative">
      <label className="block font-mono text-[10px] uppercase tracking-[0.15em] mb-2 transition-colors"
        style={{ color: error ? '#f472b6' : '#475569' }}>
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-mono mt-1.5 flex items-center gap-1"
            style={{ color: '#f472b6' }}>
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputBase = {
  width: '100%',
  background: 'rgba(8,12,22,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  padding: '12px 16px',
};

export default function ContactSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const e = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) e.name = 'At least 2 characters required';
    if (!EMAIL_RE.test(formData.email.trim())) e.email = 'Enter a valid email address';
    if (!formData.message.trim() || formData.message.trim().length < 10) e.message = 'At least 10 characters required';
    if (formData.name.length > 100) e.name = 'Name too long';
    if (formData.message.length > 2000) e.message = 'Message too long (max 2000)';
    return e;
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      try {
        await addDoc(collection(db, 'contactSubmissions'), {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          submittedAt: serverTimestamp(),
          read: false,
        });
      } catch (dbErr) {
        console.warn('[contact] Firestore write skipped:', dbErr.message);
      }

      await emailjs.send(
        EMAILJS_SERVICE, EMAILJS_TEMPLATE,
        { from_name: formData.name.trim(), from_email: formData.email.trim(), message: formData.message.trim(), to_name: 'Nigamjyoti' },
        EMAILJS_KEY
      );

      trackContactSubmit?.();
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('[contact]', err);
      showToast('Could not send — email me directly at nigamjob32@gmail.com', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } },
    item: { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } },
  };

  return (
    <section id="contact" ref={sectionRef} className="relative py-28 px-4 md:px-8 overflow-hidden">

      {/* ── Layered background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <ContactParticles />
        {/* Big glow blobs */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '-5%', left: '50%', transform: 'translateX(-50%)',
            width: '700px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', top: '5%', right: '10%',
            width: '400px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{
            position: 'absolute', top: '20%', left: '5%',
            width: '350px', height: '350px',
            background: 'radial-gradient(ellipse, rgba(244,114,182,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Section header ── */}
        <motion.div className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

          {/* Terminal label */}
          <div className="inline-flex items-center gap-2 font-mono text-xs mb-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>▋</motion.span>
            <span>[07] CONTACT.init()</span>
          </div>

          <h2 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] mb-4">
            <span className="text-slate-100">Let&apos;s </span>
            <span className="animated-gradient-text">Connect</span>
          </h2>

          {/* Animated underline */}
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: '96px' } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '3px', background: 'linear-gradient(90deg, #22d3ee, #a78bfa)', borderRadius: '2px', marginBottom: '20px' }} />

          <p className="text-slate-400 text-base max-w-lg leading-relaxed">
            Open to exciting roles in data modeling, DWH architecture, and analytics engineering.
            <span className="text-cyan-300"> Let&apos;s build something great together.</span>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── Left: Contact cards ── */}
          <motion.div className="lg:col-span-2 space-y-3"
            variants={stagger.container}
            initial="hidden"
            animate={isInView ? 'show' : 'hidden'}>

            {CONTACTS.map((c) => (
              <motion.div key={c.label} variants={stagger.item}>
                <motion.div
                  className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 group cursor-pointer"
                  style={{ background: 'rgba(8,12,22,0.6)', border: `1px solid ${c.color}15`, backdropFilter: 'blur(12px)' }}
                  whileHover={{ y: -3, borderColor: `${c.color}50`, boxShadow: `0 16px 48px -12px ${c.color}30` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                >
                  {/* Hover sweep glow */}
                  <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{ background: `linear-gradient(105deg, ${c.color}08 0%, transparent 60%)`,
                      transition: 'opacity 0.3s ease' }} />

                  {/* Icon box with animated ring */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}>
                      {c.icon}
                    </motion.div>
                    {/* Ping ring on hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ boxShadow: `0 0 0 4px ${c.color}15, 0 0 0 8px ${c.color}05` }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] mb-1" style={{ color: `${c.color}80` }}>
                      {c.label}
                    </div>
                    {c.href ? (
                      <a href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-sm font-medium truncate block transition-all"
                        style={{ color: c.color }}>
                        {c.value}
                      </a>
                    ) : (
                      <div className="text-sm font-medium" style={{ color: c.color }}>{c.value}</div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  {c.href && (
                    <motion.div className="flex-shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ color: c.color }}
                      initial={{ x: -4 }} whileHover={{ x: 0 }}
                      transition={{ duration: 0.2 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}

            {/* Availability card */}
            <motion.div variants={stagger.item}>
              <motion.div
                className="relative overflow-hidden rounded-2xl p-5"
                style={{ background: 'rgba(8,12,22,0.6)', border: '1px solid rgba(52,211,153,0.2)', backdropFilter: 'blur(12px)' }}
                whileHover={{ borderColor: 'rgba(52,211,153,0.45)', boxShadow: '0 16px 48px -12px rgba(52,211,153,0.2)' }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.1), transparent 70%)' }} />

                <div className="flex items-center gap-2.5 mb-4">
                  <div className="relative">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(52,211,153,0.4)' }} />
                  </div>
                  <span className="font-mono text-xs font-semibold" style={{ color: '#34d399' }}>Open to Opportunities</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Preferred', value: 'Bengaluru · Hyderabad · Pune', color: '#22d3ee' },
                    { label: 'Open to', value: 'NCR · Mumbai · PAN India', color: '#a78bfa' },
                    { label: 'Mode', value: 'Hybrid / Remote / On-site', color: '#f472b6' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider pt-0.5 flex-shrink-0">{row.label}</span>
                      <span className="font-mono text-[11px] text-right" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── Right: Form ── */}
          <motion.div className="lg:col-span-3"
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>

            <div className="relative overflow-hidden rounded-3xl p-8"
              style={{ background: 'rgba(8,12,22,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.7)' }}>

              {/* Top shimmer accent */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(167,139,250,0.5), transparent)' }} />

              {/* Floating corner glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.08), transparent 70%)', borderRadius: '50%' }} />

              {/* Header */}
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#22d3ee" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-slate-100 text-xl">Send a Message</h3>
                </div>
                <p className="font-mono text-[11px] text-slate-500 ml-8">Delivered directly to my inbox — no spam, no bots.</p>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  /* ── Success state ── */
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                    className="flex flex-col items-center gap-5 py-10 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                      style={{ background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.4)', boxShadow: '0 0 40px rgba(52,211,153,0.25)' }}>
                      ✓
                    </motion.div>
                    <div>
                      <div className="font-display font-bold text-xl text-emerald-400 mb-2">Message Sent!</div>
                      <div className="font-mono text-sm text-slate-400">I&apos;ll get back to you within 24 hours.</div>
                    </div>
                    <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      <span className="font-mono text-xs" style={{ color: '#34d399' }}>Delivered to nigamjob32@gmail.com</span>
                    </motion.div>
                  </motion.div>
                ) : (
                  /* ── Form ── */
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-5" noValidate
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}>
                    {/* Hidden honeypot */}
                    <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField label="Your Name" error={errors.name}>
                        <motion.input
                          type="text" placeholder="e.g. Priya Sharma"
                          value={formData.name} onChange={handleChange('name')}
                          maxLength={100} autoComplete="name"
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          style={{
                            ...inputBase,
                            borderColor: errors.name ? 'rgba(244,114,182,0.5)' : focusedField === 'name' ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)',
                            boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.08)' : 'none',
                          }}
                          animate={{ scale: focusedField === 'name' ? 1.005 : 1 }}
                          transition={{ duration: 0.15 }}
                        />
                      </FormField>
                      <FormField label="Your Email" error={errors.email}>
                        <motion.input
                          type="email" placeholder="priya@company.com"
                          value={formData.email} onChange={handleChange('email')}
                          maxLength={200} autoComplete="email"
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          style={{
                            ...inputBase,
                            borderColor: errors.email ? 'rgba(244,114,182,0.5)' : focusedField === 'email' ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)',
                            boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.08)' : 'none',
                          }}
                          animate={{ scale: focusedField === 'email' ? 1.005 : 1 }}
                          transition={{ duration: 0.15 }}
                        />
                      </FormField>
                    </div>

                    <FormField label="Message" error={errors.message}>
                      <motion.textarea
                        placeholder="Hi Nigamjyoti, I'd like to discuss a Data Modeler opportunity..."
                        value={formData.message} onChange={handleChange('message')}
                        maxLength={2000} rows={5}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          ...inputBase,
                          resize: 'none',
                          borderColor: errors.message ? 'rgba(244,114,182,0.5)' : focusedField === 'message' ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)',
                          boxShadow: focusedField === 'message' ? '0 0 0 3px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.08)' : 'none',
                        }}
                        animate={{ scale: focusedField === 'message' ? 1.002 : 1 }}
                        transition={{ duration: 0.15 }}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="font-mono text-[10px]" style={{ color: formData.message.length > 1800 ? '#f472b6' : '#334155' }}>
                          {formData.message.length}/2000
                        </span>
                      </div>
                    </FormField>

                    {/* Submit button */}
                    <motion.button type="submit" disabled={submitting}
                      className="relative w-full py-3.5 rounded-2xl font-mono text-sm font-semibold overflow-hidden"
                      style={{
                        background: submitting ? 'rgba(34,211,238,0.08)' : 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.12))',
                        border: `1px solid ${submitting ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.4)'}`,
                        color: '#22d3ee',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}
                      whileHover={submitting ? {} : { scale: 1.01, boxShadow: '0 0 30px rgba(34,211,238,0.25)' }}
                      whileTap={submitting ? {} : { scale: 0.98 }}
                    >
                      {/* Shimmer on hover */}
                      {!submitting && (
                        <motion.div className="absolute inset-0 pointer-events-none"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', width: '50%' }} />
                      )}
                      <span className="relative flex items-center justify-center gap-2.5">
                        {submitting ? (
                          <>
                            <motion.svg animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </motion.svg>
                            Transmitting…
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                            </svg>
                            Send Message
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: toast.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(244,114,182,0.1)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.35)' : 'rgba(244,114,182,0.35)'}`,
              backdropFilter: 'blur(16px)',
              boxShadow: `0 16px 48px -12px ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(244,114,182,0.3)'}`,
              maxWidth: '380px',
            }}>
            <span className="text-lg">{toast.type === 'success' ? '✓' : '⚠'}</span>
            <p className="text-sm flex-1" style={{ color: toast.type === 'success' ? '#34d399' : '#f472b6' }}>{toast.msg}</p>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300 transition text-xl leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
