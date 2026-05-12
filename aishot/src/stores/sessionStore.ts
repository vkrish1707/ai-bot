import { create } from 'zustand';
import type { ChatMessage, Intent } from '@/services/ai/types';

type SessionState = {
  sessionId: string;
  intent: Intent;
  messages: ChatMessage[];

  newSession: () => void;
  setIntent: (intent: Intent) => void;
  appendMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
};

function makeSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: makeSessionId(),
  intent: {},
  messages: [],

  newSession: () => set({ sessionId: makeSessionId(), messages: [] }),
  setIntent: (intent) => set({ intent }),
  appendMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-30), msg] })),
  clearMessages: () => set({ messages: [] }),
}));
