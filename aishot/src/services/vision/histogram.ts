import type { Frame } from 'react-native-vision-camera';
import { HISTOGRAM_BINS, HISTOGRAM_SAMPLES } from './types';

export function computeLumaHistogram(frame: Frame): number[] {
  'worklet';

  const bins = new Array<number>(HISTOGRAM_BINS).fill(0);
  if (frame.pixelFormat !== 'yuv') return bins;

  const buffer = frame.toArrayBuffer();
  const bytes = new Uint8Array(buffer);
  const lumaLength = frame.width * frame.height;
  if (bytes.length < lumaLength) return bins;

  const step = Math.max(1, Math.floor(lumaLength / HISTOGRAM_SAMPLES));
  const shift = Math.log2(256 / HISTOGRAM_BINS);

  for (let i = 0; i < lumaLength; i += step) {
    const value = bytes[i] ?? 0;
    const bin = Math.min(HISTOGRAM_BINS - 1, value >> shift);
    bins[bin] = (bins[bin] ?? 0) + 1;
  }
  return bins;
}

export function meanLuma(frame: Frame): number {
  'worklet';

  if (frame.pixelFormat !== 'yuv') return 0;

  const buffer = frame.toArrayBuffer();
  const bytes = new Uint8Array(buffer);
  const lumaLength = frame.width * frame.height;
  if (bytes.length < lumaLength) return 0;

  const step = Math.max(1, Math.floor(lumaLength / HISTOGRAM_SAMPLES));
  let sum = 0;
  let count = 0;
  for (let i = 0; i < lumaLength; i += step) {
    sum += bytes[i] ?? 0;
    count++;
  }
  return count === 0 ? 0 : sum / count;
}
