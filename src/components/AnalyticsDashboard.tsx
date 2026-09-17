import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Award, CheckCircle2, AlertOctagon, TrendingUp, Cpu } from 'lucide-react';
import { ModelMetric, TrainingEpochData } from '../types';

const MODEL_COMPARISONS: ModelMetric[] = [
  { name: 'Accuracy (%)', proposed: 95.1, cnnHaar: 94.0, mobilenetLstm: 80.0 },
  { name: 'Precision (%)', proposed: 98.7, cnnHaar: 93.5, mobilenetLstm: 79.2 },
  { name: 'Recall / Sensitivity (%)', proposed: 93.1, cnnHaar: 92.0, mobilenetLstm: 78.5 },
  { name: 'Specificity (%)', proposed: 98.1, cnnHaar: 95.2, mobilenetLstm: 81.0 },
  { name: 'F1-Score (%)', proposed: 95.1, cnnHaar: 92.7, mobilenetLstm: 78.8 },
];

const EPOCH_DATA: TrainingEpochData[] = [
  { epoch: 1, trainAcc: 55.2, valAcc: 53.0, trainLoss: 0.69, valLoss: 0.71 },
  { epoch: 10, trainAcc: 74.5, valAcc: 72.1, trainLoss: 0.48, valLoss: 0.52 },
  { epoch: 20, trainAcc: 84.1, valAcc: 82.5, trainLoss: 0.35, valLoss: 0.38 },
  { epoch: 30, trainAcc: 89.8, valAcc: 88.2, trainLoss: 0.26, valLoss: 0.29 },
  { epoch: 40, trainAcc: 92.4, valAcc: 91.0, trainLoss: 0.20, valLoss: 0.23 },
  { epoch: 50, trainAcc: 94.8, valAcc: 93.5, trainLoss: 0.15, valLoss: 0.18 },
  { epoch: 60, trainAcc: 96.2, valAcc: 94.8, trainLoss: 0.11, valLoss: 0.15 },
  { epoch: 70, trainAcc: 97.1, valAcc: 95.1, trainLoss: 0.08, valLoss: 0.12 },
];

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      
      {/* Top Benchmark Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Accuracy</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">95.1%</div>
          <p className="text-[11px] text-slate-400 mt-1">+1.1% over CNN-Haar, +15.1% over MobileNet</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Precision</span>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">98.7%</div>
          <p className="text-[11px] text-slate-400 mt-1">Extremely low false alarm trigger rate</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Recall (Sensitivity)</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">93.1%</div>
          <p className="text-[11px] text-slate-400 mt-1">High detection rate of fatigue subjects</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">F1-Score</span>
            <Cpu className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">95.1%</div>
          <p className="text-[11px] text-slate-400 mt-1">Balanced harmonic mean of precision & recall</p>
        </div>

      </div>

      {/* Model Benchmark Comparison Bar Chart */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span>Architecture Performance Benchmark Comparison</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Proposed Haar Cascade + CNN + LSTM model vs baseline literature architectures
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MODEL_COMPARISONS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="proposed" name="Proposed Haar+CNN+LSTM (95.1%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cnnHaar" name="CNN + Haar Cascade (94.0%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mobilenetLstm" name="MobileNet + LSTM (80.0%)" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training & Validation Curves over 70 Epochs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Epoch Convergence Curves (2 cols) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Training Loss & Accuracy Curves (70 Epochs)</h3>
            <p className="text-xs text-slate-400">
              Adaptive ReduceLROnPlateau learning rate scheduler prevents overfitting while maximizing convergence
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EPOCH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="epoch" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="trainAcc" name="Training Acc (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="valAcc" name="Validation Acc (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-cyan-400" />
            <span>Confusion Matrix</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl">
              <div className="text-[10px] text-emerald-300 font-bold uppercase">True Active</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">98.1%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(Correctly Alert)</div>
            </div>

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">False Fatigue</div>
              <div className="text-xl font-extrabold text-slate-400 mt-1">1.9%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(False Alarm)</div>
            </div>

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">False Active</div>
              <div className="text-xl font-extrabold text-slate-400 mt-1">6.9%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(Missed Fatigue)</div>
            </div>

            <div className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-xl">
              <div className="text-[10px] text-rose-300 font-bold uppercase">True Fatigue</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">93.1%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(Correctly Drowsy)</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-700">
            Low false-alarm rate (1.9%) ensures drivers are not annoyed by spurious warnings during normal driving.
          </p>

        </div>

      </div>

    </div>
  );
};
