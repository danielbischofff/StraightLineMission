import { el } from "./dom.js";
import { state } from "./state.js";
import { saveMissions } from "./storage.js";
import { makeId, toPoint } from "./utils.js";
import { centerOnUser, createWalkedLine, drawRoute, routeLengthMeters } from "./map.js";
import { renderHome, show, updateTimer } from "./ui.js";
import { requestGpsWatch, stopGpsWatch } from "./gps.js";
import { stopRouteAlarm, unlockRouteAlarm } from "./audio.js";

export function beginMission() {
  if (!state.start || !state.end) return;

  show("mission");
  state.score = 0;
  state.walkedCoords = [];
  state.lastScoreAt = 0;
  state.lastScorePosition = null;
  state.startedAt = Date.now();
  unlockRouteAlarm();

  el.score.textContent = "0";
  el.timer.textContent = "00:00";
  el.offset.textContent = "–";

  drawRoute();
  createWalkedLine();
  requestGpsWatch();
  centerOnUser();

  state.timerId = setInterval(updateTimer, 250);
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
    score: state.score,
    durationMs,
    distanceMeters: routeLengthMeters(),
    samples: state.walkedCoords.length
  };

  state.missions.unshift(mission);
  state.missions = state.missions.slice(0, 50);
  saveMissions(state.missions);

  show("home");
  renderHome();
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

function scoreForDistance(distance) {
  if (distance < 3) return 10;
  if (distance < 10) return 7;
  if (distance < 25) return 4;
  if (distance < 50) return 1;
  return 0;
}
