import React, { useState, useRef } from 'react';
import api from '../lib/api';
import { trackContactSubmit } from '../lib/events';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Rate-limit: prevent re-submission for 30 s after send
  const cooldownRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }
    if (!EMAIL_RE.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters.';
    }
    if (formData.name.length > 100) errs.name = 'Name is too long.';
    if (formData.message.length > 2000) errs.message = 'Message is too long (max 2000 chars).';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setStatus('Sending…');

    try {
      await api.contact.send({
        name:    formData.name.trim(),
        email:   formData.email.trim(),
        subject: `Portfolio message from ${formData.name.trim()}`,
        message: formData.message.trim(),
      });
      trackContactSubmit();
      setStatus("✓ Message received! I'll get back to you soon.");
      setFormData({ name: '', email: '', message: '' });
      clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => setStatus(''), 30_000);
    } catch (err) {
      setStatus(`✗ ${err.message || 'Failed to send. Please email me directly.'}`);
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
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
            <span className="text-cyan-300">[06]</span>
            <span>CONTACT</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl mt-2">Get in Touch</h2>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg mb-4">Direct Contact</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-500 font-mono text-xs mb-1">email</div>
                <a href="mailto:nigamjob32@gmail.com" className="text-cyan-300 hover:underline">nigamjob32@gmail.com</a>
              </div>
              <div>
                <div className="text-slate-500 font-mono text-xs mb-1">phone</div>
                <a href="tel:+917008667185" className="text-cyan-300 hover:underline">+91 7008 667 185</a>
              </div>
              <div>
                <div className="text-slate-500 font-mono text-xs mb-1">location</div>
                <div className="text-slate-300">Bengaluru, India</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg mb-4">Quick Message</h3>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  maxLength={100}
                  autoComplete="name"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 ${errors.name ? 'border-rose-500/70' : 'border-slate-700'}`}
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  maxLength={200}
                  autoComplete="email"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 ${errors.email ? 'border-rose-500/70' : 'border-slate-700'}`}
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <textarea
                  placeholder="Message (min 10 characters)"
                  value={formData.message}
                  onChange={handleChange('message')}
                  maxLength={2000}
                  className={`w-full px-3 py-2 bg-slate-900 border rounded text-slate-200 placeholder-slate-500 text-sm h-24 resize-none focus:outline-none focus:border-cyan-500/60 ${errors.message ? 'border-rose-500/70' : 'border-slate-700'}`}
                />
                <div className="flex justify-between">
                  {errors.message ? <p className="text-xs text-rose-400 mt-1">{errors.message}</p> : <span />}
                  <span className="text-xs text-slate-600 mt-1">{formData.message.length}/2000</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`btn btn-cyan w-full ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
              {status && (
                <div className={`text-sm ${status.startsWith('✓') ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {status}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
