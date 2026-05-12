import * as ImageManipulator from 'expo-image-manipulator';
import type { Camera } from 'react-native-vision-camera';

const TARGET_WIDTH = 768;
const JPEG_QUALITY = 0.7;

export async function captureSnapshotBase64(
  camera: Camera | null,
): Promise<string | null> {
  if (!camera) return null;

  const photo = await camera.takePhoto({
    enableShutterSound: false,
    enableAutoStabilization: false,
    flash: 'off',
  });

  const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: TARGET_WIDTH } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  return result.base64 ?? null;
}
