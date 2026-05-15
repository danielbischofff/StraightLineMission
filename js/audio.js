import { OFF_ROUTE_DISTANCE_METERS } from "./config.js";

let audioContext = null;
let alarmActive = false;
let lastBeepAt = 0;
let repeatTimerId = null;

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
  const outside = distanceMeters >= OFF_ROUTE_DISTANCE_METERS;

  if (!outside) {
    alarmActive = false;
    stopRepeatAlarm();
    return;
  }

  if (!alarmActive) {
    alarmActive = true;
    beepNow();
    startRepeatAlarm();
  }
}

export function stopRouteAlarm() {
  alarmActive = false;
  stopRepeatAlarm();
}

function startRepeatAlarm() {
  stopRepeatAlarm();
  repeatTimerId = window.setInterval(() => {
    if (alarmActive) beepNow();
  }, 2500);
}

function stopRepeatAlarm() {
  if (repeatTimerId !== null) {
    window.clearInterval(repeatTimerId);
    repeatTimerId = null;
  }
}

function beepNow() {
  const now = Date.now();
  if (now - lastBeepAt < 700) return;
  lastBeepAt = now;

  playTone(880, 0.12, 0.18);
  window.setTimeout(() => playTone(880, 0.12, 0.18), 180);
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

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}
