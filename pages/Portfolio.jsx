import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import BusinessAnalysis from '../components/BusinessAnalysis';
import EnterpriseEDWPipeline from '../components/EnterpriseEDWPipeline';
import AboutSection from '../components/AboutSection';
import SkillsSection from '../components/SkillsSection';
import ModelingThinkingAssistant from '../components/ModelingThinkingAssistant';
import DataModelingShowcase from '../components/DataModelingShowcase';
import KPIIntelligence from '../components/KPIIntelligence';
import ProjectsSection from '../components/ProjectsSection';
import TimelineSection from '../components/TimelineSection';
import SQLPlayground from '../components/SQLPlayground';
import ResumeSection from '../components/ResumeSection';
import ContactSection from '../components/ContactSection';
import Navigation from '../components/Navigation';
import BootScreen from '../components/BootScreen';
import BackgroundCanvas from '../components/BackgroundCanvas';
import CursorGlow from '../components/CursorGlow';

export default function Portfolio() {
  const [showBoot, setShowBoot] = useState(true);
  const [theme, setTheme] = useState('default');
  const navigate = useNavigate();

  const bootTimerStarted = useRef(false);
  useEffect(() => {
    // Ref survives StrictMode double-invoke. Only the FIRST effect pass sets the timer.
    // No cleanup returned intentionally — if we cancel, StrictMode's cleanup kills it
    // and the ref-guard prevents a replacement timer from starting (deadlock).
    if (bootTimerStarted.current) return;
    bootTimerStarted.current = true;
    setTimeout(() => {
      setShowBoot(false);
      window.__portfolioBootDone = true;
      window.dispatchEvent(new CustomEvent('portfolioBootDone'));
    }, 3500);
  }, []);

  const handleSkipBoot = () => {
    setShowBoot(false);
    window.__portfolioBootDone = true;
    window.dispatchEvent(new CustomEvent('portfolioBootDone'));
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'default' ? 'cyber' : 'default'));
  };

  useEffect(() => {
    document.body.classList.toggle('cyber', theme === 'cyber');
    return () => {
      document.body.classList.remove('cyber');
    };
  }, [theme]);

  const launchDataOS = () => {
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${theme === 'cyber' ? 'cyber' : ''}`} style={{ '--bg': '#06080f' }}>
      {showBoot && <BootScreen onSkip={handleSkipBoot} />}
      <BackgroundCanvas />
      <CursorGlow />
      <Navigation theme={theme} onThemeToggle={toggleTheme} />

      {/* Premium scanning line effect */}
      <div className="scan-line" aria-hidden="true" />

      <main className="relative z-10">
        <HeroSection onLaunchDataOS={launchDataOS} />
        <div className="section-divider" />
        <BusinessAnalysis />
        <div className="section-divider" />
        <EnterpriseEDWPipeline />
        <div className="section-divider" />
        <AboutSection />
        <div className="section-divider" />
        <SkillsSection />
        <div className="section-divider" />
        <ModelingThinkingAssistant />
        <div className="section-divider" />
        <DataModelingShowcase />
        <div className="section-divider" />
        <KPIIntelligence />
        <div className="section-divider" />
        <ProjectsSection />
        <div className="section-divider" />
        <TimelineSection />
        <div className="section-divider" />
        <ResumeSection />
        <div className="section-divider" />
        <SQLPlayground />
        <div className="section-divider" />
        <ContactSection />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-slate-600">
            <span className="text-slate-500">node://</span>
            <span className="text-cyan-300/70">nigamjyoti</span>
            <span className="text-slate-600"> / data-modeler · Bengaluru, India</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-slate-600">
            <a href="mailto:nigamjob32@gmail.com" className="hover:text-cyan-400 transition">nigamjob32@gmail.com</a>
            <span className="text-slate-700">·</span>
            <a href="https://in.linkedin.com/in/nigamjyoti" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">LinkedIn</a>
            <span className="text-slate-700">·</span>
            <button onClick={launchDataOS} className="hover:text-violet-400 transition">Data OS ⚡</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
