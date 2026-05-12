import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useCameraStore } from '@/stores/cameraStore';

const SWEEP_MS = 250;

export type AnimatedSettings = ReturnType<typeof useAnimatedSettings>;

export function useAnimatedSettings() {
  const iso = useSharedValue(useCameraStore.getState().settings.iso);
  const shutter = useSharedValue(useCameraStore.getState().settings.shutterSeconds);
  const ev = useSharedValue(useCameraStore.getState().settings.exposureCompensation);
  const wb = useSharedValue(useCameraStore.getState().settings.whiteBalanceKelvin);

  useEffect(() => {
    const config = { duration: SWEEP_MS, easing: Easing.out(Easing.cubic) };
    const unsub = useCameraStore.subscribe((state, prev) => {
      const s = state.settings;
      const p = prev.settings;
      if (s.iso !== p.iso) iso.value = withTiming(s.iso, config);
      if (s.shutterSeconds !== p.shutterSeconds)
        shutter.value = withTiming(s.shutterSeconds, config);
      if (s.exposureCompensation !== p.exposureCompensation)
        ev.value = withTiming(s.exposureCompensation, config);
      if (s.whiteBalanceKelvin !== p.whiteBalanceKelvin)
        wb.value = withTiming(s.whiteBalanceKelvin, config);
    });
    return unsub;
  }, [iso, shutter, ev, wb]);

  return { iso, shutter, ev, wb };
}
