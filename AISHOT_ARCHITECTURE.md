# AiShot — Architectural Proposal

## Context

You want an iOS app where Claude acts as a real-time photographer: analyzes the live viewfinder, talks to the user via voice, decides exposure/ISO/composition, and tells the user when to fire the shutter — for both photo and video. The product premise depends on three things being simultaneously true: **low latency**, **deep reasoning**, and **deep camera control**. None of these are free in Expo/React Native, and the architecture's whole job is to keep them all alive at once.

Confirmed direction from clarifying questions:

- **AI pipeline:** Hybrid — on-device CoreML/Vision for fast per-frame work, Claude for reasoning and conversation
- **Modality:** Voice in + voice out (ASR + TTS)
- **Distribution:** Personal / TestFlight (but architected so App Store is reachable without rewrites)
- **Camera depth:** Full manual control via VisionCamera + frame processors
- **Backend:** Thin proxy for the Anthropic key (Cloudflare Worker or Fly Hono)
- **Storage:** Device Photos library + on-device SQLite for session/transcripts

Project lives in a **new GitHub repo** (not the current `ai-bot` repo).

---

## Goals & Non-Goals

**Goals (v1, TestFlight)**
- **Auto-Pilot is the default mode.** AI runs the camera end-to-end: changes ISO/shutter/EV/WB live, locks focus on the subject, follows it, decides framing, and *fires the shutter itself* when the moment is right.
- **The user feels the AI working.** Dial values animate visibly as they change, focus reticle smoothly tracks the subject, short voice confirmations ("locking on the dog… one stop down… now"), subtle haptic ticks on every adjustment. The product feeling is "a pro photographer is holding my phone with me."
- **Voice-first conversation.** Two-way voice is the primary way the user expresses intent ("I want a moody street portrait") and the primary way the AI talks back.
- **Subject / object tracking.** On-device tracker locks onto a person, face, animal, or user-tapped object and continuously updates focus point + exposure metering + reframing suggestion.
- **Manual override always one tap away.** Long-press the shutter to take control; tap any dial to freeze that parameter.
- Full manual camera primitives: ISO, shutter, exposure comp, white balance, focus point — used by AI by default, exposed to user on demand.
- Photo + short video (≤ 30s) modes.
- Local-only history of sessions, transcripts, and outcomes.

**Non-Goals (v1)**
- Sharing, social features, web dashboard
- Editing/retouching post-capture
- Android
- Multi-user accounts / sync
- Long-form video, slow-mo, ProRes

---

## High-Level Architecture

```
┌────────────────────────── iOS App (Expo + RN, TS) ──────────────────────────┐
│                                                                              │
│   UI layer (React Native + Reanimated + Skia)                                │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐         │
│   │ Capture    │   │ Conversa-  │   │ Session    │   │ Settings   │         │
│   │ Screen     │   │ tion HUD   │   │ History    │   │            │         │
│   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘         │
│         │                │                │                │                 │
│   ┌─────┴────────────────┴────────────────┴────────────────┴──────┐          │
│   │            App State (Zustand stores + React Query)            │          │
│   │  cameraStore · sessionStore · conversationStore · settingsStore │         │
│   └─────┬─────────────────┬─────────────────┬───────────────────────┘        │
│         │                 │                 │                                 │
│   ┌─────┴──────┐   ┌──────┴──────┐   ┌──────┴──────────┐                    │
│   │ Camera     │   │ AI Pipeline │   │ Voice Pipeline   │                    │
│   │ Service    │   │ (orchestr.) │   │ (ASR + TTS)      │                    │
│   └─────┬──────┘   └──┬─────┬────┘   └────┬─────────────┘                    │
│         │             │     │             │                                   │
│   VisionCamera  CoreML/Vision  HTTP → proxy  Native Speech / Whisper          │
│   + frame       (on-device:    (Claude)      + ElevenLabs/OpenAI TTS          │
│   processor     scene, faces,                                                 │
│   (Worklets)    histogram,                                                    │
│                 horizon)                                                      │
│                                                                               │
│   Persistence: expo-sqlite (sessions, messages) · expo-media-library (photos) │
│   Secure: expo-secure-store (device auth token, user prefs)                   │
└───────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTPS (mTLS-pinned, device token)
                                   ▼
              ┌────────────────────────────────────────────┐
              │  Claude Proxy (Cloudflare Worker / Hono)   │
              │  • Hono + Zod validation                   │
              │  • Anthropic SDK (server-side)             │
              │  • Per-device rate + spend caps            │
              │  • Streaming SSE relay                     │
              │  • KV: device tokens, daily spend counters │
              └────────────────────┬───────────────────────┘
                                   │
                                   ▼
                          Anthropic API (Claude 4.7 Sonnet / Opus)
```

---

## Tech Stack — Choices & Reasoning

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 53 + Dev Client** (not Expo Go) | Expo Go cannot load VisionCamera frame processors. Dev Client gives prebuild + native modules while keeping EAS Build / OTA updates. |
| Language | TypeScript (strict) | Non-negotiable for a system with this much state. |
| Camera | **react-native-vision-camera v4** | Only RN camera with: per-frame JS worklets, manual ISO/shutter/exposure, format selection, simultaneous photo + video. `expo-camera` cannot do any of this. |
| Frame processing | **VisionCamera Frame Processors + react-native-worklets-core** | Runs on a separate JS thread at camera FPS, no main-thread jank. |
| On-device vision | **react-native-vision-camera-face-detector** + **expo-mlkit** (object detection + tracking) + Apple Vision `VNTrackObjectRequest` (via a small native module) | Face/scene/horizon detection + **continuous subject tracking** runs on-device at ~30 FPS. Tracker output drives focus point, exposure metering, and reframing hints. Used to gate when we *call* Claude. |
| Image pipeline | **react-native-skia** for overlays; **expo-image-manipulator** for downscale-before-upload | Skia renders rule-of-thirds grid, suggested crop boxes, focus reticles. Manipulator downscales to ~768px before Claude vision calls (massive cost cut). |
| State | **Zustand** for client state, **TanStack Query** for server state | Redux is overkill; Zustand is the smallest stable footprint. Query handles SSE/Claude cache + retries cleanly. |
| Navigation | **expo-router v3 (file-based)** | Matches Expo idioms, deep linking for free, simpler than RN Navigation for this surface area. |
| Voice in | **expo-speech-recognition** (native iOS Speech) for low latency + free; fall back to **OpenAI Whisper** for accuracy | Native Speech is free, on-device, low-latency. Whisper only if accuracy is bad in noisy scenes. |
| Voice out | **expo-speech** (AVSpeechSynthesizer) for v1; **ElevenLabs** post-v1 if voice quality matters | Native is free and instant. Swap later for character. |
| LLM | **Claude Sonnet 4.6** for default, **Opus 4.7** for hard scenes (low light / "explain my shot") | Sonnet is fast/cheap, Opus when user explicitly invokes deeper coaching. |
| Backend | **Hono on Cloudflare Workers** | Cold start ~0ms, free tier covers personal use, native SSE relay, KV for spend caps. Fly.io is a fine alternative if you prefer Node. |
| Persistence | **expo-sqlite** (Kysely or Drizzle for typed queries) | One file, fast, no server. Drizzle preferred for migrations. |
| Photos/video out | **expo-media-library** | Writes to Camera Roll which auto-iCloud-syncs. |
| Secrets | **expo-secure-store** (Keychain) | Device auth token for proxy, never the Anthropic key. |
| Animations | **react-native-reanimated v3** | For the HUD coaching pulses, shutter ring, etc. — runs on UI thread. |
| Testing | Vitest (unit), Detox (e2e), Maestro (smoke) | Detox alone is heavy; Maestro for daily smoke is faster. |
| Build/CI | **EAS Build + EAS Submit** | One command to TestFlight, OTA updates via EAS Update. |

---

## Screens / Routes (expo-router)

```
app/
  (tabs)/
    index.tsx               → Capture (default)
    history.tsx             → Session list
    settings.tsx
  session/[id].tsx          → Single session detail (photos + transcript)
  modal/
    intent.tsx              → "What are you trying to capture?" voice intent modal
    review.tsx              → Post-shot AI critique
```

Capture screen is 90% of the product. It owns the viewfinder, the HUD overlay, the voice button, and the shutter.

---

## Component Tree (Capture screen)

```
<CaptureScreen>
  <CameraView/>                            // VisionCamera root, mounts frame processor
    <FrameProcessorWorklet/>               // runs on every frame, posts events back to JS
  <SkiaOverlay>
    <RuleOfThirdsGrid/>
    <HorizonLine/>
    <TrackingReticle/>                     // smoothly follows locked subject, color changes by confidence
    <SuggestedCropBox/>                    // Claude-suggested reframing
    <AdjustmentTicker/>                    // floating microcopy: "ISO ↑ 400", "focus locked", "+0.7 EV"
    <ShootBurstFlash/>                     // brief ring flash when AI auto-fires
  </SkiaOverlay>
  <CameraControls>
    <ModeToggle photo|video/>
    <AutoPilotPill/>                       // big status pill: "AUTO" pulsing, tap to pause
    <AnimatedDials iso shutter ev wb/>     // values sweep visibly when AI changes them, haptic tick on land
    <ShutterButton/>                       // ring fills as AI locks in conditions; long-press = manual override
  </CameraControls>
  <ConversationDock>
    <VoiceOrb/>                            // always-listening visualization; pulses on AI speech
    <TranscriptBubble/>                    // last AI message
    <IntentChip/>                          // current goal ("moody street portrait")
  </ConversationDock>
</CaptureScreen>
```

---

## Services / Modules

| Service | Responsibility |
|---|---|
| `CameraService` | Wraps VisionCamera: device, format, frame processor lifecycle, manual params (ISO/shutter/exposure/WB), focus point, capture photo, record video. Exposes *animated setters* — when AI changes ISO 200→800 the value sweeps over 250ms so the user *sees* it move. |
| `OnDeviceVision` | Runs in the frame processor worklet. Returns `{ faces, horizon, exposureHistogram, sceneTags, motionScore, trackedSubjects[] }` ~10-30 fps. |
| `SubjectTracker` | Owns the active lock. Sources: face detector, MLKit object detector, user tap-to-lock, Claude's `lock_subject(description)` tool. Outputs a stable `subjectId + boundingBox + confidence` per frame using `VNTrackObjectRequest`. Re-acquires on loss with IoU + appearance match. |
| `AutoPilot` | The high-level "AI is driving" state machine. Runs by default. Owns the loop: read frame features → ask orchestrator → apply tools → animate dials → fire shutter when conditions met. Cleanly hands over to manual on user override. |
| `AIOrchestrator` | The brain. Decides *when* to call Claude (debounced, gated by motion + scene change + subject lock events), assembles the prompt with last-N transcript turns + downscaled frame + on-device features + tracker state, streams the response, dispatches camera commands. |
| `ClaudeClient` | Talks to the proxy. Streaming SSE, request signing, retry/backoff, request coalescing. |
| `VoicePipeline` | ASR start/stop, partial transcript events, TTS playback with interruption (barge-in: if user starts talking, stop TTS). |
| `SessionStore` | SQLite-backed. Append messages, append captures, link photo asset IDs from media library. |
| `CostGuard` | Local mirror of server-side spend cap. Soft-warns at 80%, hard-stops at 100%. |

---

## Auto-Pilot Mode — The Default Experience

This is the centerpiece of the product. From the moment the user opens the app:

1. **Listening orb is live.** Voice intent capture starts immediately; user can speak any time ("get me a portrait of my dog playing"). No button to press.
2. **Tracker locks instantly.** Face detector + object detector run from frame 0. If exactly one salient subject is present, it auto-locks. If multiple, AI picks based on stated intent. User can tap to override the lock.
3. **AI is constantly tuning.** Every 1.5-3s (gated by scene stability + subject events), Claude is consulted. Returned tool calls are applied through *animated setters* so each change is visible:
   - ISO dial sweeps from current → target over 250ms
   - Focus reticle slides smoothly to the new point, not teleports
   - A small ticker briefly shows "ISO ↑ 800", "EV −0.7", "WB tungsten" in the corner
   - Each landed adjustment fires a soft haptic (`Haptics.selectionAsync`)
   - Short voice confirmations: "lowering exposure" — only on *meaningful* changes, never on every micro-tweak
4. **Auto-fire is on by default.** When the AI determines: subject is tracked + sharp + exposure-correct + composition-aligned + (for portraits) eyes-open / smile / interesting moment, it fires the shutter itself. A **3-2-1 ring fill** animation around the shutter button gives the user a half-second to abort by tapping. After capture, a brief flash overlay + haptic confirms.
5. **Continuous critique without nagging.** Post-shot, the AI may say one short line ("got it — try one more, lower angle"). The next auto-fire is gated on either user agreement or 4s timeout, so the user doesn't get spammed.
6. **Manual override is sacred.** Long-press the shutter → Auto-Pilot pauses, user holds full control until they tap "AUTO" again. Tapping any dial locks that parameter while leaving the rest under AI control (partial autopilot).

**Why this UX matters technically:**
- The "feeling" of AI is built from *micro-animations and micro-voice*, not from making Claude faster. Even with 1-2s Claude latency, smooth interpolation between states makes the system feel continuous.
- Auto-fire requires extremely high confidence — false fires are worse than missed fires. Use a confidence threshold + cooldown (max 1 auto-fire per 1.5s) to avoid spam.
- Tracker must run independently of Claude. Even if the network drops, the reticle should keep following the subject and basic exposure should keep adjusting via on-device heuristics.

---

## Data Flow — Four Critical Journeys

### 1. Auto-Pilot loop (the default journey)
1. User opens app → CameraView mounts → frame processor starts → Auto-Pilot enters `searching` state → voice orb listens.
2. On-device pipeline runs every frame; emits a feature vector + tracker state to JS every 100-200ms.
3. SubjectTracker auto-locks on the salient subject (face/object/user-tap). Reticle smoothly snakes onto the box; focus point + spot-meter follow.
4. AIOrchestrator detects "subject stable + scene stable for ~1s" → captures one downscaled frame (768px JPEG, ~60KB).
5. Sends to proxy: `POST /v1/coach` with `{ intent, last_n_messages, features, tracker, image }`.
6. Proxy calls Claude with vision + tool-use schema:
   - `adjust_camera({ iso?, shutter?, ev?, wb?, focus_point? })`
   - `lock_subject({ description })` — instructs tracker to switch lock
   - `say({ text, urgency })` — short TTS line
   - `reframe_hint({ direction, distance })` — overlay arrow on viewfinder
   - `shoot_now({ reason })` — triggers 3-2-1 auto-fire ring
   - `wait({ reason })` — defers shooting, surfaces reason on the AdjustmentTicker
7. Orchestrator applies tools via *animated setters*: each `adjust_camera` value sweeps over 250ms, haptic ticks on land, optional one-word voice line on meaningful changes.
8. On `shoot_now`, shutter ring fills over 600ms (user can tap to abort) → `takePhoto()` → flash overlay → success haptic.
9. Conversation + every adjustment + photo asset ID logged to SQLite.

### 2. "Talk to me about what I want"
1. User taps mic → expo-speech-recognition starts; partial transcripts stream to UI.
2. On final transcript, AIOrchestrator sends `POST /v1/chat` (no image needed for pure intent talk).
3. Claude returns structured intent: `{ subject, mood, style, constraints }` — stored on `sessionStore.intent`.
4. From this point all `/v1/coach` calls include the intent.

### 3. Subject lock / tap-to-track
1. User taps anywhere on the viewfinder → SubjectTracker seeds a `VNTrackObjectRequest` with the tapped box around any nearby detected object/face.
2. Tracker emits a stable `subjectId` per frame; reticle slides to it; CameraService updates `focusPoint` and exposure point continuously.
3. If lock confidence drops below threshold for > 500ms, tracker tries re-acquisition via appearance match + nearest detection IoU. On full loss, AI is told `subject_lost` and may ask via voice ("lost him — want me to refocus on the dog?").
4. AI can override the lock at any time via `lock_subject({description})` — useful when intent is "follow the kid in the red shirt."

### 4. Capture + critique
1. User (or AI auto-fire) hits shutter → VisionCamera `takePhoto()` → full-res JPEG/HEIC.
2. Saved via `expo-media-library` → asset ID stored on the session.
3. Async, low-priority: send downscaled version to `/v1/critique` for a one-sentence post-shot reflection ("nailed the catchlights; next time try one stop lower").
4. Critique appended to session transcript; surfaced in History.

---

## API Design (Claude Proxy)

All endpoints accept `Authorization: Bearer <device-token>` issued at first launch.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/register` | `{ device_id }` | `{ token, daily_cap_usd }` |
| POST | `/v1/chat` | `{ session_id, messages[], intent? }` | SSE stream of Claude tokens |
| POST | `/v1/coach` | `{ session_id, intent, features, image (base64) }` | SSE stream with tool_use events |
| POST | `/v1/critique` | `{ session_id, image, settings_used }` | SSE stream of short critique |
| GET | `/v1/budget` | — | `{ used_usd, cap_usd, resets_at }` |

**Server-side guarantees:**
- Per-device daily spend cap (default $2 for personal use)
- Hard request-size cap (image ≤ 200KB)
- Prompt caching on the system prompt + intent (Anthropic prompt caching cuts cost ~75% on warm calls)
- Reject any request that arrives faster than 1/sec from the same device

---

## Pain Points & Mitigations

| # | Pain Point | Why It Hurts | Mitigation |
|---|---|---|---|
| 1 | **Expo Go can't run VisionCamera** | Frame processors need native code. | Use **Expo Dev Client** from day one; never test in Expo Go. EAS Build for dev. |
| 2 | **Claude vision latency (1-3s round-trip)** | Kills the "real-time" feel if every frame waits. | Two-tier pipeline: on-device features at 30fps drive instant overlays; Claude called only on **scene change + stability** with image debouncing. Stream tool calls so the *first* useful tool (`adjust_camera`) lands in ~600-900ms. |
| 3 | **Claude vision cost (~$0.01-0.03/call)** | A naive loop is $5+/minute. | (a) Downscale to 768px before upload; (b) cap calls to ≤ 1/sec via orchestrator gate; (c) prompt caching on system + intent; (d) server-side spend cap; (e) Sonnet by default, Opus only on user request. Realistic personal cost: $0.50–$2/day. |
| 4 | **Frame capture for the API ≠ what's on screen** | VisionCamera frame processor gives YUV buffers, not encodable JPEGs. | Use VisionCamera's `takeSnapshot()` for the AI feed (cheap, ~50ms) — *not* `takePhoto()` which triggers full HDR pipeline. Keep `takePhoto()` for actual capture only. |
| 5 | **iOS background audio + Speech recognition** | Speech permission has weird states; barge-in (TTS interrupting ASR) is fiddly. | One state machine in `VoicePipeline` (`idle → listening → thinking → speaking → idle`); always pause TTS on partial ASR result. Use `AVAudioSession` category `playAndRecord` with duck-others. |
| 6 | **Manual camera control conflicts with iOS auto** | VisionCamera applies manual settings, but iOS sometimes overrides on focus change. | Lock the device format explicitly; set `isActive` only after settings applied; verify via the format-change callback. |
| 7 | **Reanimated + Skia + frame processor thread chaos** | Three JS worklet contexts. Easy to crash with shared mutable state. | Communicate only via `runOnJS` from worklets; never mutate Zustand from a worklet directly. One event bus → orchestrator → store. |
| 8 | **iOS thermals (sustained vision pipeline overheats)** | Phone throttles after ~5 min of active camera + ML. | Drop on-device inference FPS adaptively when `ProcessInfo.thermalState != .nominal`. Show a "cool-down" coach tip; pause Claude calls. |
| 9 | **TestFlight 90-day expiry + Anthropic key rotation** | TestFlight builds expire; key compromise mid-test = lost evening. | EAS Update for JS-only patches; key rotation is a Cloudflare Worker env var swap with zero app update. |
| 10 | **Voice latency stacking** (ASR + LLM + TTS = 3-5s) | Conversation feels dead. | (a) Send ASR *partials* to Claude on long pauses (>1.5s) and pre-warm; (b) start TTS on the first sentence of streamed response, not on completion; (c) keep "coaching" tips short (≤ 8 words) so TTS finishes in 1s. |
| 11 | **Privacy manifest for App Store** | Even though TestFlight is personal, App Store path requires `PrivacyInfo.xcprivacy` declaring camera + mic + photo library + network use. | Author the manifest now (cheap) so the path to App Store is just `eas submit`. |
| 12 | **Frame data leaving the device** | Photos of real people → Anthropic. | (a) Show a one-time onboarding consent screen; (b) never send full-res, only ≤768px JPEG; (c) `Anthropic-Version` header pinned; (d) log only hashes server-side, never the image. |
| 13 | **Drift between "what AI suggested" and "what camera applied"** | AI says ISO 800; camera clamps to ISO 640 because format max. | Round-trip every `adjust_camera` tool call: orchestrator reads back actual values from CameraService and feeds them into the next Claude turn. |
| 14 | **Cold-start latency on first session** | First Claude call has no prompt cache hit. | Pre-warm: on app open, fire a tiny `/v1/chat` ping with the system prompt to seed the cache before user interacts. |
| 15 | **Subject tracker loses lock on fast motion / occlusion** | `VNTrackObjectRequest` drifts after a few seconds, especially on occlusion. | Hybrid: every N frames, re-run object/face detection and snap the tracker box to the highest-IoU detection. On full loss, fall back to last detection of same class. Tell AI `subject_lost` so it can ask the user via voice. |
| 16 | **Auto-fire false positives feel terrible** | One bad auto-capture destroys trust. | Fire only when *all* of: tracker confidence > 0.85, sharpness (Laplacian variance on luma) > threshold, exposure within ±0.3 EV of target, no rapid motion in last 200ms. Plus 1.5s cooldown. Plus 600ms abort ring. |
| 17 | **Animated dial changes vs. real camera settings race** | If the dial animates over 250ms but camera applies instantly, UI and viewfinder desync. | Animated setter drives the *visual* value over 250ms; camera receives the *final* value at animation start (camera physics already settle in ~100-200ms). They land in the same window. |
| 18 | **User says "stop" while AI is auto-firing** | ASR final transcript arrives too late to abort. | Stop-word detection (`wait`/`stop`/`no`/`hold on`) runs on ASR *partial* results, aborts active 3-2-1 ring in <50ms. |
| 19 | **Voice persona / barge-in feel matters more than it should** | A robotic system voice undermines the "pro photographer beside me" feeling. | v1: native AVSpeechSynthesizer with a deliberately *calm, terse* prompt persona ("be concise, decisive, never apologize"). v2: ElevenLabs with a chosen voice. Persona name/voice exposed in Settings. |

---

## Risks

- **App Store path (when you take it):** real-time camera frames going off-device require an explicit privacy disclosure and clear in-UI rationale. Plan for this; don't bolt it on.
- **Token cost runaway:** without the server-side cap, a runaway frame loop bug = a $200 surprise overnight. The proxy spend cap is the single most important guardrail.
- **UX bottleneck — "is the AI worth waiting for?":** if Claude's first useful tool call arrives later than ~1s after a scene stabilizes, the user will outpace it. Optimize the orchestrator's gating *first*, not the model choice.
- **Voice modality on a busy street:** ASR will fail. Have a silent text fallback (tap-to-type chat) even though voice is primary.
- **VisionCamera v4 breaking changes:** library is stable but moves fast. Pin exact version; budget a half-day per major bump.
- **iOS-only is a strategic risk:** Android users will ask. VisionCamera is cross-platform, but CoreML isn't. Keep on-device vision behind an interface so an Android path uses MLKit later.

---

## Repo Layout (new GitHub repo)

```
aishot/
  app/                       # expo-router screens
  src/
    components/              # CameraControls, ConversationDock, SkiaOverlay, ...
    services/
      camera/                # CameraService + frame processor worklet
      ai/                    # AIOrchestrator, ClaudeClient, prompts/
      voice/                 # ASR + TTS pipeline
      session/               # SQLite store (Drizzle schema + queries)
    stores/                  # zustand stores
    hooks/
    lib/                     # utils, types
  proxy/                     # Hono on Cloudflare Workers
    src/
      routes/
      anthropic.ts
      auth.ts
      cost-guard.ts
    wrangler.toml
  ios/                       # generated by prebuild; checked in for native edits
  PrivacyInfo.xcprivacy      # ready for App Store path
  eas.json
  app.config.ts
```

---

## Cost Model (personal use, ballpark)

- Sonnet 4.6 vision call with 768px image, 2k cached system prompt, 200 output tokens: **~$0.008**
- Typical session = 5 min, ~30 `/coach` calls + 4 `/chat` + 1 `/critique` ≈ **~$0.30/session**
- 5 sessions/day ≈ **~$1.50/day**, ~$45/month
- Cloudflare Workers free tier covers it; ElevenLabs (if added) is the next biggest line item

---

## Phased Delivery (proposed order — do not start until you greenlight)

1. **Foundation:** Expo Dev Client + VisionCamera + manual controls working in a stub UI. No AI yet. Goal: prove the camera primitive.
2. **On-device pipeline:** frame processor → features → overlays. Still no Claude. Goal: 30fps overlay never drops a frame.
3. **Proxy + ClaudeClient:** Hono worker, device auth, `/chat` SSE working end-to-end.
4. **AI Orchestrator (text only):** intent capture, `/coach` calls, tool-use applied to camera. No voice yet.
5. **Voice pipeline:** ASR + TTS with barge-in.
6. **Polish + Session history + critique.**
7. **TestFlight build via EAS.**

Each phase has a demoable artifact; nothing is built ahead of the phase that proves it.

---

## Verification

Per phase:
1. **Foundation:** install Dev Client on a physical iPhone, open Capture screen, change ISO via debug slider and see the viewfinder change. No simulator (camera doesn't exist there).
2. **On-device pipeline:** debug HUD shows `fps`, `faces`, `horizon°`, `histogram` updating ≥ 20 Hz; no main-thread frame drops in Flipper.
3. **Proxy:** `curl` the `/v1/chat` endpoint with a device token, see SSE stream of Claude tokens; spend counter increments in KV.
4. **Orchestrator:** point camera at a still scene, watch `adjust_camera` tool call land in < 1s after stability; verify camera values readback matches.
5. **Voice:** speak intent → see structured intent in store; barge-in by talking over TTS cuts playback in < 200ms.
6. **End-to-end:** capture a photo at AI's suggestion, find it in Photos, find session entry in History with transcript and settings.
7. **TestFlight:** `eas build --platform ios --profile preview && eas submit`. Install via TestFlight on a clean device, run full flow.

---

## Resolved Design Decisions (from this conversation)

- **Auto-fire:** ON by default. AI fires the shutter when confidence + sharpness + exposure + motion gates all pass. 600ms abort ring lets user veto.
- **AI-driven settings:** Default mode. Dials animate visibly when AI changes them. Each landed adjustment fires a haptic tick.
- **Subject tracking:** Core feature, on-device. Face + object detector seed `VNTrackObjectRequest`; tap-to-lock supported; AI can `lock_subject`.
- **Voice persona:** v1 = native AVSpeechSynthesizer, terse/decisive prompt persona. v2 = ElevenLabs custom voice (deferred).
- **Voice modality:** Voice-first. Always-listening orb from app open. Stop-words abort auto-fire on ASR partials.

## Open Decisions (intentionally deferred — answer when relevant)

- Specific persona name + tone for the AI photographer ("Maya"? "Iris"? — affects system prompt)
- Dark mode only for capture surface? (default: yes, to protect night vision)
- Telemetry / crash reporting? (Sentry free tier — opt-in)
- Should video mode auto-stop when subject leaves frame, or keep rolling?
