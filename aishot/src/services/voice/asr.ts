import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionOptions,
} from 'expo-speech-recognition';

const DEFAULT_OPTIONS: ExpoSpeechRecognitionOptions = {
  lang: 'en-US',
  interimResults: true,
  continuous: true,
  requiresOnDeviceRecognition: true,
  addsPunctuation: false,
  maxAlternatives: 1,
};

export async function ensureSpeechPermissions(): Promise<boolean> {
  const status =
    await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => null);
  return status?.granted ?? false;
}

export function startListening(overrides?: Partial<ExpoSpeechRecognitionOptions>) {
  ExpoSpeechRecognitionModule.start({ ...DEFAULT_OPTIONS, ...overrides });
}

export function stopListening() {
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // already stopped
  }
}

export function abortListening() {
  try {
    ExpoSpeechRecognitionModule.abort();
  } catch {
    // already stopped
  }
}
