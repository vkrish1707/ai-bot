import { useEffect, useState } from 'react';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';

export type PermissionsState = {
  camera: CameraPermissionStatus;
  microphone: CameraPermissionStatus;
  ready: boolean;
  request: () => Promise<void>;
};

export function useCameraPermissions(): PermissionsState {
  const [camera, setCamera] = useState<CameraPermissionStatus>('not-determined');
  const [microphone, setMicrophone] = useState<CameraPermissionStatus>('not-determined');

  const refresh = () => {
    setCamera(Camera.getCameraPermissionStatus());
    setMicrophone(Camera.getMicrophonePermissionStatus());
  };

  useEffect(() => {
    refresh();
  }, []);

  const request = async () => {
    const cam = await Camera.requestCameraPermission();
    const mic = await Camera.requestMicrophonePermission();
    setCamera(cam);
    setMicrophone(mic);
  };

  return {
    camera,
    microphone,
    ready: camera === 'granted' && microphone === 'granted',
    request,
  };
}
