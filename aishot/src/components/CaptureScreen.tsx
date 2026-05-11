import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';
import { useCameraPermissions } from '@/services/camera/useCameraPermissions';
import {
  capabilitiesFromFormat,
  selectBestPhotoFormat,
} from '@/services/camera/CameraService';
import { useCameraStore } from '@/stores/cameraStore';
import { AutoPilotPill } from './CameraControls/AutoPilotPill';
import { ManualDials } from './CameraControls/ManualDials';
import { ModeToggle } from './CameraControls/ModeToggle';
import { ShutterButton } from './CameraControls/ShutterButton';

export function CaptureScreen() {
  const permissions = useCameraPermissions();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const settings = useCameraStore((s) => s.settings);
  const setCapabilities = useCameraStore((s) => s.setCapabilities);

  const format = useMemo(() => selectBestPhotoFormat(device), [device]);

  useEffect(() => {
    if (format) setCapabilities(capabilitiesFromFormat(format));
  }, [format, setCapabilities]);

  if (!permissions.ready) {
    return <PermissionGate state={permissions} />;
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.dim}>No back camera available on this device.</Text>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    await cameraRef.current.takePhoto({
      enableShutterSound: false,
    });
  };

  return (
    <View style={styles.root}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive
        photo
        video
        iso={settings.iso}
        exposure={settings.exposureCompensation}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <ModeToggle />
          <AutoPilotPill />
        </View>
        <View style={styles.bottom}>
          <ManualDials />
          <View style={styles.shutterRow}>
            <View style={styles.sidePlaceholder} />
            <ShutterButton onPress={handleCapture} />
            <View style={styles.sidePlaceholder} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PermissionGate({ state }: { state: ReturnType<typeof useCameraPermissions> }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>AiShot needs the camera and microphone</Text>
      <Text style={styles.dim}>
        Camera: {state.camera} · Microphone: {state.microphone}
      </Text>
      <Pressable style={styles.button} onPress={state.request}>
        <Text style={styles.buttonText}>Grant access</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottom: { paddingBottom: 8 },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  sidePlaceholder: { width: 76 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  dim: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#000', fontWeight: '700' },
});
