
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
(() => {
  'use strict';

  const durationSelect = document.querySelector('#duration');
  const intervalSelect = document.querySelector('#interval');
  const soundToggle = document.querySelector('#sound-toggle');
  const soundToggleLabel = document.querySelector('#sound-toggle-label');
  const startButton = document.querySelector('#start-button');
  const startLabel = document.querySelector('#start-label');
  const startIcon = document.querySelector('#start-icon');
  const resetButton = document.querySelector('#reset-button');
  const timerDisplay = document.querySelector('#timer-display');
  const timerCaption = document.querySelector('#timer-caption');
  const sessionLabel = document.querySelector('#session-label');
  const statusMessage = document.querySelector('#status-message');
  const progressRing = document.querySelector('#progress-ring');
  const timerCard = document.querySelector('.timer-card');

  let audioContext;
  let timerHandle;
  let wakeLock;
  let scheduledSources = [];
  let durationSeconds = Number(durationSelect.value) * 60;
  let intervalSeconds = Number(intervalSelect.value) * 60;
  let remainingSeconds = durationSeconds;
  let endTime = 0;
  let nextBellAt = intervalSeconds;
  let isRunning = false;
  let isPaused = false;
  let soundEnabled = true;

  const savedDuration = localStorage.getItem('stillpoint-duration');
  const savedInterval = localStorage.getItem('stillpoint-interval');
  if (savedDuration && durationSelect.querySelector(`option[value="${savedDuration}"]`)) durationSelect.value = savedDuration;
  if (savedInterval && intervalSelect.querySelector(`option[value="${savedInterval}"]`)) intervalSelect.value = savedInterval;
  durationSeconds = Number(durationSelect.value) * 60;
  intervalSeconds = Number(intervalSelect.value) * 60;
  remainingSeconds = durationSeconds;

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function render() {
    const elapsed = durationSeconds - remainingSeconds;
    const progress = durationSeconds ? Math.min(100, (elapsed / durationSeconds) * 100) : 0;
    timerDisplay.textContent = formatTime(remainingSeconds);
    progressRing.style.setProperty('--progress', `${progress}%`);
    timerCard.classList.toggle('is-running', isRunning);

    if (!isRunning && !isPaused && remainingSeconds === durationSeconds) {
      sessionLabel.textContent = 'Ready';
      timerCaption.textContent = 'left';
      startLabel.textContent = 'Begin';
      startIcon.textContent = '▶';
      statusMessage.textContent = 'Breathe in. Breathe out.';
    } else if (isPaused) {
      sessionLabel.textContent = 'Paused';
      timerCaption.textContent = 'left';
      startLabel.textContent = 'Continue';
      startIcon.textContent = '▶';
      statusMessage.textContent = 'Return when ready.';
    } else if (isRunning) {
      sessionLabel.textContent = 'In practice';
      timerCaption.textContent = 'left';
      startLabel.textContent = 'Pause';
      startIcon.textContent = 'Ⅱ';
      statusMessage.textContent = intervalSeconds && nextBellAt - (durationSeconds - remainingSeconds) <= 2
        ? 'A bell will call you back.'
        : 'Stay with the breath.';
    } else {
      sessionLabel.textContent = 'Complete';
      timerCaption.textContent = 'done';
      startLabel.textContent = 'Again';
      startIcon.textContent = '↻';
      statusMessage.textContent = 'Be here now.';
    }
  }

  function createAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioContext = new AudioContextClass();
    }
    return audioContext;
  }

  async function unlockAudio() {
    const context = createAudioContext();
    if (context && context.state === 'suspended') await context.resume();
  }

  function playBell(startAt) {
    if (!soundEnabled) return [];
    const context = createAudioContext();
    if (!context) return [];

    // A meditation-class temple bell: a low wooden strike, a brief metal attack,
    // and inharmonic resonances that bloom and fade over several seconds.
    const now = Math.max(startAt ?? context.currentTime, context.currentTime);
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 7.2);
    master.connect(context.destination);
    const sources = [];

    const strikeOscillator = context.createOscillator();
    const strikeGain = context.createGain();
    strikeOscillator.type = 'sine';
    strikeOscillator.frequency.setValueAtTime(118, now);
    strikeOscillator.frequency.exponentialRampToValueAtTime(78, now + 0.18);
    strikeGain.gain.setValueAtTime(0.0001, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.42, now + 0.008);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    strikeOscillator.connect(strikeGain);
    strikeGain.connect(master);
    strikeOscillator.start(now);
    strikeOscillator.stop(now + 1.7);
    sources.push(strikeOscillator);

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.16), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseData.length);
    }
    const noiseSource = context.createBufferSource();
    const metalFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noiseSource.buffer = noiseBuffer;
    metalFilter.type = 'bandpass';
    metalFilter.frequency.value = 2200;
    metalFilter.Q.value = 2.4;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.34, now + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    noiseSource.connect(metalFilter);
    metalFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSource.start(now);
    sources.push(noiseSource);

    // Bell overtones are intentionally not integer multiples of the root.
    [
      { ratio: 1, gain: 0.72, decay: 7.0, detune: 0 },
      { ratio: 2.01, gain: 0.34, decay: 5.8, detune: -3 },
      { ratio: 2.76, gain: 0.24, decay: 5.1, detune: 2 },
      { ratio: 4.07, gain: 0.14, decay: 4.1, detune: -2 },
      { ratio: 5.43, gain: 0.09, decay: 3.4, detune: 4 },
      { ratio: 7.12, gain: 0.045, decay: 2.3, detune: -5 },
    ].forEach(({ ratio, gain, decay, detune }) => {
      const oscillator = context.createOscillator();
      const partialGain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 146.8 * ratio;
      oscillator.detune.value = detune;
      partialGain.gain.setValueAtTime(0.0001, now);
      partialGain.gain.exponentialRampToValueAtTime(gain, now + 0.014);
      partialGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      oscillator.connect(partialGain);
      partialGain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + decay + 0.1);
      sources.push(oscillator);
    });
    return sources;
  }

  function clearScheduledBells() {
    scheduledSources.forEach((source) => {
      try { source.stop(); } catch (_) { /* Already finished. */ }
    });
    scheduledSources = [];
  }

  function scheduleSessionBells() {
    clearScheduledBells();
    if (!soundEnabled) return;
    const context = createAudioContext();
    if (!context) return;

    const elapsed = durationSeconds - remainingSeconds;
    const targets = [];
    nextBellAt = 0;
    if (intervalSeconds > 0) {
      for (let target = intervalSeconds; target < durationSeconds; target += intervalSeconds) {
        if (target > elapsed) targets.push(target);
      }
      nextBellAt = targets[0] || 0;
    }
    if (durationSeconds > elapsed) targets.push(durationSeconds);

    targets.forEach((target) => {
      const wallTime = endTime - (durationSeconds - target) * 1000;
      const secondsUntilBell = (wallTime - Date.now()) / 1000;
      const audioTime = context.currentTime + Math.max(0, secondsUntilBell);
      scheduledSources.push(...playBell(audioTime));
    });
  }

  function requestWakeLock() {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => { wakeLock = lock; }).catch(() => {});
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = undefined;
    }
  }

  function stopTicking() {
    window.clearInterval(timerHandle);
    timerHandle = undefined;
  }

  function finishSession() {
    remainingSeconds = 0;
    isRunning = false;
    isPaused = false;
    stopTicking();
    releaseWakeLock();
    render();
  }

  function tick() {
    if (!isRunning) return;
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remainingSeconds <= 0) finishSession();
    else render();
  }

  async function beginOrResume() {
    await unlockAudio();
    if (isPaused) {
      endTime = Date.now() + remainingSeconds * 1000;
    } else {
      durationSeconds = Number(durationSelect.value) * 60;
      intervalSeconds = Number(intervalSelect.value) * 60;
      remainingSeconds = durationSeconds;
      nextBellAt = intervalSeconds;
      endTime = Date.now() + durationSeconds * 1000;
    }
    isRunning = true;
    isPaused = false;
    durationSelect.disabled = true;
    intervalSelect.disabled = true;
    requestWakeLock();
    scheduleSessionBells();
    timerHandle = window.setInterval(tick, 250);
    render();
  }

  function pause() {
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    isRunning = false;
    isPaused = true;
    stopTicking();
    clearScheduledBells();
    releaseWakeLock();
    render();
  }

  function reset() {
    isRunning = false;
    isPaused = false;
    stopTicking();
    clearScheduledBells();
    releaseWakeLock();
    durationSeconds = Number(durationSelect.value) * 60;
    intervalSeconds = Number(intervalSelect.value) * 60;
    remainingSeconds = durationSeconds;
    nextBellAt = intervalSeconds;
    durationSelect.disabled = false;
    intervalSelect.disabled = false;
    render();
  }

  durationSelect.addEventListener('change', () => {
    localStorage.setItem('stillpoint-duration', durationSelect.value);
    if (!isRunning && !isPaused) reset();
  });
  intervalSelect.addEventListener('change', () => {
    localStorage.setItem('stillpoint-interval', intervalSelect.value);
    if (!isRunning && !isPaused) reset();
  });
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggleLabel.textContent = soundEnabled ? 'On' : 'Off';
    soundToggle.classList.toggle('is-muted', !soundEnabled);
    if (isRunning) scheduleSessionBells();
  });
  startButton.addEventListener('click', () => {
    if (isRunning) pause();
    else beginOrResume();
  });
  resetButton.addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRunning) {
      requestWakeLock();
      scheduleSessionBells();
    }
  });

  render();
})();
