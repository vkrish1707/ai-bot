# AiShot assets

Drop the following PNGs in this directory before running `eas build`:

- `icon.png` — 1024×1024, no transparency, no rounded corners (Apple
  adds them). Used as the iOS app icon.
- `adaptive-icon.png` — 1024×1024, transparent background of the
  foreground mark. Used for Android if you add it later.
- `splash.png` — 1242×2436 (or any 16:9-ish portrait), dark background.
  Shown for ~200ms while the JS bundle loads. Background color is set
  in `app.config.ts` so a solid color also works.
- `notification.png` — 96×96, monochrome, transparent. Only needed if
  push notifications are added later.

For TestFlight you only need `icon.png` and `splash.png`. The rest are
nice-to-haves.

A quick way to make placeholders: any 1024×1024 black PNG with the
letter "A" centered in white works for the icon; a solid black
1242×2436 works for the splash until you have art.
