import React from 'react';
import { BookOpen, FileCode, Database, CheckCircle2, Award, Terminal } from 'lucide-react';

export const NotebookDoc: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Overview Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-md w-fit">
          <BookOpen className="w-4 h-4" /> Research Paper & Jupyter Notebook Overview
        </div>
        <h2 className="text-xl font-extrabold text-white">Driver Drowsiness Detection Using CNN-LSTM Fusion Model</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Based on <code className="bg-slate-900 text-rose-300 px-1.5 py-0.5 rounded">DDD_finalProject.ipynb</code> and the research paper publication in Intelligent Transportation Systems (ITS).
        </p>
      </div>

      {/* Grid of Key Research Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dataset Preprocessing */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-2 border-b border-slate-700">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Dataset & Preprocessing Pipeline</h3>
          </div>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Datasets Used:</strong> Drowsiness Prediction Dataset & Prediction Images Dataset containing labeled open/closed eyes and fatigue postures.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Image Resizing:</strong> All facial regions resized to 145x145 pixels and normalized to scale [0, 1].</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Facial Landmark Extraction:</strong> Key landmark points extracted around eye contours (p1..p6) to compute Eye Aspect Ratio (EAR) and mouth contours for Mouth Aspect Ratio (MAR).</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Data Augmentation:</strong> Random rotations, zooming, horizontal flipping, and brightness adjustments to ensure robustness under varying cab lighting.</span>
            </li>
          </ul>
        </div>

        {/* Training & Optimization Strategy */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-2 border-b border-slate-700">
            <FileCode className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Hyperparameters & Training Strategy</h3>
          </div>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Optimizer:</strong> Adam with initial learning rate <code className="bg-slate-900 text-purple-300 px-1 rounded">1e-3</code>.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Loss Function:</strong> <code className="bg-slate-900 text-cyan-300 px-1 rounded">binary_crossentropy</code> for classification into Active vs Fatigue Subjects.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Adaptive Callbacks:</strong> <code className="bg-slate-900 text-rose-300 px-1 rounded">ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3)</code> adaptively reduces LR when validation performance plateaus.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Training Duration:</strong> Trained over 70 epochs with early stopping guards against overfitting.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Code Snippets from DDD_finalProject.ipynb */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Core Python Code Snippet from <code className="text-emerald-400">DDD_finalProject.ipynb</code></span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
          <pre className="text-emerald-300">
{`# 1. Eye Aspect Ratio (EAR) Calculation
def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

# 2. Hybrid CNN-LSTM Model Architecture
model = Sequential([
    TimeDistributed(Conv2D(32, (3, 3), activation='relu'), input_shape=(16, 145, 145, 3)),
    TimeDistributed(BatchNormalization()),
    TimeDistributed(MaxPooling2D((2, 2))),
    TimeDistributed(Conv2D(64, (3, 3), activation='relu')),
    TimeDistributed(BatchNormalization()),
    TimeDistributed(MaxPooling2D((2, 2))),
    TimeDistributed(Flatten()),
    LSTM(128, return_sequences=False),
    Dense(64, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

model.compile(optimizer=Adam(lr=0.001), loss='binary_crossentropy', metrics=['accuracy'])`}
          </pre>
        </div>
      </div>

    </div>
  );
};
