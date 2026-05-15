import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "./config.js";

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

function normalizeMission(mission) {
  return {
    id: mission.id || String(mission.createdAt || Date.now()),
    createdAt: mission.createdAt || Date.now(),
    score: Number(mission.score || 0),
    durationMs: Number(mission.durationMs || 0),
    distanceMeters: Number(mission.distanceMeters || (mission.distanceKm || 0) * 1000),
    samples: Number(mission.samples || 0)
  };
}
