import { useMemo } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { computeLumaHistogram, meanLuma } from './histogram';
import type { FaceBox } from './types';

const HISTOGRAM_EVERY_N_FRAMES = 3;
const FPS_WINDOW_MS = 1000;
const MOTION_SCALE = 1 / 64;

export type VisionSharedValues = {
  fps: SharedValue<number>;
  faces: SharedValue<FaceBox[]>;
  histogram: SharedValue<number[]>;
  motionScore: SharedValue<number>;
  frameSize: SharedValue<{ width: number; height: number }>;
};

export function useVisionFeatures() {
  const fps = useSharedValue(0);
  const faces = useSharedValue<FaceBox[]>([]);
  const histogram = useSharedValue<number[]>([]);
  const motionScore = useSharedValue(0);
  const frameSize = useSharedValue({ width: 0, height: 0 });

  const lastTimestamp = useSharedValue(0);
  const frameCount = useSharedValue(0);
  const fpsWindowStart = useSharedValue(0);
  const fpsWindowFrames = useSharedValue(0);
  const previousLuma = useSharedValue(0);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    classificationMode: 'none',
    minFaceSize: 0.15,
    trackingEnabled: true,
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      const now = Date.now();
      if (fpsWindowStart.value === 0) fpsWindowStart.value = now;
      fpsWindowFrames.value += 1;
      const elapsed = now - fpsWindowStart.value;
      if (elapsed >= FPS_WINDOW_MS) {
        fps.value = (fpsWindowFrames.value * 1000) / elapsed;
        fpsWindowStart.value = now;
        fpsWindowFrames.value = 0;
      }

      frameSize.value = { width: frame.width, height: frame.height };
      frameCount.value += 1;

      const detected = detectFaces(frame);
      faces.value = detected.map((f, index) => ({
        id: f.trackingId != null ? String(f.trackingId) : `face-${index}`,
        x: f.bounds.x,
        y: f.bounds.y,
        width: f.bounds.width,
        height: f.bounds.height,
        confidence: 1,
      }));

      const currentLuma = meanLuma(frame);
      const diff = Math.abs(currentLuma - previousLuma.value);
      motionScore.value = Math.min(1, diff * MOTION_SCALE);
      previousLuma.value = currentLuma;

      if (frameCount.value % HISTOGRAM_EVERY_N_FRAMES === 0) {
        histogram.value = computeLumaHistogram(frame);
      }

      lastTimestamp.value = now;
    },
    [detectFaces],
  );

  return useMemo(
    () => ({
      frameProcessor,
      shared: { fps, faces, histogram, motionScore, frameSize },
    }),
    [frameProcessor, fps, faces, histogram, motionScore, frameSize],
  );
}
