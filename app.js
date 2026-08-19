
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
      sessionLabel.textContent = 'Ready when you are';
      timerCaption.textContent = 'remaining';
      startLabel.textContent = 'Begin practice';
      startIcon.textContent = '▶';
      statusMessage.textContent = 'Take a breath. There is nowhere else to be.';
    } else if (isPaused) {
      sessionLabel.textContent = 'Practice paused';
      timerCaption.textContent = 'remaining';
      startLabel.textContent = 'Continue';
      startIcon.textContent = '▶';
      statusMessage.textContent = 'Whenever you are ready, return to the breath.';
    } else if (isRunning) {
      sessionLabel.textContent = 'Practice in progress';
      timerCaption.textContent = 'remaining';
      startLabel.textContent = 'Pause';
      startIcon.textContent = 'Ⅱ';
      statusMessage.textContent = intervalSeconds && nextBellAt - (durationSeconds - remainingSeconds) <= 2
        ? 'A bell will gently mark your next return.'
        : 'Notice the breath as it is, without changing it.';
    } else {
      sessionLabel.textContent = 'Practice complete';
      timerCaption.textContent = 'complete';
      startLabel.textContent = 'Begin again';
      startIcon.textContent = '↻';
      statusMessage.textContent = 'Well done. Notice how you feel before moving on.';
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

  function playBell() {
    if (!soundEnabled) return;
    const context = createAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    master.connect(context.destination);

    [392, 587, 784].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const partialGain = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      partialGain.gain.value = [0.7, 0.3, 0.14][index];
      oscillator.connect(partialGain);
      partialGain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 2.5);
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
    playBell();
    render();
  }

  function tick() {
    if (!isRunning) return;
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const elapsed = durationSeconds - remainingSeconds;
    if (intervalSeconds > 0 && elapsed >= nextBellAt && remainingSeconds > 0) {
      playBell();
      nextBellAt = (Math.floor(elapsed / intervalSeconds) + 1) * intervalSeconds;
    }
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
    timerHandle = window.setInterval(tick, 250);
    render();
  }

  function pause() {
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    isRunning = false;
    isPaused = true;
    stopTicking();
    releaseWakeLock();
    render();
  }

  function reset() {
    isRunning = false;
    isPaused = false;
    stopTicking();
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
  });
  startButton.addEventListener('click', () => {
    if (isRunning) pause();
    else beginOrResume();
  });
  resetButton.addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRunning) requestWakeLock();
  });

  render();
})();
