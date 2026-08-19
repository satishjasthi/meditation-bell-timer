# Stillpoint Meditation Timer

A calm, responsive meditation timer for GitHub Pages. Choose a meditation length, set an optional interval bell, and return to your breath whenever the soft tone sounds.

## Features

- 5–60 minute meditation sessions
- Optional bells every 1, 5, 10, or 15 minutes
- Pause, continue, reset, and session-complete bell
- Bell generated locally with the Web Audio API — no audio files or tracking
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

Mobile browsers require audio to be unlocked by a user gesture. Tap **Begin practice** to start the session and enable the bell. If an iPhone or iPad is on silent mode, the device may suppress browser audio.

The timer uses wall-clock time, so it stays accurate if the browser briefly throttles background JavaScript. For the most reliable bells, keep the page open and the screen awake.

## License

MIT
