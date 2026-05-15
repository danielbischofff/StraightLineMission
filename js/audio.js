import { OFF_ROUTE_DISTANCE_METERS } from "./config.js";

let audioContext = null;
let alarmActive = false;
let currentDistanceMeters = 0;
let repeatTimerId = null;
let lastBeepAt = 0;

export function unlockRouteAlarm() {
  const context = getAudioContext();
  if (!context) return false;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  // iOS Safari only allows audio after a user gesture. A silent, very short
  // sound during mission start unlocks later warning beeps.
  playTone(1, 0.01, 0.001);
  return true;
}

export function handleRouteAlarm(distanceMeters) {
  currentDistanceMeters = Number(distanceMeters || 0);
  const outside = currentDistanceMeters >= OFF_ROUTE_DISTANCE_METERS;

  if (!outside) {
    alarmActive = false;
    stopRepeatAlarm();
    return;
  }

  if (!alarmActive) {
    alarmActive = true;
    beepNow();
    scheduleNextAlarm();
  }
}

export function stopRouteAlarm() {
  alarmActive = false;
  stopRepeatAlarm();
}

function scheduleNextAlarm() {
  stopRepeatAlarm();
  if (!alarmActive) return;

  const pattern = alarmPatternForDistance(currentDistanceMeters);
  repeatTimerId = window.setTimeout(() => {
    if (!alarmActive) return;
    beepNow();
    scheduleNextAlarm();
  }, pattern.intervalMs);
}

function stopRepeatAlarm() {
  if (repeatTimerId !== null) {
    window.clearTimeout(repeatTimerId);
    repeatTimerId = null;
  }
}

function beepNow() {
  const pattern = alarmPatternForDistance(currentDistanceMeters);
  const now = Date.now();
  if (now - lastBeepAt < Math.min(250, pattern.intervalMs - 50)) return;
  lastBeepAt = now;

  for (let index = 0; index < pattern.beeps; index += 1) {
    window.setTimeout(() => {
      playTone(pattern.frequency, pattern.durationSeconds, pattern.volume);
    }, index * pattern.gapMs);
  }
}

function alarmPatternForDistance(distanceMeters) {
  const extraDistance = Math.max(0, distanceMeters - OFF_ROUTE_DISTANCE_METERS);

  if (extraDistance >= 90) {
    return {
      intervalMs: 450,
      beeps: 4,
      gapMs: 90,
      frequency: 1320,
      durationSeconds: 0.1,
      volume: 0.95
    };
  }

  if (extraDistance >= 40) {
    return {
      intervalMs: 800,
      beeps: 3,
      gapMs: 110,
      frequency: 1160,
      durationSeconds: 0.11,
      volume: 0.8
    };
  }

  if (extraDistance >= 15) {
    return {
      intervalMs: 1400,
      beeps: 2,
      gapMs: 140,
      frequency: 980,
      durationSeconds: 0.12,
      volume: 0.6
    };
  }

  return {
    intervalMs: 2300,
    beeps: 1,
    gapMs: 160,
    frequency: 880,
    durationSeconds: 0.13,
    volume: 0.38
  };
}

function getAudioContext() {
  if (audioContext) return audioContext;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();
  return audioContext;
}

function playTone(frequency, durationSeconds, volume) {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
  const end = start + durationSeconds;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}
