import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useCameraPermissions } from '@/services/camera/useCameraPermissions';
import {
  capabilitiesFromFormat,
  selectBestPhotoFormat,
} from '@/services/camera/CameraService';
import { useAnimatedSettings } from '@/services/camera/useAnimatedSettings';
import { useCameraStore } from '@/stores/cameraStore';
import { useVisionFeatures } from '@/services/vision/useVisionFeatures';
import { useHorizon } from '@/services/sensors/useHorizon';
import { useOrchestrator } from '@/services/orchestrator/useOrchestrator';
import { useVoicePipeline } from '@/services/voice/useVoicePipeline';
import { AutoPilotPill } from './CameraControls/AutoPilotPill';
import { ManualDials } from './CameraControls/ManualDials';
import { ModeToggle } from './CameraControls/ModeToggle';
import { ShutterButton } from './CameraControls/ShutterButton';
import { SkiaOverlay } from './SkiaOverlay/SkiaOverlay';
import { DebugHud } from './SkiaOverlay/DebugHud';
import { AdjustmentTicker } from './Hud/AdjustmentTicker';
import { IntentChip } from './Hud/IntentChip';
import { VoiceOrb } from './Hud/VoiceOrb';
import { TranscriptBubble } from './Hud/TranscriptBubble';

export function CaptureScreen() {
  const permissions = useCameraPermissions();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const settings = useCameraStore((s) => s.settings);
  const setCapabilities = useCameraStore((s) => s.setCapabilities);

  const format = useMemo(() => selectBestPhotoFormat(device), [device]);
  const { frameProcessor, shared } = useVisionFeatures();
  const horizon = useHorizon();
  const animated = useAnimatedSettings();

  useEffect(() => {
    if (format) setCapabilities(capabilitiesFromFormat(format));
  }, [format, setCapabilities]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    await cameraRef.current.takePhoto({ enableShutterSound: false });
  }, []);

  useOrchestrator({
    cameraRef,
    vision: shared,
    horizon,
    onAutoFire: handleCapture,
  });

  useVoicePipeline();

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
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
      <SkiaOverlay
        faces={shared.faces}
        frameSize={shared.frameSize}
        horizon={horizon}
      />
      <AdjustmentTicker />
      <TranscriptBubble />
      <DebugHud
        fps={shared.fps}
        faces={shared.faces}
        histogram={shared.histogram}
        motionScore={shared.motionScore}
        horizon={horizon}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <ModeToggle />
          <IntentChip />
          <View style={styles.topRight}>
            <VoiceOrb />
            <AutoPilotPill />
          </View>
        </View>
        <View style={styles.bottom}>
          <ManualDials animated={animated} />
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
    gap: 8,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottom: { paddingBottom: 8 },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  sidePlaceholder: { width: 92 },
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
