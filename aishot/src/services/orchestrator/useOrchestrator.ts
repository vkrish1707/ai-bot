import { useEffect, useRef } from 'react';
import type { Camera } from 'react-native-vision-camera';
import { claudeClient } from '@/services/ai/ClaudeClient';
import type { CoachToolCall } from '@/services/ai/tools';
import { useAiStore } from '@/stores/aiStore';
import { useCameraStore } from '@/stores/cameraStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { VisionSharedValues } from '@/services/vision/useVisionFeatures';
import type { SharedValue } from 'react-native-reanimated';
import { clampSettings } from '@/services/camera/CameraService';
import { captureSnapshotBase64 } from './frameCapture';

const TICK_MS = 500;
const COOLDOWN_MS = 2200;
const STABILITY_MOTION_MAX = 0.12;
const AUTOFIRE_RING_MS = 600;
const AUTOFIRE_COOLDOWN_MS = 1500;

type Args = {
  cameraRef: React.RefObject<Camera | null>;
  vision: VisionSharedValues;
  horizon: SharedValue<number>;
  onAutoFire: () => Promise<void> | void;
};

export function useOrchestrator({ cameraRef, vision, horizon, onAutoFire }: Args) {
  const inflightRef = useRef<AbortController | null>(null);
  const lastAutoFireRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled) return;
      void tick();
    }, TICK_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      inflightRef.current?.abort();
      inflightRef.current = null;
    };

    async function tick() {
      const ai = useAiStore.getState();
      const cam = useCameraStore.getState();

      if (!cam.isAutoPilot) return;
      if (inflightRef.current) return;
      if (Date.now() < ai.cooldownUntil) return;
      if (vision.motionScore.value > STABILITY_MOTION_MAX) return;

      const session = useSessionStore.getState();
      const abort = new AbortController();
      inflightRef.current = abort;
      useAiStore.getState().setCoaching(true);

      try {
        const imageBase64 = await captureSnapshotBase64(cameraRef.current);
        if (!imageBase64 || abort.signal.aborted) return;

        const stream = await claudeClient.streamCoach(
          {
            sessionId: session.sessionId,
            intent: session.intent,
            features: {
              fps: vision.fps.value,
              face_count: vision.faces.value.length,
              horizon_deg: horizon.value,
              motion_score: vision.motionScore.value,
            },
            tracker: trackerFromFaces(vision),
            imageBase64,
            lastMessages: session.messages.slice(-6),
          },
          abort.signal,
        );

        for await (const evt of stream) {
          if (abort.signal.aborted) break;
          if (evt.kind === 'tool') {
            dispatchTool(evt.call, () => {
              lastAutoFireRef.current = Date.now();
              void onAutoFire();
            });
          }
        }
        useAiStore.getState().markCoachAt(Date.now());
      } catch (err) {
        useAiStore.getState().pushTicker({
          kind: 'wait',
          text: `coach error: ${String(err).slice(0, 60)}`,
        });
      } finally {
        useAiStore.getState().setCoaching(false);
        useAiStore.getState().setCooldownUntil(Date.now() + COOLDOWN_MS);
        inflightRef.current = null;
      }
    }

    function dispatchTool(call: CoachToolCall, fire: () => void) {
      const camStore = useCameraStore.getState();
      const aiStore = useAiStore.getState();
      const sessionStore = useSessionStore.getState();

      switch (call.name) {
        case 'adjust_camera': {
          const next = clampSettings(
            {
              iso: call.input.iso ?? camStore.settings.iso,
              shutterSeconds:
                call.input.shutter_seconds ?? camStore.settings.shutterSeconds,
              exposureCompensation:
                call.input.ev ?? camStore.settings.exposureCompensation,
              whiteBalanceKelvin:
                call.input.wb_kelvin ?? camStore.settings.whiteBalanceKelvin,
            },
            camStore.capabilities,
          );
          const locked = camStore.lockedParams;
          if (!locked.has('iso') && next.iso !== camStore.settings.iso) {
            camStore.setIso(next.iso);
            aiStore.pushTicker({ kind: 'adjust', text: `ISO ${Math.round(next.iso)}` });
          }
          if (
            !locked.has('shutter') &&
            next.shutterSeconds !== camStore.settings.shutterSeconds
          ) {
            camStore.setShutter(next.shutterSeconds);
            aiStore.pushTicker({
              kind: 'adjust',
              text: `1/${Math.round(1 / next.shutterSeconds)}s`,
            });
          }
          if (
            !locked.has('ev') &&
            next.exposureCompensation !== camStore.settings.exposureCompensation
          ) {
            camStore.setExposureCompensation(next.exposureCompensation);
            aiStore.pushTicker({
              kind: 'adjust',
              text: `EV ${next.exposureCompensation >= 0 ? '+' : ''}${next.exposureCompensation.toFixed(1)}`,
            });
          }
          if (
            !locked.has('wb') &&
            next.whiteBalanceKelvin !== camStore.settings.whiteBalanceKelvin
          ) {
            camStore.setWhiteBalance(next.whiteBalanceKelvin);
            aiStore.pushTicker({ kind: 'adjust', text: `WB ${Math.round(next.whiteBalanceKelvin)}K` });
          }
          return;
        }

        case 'lock_subject':
          sessionStore.setIntent({
            ...sessionStore.intent,
            subject: call.input.description,
          });
          aiStore.pushTicker({ kind: 'lock', text: `lock: ${call.input.description}` });
          return;

        case 'say':
          aiStore.setLastSay({
            text: call.input.text,
            urgency: call.input.urgency ?? 'normal',
          });
          aiStore.pushTicker({ kind: 'say', text: call.input.text });
          return;

        case 'reframe_hint':
          aiStore.setReframeHint(call.input);
          aiStore.pushTicker({
            kind: 'reframe',
            text: `${call.input.direction.replace('_', ' ')}`,
          });
          return;

        case 'shoot_now': {
          if (Date.now() - lastAutoFireRef.current < AUTOFIRE_COOLDOWN_MS) return;
          aiStore.armAutoFire(AUTOFIRE_RING_MS, call.input.reason);
          aiStore.pushTicker({ kind: 'say', text: 'shoot' });
          setTimeout(() => {
            const current = useAiStore.getState().autoFire;
            if (current.state === 'arming') {
              useAiStore.getState().cancelAutoFire();
              fire();
            }
          }, AUTOFIRE_RING_MS);
          return;
        }

        case 'wait':
          aiStore.pushTicker({ kind: 'wait', text: call.input.reason });
          return;
      }
    }
  }, [cameraRef, vision, horizon, onAutoFire]);
}

function trackerFromFaces(vision: VisionSharedValues) {
  const faces = vision.faces.value;
  if (faces.length === 0) return undefined;
  const largest = faces.reduce((a, b) =>
    a.width * a.height >= b.width * b.height ? a : b,
  );
  const fs = vision.frameSize.value;
  if (!fs.width || !fs.height) return undefined;
  return {
    subject_id: largest.id,
    bounds: {
      x: largest.x / fs.width,
      y: largest.y / fs.height,
      width: largest.width / fs.width,
      height: largest.height / fs.height,
    },
    confidence: largest.confidence,
  };
}
