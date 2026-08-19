# Stillpoint Meditation Timer

A calm, responsive meditation timer for GitHub Pages. Choose a meditation length, set an optional interval bell, and return to your breath whenever the soft tone sounds.

## Features

- 5–60 minute meditation sessions
- Optional bells every 1, 5, 10, or 15 minutes
- Pause, continue, reset, and session-complete bell
- Deep, resonant monk-style temple bell generated locally with the Web Audio API — no audio files or tracking
- Responsive layout for iPhone, iPad, and Mac
- Remembers your last duration and interval choice on the device
- Uses the Screen Wake Lock API when supported
- Installable as a simple standalone web app on supported browsers

## Run locally

Because this is a static site, any local web server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Browser note

Mobile browsers require audio to be unlocked by a user gesture. Tap **Begin practice** to start the session and enable the bell. The timer pre-schedules Web Audio events, which improves reliability when a Mac tab is switched away from, but browsers can still throttle or suspend background audio.

A web page cannot guarantee sound while the device is locked. iPhone/iPad Safari and macOS may suspend the page or its audio context during screen lock, and GitHub Pages cannot bypass that OS restriction. For reliable lock-screen bells, the app would need to become a native iOS/macOS app using OS-level notifications or background-audio capabilities. On iPhone/iPad, silent mode can also suppress browser audio.

For the most reliable web-only session, keep the page visible and prevent the screen from locking.

## License

MIT
