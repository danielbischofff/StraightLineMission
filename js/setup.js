import { state } from "./state.js";
import { el } from "./dom.js";
import { centerOnUser, map, removeLayer, resetMapOverlays, routeLengthMeters, setEnd, setStart } from "./map.js";
import { renderHome, show, updateSetupUi } from "./ui.js";
import { beginMission } from "./mission.js";
import { saveMissions } from "./storage.js";
import { makeId } from "./utils.js";
import { requestSingleGpsFix } from "./gps.js";

export function startSetup() {
  resetMapOverlays();
  el.danger.classList.remove("active");

  state.step = "start";
  state.start = null;
  state.end = null;
  state.walkedCoords = [];
  state.score = 0;

  show("setup");
  updateSetupUi();
  centerOnUser();
}


export function cancelSetup() {
  savePlannedMissionIfComplete();
  resetSetupState();

  show("home");
  renderHome();
}

export function setupBack() {
  if (state.step === "start") {
    show("home");
    renderHome();
    return;
  }

  if (state.step === "end") {
    state.step = "start";
    state.end = null;
    removeLayer("endMarker");
    updateSetupUi();
    return;
  }

  state.step = "end";
  updateSetupUi();
}

export function setupNext() {
  const center = [map.getCenter().lat, map.getCenter().lng];

  if (state.step === "start") {
    setStart(center);
    state.step = "end";
  } else if (state.step === "end") {
    setEnd(center);
    state.step = "ready";
  } else {
    beginMission();
    return;
  }

  updateSetupUi();
}

export async function useGps() {
  const result = await requestSingleGpsFix();

  if (!result.ok || !state.currentPosition) {
    el.setupStatus.textContent = result.message;
    return;
  }

  map.setView(state.currentPosition, 18);

  if (state.step === "start") {
    setStart(state.currentPosition);
    state.step = "end";
  } else if (state.step === "end") {
    setEnd(state.currentPosition);
    state.step = "ready";
  }

  updateSetupUi();
}

function savePlannedMissionIfComplete() {
  if (!state.start || !state.end) return;

  const mission = {
    id: makeId(),
    createdAt: Date.now(),
    startedAt: null,
    name: nextPlannedMissionName(),
    score: 0,
    rawScore: 0,
    durationMs: 0,
    distanceMeters: routeLengthMeters(),
    samples: 0,
    start: state.start,
    end: state.end,
    walkedCoords: [],
    planned: true
  };

  state.missions.unshift(mission);
  state.missions = state.missions.slice(0, 50);
  saveMissions(state.missions);
}

function nextPlannedMissionName() {
  const number = state.missions.filter(mission => mission.name?.startsWith("Planned Mission")).length + 1;
  return `Planned Mission ${String(number).padStart(2, "0")}`;
}

function resetSetupState() {
  resetMapOverlays();
  el.danger.classList.remove("active");

  state.step = "start";
  state.start = null;
  state.end = null;
  state.walkedCoords = [];
  state.score = 0;
  state.startedAt = null;
  state.lastScoreAt = 0;
  state.lastScorePosition = null;
}
