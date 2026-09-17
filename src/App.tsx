import React, { useState } from 'react';
import { Header } from './components/Header';
import { WebcamDetector } from './components/WebcamDetector';
import { DemoSimulation } from './components/DemoSimulation';
import { ModelArchitecture } from './components/ModelArchitecture';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { NotebookDoc } from './components/NotebookDoc';

export function App() {
  const [activeTab, setActiveTab] = useState<'webcam' | 'simulator' | 'architecture' | 'analytics' | 'doc'>('webcam');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'webcam' && <WebcamDetector />}
        {activeTab === 'simulator' && <DemoSimulation />}
        {activeTab === 'architecture' && <ModelArchitecture />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'doc' && <NotebookDoc />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-400">Driver Drowsiness Detection System</span> — ITS CNN-LSTM Model (95.1% Accuracy)
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>OpenCV / EAR Landmark Metrics</span>
            <span>•</span>
            <span>Web Audio Synth Alarm</span>
            <span>•</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
