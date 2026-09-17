import React, { useState } from 'react';
import { Cpu, Layers, Eye, Film, ArrowRight, Activity, CheckCircle, Sliders, Shield } from 'lucide-react';

export const ModelArchitecture: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const stages = [
    {
      step: '01',
      title: 'Video Frame Capture & Preprocessing',
      subtitle: '145x145 Pixel Normalization',
      icon: Film,
      description:
        'Live video stream frames are captured and downsampled to a uniform 145x145 pixel resolution with RGB color channel normalization [0, 1]. Data augmentation (rotation, zooming, horizontal flipping) increases model generalization.',
      details: [
        'Input shape: (Batch Size, 145, 145, 3)',
        'Facial landmark detection locates eye and mouth boundaries',
        'Frame rate sampling rate: 30 FPS',
      ],
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400',
    },
    {
      step: '02',
      title: 'Haar Cascade & Spatial Extractor',
      subtitle: 'Region of Interest (ROI) Localization',
      icon: Eye,
      description:
        'Haar Cascade classifier detects facial boundaries and isolates key facial regions of interest (eyes and mouth). Calculates geometric Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR) metrics.',
      details: [
        'Haar Cascade eye & face feature detection',
        'EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)',
        'Filters non-facial noise from raw video stream',
      ],
      color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/40 text-cyan-400',
    },
    {
      step: '03',
      title: 'Convolutional Neural Network (CNN)',
      subtitle: 'Spatial Feature Map Extraction',
      icon: Cpu,
      description:
        'Multi-layer 2D Convolutional Neural Network extracts high-level spatial visual features such as eyelid distance, pupil position, texture, and facial muscle tension.',
      details: [
        'Layer 1: Conv2D(32, 3x3) + BatchNorm + MaxPool + Dropout(0.25)',
        'Layer 2: Conv2D(64, 3x3) + BatchNorm + MaxPool + Dropout(0.25)',
        'Layer 3: Conv2D(128, 3x3) + BatchNorm + MaxPool + Dropout(0.25)',
        'Outputs dense spatial embedding vector per frame',
      ],
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400',
    },
    {
      step: '04',
      title: 'Long Short-Term Memory (LSTM)',
      subtitle: 'Temporal Dependency & Sequence Processing',
      icon: Layers,
      description:
        'LSTM recurrent network receives spatial feature embeddings from a sliding window sequence of consecutive frames (T=16). Recurrent gates capture eyelid movement velocity and prolonged closures across time.',
      details: [
        'Input sequence tensor: (Batch, Sequence Length T=16, Feature Dim)',
        'LSTM Layer: 128 hidden units with tanh & sigmoid recurrent gates',
        'Differentiates rapid natural blinks (~0.15s) from fatigue micro-sleep (>0.50s)',
      ],
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/40 text-rose-400',
    },
    {
      step: '05',
      title: 'Classification & Alert System',
      subtitle: 'Sigmoid Binary Output Layer',
      icon: Shield,
      description:
        'Fully connected Dense layer with Sigmoid activation computes the probability of driver fatigue [0.0 - 1.0]. Triggers visual HUD indicators and auditory alarm synthesizer when threshold is exceeded.',
      details: [
        'Dense(64) -> Dropout(0.50) -> Dense(1, activation="sigmoid")',
        'Binary Cross-Entropy Loss optimization via Adam optimizer',
        'Achieves 95.1% overall classification accuracy on benchmark dataset',
      ],
      color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/40 text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Overview Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
              <Cpu className="w-3.5 h-3.5" /> Proposed Model Architecture
            </div>
            <h2 className="text-xl font-extrabold text-white">Hybrid Haar Cascade + CNN + LSTM Network</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Combining spatial convolutional feature extraction with recurrent sequence memory allows the system to analyze both instantaneous visual posture and temporal eye closure patterns.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-700">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Model Accuracy</div>
              <div className="text-lg font-black text-emerald-400">95.1%</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">F1-Score</div>
              <div className="text-lg font-black text-rose-400">95.1%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stg, idx) => {
          const Icon = stg.icon;
          const isSelected = selectedStage === idx;
          return (
            <div
              key={stg.step}
              onClick={() => setSelectedStage(idx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? `bg-slate-800 border-2 shadow-lg shadow-rose-950/20 ${stg.color}`
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/80 text-slate-400">
                  STEP {stg.step}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <h3 className="text-xs font-bold text-white line-clamp-1">{stg.title}</h3>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{stg.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black text-rose-400">{stages[selectedStage].step}</span>
            <div>
              <h3 className="text-lg font-bold text-white">{stages[selectedStage].title}</h3>
              <p className="text-xs text-rose-300 font-medium">{stages[selectedStage].subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            {stages[selectedStage].description}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Technical Specifications & Hyperparameters:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stages[selectedStage].details.map((detail, dIdx) => (
                <div key={dIdx} className="flex items-start space-x-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code / Architecture Schema Preview */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3 overflow-x-auto">
          <div className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-800 pb-2">
            Keras / TensorFlow Model Summary
          </div>
          <pre className="text-[11px] leading-relaxed text-emerald-300">
{selectedStage === 0 && `input_layer = Input(shape=(145, 145, 3))
x = Rescaling(1./255)(input_layer)
# Image dimensions: 145x145x3`}

{selectedStage === 1 && `def extract_roi(frame):
  faces = haar_cascade.detectMultiScale(frame)
  ear = calculate_ear(eye_landmarks)
  mar = calculate_mar(mouth_landmarks)
  return cropped_roi, ear, mar`}

{selectedStage === 2 && `x = Conv2D(32, (3,3), activation='relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D((2,2))(x)
x = Conv2D(64, (3,3), activation='relu')(x)
x = Conv2D(128, (3,3), activation='relu')(x)
spatial_features = Flatten()(x)`}

{selectedStage === 3 && `seq_input = TimeDistributed(CNN_model)(input_seq)
lstm_out = LSTM(128, return_sequences=False)(seq_input)
# Evaluates temporal sequence over 16 frames`}

{selectedStage === 4 && `dense_1 = Dense(64, activation='relu')(lstm_out)
dropout = Dropout(0.5)(dense_1)
output = Dense(1, activation='sigmoid')(dropout)
# Loss: binary_crossentropy, Opt: Adam(lr=0.001)`}
          </pre>
        </div>

      </div>

    </div>
  );
};
