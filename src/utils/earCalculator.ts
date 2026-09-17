// Helper functions to calculate Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR)

export interface Point2D {
  x: number;
  y: number;
}

export function EuclideanDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Calculates Eye Aspect Ratio (EAR) given 6 eye boundary points
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 */
export function calculateEAR(landmarks: Point2D[]): number {
  if (landmarks.length < 6) return 0.3;
  
  const p1 = landmarks[0];
  const p2 = landmarks[1];
  const p3 = landmarks[2];
  const p4 = landmarks[3];
  const p5 = landmarks[4];
  const p6 = landmarks[5];

  const vert1 = EuclideanDistance(p2, p6);
  const vert2 = EuclideanDistance(p3, p5);
  const horiz = EuclideanDistance(p1, p4);

  if (horiz === 0) return 0.3;
  return (vert1 + vert2) / (2.0 * horiz);
}

/**
 * Calculates Mouth Aspect Ratio (MAR) given inner lip landmarks
 */
export function calculateMAR(landmarks: Point2D[]): number {
  if (landmarks.length < 4) return 0.1;
  const left = landmarks[0];
  const right = landmarks[1];
  const top = landmarks[2];
  const bottom = landmarks[3];

  const vert = EuclideanDistance(top, bottom);
  const horiz = EuclideanDistance(left, right);

  if (horiz === 0) return 0.1;
  return vert / horiz;
}

export const DEFAULT_EAR_THRESHOLD = 0.22;
export const DEFAULT_MAR_THRESHOLD = 0.55;
