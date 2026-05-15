import { el } from "./dom.js";
import { state } from "./state.js";
import { clearActiveMission, saveActiveMission, saveMissions } from "./storage.js";
import { makeId, toPoint } from "./utils.js";
import { addWalkPoint, centerOnUser, createWalkedLine, drawRoute, routeLengthMeters, setEnd, setStart } from "./map.js";
import { renderHome, show, updateTimer } from "./ui.js";
import { requestGpsWatch, stopGpsWatch } from "./gps.js";
import { stopRouteAlarm, unlockRouteAlarm } from "./audio.js";

export function beginMission(options = {}) {
  if (!state.start || !state.end) return;

  const resume = options.resume === true;

  show("mission");
  state.score = resume ? Number(state.score || 0) : 0;
  state.walkedCoords = resume ? [...(state.walkedCoords || [])] : [];
  state.lastScoreAt = 0;
  state.lastScorePosition = state.walkedCoords.length ? state.walkedCoords[state.walkedCoords.length - 1] : null;
  state.startedAt = resume && state.startedAt ? state.startedAt : Date.now();
  unlockRouteAlarm();

  el.score.textContent = String(state.score);
  el.timer.textContent = "00:00";
  el.offset.textContent = "–";

  drawRoute();
  const savedWalkedCoords = [...state.walkedCoords];
  state.walkedCoords = [];
  createWalkedLine();
  savedWalkedCoords.forEach(point => addWalkPoint(point));
  requestGpsWatch();
  centerOnUser();
  saveActiveMissionProgress();

  state.timerId = setInterval(() => {
    updateTimer();
    saveActiveMissionProgress();
  }, 1000);
}

export function finishMission() {
  clearInterval(state.timerId);
  state.timerId = null;
  el.danger.classList.remove("active");
  stopRouteAlarm();
  stopGpsWatch();

  const durationMs = state.startedAt ? Date.now() - state.startedAt : 0;
  const mission = {
    id: makeId(),
    createdAt: Date.now(),
    startedAt: state.startedAt,
    score: state.score,
    durationMs,
    distanceMeters: routeLengthMeters(),
    samples: state.walkedCoords.length,
    start: state.start,
    end: state.end,
    walkedCoords: state.walkedCoords
  };

  state.missions.unshift(mission);
  state.missions = state.missions.slice(0, 50);
  state.activeMission = null;
  saveMissions(state.missions);
  clearActiveMission();

  show("home");
  renderHome();
}

export function resumeActiveMission() {
  const mission = state.activeMission;
  if (!mission || !mission.start || !mission.end) return;

  loadMissionIntoState(mission, true);
  beginMission({ resume: true });
}

export function restartMissionFromHistory(missionId) {
  const mission = state.missions.find(item => item.id === missionId);
  if (!mission || !mission.start || !mission.end) return;

  loadMissionIntoState(mission, false);
  beginMission();
}

export function saveActiveMissionProgress() {
  if (state.view !== "mission" || !state.start || !state.end || !state.startedAt) return;

  const mission = {
    id: state.activeMission?.id || makeId(),
    createdAt: state.activeMission?.createdAt || Date.now(),
    startedAt: state.startedAt,
    score: state.score,
    durationMs: Date.now() - state.startedAt,
    distanceMeters: routeLengthMeters(),
    samples: state.walkedCoords.length,
    start: state.start,
    end: state.end,
    walkedCoords: state.walkedCoords
  };

  state.activeMission = mission;
  saveActiveMission(mission);
}

export function addScore(latlng, distance) {
  const now = Date.now();
  if (now - state.lastScoreAt < 1000) return;

  if (state.lastScorePosition) {
    const moved = turf.distance(toPoint(state.lastScorePosition), toPoint(latlng), { units: "meters" });
    if (moved < 1.5) return;
  }

  state.score += scoreForDistance(distance);
  state.lastScoreAt = now;
  state.lastScorePosition = latlng;
  el.score.textContent = String(state.score);
}

function loadMissionIntoState(mission, keepProgress) {
  stopRouteAlarm();
  stopGpsWatch();
  clearInterval(state.timerId);
  state.timerId = null;

  state.step = "ready";
  state.start = null;
  state.end = null;
  state.walkedCoords = keepProgress ? [...(mission.walkedCoords || [])] : [];
  state.score = keepProgress ? Number(mission.score || 0) : 0;
  state.startedAt = keepProgress && mission.startedAt ? mission.startedAt : null;
  state.lastScoreAt = 0;
  state.lastScorePosition = state.walkedCoords.length ? state.walkedCoords[state.walkedCoords.length - 1] : null;

  setStart(mission.start);
  setEnd(mission.end);
}

function scoreForDistance(distance) {
  if (distance < 3) return 10;
  if (distance < 10) return 7;
  if (distance < 25) return 4;
  if (distance < 50) return 1;
  return 0;
}
