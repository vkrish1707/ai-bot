import * as Speech from 'expo-speech';

export type SpeakOptions = {
  voice?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
};

const DEFAULT_VOICE_OPTIONS: SpeakOptions = {
  rate: 1.05,
  pitch: 1.0,
};

let active = false;

export function speak(text: string, options: SpeakOptions = {}) {
  if (!text.trim()) return;
  const opts: SpeakOptions = { ...DEFAULT_VOICE_OPTIONS, ...options };
  active = true;
  Speech.speak(text, {
    rate: opts.rate,
    pitch: opts.pitch,
    voice: opts.voice,
    onStart: () => opts.onStart?.(),
    onDone: () => {
      active = false;
      opts.onDone?.();
    },
    onStopped: () => {
      active = false;
      opts.onStopped?.();
    },
    onError: () => {
      active = false;
      opts.onStopped?.();
    },
  });
}

export function stopSpeaking() {
  if (!active) return;
  active = false;
  void Speech.stop();
}

export function isSpeaking(): boolean {
  return active;
}
