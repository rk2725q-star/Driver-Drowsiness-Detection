import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceLandmarkResult {
  isDetected: boolean;
  landmarks?: { x: number; y: number; z: number }[];
  leftEyeLandmarks?: { x: number; y: number }[];
  rightEyeLandmarks?: { x: number; y: number }[];
  mouthLandmarks?: { x: number; y: number }[];
  faceBox?: { x: number; y: number; w: number; h: number };
  leftEyeBox?: { x: number; y: number; w: number; h: number };
  rightEyeBox?: { x: number; y: number; w: number; h: number };
  mouthBox?: { x: number; y: number; w: number; h: number };
  leftEyeEAR: number;
  rightEyeEAR: number;
  avgEAR: number;
  mar: number;
  leftBlinkScore: number;
  rightBlinkScore: number;
  jawOpenScore: number;
  isEyesClosed: boolean;
  isYawning: boolean;
}

// MediaPipe 468/478 Landmark Indices
export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
export const LEFT_EYE_OUTLINE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
export const RIGHT_EYE_OUTLINE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263];
export const LIPS_OUTLINE = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61];

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<FaceLandmarker | null> | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Attempt GPU first, then CPU fallback
      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });
        return faceLandmarkerInstance;
      } catch (gpuErr) {
        console.warn('MediaPipe GPU initialization failed, falling back to CPU:', gpuErr);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });
        return faceLandmarkerInstance;
      }
    } catch (err) {
      console.error('Failed to initialize MediaPipe FaceLandmarker:', err);
      return null;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

// Compute Euclidean distance in 2D
function dist2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate Eye Aspect Ratio from 6 landmark points
export function calculateLandmarkEAR(landmarks: { x: number; y: number }[], indices: number[]): number {
  const p1 = landmarks[indices[0]]; // outer corner
  const p2 = landmarks[indices[1]]; // top-1
  const p3 = landmarks[indices[2]]; // top-2
  const p4 = landmarks[indices[3]]; // inner corner
  const p5 = landmarks[indices[4]]; // bottom-2
  const p6 = landmarks[indices[5]]; // bottom-1

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0.3;

  const vertical1 = dist2D(p2, p6);
  const vertical2 = dist2D(p3, p5);
  const horizontal = dist2D(p1, p4);

  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// Compute bounding box containing a subset of landmarks
function getBBox(points: { x: number; y: number }[], width: number, height: number, padding = 10) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    const px = p.x * width;
    const py = p.y * height;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const w = Math.min(width - x, maxX - minX + padding * 2);
  const h = Math.min(height - y, maxY - minY + padding * 2);

  return { x, y, w, h };
}

/**
 * Process a single video frame with MediaPipe Face Landmarker
 */
export function analyzeVideoFrameWithMediaPipe(
  landmarker: FaceLandmarker,
  videoElement: HTMLVideoElement,
  timestampMs: number,
  canvasWidth: number,
  canvasHeight: number
): FaceLandmarkResult {
  try {
    const results = landmarker.detectForVideo(videoElement, timestampMs);

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        isDetected: false,
        leftEyeEAR: 0.3,
        rightEyeEAR: 0.3,
        avgEAR: 0.3,
        mar: 0.1,
        leftBlinkScore: 0,
        rightBlinkScore: 0,
        jawOpenScore: 0,
        isEyesClosed: false,
        isYawning: false,
      };
    }

    const rawLandmarks = results.faceLandmarks[0];

    // Compute EAR directly from exact 3D eyelid points
    const leftEyeEAR = calculateLandmarkEAR(rawLandmarks, LEFT_EYE_INDICES);
    const rightEyeEAR = calculateLandmarkEAR(rawLandmarks, RIGHT_EYE_INDICES);
    const rawAvgEAR = (leftEyeEAR + rightEyeEAR) / 2.0;

    // Extract Blendshapes
    let leftBlinkScore = 0;
    let rightBlinkScore = 0;
    let jawOpenScore = 0;

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const categories = results.faceBlendshapes[0].categories;
      for (const cat of categories) {
        if (cat.categoryName === 'eyeBlinkLeft') leftBlinkScore = cat.score;
        if (cat.categoryName === 'eyeBlinkRight') rightBlinkScore = cat.score;
        if (cat.categoryName === 'jawOpen') jawOpenScore = cat.score;
      }
    }

    const maxBlink = Math.max(leftBlinkScore, rightBlinkScore);

    // MAR calculation
    const lipTop = rawLandmarks[13];
    const lipBottom = rawLandmarks[14];
    const lipLeft = rawLandmarks[78];
    const lipRight = rawLandmarks[308];
    const lipHeight = lipTop && lipBottom ? dist2D(lipTop, lipBottom) : 0.05;
    const lipWidth = lipLeft && lipRight ? dist2D(lipLeft, lipRight) : 0.15;
    const computedMAR = lipWidth > 0 ? lipHeight / lipWidth : 0.1;
    const calibratedMAR = Math.max(computedMAR, jawOpenScore * 0.9);

    const faceBox = getBBox(rawLandmarks, canvasWidth, canvasHeight, 14);

    const leftEyePoints = LEFT_EYE_OUTLINE.map((idx) => rawLandmarks[idx]).filter(Boolean);
    const rightEyePoints = RIGHT_EYE_OUTLINE.map((idx) => rawLandmarks[idx]).filter(Boolean);
    const mouthPoints = LIPS_OUTLINE.map((idx) => rawLandmarks[idx]).filter(Boolean);

    const leftEyeBox = getBBox(leftEyePoints, canvasWidth, canvasHeight, 6);
    const rightEyeBox = getBBox(rightEyePoints, canvasWidth, canvasHeight, 6);
    const mouthBox = getBBox(mouthPoints, canvasWidth, canvasHeight, 8);

    // True closed eye only when BOTH blink score is high (>0.60) OR EAR drops below 0.15
    const isEyesClosed = maxBlink > 0.60 || rawAvgEAR < 0.15;
    const isYawning = calibratedMAR > 0.58 || jawOpenScore > 0.65;

    return {
      isDetected: true,
      landmarks: rawLandmarks,
      leftEyeLandmarks: leftEyePoints,
      rightEyeLandmarks: rightEyePoints,
      mouthLandmarks: mouthPoints,
      faceBox,
      leftEyeBox,
      rightEyeBox,
      mouthBox,
      leftEyeEAR,
      rightEyeEAR,
      avgEAR: rawAvgEAR,
      mar: calibratedMAR,
      leftBlinkScore,
      rightBlinkScore,
      jawOpenScore,
      isEyesClosed,
      isYawning,
    };
  } catch (err) {
    console.warn('Error analyzing frame with MediaPipe:', err);
    return {
      isDetected: false,
      leftEyeEAR: 0.3,
      rightEyeEAR: 0.3,
      avgEAR: 0.3,
      mar: 0.1,
      leftBlinkScore: 0,
      rightBlinkScore: 0,
      jawOpenScore: 0,
      isEyesClosed: false,
      isYawning: false,
    };
  }
}
