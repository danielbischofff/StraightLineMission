export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "0 m";
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function toPoint(latlng) {
  return turf.point([latlng[1], latlng[0]]);
}
