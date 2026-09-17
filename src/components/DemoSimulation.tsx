import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldAlert, Sparkles, UserCheck, Flame, Coffee } from 'lucide-react';
import { alarmSynth } from '../utils/audioAlarm';
import { DetectionFrameData, DetectionStatus, SimulationPreset } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'alert_driver',
    name: 'Normal Highway Driving',
    description: 'Driver is well-rested. Eyes remain open with regular 0.15s blinks.',
    driverName: 'Alex Mercer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    baseEar: 0.34,
    baseMar: 0.10,
    drowsinessTrend: 'STABLE',
    durationSeconds: 30,
  },
  {
    id: 'yawning_driver',
    name: 'Late-Night Fatigue & Yawning',
    description: 'Driver exhibits frequent yawning episodes and slow eyelid reopening.',
    driverName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    baseEar: 0.25,
    baseMar: 0.62,
    drowsinessTrend: 'YAWNING',
    durationSeconds: 30,
  },
  {
    id: 'microsleep_driver',
    name: 'Critical Micro-Sleep Hazard',
    description: 'Extended eye closures exceeding 2.0 seconds with head drooping.',
    driverName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    baseEar: 0.14,
    baseMar: 0.15,
    drowsinessTrend: 'NODDING',
    durationSeconds: 30,
  },
];

export const DemoSimulation: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<SimulationPreset>(SIMULATION_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  // Simulated Metrics
  const [currentEar, setCurrentEar] = useState<number>(0.34);
  const [currentMar, setCurrentMar] = useState<number>(0.10);
  const [status, setStatus] = useState<DetectionStatus>('ALERT');
  const [history, setHistory] = useState<DetectionFrameData[]>([]);
  const [closedCount, setClosedCount] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  // Reset simulation
  const handleReset = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedTime(0);
    frameRef.current = 0;
    setCurrentEar(selectedPreset.baseEar);
    setCurrentMar(selectedPreset.baseMar);
    setStatus('ALERT');
    setClosedCount(0);
    setHistory([]);
  };

  useEffect(() => {
    handleReset();
  }, [selectedPreset]);

  // Tick step
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        frameRef.current += 1;
        setElapsedTime((prev) => prev + 0.1);

        const t = frameRef.current * 0.1;
        let ear = selectedPreset.baseEar;
        let mar = selectedPreset.baseMar;

        if (selectedPreset.drowsinessTrend === 'STABLE') {
          // Regular open eye with quick blinks
          const blink = Math.sin(t * 1.2) > 0.92;
          ear = blink ? 0.16 : 0.33 + Math.sin(t * 0.5) * 0.02;
          mar = 0.10 + Math.cos(t * 0.3) * 0.02;
        } else if (selectedPreset.drowsinessTrend === 'YAWNING') {
          // Yawning cycle
          const yawnPhase = Math.sin(t * 0.4);
          mar = yawnPhase > 0 ? 0.30 + yawnPhase * 0.38 : 0.12;
          ear = yawnPhase > 0.5 ? 0.18 : 0.27 + Math.sin(t) * 0.03;
        } else if (selectedPreset.drowsinessTrend === 'NODDING') {
          // Progressive eye closure -> Micro-sleep
          const cycle = (t % 10) / 10; // 10s cycle
          if (cycle > 0.4) {
            ear = 0.12 + Math.random() * 0.04; // closed
          } else {
            ear = 0.28 - cycle * 0.3;
          }
          mar = 0.15;
        }

        setCurrentEar(parseFloat(ear.toFixed(3)));
        setCurrentMar(parseFloat(mar.toFixed(3)));

        // Evaluate status
        const isClosed = ear < 0.22;
        let nextCount = closedCount;
        if (isClosed) {
          nextCount = closedCount + 1;
        } else {
          nextCount = Math.max(0, closedCount - 1);
        }
        setClosedCount(nextCount);

        let nextStatus: DetectionStatus = 'ALERT';
        let prob = 0.05;

        if (nextCount > 18) {
          nextStatus = 'MICRO_SLEEP';
          prob = 0.99;
          alarmSynth.playEmergencyAlarm();
        } else if (nextCount > 10) {
          nextStatus = 'DROWSY';
          prob = 0.85;
          alarmSynth.playDrowsyAlarm();
        } else if (nextCount > 3 || mar > 0.55) {
          nextStatus = 'WARMING';
          prob = 0.48;
          alarmSynth.playWarningBeep();
        }

        setStatus(nextStatus);

        setHistory((prev) => [
          ...prev.slice(-30),
          {
            timestamp: parseFloat((frameRef.current * 0.1).toFixed(1)),
            ear: parseFloat(ear.toFixed(3)),
            mar: parseFloat(mar.toFixed(3)),
            headPosePitch: 0,
            status: nextStatus,
            drowsinessProbability: prob,
            blinkRate: 12,
          },
        ]);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedPreset, closedCount]);

  // Inject manual event triggers
  const triggerManualYawn = () => {
    setCurrentMar(0.68);
    setCurrentEar(0.19);
    alarmSynth.playWarningBeep();
  };

  const triggerMicroSleep = () => {
    setClosedCount(25);
    setCurrentEar(0.11);
    setStatus('MICRO_SLEEP');
    alarmSynth.playEmergencyAlarm();
  };

  return (
    <div className="space-y-6">
      
      {/* Preset Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SIMULATION_PRESETS.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800 border-rose-500/80 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={preset.avatarUrl}
                  alt={preset.driverName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{preset.name}</h3>
                  <p className="text-xs text-slate-400">{preset.driverName}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">{preset.description}</p>
              
              {isSelected && (
                <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Active Scenario
                  </span>
                  <span className="text-slate-400">Target EAR: ~{preset.baseEar}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Panel + Live HUD Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Visual Simulator Frame (2 cols) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">{selectedPreset.name} Simulator</h2>
              <p className="text-xs text-slate-400">Testing CNN spatial classification & LSTM temporal memory</p>
            </div>

            {/* Playback buttons */}
            <div className="flex items-center space-x-3">
              <button
                id="sim-play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Simulation' : 'Start Simulation'}</span>
              </button>

              <button
                id="sim-reset-btn"
                onClick={handleReset}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Reset scenario"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Simulated Driver Video Stage */}
          <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
            
            {/* Background Avatar representation */}
            <div className="relative flex flex-col items-center justify-center space-y-4">
              <div
                className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all ${
                  status === 'ALERT'
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : status === 'WARMING'
                    ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'border-rose-500 shadow-2xl shadow-rose-500/40 animate-pulse'
                }`}
              >
                <img
                  src={selectedPreset.avatarUrl}
                  alt={selectedPreset.driverName}
                  className={`w-32 h-32 rounded-full object-cover transition-all ${
                    currentEar < 0.22 ? 'brightness-50 grayscale' : 'brightness-100'
                  }`}
                />
              </div>

              {/* Status Banner overlay */}
              <div
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border backdrop-blur-md ${
                  status === 'ALERT'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : status === 'WARMING'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    : 'bg-rose-950/90 text-rose-200 border-rose-500/60 animate-bounce'
                }`}
              >
                STATUS: {status}
              </div>
            </div>

            {/* Floating Telemetry Stats on Frame */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Timer: <span className="text-white font-mono">{elapsedTime.toFixed(1)}s</span></div>
              <div className="text-slate-400">EAR: <span className={currentEar < 0.22 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{currentEar}</span></div>
              <div className="text-slate-400">MAR: <span className={currentMar > 0.55 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{currentMar}</span></div>
            </div>

            {/* Quick Inject Action Buttons */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <button
                onClick={triggerManualYawn}
                className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                + Inject Yawn
              </button>
              <button
                onClick={triggerMicroSleep}
                className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-lg text-[11px] font-semibold hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                + Inject Micro-Sleep
              </button>
            </div>

          </div>

          {/* Temporal Graph for Simulation */}
          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 0.45]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <ReferenceLine y={0.22} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ear" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="mar" stroke="#fbbf24" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Side Panel: Model Response Breakdown */}
        <div className="space-y-6">
          
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Model Classification Output</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Active Class Probability</span>
                  <span className="font-bold text-emerald-400">
                    {status === 'ALERT' ? '96%' : status === 'WARMING' ? '52%' : '2%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: status === 'ALERT' ? '96%' : status === 'WARMING' ? '52%' : '2%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Fatigue Class Probability</span>
                  <span className="font-bold text-rose-400">
                    {status === 'ALERT' ? '4%' : status === 'WARMING' ? '48%' : '98%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{
                      width: status === 'ALERT' ? '4%' : status === 'WARMING' ? '48%' : '98%',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-rose-300">LSTM Memory Buffer:</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                LSTM evaluates temporal dependencies over sequence length T=16 frames. Single frame blinks are filtered out; only sustained low EAR or repeated yawns shift class confidence.
              </p>
            </div>

          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Recommended Countermeasures</span>
            </h3>

            {status === 'ALERT' && (
              <p className="text-xs text-slate-300">Driver status optimal. Cruise control and lane keep assistance functioning normally.</p>
            )}

            {status === 'WARMING' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1">
                <p className="font-bold">Mild Fatigue Advisory</p>
                <p className="text-[11px] text-amber-300">Consider taking a 15-minute rest break at the next service area.</p>
              </div>
            )}

            {(status === 'DROWSY' || status === 'MICRO_SLEEP') && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs space-y-1 animate-pulse">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  <ShieldAlert className="w-4 h-4" /> EMERGENCY DRIVER STOP ALERT
                </p>
                <p className="text-[11px]">Auditory buzzer activated. Haptic seat vibration engaged. Pull over safely immediately.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
