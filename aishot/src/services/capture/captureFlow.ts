import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import type { Camera } from 'react-native-vision-camera';
import { claudeClient } from '@/services/ai/ClaudeClient';
import { insertCapture, updateCaptureCritique } from '@/db/queries';
import { useAiStore } from '@/stores/aiStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useSessionStore } from '@/stores/sessionStore';

const CRITIQUE_RESIZE_WIDTH = 768;
const CRITIQUE_QUALITY = 0.7;

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync(true);
  return status === 'granted';
}

export async function performCapture(camera: Camera | null): Promise<number | null> {
  if (!camera) return null;

  const settings = useCameraStore.getState().settings;
  const session = useSessionStore.getState();

  const photo = await camera.takePhoto({ enableShutterSound: false });
  const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;

  let assetId: string | null = null;
  let localUri: string | null = uri;
  try {
    const granted = await ensureMediaLibraryPermission();
    if (granted) {
      const asset = await MediaLibrary.createAssetAsync(uri);
      assetId = asset.id;
      const info = await MediaLibrary.getAssetInfoAsync(asset.id).catch(() => null);
      if (info?.localUri) localUri = info.localUri;
    }
  } catch {
    // best-effort: keep local uri only
  }

  const captureId = await insertCapture({
    sessionId: session.sessionId,
    assetId,
    localUri,
    iso: settings.iso,
    shutterSeconds: settings.shutterSeconds,
    ev: settings.exposureCompensation,
    wbKelvin: settings.whiteBalanceKelvin,
    takenAt: Date.now(),
  });

  void requestCritique(captureId, uri).catch(() => {
    // critique failures are silent; the row stays without one
  });

  useAiStore.getState().pushTicker({ kind: 'say', text: 'saved' });
  return captureId;
}

async function requestCritique(captureId: number, fileUri: string): Promise<void> {
  const settings = useCameraStore.getState().settings;
  const session = useSessionStore.getState();

  const downscaled = await ImageManipulator.manipulateAsync(
    fileUri,
    [{ resize: { width: CRITIQUE_RESIZE_WIDTH } }],
    {
      compress: CRITIQUE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!downscaled.base64) return;

  const stream = await claudeClient.streamCritique({
    sessionId: session.sessionId,
    imageBase64: downscaled.base64,
    settings: {
      iso: settings.iso,
      shutterSeconds: settings.shutterSeconds,
      ev: settings.exposureCompensation,
      wbKelvin: settings.whiteBalanceKelvin,
    },
  });

  let buf = '';
  for await (const chunk of stream) {
    buf += chunk;
  }
  const trimmed = buf.trim();
  if (!trimmed) return;

  await updateCaptureCritique(captureId, trimmed);
  useSessionStore.getState().appendMessage({ role: 'assistant', content: trimmed });
}
