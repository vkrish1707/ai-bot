import { StyleSheet, View } from 'react-native';
import { useCameraStore } from '@/stores/cameraStore';
import { formatShutterLabel } from '@/services/camera/CameraService';
import type { AnimatedSettings } from '@/services/camera/useAnimatedSettings';
import { Dial } from './Dial';

type Props = {
  animated: AnimatedSettings;
};

export function ManualDials({ animated }: Props) {
  const caps = useCameraStore((s) => s.capabilities);
  const lockedParams = useCameraStore((s) => s.lockedParams);
  const toggleLock = useCameraStore((s) => s.toggleLock);

  return (
    <View style={styles.row}>
      <Dial
        label="ISO"
        format={(n) => String(Math.round(n))}
        value={animated.iso}
        isLocked={lockedParams.has('iso')}
        onLockToggle={() => toggleLock('iso')}
        min={caps.isoRange.min}
        max={caps.isoRange.max}
      />
      <Dial
        label="SHUTTER"
        format={formatShutterLabel}
        value={animated.shutter}
        isLocked={lockedParams.has('shutter')}
        onLockToggle={() => toggleLock('shutter')}
        min={caps.shutterRange.min}
        max={caps.shutterRange.max}
      />
      <Dial
        label="EV"
        format={(n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`}
        value={animated.ev}
        isLocked={lockedParams.has('ev')}
        onLockToggle={() => toggleLock('ev')}
        min={caps.exposureCompRange.min}
        max={caps.exposureCompRange.max}
      />
      <Dial
        label="WB"
        format={(n) => `${Math.round(n)}K`}
        value={animated.wb}
        isLocked={lockedParams.has('wb')}
        onLockToggle={() => toggleLock('wb')}
        min={caps.whiteBalanceRange.min}
        max={caps.whiteBalanceRange.max}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
});
