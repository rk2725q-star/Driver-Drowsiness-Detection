import React from 'react';
import { Camera, PlayCircle, Cpu, BarChart3, BookOpen, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { alarmSynth } from '../utils/audioAlarm';

interface HeaderProps {
  activeTab: 'webcam' | 'simulator' | 'architecture' | 'analytics' | 'doc';
  setActiveTab: (tab: 'webcam' | 'simulator' | 'architecture' | 'analytics' | 'doc') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isMuted, setIsMuted }) => {
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    alarmSynth.setMuted(nextState);
  };

  const navItems = [
    { id: 'webcam', label: 'Live Webcam Detection', icon: Camera },
    { id: 'simulator', label: 'Fatigue Simulator', icon: PlayCircle },
    { id: 'architecture', label: 'CNN-LSTM Architecture', icon: Cpu },
    { id: 'analytics', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'doc', label: 'Notebook & Paper', icon: BookOpen },
  ] as const;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Driver Drowsiness Detection</h1>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CNN-LSTM 95.1% ACC
              </span>
            </div>
            <p className="text-xs text-slate-400">ITS Research & Real-time Facial Fatigue Detection</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Audio Mute Toggle */}
        <div className="flex items-center space-x-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
          <button
            id="audio-mute-toggle"
            onClick={toggleMute}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title={isMuted ? 'Unmute alert synth' : 'Mute alert synth'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound Active'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
