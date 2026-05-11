import { create } from 'zustand';
import {
  CameraCapabilities,
  CameraSettings,
  CaptureMode,
  DEFAULT_CAPABILITIES,
  DEFAULT_SETTINGS,
  ManualParam,
} from '@/lib/types';

type CameraState = {
  mode: CaptureMode;
  isAutoPilot: boolean;
  lockedParams: Set<ManualParam>;
  settings: CameraSettings;
  capabilities: CameraCapabilities;

  setMode: (mode: CaptureMode) => void;
  toggleAutoPilot: () => void;
  toggleLock: (param: ManualParam) => void;
  setIso: (iso: number) => void;
  setShutter: (shutterSeconds: number) => void;
  setExposureCompensation: (ev: number) => void;
  setWhiteBalance: (kelvin: number) => void;
  setCapabilities: (caps: CameraCapabilities) => void;
};

export const useCameraStore = create<CameraState>((set) => ({
  mode: 'photo',
  isAutoPilot: true,
  lockedParams: new Set(),
  settings: DEFAULT_SETTINGS,
  capabilities: DEFAULT_CAPABILITIES,

  setMode: (mode) => set({ mode }),
  toggleAutoPilot: () => set((s) => ({ isAutoPilot: !s.isAutoPilot })),
  toggleLock: (param) =>
    set((s) => {
      const next = new Set(s.lockedParams);
      if (next.has(param)) next.delete(param);
      else next.add(param);
      return { lockedParams: next };
    }),
  setIso: (iso) => set((s) => ({ settings: { ...s.settings, iso } })),
  setShutter: (shutterSeconds) =>
    set((s) => ({ settings: { ...s.settings, shutterSeconds } })),
  setExposureCompensation: (ev) =>
    set((s) => ({ settings: { ...s.settings, exposureCompensation: ev } })),
  setWhiteBalance: (kelvin) =>
    set((s) => ({ settings: { ...s.settings, whiteBalanceKelvin: kelvin } })),
  setCapabilities: (capabilities) => set({ capabilities }),
}));
