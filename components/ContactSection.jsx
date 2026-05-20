import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { trackContactSubmit } from '../lib/events';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// EmailJS config — set these in your .env
const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';

const CONTACTS = [
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 7.125L2.25 6.75"/>
      </svg>
    ),
    label: 'Email',
    value: 'nigamjob32@gmail.com',
    href: 'mailto:nigamjob32@gmail.com',
    color: '#22d3ee',
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z"/>
      </svg>
    ),
    label: 'Phone',
    value: '+91 7008 667 185',
    href: 'tel:+917008667185',
    color: '#34d399',
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>
    ),
    label: 'Location',
    value: 'Bengaluru, India · 30-day notice',
    color: '#a78bfa',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    label: 'LinkedIn',
    value: 'nigamjyoti',
    href: 'https://in.linkedin.com/in/nigamjyoti',
    color: '#f472b6',
  },
];

function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl"
      style={{
        background: type === 'success' ? 'rgba(6,214,160,0.12)' : 'rgba(244,114,182,0.12)',
        border: `1px solid ${type === 'success' ? 'rgba(6,214,160,0.4)' : 'rgba(244,114,182,0.4)'}`,
        backdropFilter: 'blur(12px)',
        maxWidth: '360px',
      }}
    >
      <div className="text-xl">{type === 'success' ? '✓' : '✗'}</div>
      <div className="flex-1 text-sm" style={{ color: type === 'success' ? '#34d399' : '#f472b6' }}>
        {message}
      </div>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
    </motion.div>
  );
}

export default function ContactSection() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!EMAIL_RE.test(formData.email.trim())) errs.email = 'Enter a valid email address.';
    if (!formData.message.trim() || formData.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.';
    if (formData.name.length > 100) errs.name = 'Name is too long.';
    if (formData.message.length > 2000) errs.message = 'Message is too long (max 2000 chars).';
    return errs;
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      // Save to Firestore first (reliable)
      try {
        await addDoc(collection(db, 'contactSubmissions'), {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          submittedAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn('[contact] Firestore write failed:', dbErr.message);
      }

      // Send email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          from_name: formData.name.trim(),
          from_email: formData.email.trim(),
          message: formData.message.trim(),
          to_name: 'Nigamjyoti',
        },
        EMAILJS_KEY
      );

      trackContactSubmit?.();
      setFormData({ name: '', email: '', message: '' });
      showToast("Message sent! I'll get back to you soon.", 'success');
    } catch (err) {
      console.error('[contact] Send failed:', err);
      showToast('Failed to send. Please email me directly at nigamjob32@gmail.com', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <section id="contact" className="relative py-24 px-4 md:px-8">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2 mb-2">
            <span className="text-cyan-300">[06]</span>
            <span>CONTACT</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl">Get in Touch</h2>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-cyan-400/60 to-transparent" />
          <p className="mt-4 text-slate-400 text-sm max-w-xl">
            Open to new opportunities, collaborations, and conversations about data modeling.
            <span className="text-emerald-400"> 30-day notice period.</span>
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left — contact info */}
          <motion.div
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {CONTACTS.map((c, i) => (
              <motion.div
                key={c.label}
                className="glass rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all duration-300 group"
                style={{ borderColor: `${c.color}20` }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{c.label}</div>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-sm text-slate-200 hover:underline truncate block"
                      style={{ color: c.color }}
                    >
                      {c.value}
                    </a>
                  ) : (
                    <div className="text-sm text-slate-300 truncate">{c.value}</div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Availability badge */}
            <div className="glass rounded-xl p-4" style={{ borderColor: 'rgba(52,211,153,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="dot text-emerald-400 bg-emerald-400" />
                <span className="font-mono text-xs text-emerald-400">Available for opportunities</span>
              </div>
              <div className="font-mono text-[10px] text-slate-500 space-y-1">
                <div>Preferred: Bengaluru · Hyderabad · Pune</div>
                <div>Open to: NCR · Mumbai · PAN India</div>
                <div className="text-amber-400">Notice period: 30 days</div>
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg mb-1">Send a Message</h3>
              <p className="font-mono text-xs text-slate-500 mb-5">Direct email delivery — no spam.</p>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Honeypot anti-spam */}
                <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      placeholder="Eg. Priya Sharma"
                      value={formData.name}
                      onChange={handleChange('name')}
                      maxLength={100}
                      autoComplete="name"
                      className={`w-full px-3 py-2.5 bg-slate-900/80 border rounded-lg text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/60 transition-colors ${errors.name ? 'border-rose-500/70' : 'border-slate-700/60'}`}
                    />
                    {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Your Email</label>
                    <input
                      type="email"
                      placeholder="priya@company.com"
                      value={formData.email}
                      onChange={handleChange('email')}
                      maxLength={200}
                      autoComplete="email"
                      className={`w-full px-3 py-2.5 bg-slate-900/80 border rounded-lg text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/60 transition-colors ${errors.email ? 'border-rose-500/70' : 'border-slate-700/60'}`}
                    />
                    {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
                  <textarea
                    placeholder="Hi Nigamjyoti, I'd like to discuss a Data Modeler role..."
                    value={formData.message}
                    onChange={handleChange('message')}
                    maxLength={2000}
                    rows={5}
                    className={`w-full px-3 py-2.5 bg-slate-900/80 border rounded-lg text-slate-200 placeholder-slate-600 text-sm resize-none focus:outline-none focus:border-cyan-500/60 transition-colors ${errors.message ? 'border-rose-500/70' : 'border-slate-700/60'}`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message ? <p className="text-xs text-rose-400">{errors.message}</p> : <span />}
                    <span className="text-xs text-slate-600">{formData.message.length}/2000</span>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  className={`btn btn-cyan w-full justify-center text-sm font-semibold ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  whileHover={submitting ? {} : { scale: 1.02 }}
                  whileTap={submitting ? {} : { scale: 0.98 }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                      </svg>
                      Send Message
                    </span>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
