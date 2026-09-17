import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  AlertTriangle,
  Volume2,
  VolumeX,
  Settings2,
  Activity,
  Sparkles,
  Bot,
  Crosshair,
  Glasses,
  Scan,
  RefreshCw,
  BellRing,
  CheckCircle2,
  Sliders,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { alarmSynth } from '../utils/audioAlarm';
import { AIVisionAnalysis, DetectionFrameData, DetectionStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  getFaceLandmarker,
  analyzeVideoFrameWithMediaPipe,
  FaceLandmarkResult,
  LEFT_EYE_OUTLINE,
  RIGHT_EYE_OUTLINE,
  LIPS_OUTLINE,
} from '../utils/mediaPipeService';

export const WebcamDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const aiVisionIntervalRef = useRef<number | null>(null);
  const isAnalyzingAiRef = useRef<boolean>(false);
  const landmarkerRef = useRef<any>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Auto-Calibration State
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [openEyeBaseline, setOpenEyeBaseline] = useState<number>(0.26);
  const calibrationSamplesRef = useRef<number[]>([]);

  // Detection Thresholds (Default set to safe low values to avoid false alarms)
  const [earThreshold, setEarThreshold] = useState<number>(0.15); // Safe threshold: closed is < 0.15
  const [marThreshold, setMarThreshold] = useState<number>(0.58);
  const [consecutiveFrameLimit, setConsecutiveFrameLimit] = useState<number>(35); // ~1.2s at 30fps (ignores blinks!)

  // Realtime Telemetry State
  const [currentEar, setCurrentEar] = useState<number>(0.26);
  const [currentMar, setCurrentMar] = useState<number>(0.12);
  const [blinkScore, setBlinkScore] = useState<number>(0);
  const [status, setStatus] = useState<DetectionStatus>('ALERT');
  const [drowsyProbability, setDrowsyProbability] = useState<number>(0.05);
  const [closedFramesCount, setClosedFramesCount] = useState<number>(0);
  const [frameHistory, setFrameHistory] = useState<DetectionFrameData[]>([]);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [facePositionInfo, setFacePositionInfo] = useState<string>('Initializing 478-Point Face Mesh...');

  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [lastAiAnalysis, setLastAiAnalysis] = useState<AIVisionAnalysis | null>(null);

  const frameCounterRef = useRef<number>(0);
  const consecutiveClosedRef = useRef<number>(0);
  const lastAlarmSoundTime = useRef<number>(0);

  // Initialize MediaPipe Face Landmarker on mount
  useEffect(() => {
    let isMounted = true;
    getFaceLandmarker().then((landmarker) => {
      if (isMounted && landmarker) {
        landmarkerRef.current = landmarker;
        setIsMediaPipeReady(true);
        setFacePositionInfo('MediaPipe 478-Point Mesh Ready');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger User Open-Eye Calibration (3 seconds of sampling)
  const startEyeCalibration = () => {
    calibrationSamplesRef.current = [];
    setCalibrationProgress(0);
    setIsCalibrating(true);
  };

  // Capture canvas snapshot for AI Vision
  const captureFrameSnapshot = (): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 480;
    snapCanvas.height = 360;
    const snapCtx = snapCanvas.getContext('2d');
    if (!snapCtx) return null;

    snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    return snapCanvas.toDataURL('image/jpeg', 0.85);
  };

  // AI Vision Diagnostic Check
  const runAiVisionAnalysis = useCallback(async () => {
    if (isAnalyzingAiRef.current) return;
    const snapshot = captureFrameSnapshot();
    if (!snapshot) return;

    isAnalyzingAiRef.current = true;
    setIsAiAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: snapshot,
          clientEar: currentEar,
          clientMar: currentMar,
        }),
      });

      if (res.ok) {
        const data: AIVisionAnalysis = await res.json();
        setLastAiAnalysis(data);
      }
    } catch (err) {
      // Ignored: edge tracking remains completely autonomous
    } finally {
      isAnalyzingAiRef.current = false;
      setIsAiAnalyzing(false);
    }
  }, [currentEar, currentMar]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    alarmSynth.initContext(); // Unlock Web Audio immediately

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        // Trigger auto-calibration on start
        setTimeout(() => startEyeCalibration(), 800);
      }
    } catch (err: any) {
      console.warn('Webcam permission error:', err);
      setCameraError(
        'Could not access camera. Please allow camera permissions in your browser or phone settings.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsFaceDetected(false);
    setIsCalibrating(false);
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    if (aiVisionIntervalRef.current) clearInterval(aiVisionIntervalRef.current);
    alarmSynth.stopAlarm();
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    alarmSynth.setMuted(nextMuted);
  };

  // Main 60FPS Video Computer Vision Frame Loop
  const processFrame = useCallback(async () => {
    frameCounterRef.current += 1;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || video.readyState < 2) {
      if (isCameraActive) {
        animFrameId.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw video feed onto canvas
    ctx.drawImage(video, 0, 0, width, height);

    let landmarkResult: FaceLandmarkResult | null = null;

    if (landmarkerRef.current) {
      const now = performance.now();
      landmarkResult = analyzeVideoFrameWithMediaPipe(
        landmarkerRef.current,
        video,
        now,
        width,
        height
      );
    }

    if (landmarkResult && landmarkResult.isDetected && landmarkResult.landmarks) {
      setIsFaceDetected(true);
      const rawLandmarks = landmarkResult.landmarks;
      const computedEar = landmarkResult.avgEAR;
      const computedMar = landmarkResult.mar;
      const maxBlink = Math.max(landmarkResult.leftBlinkScore, landmarkResult.rightBlinkScore);

      setCurrentEar(parseFloat(computedEar.toFixed(3)));
      setCurrentMar(parseFloat(computedMar.toFixed(3)));
      setBlinkScore(parseFloat(maxBlink.toFixed(2)));

      // Handle Calibration
      if (isCalibrating) {
        calibrationSamplesRef.current.push(computedEar);
        const progress = Math.min(100, Math.round((calibrationSamplesRef.current.length / 75) * 100));
        setCalibrationProgress(progress);

        if (calibrationSamplesRef.current.length >= 75) {
          const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / calibrationSamplesRef.current.length;
          const safeThreshold = parseFloat(Math.max(0.12, Math.min(0.22, avg * 0.62)).toFixed(2));
          setOpenEyeBaseline(parseFloat(avg.toFixed(3)));
          setEarThreshold(safeThreshold);
          setIsCalibrating(false);
        }
      }

      // 1. Draw Real-time 3D Facial Landmark Contours
      // Eyelid Outlines
      const isCurrentlyClosed = computedEar < earThreshold || maxBlink > 0.65;

      ctx.strokeStyle = isCurrentlyClosed ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2.5;

      // Left Eye
      ctx.beginPath();
      LEFT_EYE_OUTLINE.forEach((idx, i) => {
        const pt = rawLandmarks[idx];
        if (pt) {
          const x = pt.x * width;
          const y = pt.y * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Right Eye
      ctx.beginPath();
      RIGHT_EYE_OUTLINE.forEach((idx, i) => {
        const pt = rawLandmarks[idx];
        if (pt) {
          const x = pt.x * width;
          const y = pt.y * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw Irises
      const leftIris = rawLandmarks[468] || rawLandmarks[33];
      const rightIris = rawLandmarks[473] || rawLandmarks[362];
      if (leftIris && rightIris) {
        ctx.fillStyle = isCurrentlyClosed ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(leftIris.x * width, leftIris.y * height, 3, 0, Math.PI * 2);
        ctx.arc(rightIris.x * width, rightIris.y * height, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Lips Outline
      ctx.strokeStyle = landmarkResult.isYawning ? '#fbbf24' : '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      LIPS_OUTLINE.forEach((idx, i) => {
        const pt = rawLandmarks[idx];
        if (pt) {
          const x = pt.x * width;
          const y = pt.y * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw Outer Head Bounding Box
      if (landmarkResult.faceBox) {
        const fb = landmarkResult.faceBox;
        ctx.strokeStyle = isCurrentlyClosed ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(fb.x, fb.y, fb.w, fb.h);

        // Header Pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(fb.x, Math.max(0, fb.y - 24), Math.min(fb.w, 190), 22);
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = isCurrentlyClosed ? '#f87171' : '#34d399';
        ctx.fillText(
          isCurrentlyClosed ? '⚠️ EYES CLOSED' : '👁️ EYES OPEN (ATTENTIVE)',
          fb.x + 6,
          Math.max(14, fb.y - 8)
        );

        setFacePositionInfo(`Dynamic Lock (${Math.round(fb.x)}, ${Math.round(fb.y)})`);
      }

      // Top-Left Telemetry HUD
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(10, 10, 290, 54);
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = isCurrentlyClosed ? '#f87171' : '#34d399';
      ctx.fillText(`Live EAR: ${computedEar.toFixed(3)}  |  Alarm Trigger: < ${earThreshold.toFixed(2)}`, 18, 30);
      ctx.fillStyle = landmarkResult.isYawning ? '#fbbf24' : '#94a3b8';
      ctx.fillText(`Baseline: ${openEyeBaseline.toFixed(3)}  |  Closed Frames: ${consecutiveClosedRef.current}`, 18, 48);

      // Eye Closure Sequence & Alarm Logic (PERCLOS Standard)
      // If eyes are genuinely closed below threshold
      if (isCurrentlyClosed && !isCalibrating) {
        consecutiveClosedRef.current += 1;
      } else {
        // As soon as eyes open, decay rapidly so blinks are forgotten immediately
        consecutiveClosedRef.current = Math.max(0, consecutiveClosedRef.current - 3);
        if (consecutiveClosedRef.current === 0) {
          alarmSynth.stopAlarm();
        }
      }

      setClosedFramesCount(consecutiveClosedRef.current);

      let nextStatus: DetectionStatus = 'ALERT';
      let prob = 0.05;

      // Alarm ONLY fires when eyes remain continuously closed for >= consecutiveFrameLimit (1.2+ seconds)
      if (consecutiveClosedRef.current >= consecutiveFrameLimit * 2) {
        nextStatus = 'MICRO_SLEEP';
        prob = 0.99;
        const nowMs = Date.now();
        if (nowMs - lastAlarmSoundTime.current > 400) {
          alarmSynth.playEmergencyAlarm();
          lastAlarmSoundTime.current = nowMs;
        }
      } else if (consecutiveClosedRef.current >= consecutiveFrameLimit) {
        nextStatus = 'DROWSY';
        prob = 0.88;
        const nowMs = Date.now();
        if (nowMs - lastAlarmSoundTime.current > 400) {
          alarmSynth.playDrowsyAlarm();
          lastAlarmSoundTime.current = nowMs;
        }
      } else if (consecutiveClosedRef.current > consecutiveFrameLimit * 0.5) {
        nextStatus = 'WARMING';
        prob = 0.45;
      }

      setStatus(nextStatus);
      setDrowsyProbability(prob);

      // Add to graph queue
      setFrameHistory((prev) => [
        ...prev.slice(-35),
        {
          timestamp: frameCounterRef.current,
          ear: parseFloat(computedEar.toFixed(3)),
          mar: parseFloat(computedMar.toFixed(3)),
          headPosePitch: 0,
          status: nextStatus,
          drowsinessProbability: prob,
          blinkRate: 15,
        },
      ]);
    } else {
      // Searching full frame
      setIsFaceDetected(false);
      setFacePositionInfo('Scanning full camera frame for face...');

      const scanY = (frameCounterRef.current * 4) % height;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(width / 2 - 130, height / 2 - 25, 260, 50);
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('🔍 SCANNING FULL FRAME FOR FACE', width / 2, height / 2 + 6);
      ctx.textAlign = 'start';

      setStatus('NO_FACE');
    }

    if (isCameraActive) {
      animFrameId.current = requestAnimationFrame(processFrame);
    }
  }, [
    earThreshold,
    marThreshold,
    consecutiveFrameLimit,
    isCameraActive,
    isCalibrating,
    openEyeBaseline,
  ]);

  useEffect(() => {
    if (isCameraActive) {
      animFrameId.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isCameraActive, processFrame]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Status Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="camera-toggle-btn"
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer flex-1 sm:flex-initial ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            {isCameraActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            <span>{isCameraActive ? 'Stop Live Camera' : 'Start Live Camera'}</span>
          </button>

          {isCameraActive && (
            <button
              id="calibrate-eyes-btn"
              onClick={startEyeCalibration}
              disabled={isCalibrating}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isCalibrating
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isCalibrating ? `Calibrating Eyes (${calibrationProgress}%)...` : '🎯 Calibrate My Open Eyes'}</span>
            </button>
          )}

          <button
            onClick={toggleMute}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={isMuted ? 'Unmute Alarm' : 'Mute Alarm'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {isCameraActive && (
            <button
              id="instant-ai-check-btn"
              onClick={() => runAiVisionAnalysis()}
              disabled={isAiAnalyzing}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAiAnalyzing ? 'animate-spin' : 'animate-pulse text-amber-300'}`} />
              <span>{isAiAnalyzing ? 'Assessing...' : '⚡ AI Diagnostic'}</span>
            </button>
          )}
        </div>

        {/* Realtime Status Badge */}
        <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              status === 'ALERT'
                ? 'bg-emerald-500 shadow-emerald-500/50 shadow-md'
                : status === 'WARMING'
                ? 'bg-amber-500 shadow-amber-500/50 shadow-md'
                : status === 'NO_FACE'
                ? 'bg-slate-500'
                : 'bg-rose-500 animate-ping shadow-rose-500/80 shadow-lg'
            }`}
          />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Detection Status</div>
            <div
              className={`text-sm font-extrabold tracking-wide ${
                status === 'ALERT'
                  ? 'text-emerald-400'
                  : status === 'WARMING'
                  ? 'text-amber-400'
                  : status === 'NO_FACE'
                  ? 'text-slate-400'
                  : 'text-rose-400'
              }`}
            >
              {status === 'ALERT' && 'ALERT & ATTENTIVE'}
              {status === 'WARMING' && 'CLOSING EYES...'}
              {status === 'DROWSY' && '⚠️ DROWSINESS ALERT!'}
              {status === 'MICRO_SLEEP' && '🚨 CRITICAL MICRO-SLEEP!'}
              {status === 'NO_FACE' && 'NO FACE IN FRAME'}
            </div>
          </div>
        </div>

      </div>

      {isCalibrating && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 p-3 rounded-xl flex items-center space-x-3 text-indigo-200 text-xs">
          <Eye className="w-5 h-5 text-indigo-400 animate-bounce" />
          <div className="flex-1">
            <div className="flex justify-between font-bold mb-1">
              <span>Looking naturally at camera with open eyes...</span>
              <span>{calibrationProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 transition-all duration-100"
                style={{ width: `${calibrationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Grid: Video Stream + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Canvas & Camera Overlay (2 cols) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
          
          <video ref={videoRef} className="hidden" playsInline muted />

          <div className="relative w-full max-w-[640px] aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
            
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 space-y-4">
                <div className="p-4 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  <Scan className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-base font-bold text-white mb-1">Zero-False-Alarm 3D Mesh Engine</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Calibrates to your natural open eyes automatically. Normal eye blinks are ignored, and alarms only sound when your eyes stay closed for &gt; 1.2 seconds!
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Live Detection</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Tracking Lock Badge */}
            {isCameraActive && (
              <div
                className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 backdrop-blur-md shadow-md ${
                  isFaceDetected
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-700'
                }`}
              >
                {isFaceDetected ? <Crosshair className="w-4 h-4 text-emerald-400" /> : <Scan className="w-4 h-4 text-cyan-400 animate-spin" />}
                <span>{facePositionInfo}</span>
              </div>
            )}

          </div>

          {/* Quick Stats Pill Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-4">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Your Live EAR</div>
              <div className={`text-base font-extrabold mt-0.5 ${currentEar < earThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentEar.toFixed(3)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Open Eye Baseline</div>
              <div className="text-base font-extrabold text-indigo-400 mt-0.5">
                {openEyeBaseline.toFixed(3)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Closed Frames</div>
              <div className={`text-base font-extrabold mt-0.5 ${closedFramesCount >= consecutiveFrameLimit ? 'text-rose-400' : 'text-cyan-400'}`}>
                {closedFramesCount} / {consecutiveFrameLimit}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Alarm State</div>
              <div className={`text-xs font-bold mt-1 ${closedFramesCount >= consecutiveFrameLimit ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`}>
                {closedFramesCount >= consecutiveFrameLimit ? '🚨 ALARM ON' : '🛡️ SAFE (EYES OPEN)'}
              </div>
            </div>
          </div>

          {/* AI Vision Deep Diagnostic Card */}
          {lastAiAnalysis && (
            <div className="w-full mt-4 bg-slate-900/90 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Gemini AI Vision Multimodal Diagnostic</span>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {lastAiAnalysis.aiSource || 'gemini-flash-latest'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Eye Openness</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {lastAiAnalysis.leftEyeOpenness}% / {lastAiAnalysis.rightEyeOpenness}%
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Gaze Direction</div>
                  <div className="font-bold text-cyan-400 mt-0.5">{lastAiAnalysis.gazeDirection}</div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Head Posture</div>
                  <div className="font-bold text-slate-200 mt-0.5">{lastAiAnalysis.headPosture}</div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Yawn Status</div>
                  <div className={`font-bold mt-0.5 ${lastAiAnalysis.isYawning ? 'text-amber-400' : 'text-slate-400'}`}>
                    {lastAiAnalysis.isYawning ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <p className="text-slate-300">{lastAiAnalysis.detailedDiagnosis}</p>
              </div>
            </div>
          )}

        </div>

        {/* Real-time Analytics & Threshold Control Settings (1 col) */}
        <div className="space-y-6">
          
          {/* EAR Over Time Live Graph */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Live Eye Aspect Ratio (EAR)</h3>
              </div>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">30 FPS</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={frameHistory}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={[0, 0.45]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <ReferenceLine y={earThreshold} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Alarm Line', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="ear" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Your open eyes stay high up in the blue region. The red alarm line is down at <strong>{earThreshold.toFixed(2)}</strong>.
            </p>
          </div>

          {/* Model Sensitivity Threshold Sliders */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Alarm Sensitivity Controls</h3>
            </div>

            {/* EAR Threshold */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Eye Closure Threshold (EAR)</span>
                <span className="text-rose-400 font-bold">{earThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.22"
                step="0.01"
                value={earThreshold}
                onChange={(e) => setEarThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Keep lower (0.13 - 0.15) to prevent any false alarm</span>
            </div>

            {/* Consecutive Frame Limit Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Consecutive Closed Frames to Alarm</span>
                <span className="text-cyan-400 font-bold">{consecutiveFrameLimit} frames (~{(consecutiveFrameLimit / 30).toFixed(1)}s)</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={consecutiveFrameLimit}
                onChange={(e) => setConsecutiveFrameLimit(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Natural blinks (~0.2s) are ignored. Alarm triggers only on prolonged closure.</span>
            </div>

            {/* Test Alarm Sound */}
            <div className="pt-2">
              <button
                id="test-alarm-btn"
                onClick={() => alarmSynth.playDrowsyAlarm()}
                className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-rose-400" />
                <span>Test Alarm Audio</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
