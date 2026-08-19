# Stillpoint Meditation Timer

A calm, responsive meditation timer for GitHub Pages. Choose a meditation length, set an optional interval bell, and return to your breath whenever the soft tone sounds.

## Features

- 5–60 minute meditation sessions
- Optional bells every 1, 5, 10, or 15 minutes
- Pause, continue, reset, and session-complete bell
- Deep, resonant monk-style temple bell generated locally with the Web Audio API — no audio files or tracking
- Responsive layout for iPhone, iPad, and Mac
- Remembers your last duration and interval choice on the device
- Uses a user-started HTML media stream carrying continuous silence and scheduled bells for better background playback attempts
- Installable as a simple standalone web app on supported browsers

## Run locally

Because this is a static site, any local web server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Browser note

Mobile browsers require audio to be unlocked by a user gesture. Tap **Begin** to start the session and enable the bell. Stillpoint starts a real HTML media element from that tap and feeds it continuous silent frames plus the scheduled bell tones. This is more likely to continue when an iPhone screen locks or a Mac tab is switched away from than page-timer callbacks alone.

This remains best-effort: Safari and the operating system may still interrupt a live `MediaStream`, especially when the page is force-quit, another app takes audio priority, Low Power Mode intervenes, or the device is locked for a long period. On iPhone/iPad, silent mode can also suppress browser audio. For guaranteed lock-screen bells, the app would need native iOS/macOS background-audio or notification capabilities.

For the most reliable web-only session, start the timer with the page open, keep Safari running, and do not force-quit it.

## License

MIT
