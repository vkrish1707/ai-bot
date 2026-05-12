import { useEffect, useRef } from 'react';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { claudeClient } from '@/services/ai/ClaudeClient';
import { useAiStore } from '@/stores/aiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useVoiceStore } from '@/stores/voiceStore';
import { abortListening, ensureSpeechPermissions, startListening, stopListening } from './asr';
import { isSpeaking, speak, stopSpeaking } from './tts';
import { containsStopWord } from './stopWords';

const RESTART_DELAY_MS = 400;
const INTENT_MIN_LEN = 4;

export function useVoicePipeline() {
  const wantListeningRef = useRef(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const ok = await ensureSpeechPermissions();
      if (!mounted) return;
      if (!ok) {
        useVoiceStore.getState().setError('speech_permission_denied');
        return;
      }
      useVoiceStore.getState().setState('listening');
      try {
        startListening();
      } catch (err) {
        useVoiceStore.getState().setError(String(err));
      }
    })();

    const unsub = useAiStore.subscribe((s, prev) => {
      const last = s.lastSay;
      const prevLast = prev.lastSay;
      if (last && last !== prevLast) {
        sayWithBargeIn(last.text);
      }
    });

    return () => {
      mounted = false;
      unsub();
      wantListeningRef.current = false;
      stopSpeaking();
      abortListening();
      intentInflightRef_global?.abort();
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    useVoiceStore.getState().setState('listening');
  });

  useSpeechRecognitionEvent('end', () => {
    if (!wantListeningRef.current) {
      useVoiceStore.getState().setState('idle');
      return;
    }
    setTimeout(() => {
      if (!wantListeningRef.current) return;
      try {
        startListening();
      } catch {
        // ignore
      }
    }, RESTART_DELAY_MS);
  });

  useSpeechRecognitionEvent('speechstart', () => {
    useVoiceStore.getState().setUserSpeaking(true);
    if (isSpeaking()) stopSpeaking();
    useAiStore.getState().cancelAutoFire();
  });

  useSpeechRecognitionEvent('speechend', () => {
    useVoiceStore.getState().setUserSpeaking(false);
  });

  useSpeechRecognitionEvent('error', (e) => {
    useVoiceStore.getState().setError(e?.error ?? e?.message ?? 'asr_error');
  });

  useSpeechRecognitionEvent('result', (e) => {
    const transcript = e.results?.[0]?.transcript?.trim();
    if (!transcript) return;

    if (containsStopWord(transcript)) {
      useAiStore.getState().cancelAutoFire();
      if (isSpeaking()) stopSpeaking();
    }

    if (e.isFinal) {
      useVoiceStore.getState().setFinal(transcript);
      if (transcript.length >= INTENT_MIN_LEN) {
        void handleFinalTranscript(transcript);
      }
    } else {
      useVoiceStore.getState().setPartial(transcript);
    }
  });
}

async function handleFinalTranscript(transcript: string) {
  intentInflightRef_global?.abort();
  const abort = new AbortController();
  intentInflightRef_global = abort;

  useVoiceStore.getState().setState('thinking');
  const session = useSessionStore.getState();

  try {
    const { intent, reply } = await claudeClient.extractIntent({
      sessionId: session.sessionId,
      transcript,
      currentIntent: session.intent,
    });
    if (abort.signal.aborted) return;

    useSessionStore.getState().setIntent(intent);
    useSessionStore.getState().appendMessage({ role: 'user', content: transcript });

    if (reply) {
      useSessionStore.getState().appendMessage({ role: 'assistant', content: reply });
      useAiStore.getState().setLastSay({ text: reply, urgency: 'normal' });
    } else {
      useVoiceStore.getState().setState('listening');
    }
  } catch (err) {
    useVoiceStore.getState().setError(String(err));
  } finally {
    if (intentInflightRef_global === abort) intentInflightRef_global = null;
  }
}

let intentInflightRef_global: AbortController | null = null;

function sayWithBargeIn(text: string) {
  if (isSpeaking()) stopSpeaking();
  useVoiceStore.getState().setSpeaking(true);
  useVoiceStore.getState().setState('speaking');
  speak(text, {
    onDone: () => {
      useVoiceStore.getState().setSpeaking(false);
      useVoiceStore.getState().setState('listening');
    },
    onStopped: () => {
      useVoiceStore.getState().setSpeaking(false);
      useVoiceStore.getState().setState('listening');
    },
  });
}
