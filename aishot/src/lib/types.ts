export type CaptureMode = 'photo' | 'video';

export type ManualParam = 'iso' | 'shutter' | 'ev' | 'wb';

export type CameraSettings = {
  iso: number;
  shutterSeconds: number;
  exposureCompensation: number;
  whiteBalanceKelvin: number;
};

export type CameraCapabilities = {
  isoRange: { min: number; max: number };
  shutterRange: { min: number; max: number };
  exposureCompRange: { min: number; max: number };
  whiteBalanceRange: { min: number; max: number };
};

export const DEFAULT_SETTINGS: CameraSettings = {
  iso: 200,
  shutterSeconds: 1 / 120,
  exposureCompensation: 0,
  whiteBalanceKelvin: 5500,
};

export const DEFAULT_CAPABILITIES: CameraCapabilities = {
  isoRange: { min: 25, max: 6400 },
  shutterRange: { min: 1 / 8000, max: 1 / 4 },
  exposureCompRange: { min: -3, max: 3 },
  whiteBalanceRange: { min: 2500, max: 8000 },
};
