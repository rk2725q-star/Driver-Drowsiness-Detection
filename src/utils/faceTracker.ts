import { BoundingBoxCoords } from '../types';

export interface TrackedFaceData {
  isDetected: boolean;
  faceBox: { x: number; y: number; w: number; h: number };
  leftEyeBox: { x: number; y: number; w: number; h: number };
  rightEyeBox: { x: number; y: number; w: number; h: number };
  mouthBox: { x: number; y: number; w: number; h: number };
  confidence: number;
}

export class DynamicFaceTracker {
  private smoothedFaceBox: { x: number; y: number; w: number; h: number } | null = null;
  private smoothedLeftEye: { x: number; y: number; w: number; h: number } | null = null;
  private smoothedRightEye: { x: number; y: number; w: number; h: number } | null = null;
  private smoothedMouth: { x: number; y: number; w: number; h: number } | null = null;
  private lastDetectedTimestamp = 0;
  private alpha = 0.35; // Smoothing factor for buttery smooth tracking

  // Helper to convert 0-1000 normalized bbox to canvas px
  private normToPx(box: BoundingBoxCoords, width: number, height: number) {
    const x = (box.xmin / 1000) * width;
    const y = (box.ymin / 1000) * height;
    const w = ((box.xmax - box.xmin) / 1000) * width;
    const h = ((box.ymax - box.ymin) / 1000) * height;
    return {
      x: Math.max(0, Math.min(width - 20, x)),
      y: Math.max(0, Math.min(height - 20, y)),
      w: Math.max(20, Math.min(width, w)),
      h: Math.max(20, Math.min(height, h)),
    };
  }

  // Linear interpolation for smooth boxes
  private lerpBox(
    current: { x: number; y: number; w: number; h: number } | null,
    target: { x: number; y: number; w: number; h: number },
    factor = 0.35
  ) {
    if (!current) return { ...target };
    return {
      x: current.x + (target.x - current.x) * factor,
      y: current.y + (target.y - current.y) * factor,
      w: current.w + (target.w - current.w) * factor,
      h: current.h + (target.h - current.h) * factor,
    };
  }

  /**
   * Update tracker from Gemini AI Vision Ground Truth Box
   */
  public updateFromAiVision(
    aiFaceBox: BoundingBoxCoords | undefined,
    aiLeftEye: BoundingBoxCoords | undefined,
    aiRightEye: BoundingBoxCoords | undefined,
    aiMouth: BoundingBoxCoords | undefined,
    width: number,
    height: number
  ) {
    if (aiFaceBox) {
      const targetFace = this.normToPx(aiFaceBox, width, height);
      this.smoothedFaceBox = this.lerpBox(this.smoothedFaceBox, targetFace, 0.65);
      this.lastDetectedTimestamp = Date.now();
    }
    if (aiLeftEye) {
      const targetEye = this.normToPx(aiLeftEye, width, height);
      this.smoothedLeftEye = this.lerpBox(this.smoothedLeftEye, targetEye, 0.65);
    }
    if (aiRightEye) {
      const targetEye = this.normToPx(aiRightEye, width, height);
      this.smoothedRightEye = this.lerpBox(this.smoothedRightEye, targetEye, 0.65);
    }
    if (aiMouth) {
      const targetMouth = this.normToPx(aiMouth, width, height);
      this.smoothedMouth = this.lerpBox(this.smoothedMouth, targetMouth, 0.65);
    }
  }

  /**
   * Full-frame dynamic face detection & optical tracking in real-time
   */
  public trackInCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    nativeDetectedFace?: { x: number; y: number; width: number; height: number } | null
  ): TrackedFaceData {
    // 1. If Native Browser FaceDetector found a face, use it immediately
    if (nativeDetectedFace) {
      const target = {
        x: nativeDetectedFace.x,
        y: nativeDetectedFace.y,
        w: nativeDetectedFace.width,
        h: nativeDetectedFace.height,
      };
      this.smoothedFaceBox = this.lerpBox(this.smoothedFaceBox, target, this.alpha);
      this.lastDetectedTimestamp = Date.now();
    } else {
      // 2. Full-frame optical Skin & Luminance Centroid Scanner across entire image
      // Downsample grid step for high 60fps performance
      const step = 6;
      let imgData: ImageData;
      try {
        imgData = ctx.getImageData(0, 0, width, height);
      } catch (e) {
        return this.getFallback(width, height);
      }

      const data = imgData.data;
      let skinPixelCount = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Universal Skin Chrominance Filter across light & dark lighting conditions:
          // Standard Rule: R > 55, G > 40, B > 20, R > G, R > B, |R-G| > 10
          const isSkin =
            r > 45 &&
            g > 30 &&
            b > 18 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 8 &&
            r - Math.min(g, b) > 10;

          if (isSkin) {
            skinPixelCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const minSkinPixels = ((width * height) / (step * step)) * 0.035;

      if (skinPixelCount > minSkinPixels && minX < maxX && minY < maxY) {
        const centroidX = sumX / skinPixelCount;
        const centroidY = sumY / skinPixelCount;

        const rawW = Math.max(80, Math.min(width * 0.7, (maxX - minX) * 0.9));
        const rawH = Math.max(100, Math.min(height * 0.8, (maxY - minY) * 0.95));

        const boxX = Math.max(0, Math.min(width - rawW, centroidX - rawW / 2));
        const boxY = Math.max(0, Math.min(height - rawH, centroidY - rawH / 2));

        const target = { x: boxX, y: boxY, w: rawW, h: rawH };
        this.smoothedFaceBox = this.lerpBox(this.smoothedFaceBox, target, this.alpha);
        this.lastDetectedTimestamp = Date.now();
      } else {
        // If no skin detected for > 1500ms, clear face detection
        if (Date.now() - this.lastDetectedTimestamp > 1500) {
          this.smoothedFaceBox = null;
        }
      }
    }

    if (!this.smoothedFaceBox) {
      return {
        isDetected: false,
        faceBox: { x: 0, y: 0, w: 0, h: 0 },
        leftEyeBox: { x: 0, y: 0, w: 0, h: 0 },
        rightEyeBox: { x: 0, y: 0, w: 0, h: 0 },
        mouthBox: { x: 0, y: 0, w: 0, h: 0 },
        confidence: 0,
      };
    }

    const face = this.smoothedFaceBox;

    // Dynamically derive eye and mouth boxes inside the tracked face
    const leftEyeTarget = {
      x: face.x + face.w * 0.14,
      y: face.y + face.h * 0.28,
      w: face.w * 0.32,
      h: face.h * 0.22,
    };
    const rightEyeTarget = {
      x: face.x + face.w * 0.54,
      y: face.y + face.h * 0.28,
      w: face.w * 0.32,
      h: face.h * 0.22,
    };
    const mouthTarget = {
      x: face.x + face.w * 0.24,
      y: face.y + face.h * 0.68,
      w: face.w * 0.52,
      h: face.h * 0.22,
    };

    this.smoothedLeftEye = this.lerpBox(this.smoothedLeftEye, leftEyeTarget, 0.4);
    this.smoothedRightEye = this.lerpBox(this.smoothedRightEye, rightEyeTarget, 0.4);
    this.smoothedMouth = this.lerpBox(this.smoothedMouth, mouthTarget, 0.4);

    return {
      isDetected: true,
      faceBox: this.smoothedFaceBox,
      leftEyeBox: this.smoothedLeftEye || leftEyeTarget,
      rightEyeBox: this.smoothedRightEye || rightEyeTarget,
      mouthBox: this.smoothedMouth || mouthTarget,
      confidence: 0.95,
    };
  }

  private getFallback(width: number, height: number): TrackedFaceData {
    return {
      isDetected: false,
      faceBox: { x: 0, y: 0, w: 0, h: 0 },
      leftEyeBox: { x: 0, y: 0, w: 0, h: 0 },
      rightEyeBox: { x: 0, y: 0, w: 0, h: 0 },
      mouthBox: { x: 0, y: 0, w: 0, h: 0 },
      confidence: 0,
    };
  }

  public reset() {
    this.smoothedFaceBox = null;
    this.smoothedLeftEye = null;
    this.smoothedRightEye = null;
    this.smoothedMouth = null;
    this.lastDetectedTimestamp = 0;
  }
}
