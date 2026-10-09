import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TaskWorkspace from './components/TaskWorkspace';
import RecoveryBriefingModal from './components/RecoveryBriefingModal';
import NasaTlxModal from './components/NasaTlxModal';
import VersionHistory from './components/VersionHistory';
import CrossDeviceSync from './components/CrossDeviceSync';
import ResearchExperiment from './components/ResearchExperiment';
import AwsArchitecture from './components/AwsArchitecture';
import CloudWatchDashboard from './components/CloudWatchDashboard';
import PrivacyCenter from './components/PrivacyCenter';
import QuickCaptureModal from './components/QuickCaptureModal';
import NotificationToast from './components/NotificationToast';
import { RotateCcw, Zap, Sparkles } from 'lucide-react';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState('workspace');
  const { 
    isRecoveryModalOpen, 
    setIsRecoveryModalOpen, 
    isNasaTlxModalOpen, 
    setIsNasaTlxModalOpen,
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    simulateInterruption
  } = useTasks();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Center View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'workspace' && (
            <TaskWorkspace 
              onOpenBriefing={() => simulateInterruption('short_break', 300)} 
              onOpenHistory={() => setActiveTab('history')} 
            />
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Recovery Briefing & Resumption Hub</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Trigger an interruption or preview how the 4-part briefing presents context upon returning to work.
                  </p>
                </div>

                <button
                  onClick={() => simulateInterruption('short_break', 300)}
                  className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Launch Live Recovery Briefing</span>
                </button>
              </div>

              {/* Show task workspace as underlying canvas */}
              <TaskWorkspace 
                onOpenBriefing={() => simulateInterruption('short_break', 300)} 
                onOpenHistory={() => setActiveTab('history')} 
              />
            </div>
          )}

          {activeTab === 'history' && <VersionHistory />}

          {activeTab === 'devices' && <CrossDeviceSync />}

          {activeTab === 'research' && <ResearchExperiment />}

          {activeTab === 'aws' && <AwsArchitecture />}

          {activeTab === 'telemetry' && <CloudWatchDashboard />}

          {activeTab === 'privacy' && <PrivacyCenter />}
        </main>
      </div>

      {/* Persistent Modals and Toast */}
      <RecoveryBriefingModal 
        isOpen={isRecoveryModalOpen} 
        onClose={() => setIsRecoveryModalOpen(false)} 
      />

      <NasaTlxModal 
        isOpen={isNasaTlxModalOpen} 
        onClose={() => setIsNasaTlxModalOpen(false)} 
      />

      <QuickCaptureModal 
        isOpen={isQuickCaptureOpen} 
        onClose={() => setIsQuickCaptureOpen(false)} 
      />

      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainAppContent />
      </TaskProvider>
    </AuthProvider>
  );
}
