# AiShot — Runbook

End-to-end steps to take this from a fresh clone to a working TestFlight
build. Two systems to deploy: the **proxy** (Cloudflare Worker) and the
**app** (iOS via EAS Build → TestFlight).

---

## 0. One-time accounts

- Apple Developer account ($99/year) with App Store Connect access.
- Cloudflare account (free tier is enough).
- Anthropic API key with billing enabled.
- Expo account, then `npm i -g eas-cli` and `eas login`.

---

## 1. Deploy the proxy (do this first)

```bash
cd aishot/proxy
npm install

# Dev KV
wrangler kv namespace create AISHOT_KV
wrangler kv namespace create AISHOT_KV --preview
# Paste both ids into wrangler.toml under the top-level [[kv_namespaces]]

# Prod KV (separate, lives under env.production)
wrangler kv namespace create AISHOT_KV --env production
# Paste the id into [[env.production.kv_namespaces]]

# Secret
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ANTHROPIC_API_KEY --env production

# Local sanity
npm run dev
curl http://localhost:8787/health

# Ship it
wrangler deploy --env production
# Note the workers.dev URL it prints, or bind a custom domain via
# the Cloudflare dashboard.
```

Verify with a curl round-trip:

```bash
curl -X POST https://<your-worker>/v1/register \
  -H 'content-type: application/json' \
  -d '{"device_id":"smoke-test-1234567890"}'
# -> { "token": "...", "daily_cap_usd": 2 }

curl -N -X POST https://<your-worker>/v1/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'content-type: application/json' \
  -d '{"session_id":"s1","messages":[{"role":"user","content":"Say hi."}]}'
# -> SSE stream of Claude tokens; KV spend counter increments
```

---

## 2. Configure the app

```bash
cd aishot
npm install
```

Edit `eas.json` and replace `https://aishot-proxy.example.workers.dev`
with the production proxy URL from step 1 in both the `preview` and
`production` profiles.

Edit `eas.json` `submit.production.ios`:

- `appleId` — your Apple ID email
- `ascAppId` — App Store Connect app id (created on first
  `eas submit`, or look it up in App Store Connect)
- `appleTeamId` — your Apple Developer Team ID

Drop assets in `assets/` (see `assets/README.md` for sizes).

```bash
# First-time native generation
npx expo prebuild --clean

# EAS project link (one-time)
eas init
# Sets project id in eas.json + Expo dashboard

# Optional: enable OTA updates
eas update:configure
# This sets the EAS_PROJECT_ID env -> app.config.ts picks it up
# and the updates.url is rendered automatically.
```

---

## 3. Build a development client (for local iteration)

```bash
eas build --profile development --platform ios
# When done, install the .ipa on your iPhone (TestFlight or direct).

npm start
# Open the Dev Client; it'll connect to the Metro bundler.
# Edits hot-reload, native changes need a fresh build.
```

Phase 1–6 verification gates are all reachable from the Dev Client.

---

## 4. Build a TestFlight preview

```bash
eas build --profile preview --platform ios
# 8-15 min on EAS's m-medium worker.

eas submit --platform ios --profile production --latest
# Uploads to App Store Connect. Apple processes for 5-30 min.
# Then add yourself as an internal tester in App Store Connect ->
# TestFlight, and install via the TestFlight app.
```

If `eas submit` complains about missing `ascAppId`, run it once
without it — EAS will create the App Store Connect record and print
the id, then put it in `eas.json`.

---

## 5. Smoke test on TestFlight

Install the TestFlight build on a clean device, then run the
end-to-end gate from the architecture doc:

- [ ] Capture screen opens, viewfinder is live (real camera, not stub).
- [ ] Dials show real ISO range (not the default placeholder).
- [ ] Debug HUD shows ~30 FPS, faces tracked, horizon° responds to tilt.
- [ ] Speak: "I want a moody portrait of my dog." Partial appears in
      the transcript bubble; on final, intent chip updates and AI
      replies via TTS.
- [ ] Talk over the AI's reply — TTS cuts within ~200 ms.
- [ ] Hold steady on a face for ~3 s. Adjustment ticker shows AI
      changes; dials sweep visibly. Eventually the shutter ring fills.
- [ ] Either let it fire or tap the ring to abort. If fired:
      - [ ] iOS Photos app has the new shot in Camera Roll.
      - [ ] History tab shows a row for this session with "1 shot".
      - [ ] Session detail shows the photo, the spoken transcript,
            and a one-line AI critique within ~2 s.
- [ ] Settings tab: "Test /v1/chat" streams tokens; "Check daily
      budget" returns the current spend.

---

## 6. Common issues

- **EAS build fails on `pod install`**: bump `expo-build-properties`'
  iOS `deploymentTarget` if a dep raised its minimum. Currently 15.1.
- **TestFlight build crashes on launch**: usually a missing
  `Info.plist` usage string. Check `aishot/app.config.ts` `infoPlist`.
- **Voice recognition silently fails**: confirm both Microphone and
  Speech Recognition permissions are granted under Settings → AiShot.
- **Proxy returns 429 immediately**: rate limit. Wait 1 s, retry.
- **`Anthropic upstream 401`**: secret not set in the prod env. Run
  `wrangler secret put ANTHROPIC_API_KEY --env production`.
- **Daily cap hit during a long session**: bump `DAILY_CAP_USD` in
  `wrangler.toml` `[env.production.vars]` and redeploy.
- **Photos don't appear in History detail**: `MediaLibrary` permission
  was denied at first capture. Settings → AiShot → Photos → Add Photos
  Only, then re-shoot.

---

## 7. Updating after first ship

- JS-only changes: `eas update --branch production` — installs on next
  app cold-start, no resubmit.
- Native changes (any new module, new permission, plugin config
  change): `eas build` + `eas submit` again.
- Proxy changes: `wrangler deploy --env production` — instant, no app
  update needed.
- Anthropic key rotation: `wrangler secret put ANTHROPIC_API_KEY --env
  production`; zero app impact.
