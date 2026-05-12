import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

const UPDATE_INTERVAL_MS = 1000 / 30;
const SMOOTHING = 0.2;

export function useHorizon(): SharedValue<number> {
  const horizon = useSharedValue(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      const angleRad = Math.atan2(x, -y);
      const angleDeg = (angleRad * 180) / Math.PI;
      horizon.value = horizon.value * (1 - SMOOTHING) + angleDeg * SMOOTHING;
    });
    return () => subscription.remove();
  }, [horizon]);

  return horizon;
}
