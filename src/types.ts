export type DetectionStatus = 'ALERT' | 'WARMING' | 'DROWSY' | 'MICRO_SLEEP' | 'NO_FACE';

export interface BoundingBoxCoords {
  ymin: number; // 0 to 1000
  xmin: number; // 0 to 1000
  ymax: number; // 0 to 1000
  xmax: number; // 0 to 1000
}

export interface AIVisionAnalysis {
  isFaceDetected: boolean;
  faceBox?: BoundingBoxCoords;
  leftEyeBox?: BoundingBoxCoords;
  rightEyeBox?: BoundingBoxCoords;
  mouthBox?: BoundingBoxCoords;
  leftEyeOpenness: number; // 0 to 100
  rightEyeOpenness: number; // 0 to 100
  isBlinking: boolean;
  isYawning: boolean;
  mouthOpenness: number; // 0 to 100
  headPosture: 'CENTER' | 'NODDING_DOWN' | 'TILTED_SIDE' | 'LOOKING_AWAY';
  gazeDirection: 'ROAD_AHEAD' | 'DISTRACTED' | 'EYES_CLOSED';
  drowsinessLevel: 'ALERT' | 'MILD_FATIGUE' | 'DROWSY' | 'CRITICAL_MICROSLEEP';
  fatigueConfidence: number; // 0 to 100
  facialTension?: 'RELAXED' | 'TIRED_STRAIN' | 'NORMAL';
  detailedDiagnosis: string;
  safetyAdvice: string;
  aiSource?: string;
  timestamp?: number;
}

export interface DetectionFrameData {
  timestamp: number;
  ear: number; // Eye Aspect Ratio
  mar: number; // Mouth Aspect Ratio
  headPosePitch: number; // Head tilt
  status: DetectionStatus;
  drowsinessProbability: number; // 0 to 1
  blinkRate: number; // Blinks per minute
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  driverName: string;
  avatarUrl: string;
  baseEar: number;
  baseMar: number;
  drowsinessTrend: 'STABLE' | 'DECREASING_EAR' | 'YAWNING' | 'NODDING';
  durationSeconds: number;
}

export interface ModelMetric {
  name: string;
  proposed: number; // Haar + CNN + LSTM
  cnnHaar: number; // CNN + Haar Cascade
  mobilenetLstm: number; // MobileNet + LSTM
}

export interface TrainingEpochData {
  epoch: number;
  trainAcc: number;
  valAcc: number;
  trainLoss: number;
  valLoss: number;
}

export interface ConfusionMatrixData {
  actualActivePredictedActive: number;
  actualActivePredictedFatigue: number;
  actualFatiguePredictedActive: number;
  actualFatiguePredictedFatigue: number;
}
