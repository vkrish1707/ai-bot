import { create } from 'zustand';
import type { ReframeHintInput } from '@/services/ai/tools';

export type TickerEntry = {
  id: string;
  text: string;
  kind: 'adjust' | 'say' | 'wait' | 'reframe' | 'lock';
  at: number;
};

export type AutoFireState =
  | { state: 'idle' }
  | { state: 'arming'; startedAt: number; durationMs: number; reason?: string };

type AiState = {
  isCoaching: boolean;
  lastCoachAt: number;
  cooldownUntil: number;
  ticker: TickerEntry[];
  reframeHint: ReframeHintInput | null;
  lastSay: { text: string; urgency: 'low' | 'normal' | 'high'; at: number } | null;
  autoFire: AutoFireState;

  setCoaching: (v: boolean) => void;
  setCooldownUntil: (ts: number) => void;
  markCoachAt: (ts: number) => void;
  pushTicker: (entry: Omit<TickerEntry, 'id' | 'at'>) => void;
  setReframeHint: (h: ReframeHintInput | null) => void;
  setLastSay: (s: { text: string; urgency: 'low' | 'normal' | 'high' }) => void;
  armAutoFire: (durationMs: number, reason?: string) => void;
  cancelAutoFire: () => void;
};

const TICKER_LIMIT = 6;

export const useAiStore = create<AiState>((set) => ({
  isCoaching: false,
  lastCoachAt: 0,
  cooldownUntil: 0,
  ticker: [],
  reframeHint: null,
  lastSay: null,
  autoFire: { state: 'idle' },

  setCoaching: (v) => set({ isCoaching: v }),
  setCooldownUntil: (ts) => set({ cooldownUntil: ts }),
  markCoachAt: (ts) => set({ lastCoachAt: ts }),
  pushTicker: (entry) =>
    set((s) => ({
      ticker: [
        ...s.ticker.slice(-TICKER_LIMIT + 1),
        { ...entry, id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: Date.now() },
      ],
    })),
  setReframeHint: (h) => set({ reframeHint: h }),
  setLastSay: (s) => set({ lastSay: { ...s, at: Date.now() } }),
  armAutoFire: (durationMs, reason) =>
    set({ autoFire: { state: 'arming', startedAt: Date.now(), durationMs, reason } }),
  cancelAutoFire: () => set({ autoFire: { state: 'idle' } }),
}));
