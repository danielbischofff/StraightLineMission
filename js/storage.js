import { ACTIVE_MISSION_STORAGE_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY } from "./config.js";

export function loadMissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "[]";
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) return [];

    return data.map(normalizeMission).slice(0, 50);
  } catch {
    return [];
  }
}

export function saveMissions(missions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

export function loadActiveMission() {
  try {
    const raw = localStorage.getItem(ACTIVE_MISSION_STORAGE_KEY);
    if (!raw) return null;

    const mission = normalizeMission(JSON.parse(raw));
    if (!hasRoute(mission)) return null;

    return mission;
  } catch {
    return null;
  }
}

export function saveActiveMission(mission) {
  if (!mission || !hasRoute(mission)) return;
  localStorage.setItem(ACTIVE_MISSION_STORAGE_KEY, JSON.stringify(normalizeMission(mission)));
}

export function clearActiveMission() {
  localStorage.removeItem(ACTIVE_MISSION_STORAGE_KEY);
}

function normalizeMission(mission) {
  const start = normalizePoint(mission.start);
  const end = normalizePoint(mission.end);
  const walkedCoords = Array.isArray(mission.walkedCoords)
    ? mission.walkedCoords.map(normalizePoint).filter(Boolean)
    : [];

  return {
    id: mission.id || String(mission.createdAt || Date.now()),
    createdAt: mission.createdAt || Date.now(),
    startedAt: mission.startedAt || null,
    name: typeof mission.name === "string" ? mission.name.trim().slice(0, 60) : "",
    score: Number(mission.score || 0),
    rawScore: Number(mission.rawScore || mission.score || 0),
    durationMs: Number(mission.durationMs || 0),
    distanceMeters: Number(mission.distanceMeters || (mission.distanceKm || 0) * 1000),
    samples: Number(mission.samples || walkedCoords.length || 0),
    start,
    end,
    walkedCoords
  };
}

function normalizePoint(point) {
  if (!Array.isArray(point) || point.length < 2) return null;

  const lat = Number(point[0]);
  const lng = Number(point[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function hasRoute(mission) {
  return Array.isArray(mission.start) && Array.isArray(mission.end);
}
