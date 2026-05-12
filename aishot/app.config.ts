import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AiShot',
  slug: 'aishot',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'aishot',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.aishot.app',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'AiShot uses the camera so the AI photographer can see your scene, frame your shot, and capture photos.',
      NSMicrophoneUsageDescription:
        'AiShot uses the microphone so you can talk to the AI photographer about the shot you want.',
      NSPhotoLibraryAddUsageDescription:
        'AiShot saves the photos and videos you capture to your photo library.',
      NSSpeechRecognitionUsageDescription:
        'AiShot transcribes your voice on-device to understand what you want to capture.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: [
    'expo-router',
    [
      'react-native-vision-camera',
      {
        cameraPermissionText: 'AiShot needs camera access to see and capture your scene.',
        enableMicrophonePermission: true,
        microphonePermissionText: 'AiShot needs microphone access for video and voice control.',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: { deploymentTarget: '15.1' },
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'AiShot listens for your voice so you can tell the photographer what you want.',
        speechRecognitionPermission:
          'AiShot transcribes your voice on-device to understand the shot you want.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'AiShot saves your shots to your photo library.',
        savePhotosPermission: 'AiShot saves your shots to your photo library.',
        isAccessMediaLocationEnabled: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    proxyUrl: process.env.EXPO_PUBLIC_PROXY_URL ?? 'http://localhost:8787',
  },
};

export default config;
