export type FaceBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type VisionFeatures = {
  fps: number;
  faces: FaceBox[];
  histogram: number[];
  motionScore: number;
  frameWidth: number;
  frameHeight: number;
};

export const HISTOGRAM_BINS = 16;
export const HISTOGRAM_SAMPLES = 1024;
