import { create } from 'zustand';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

type VoiceStore = {
  state: VoiceState;
  partial: string;
  lastFinal: string;
  speaking: boolean;
  userSpeaking: boolean;
  errorMessage: string | null;

  setState: (s: VoiceState) => void;
  setPartial: (text: string) => void;
  setFinal: (text: string) => void;
  setSpeaking: (v: boolean) => void;
  setUserSpeaking: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  state: 'idle',
  partial: '',
  lastFinal: '',
  speaking: false,
  userSpeaking: false,
  errorMessage: null,

  setState: (s) => set({ state: s, errorMessage: s === 'error' ? undefined : null }),
  setPartial: (text) => set({ partial: text }),
  setFinal: (text) => set({ lastFinal: text, partial: '' }),
  setSpeaking: (v) => set({ speaking: v }),
  setUserSpeaking: (v) => set({ userSpeaking: v }),
  setError: (msg) => set({ errorMessage: msg, state: msg ? 'error' : 'idle' }),
  reset: () =>
    set({
      state: 'idle',
      partial: '',
      lastFinal: '',
      speaking: false,
      userSpeaking: false,
      errorMessage: null,
    }),
}));
