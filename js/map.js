import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_LAYER, USER_ZOOM } from "./config.js";
import { state } from "./state.js";
import { toPoint } from "./utils.js";

export const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true,
  zoomSnap: 0.25,
  zoomDelta: 0.5
}).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer(TILE_LAYER.url, TILE_LAYER.options).addTo(map);

export function centerOnUser() {
  if (state.currentPosition) map.setView(state.currentPosition, USER_ZOOM);
}

export function setStart(point) {
  state.start = point;
  removeLayer("startMarker");
  state.startMarker = L.circleMarker(point, {
    radius: 8,
    color: "#111",
    weight: 2,
    fillColor: "#fff",
    fillOpacity: 1
  }).addTo(map);
  drawRoute();
}

export function setEnd(point) {
  state.end = point;
  removeLayer("endMarker");
  state.endMarker = L.circleMarker(point, {
    radius: 8,
    color: "#111",
    weight: 2,
    fillColor: "#ff2b2b",
    fillOpacity: 1
  }).addTo(map);
  drawRoute();
}

export function drawRoute() {
  removeLayer("routeLine");
  if (!state.start || !state.end) return;

  state.routeLine = L.polyline([state.start, state.end], {
    color: "#111",
    weight: 5,
    dashArray: "2 10",
    lineCap: "round"
  }).addTo(map);

  if (state.view !== "mission") {
    map.fitBounds(state.routeLine.getBounds(), {
      paddingTopLeft: [24, 150],
      paddingBottomRight: [24, 180]
    });
  }
}

export function createWalkedLine() {
  removeLayer("walkedLine");
  state.walkedLine = L.polyline([], {
    color: "#ff2b2b",
    weight: 4,
    opacity: .85
  }).addTo(map);
}

export function addWalkPoint(latlng) {
  state.walkedCoords.push(latlng);
  if (state.walkedLine) state.walkedLine.setLatLngs(state.walkedCoords);
}

export function updateUserPositionMarker(latlng, accuracy) {
  if (!state.userMarker) {
    state.userMarker = L.circleMarker(latlng, {
      radius: 7,
      color: "#111",
      weight: 2,
      fillColor: "#ff2b2b",
      fillOpacity: 1
    }).addTo(map);
  } else {
    state.userMarker.setLatLng(latlng);
  }

  if (!state.accuracyCircle) {
    state.accuracyCircle = L.circle(latlng, {
      radius: accuracy,
      color: "#111",
      weight: 1,
      fillColor: "#ff2b2b",
      fillOpacity: .08
    }).addTo(map);
  } else {
    state.accuracyCircle.setLatLng(latlng);
    state.accuracyCircle.setRadius(accuracy);
  }
}

export function resetMapOverlays() {
  clearInterval(state.timerId);
  state.timerId = null;
  ["routeLine", "walkedLine", "startMarker", "endMarker"].forEach(removeLayer);
}

export function removeLayer(key) {
  if (state[key]) map.removeLayer(state[key]);
  state[key] = null;
}

export function distanceToRoute(point) {
  const line = turf.lineString([
    [state.start[1], state.start[0]],
    [state.end[1], state.end[0]]
  ]);
  return turf.pointToLineDistance(toPoint(point), line, { units: "meters" });
}

export function routeLengthMeters() {
  if (!state.start || !state.end) return 0;
  return turf.distance(toPoint(state.start), toPoint(state.end), { units: "kilometers" }) * 1000;
}
