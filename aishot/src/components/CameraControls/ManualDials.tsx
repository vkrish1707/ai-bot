import { StyleSheet, View } from 'react-native';
import { useCameraStore } from '@/stores/cameraStore';
import { formatShutterLabel } from '@/services/camera/CameraService';
import { Dial } from './Dial';

export function ManualDials() {
  const settings = useCameraStore((s) => s.settings);
  const caps = useCameraStore((s) => s.capabilities);
  const lockedParams = useCameraStore((s) => s.lockedParams);
  const toggleLock = useCameraStore((s) => s.toggleLock);

  return (
    <View style={styles.row}>
      <Dial
        label="ISO"
        value={String(Math.round(settings.iso))}
        isLocked={lockedParams.has('iso')}
        onLockToggle={() => toggleLock('iso')}
        min={caps.isoRange.min}
        max={caps.isoRange.max}
        current={settings.iso}
      />
      <Dial
        label="SHUTTER"
        value={formatShutterLabel(settings.shutterSeconds)}
        isLocked={lockedParams.has('shutter')}
        onLockToggle={() => toggleLock('shutter')}
        min={caps.shutterRange.min}
        max={caps.shutterRange.max}
        current={settings.shutterSeconds}
      />
      <Dial
        label="EV"
        value={`${settings.exposureCompensation >= 0 ? '+' : ''}${settings.exposureCompensation.toFixed(1)}`}
        isLocked={lockedParams.has('ev')}
        onLockToggle={() => toggleLock('ev')}
        min={caps.exposureCompRange.min}
        max={caps.exposureCompRange.max}
        current={settings.exposureCompensation}
      />
      <Dial
        label="WB"
        value={`${Math.round(settings.whiteBalanceKelvin)}K`}
        isLocked={lockedParams.has('wb')}
        onLockToggle={() => toggleLock('wb')}
        min={caps.whiteBalanceRange.min}
        max={caps.whiteBalanceRange.max}
        current={settings.whiteBalanceKelvin}
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
