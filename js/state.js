import { loadMissions } from "./storage.js";

export const state = {
  view: "home",
  step: "start",

  start: null,
  end: null,
  currentPosition: null,
  currentAccuracy: null,

  watchId: null,
  routeLine: null,
  walkedLine: null,
  startMarker: null,
  endMarker: null,
  userMarker: null,
  accuracyCircle: null,

  walkedCoords: [],
  score: 0,
  lastScoreAt: 0,
  lastScorePosition: null,
  startedAt: null,
  timerId: null,

  missions: loadMissions()
};
