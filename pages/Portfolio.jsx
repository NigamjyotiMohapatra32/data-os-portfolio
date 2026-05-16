import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import SkillsSection from '../components/SkillsSection';
import ProjectsSection from '../components/ProjectsSection';
import TimelineSection from '../components/TimelineSection';
import SQLPlayground from '../components/SQLPlayground';
import ContactSection from '../components/ContactSection';
import Navigation from '../components/Navigation';
import BootScreen from '../components/BootScreen';
import BackgroundCanvas from '../components/BackgroundCanvas';

export default function Portfolio() {
  const [showBoot, setShowBoot] = useState(true);
  const [theme, setTheme] = useState('default');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowBoot(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleSkipBoot = () => setShowBoot(false);

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
      <Navigation theme={theme} onThemeToggle={toggleTheme} />

      <main className="relative z-10">
        <HeroSection onLaunchDataOS={launchDataOS} />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <TimelineSection />
        <SQLPlayground />
        <ContactSection />
      </main>
    </div>
  );
}
