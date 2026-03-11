
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LearningModule from './components/LearningModule';
import Quiz from './components/Quiz';
import AIAssistant from './components/AIAssistant';
import Reminders from './components/Reminders';
import VisitorRegistry from './components/VisitorRegistry';
import WeeklyAudit from './components/WeeklyAudit';
import LearningCurriculum from './components/LearningCurriculum';
import DocsManager from './components/DocsManager';
import MdroArchive from './components/MdroArchive';
import SyncHub from './components/SyncHub';
import GoldenFiles from './components/GoldenFiles';
import SplashScreen from './components/SplashScreen';
import VisitorPdfViewer from './components/VisitorPdfViewer';
import HandHygieneAudit from './components/HandHygieneAudit';
import HandHygieneResults from './components/HandHygieneResults';
import AppLock from './components/AppLock';
import { storageService } from './services/storageService';

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const [isLocked, setIsLocked] = useState(() => {
    // Check App Lock (mandatory for everyone)
    const isAppUnlocked = sessionStorage.getItem('session_app_unlocked') === 'true';
    if (!isAppUnlocked) return true;

    // Check Section Specific Locks
    const auditRoutes = ['/audit', '/hand-hygiene', '/hand-hygiene-results'];
    const docsRoutes = ['/docs', '/vault'];
    
    if (auditRoutes.some(route => location.pathname.startsWith(route))) {
      return sessionStorage.getItem('session_audit_unlocked') !== 'true';
    }
    
    if (docsRoutes.some(route => location.pathname.startsWith(route))) {
      return sessionStorage.getItem('session_docs_unlocked') !== 'true';
    }
    
    return false;
  });

  useEffect(() => {
    // Ensure data migrations are handled on startup
    storageService.migrate();

    // Fallback: Force hide splash screen after 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Handle unlocking
  const handleUnlock = () => {
    const isAppUnlocked = sessionStorage.getItem('session_app_unlocked') === 'true';
    
    if (!isAppUnlocked) {
      sessionStorage.setItem('session_app_unlocked', 'true');
    } else {
      const auditRoutes = ['/audit', '/hand-hygiene', '/hand-hygiene-results'];
      const docsRoutes = ['/docs', '/vault'];
      
      if (auditRoutes.some(route => location.pathname.startsWith(route))) {
        sessionStorage.setItem('session_audit_unlocked', 'true');
      } else if (docsRoutes.some(route => location.pathname.startsWith(route))) {
        sessionStorage.setItem('session_docs_unlocked', 'true');
      }
    }
    
    setIsLocked(false);
  };

  // Lock the app on route change if needed, but respect session unlock
  useEffect(() => {
    const isAppUnlocked = sessionStorage.getItem('session_app_unlocked') === 'true';
    if (!isAppUnlocked) {
      setIsLocked(true);
      return;
    }

    const auditRoutes = ['/audit', '/hand-hygiene', '/hand-hygiene-results'];
    const docsRoutes = ['/docs', '/vault'];
    
    const isAuditRoute = auditRoutes.some(route => location.pathname.startsWith(route));
    const isDocsRoute = docsRoutes.some(route => location.pathname.startsWith(route));

    if (isAuditRoute) {
      const isAuditUnlocked = sessionStorage.getItem('session_audit_unlocked') === 'true';
      setIsLocked(!isAuditUnlocked);
    } else if (isDocsRoute) {
      const isDocsUnlocked = sessionStorage.getItem('session_docs_unlocked') === 'true';
      setIsLocked(!isDocsUnlocked);
    } else {
      setIsLocked(false);
    }
  }, [location.pathname]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (isLocked) {
    return <AppLock onUnlock={handleUnlock} />;
  }

  return (
    <div className="animate-in fade-in zoom-in-105 duration-1000">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learning" element={<LearningCurriculum />} />
          <Route path="/learning/:id" element={<LearningModule />} />
          <Route path="/quiz/:moduleId" element={<Quiz />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/registry" element={<VisitorRegistry />} />
          <Route path="/audit" element={<WeeklyAudit />} />
          <Route path="/docs" element={<DocsManager />} />
          <Route path="/vault" element={<DocsManager />} />
          <Route path="/mdro-archive" element={<MdroArchive />} />
          <Route path="/sync" element={<SyncHub />} />
          <Route path="/golden-files" element={<GoldenFiles />} />
          <Route path="/visitor-pdf" element={<VisitorPdfViewer />} />
          <Route path="/hand-hygiene" element={<HandHygieneAudit />} />
          <Route path="/hand-hygiene-results" element={<HandHygieneResults />} />
        </Routes>
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
