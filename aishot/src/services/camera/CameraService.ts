import type { CameraDevice, CameraDeviceFormat } from 'react-native-vision-camera';
import { CameraCapabilities, CameraSettings } from '@/lib/types';

const TARGET_PHOTO_RESOLUTION = 3024 * 4032;

export function selectBestPhotoFormat(
  device: CameraDevice | undefined,
): CameraDeviceFormat | undefined {
  if (!device) return undefined;

  const scored = device.formats.map((f) => {
    const photoArea = f.photoWidth * f.photoHeight;
    const photoScore = -Math.abs(photoArea - TARGET_PHOTO_RESOLUTION);
    const fpsScore = f.maxFps ?? 0;
    const isoScore = f.maxISO - f.minISO;
    return { format: f, score: photoScore + fpsScore * 1000 + isoScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.format;
}

export function capabilitiesFromFormat(format: CameraDeviceFormat): CameraCapabilities {
  return {
    isoRange: { min: format.minISO, max: format.maxISO },
    shutterRange: {
      min: format.minExposureDuration ?? 1 / 8000,
      max: format.maxExposureDuration ?? 1 / 4,
    },
    exposureCompRange: { min: -3, max: 3 },
    whiteBalanceRange: { min: 2500, max: 8000 },
  };
}

export function clampSettings(
  settings: CameraSettings,
  caps: CameraCapabilities,
): CameraSettings {
  return {
    iso: clamp(settings.iso, caps.isoRange.min, caps.isoRange.max),
    shutterSeconds: clamp(settings.shutterSeconds, caps.shutterRange.min, caps.shutterRange.max),
    exposureCompensation: clamp(
      settings.exposureCompensation,
      caps.exposureCompRange.min,
      caps.exposureCompRange.max,
    ),
    whiteBalanceKelvin: clamp(
      settings.whiteBalanceKelvin,
      caps.whiteBalanceRange.min,
      caps.whiteBalanceRange.max,
    ),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatShutterLabel(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(1)}s`;
  const denominator = Math.round(1 / seconds);
  return `1/${denominator}`;
}
