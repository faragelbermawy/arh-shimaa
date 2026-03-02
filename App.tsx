
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
import { storageService } from './services/storageService';

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Ensure data migrations are handled on startup
    storageService.migrate();

    // Fallback: Force hide splash screen after 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
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
