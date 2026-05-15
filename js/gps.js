import { state } from "./state.js";
import { el } from "./dom.js";
import { addWalkPoint, distanceToRoute, updateUserPositionMarker } from "./map.js";
import { addScore } from "./mission.js";
import { updateMission, updateSetupStatus } from "./ui.js";

export function requestGpsWatch() {
  if (!canUseGeolocation() || state.watchId !== null) return;

  state.watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
    enableHighAccuracy: true,
    maximumAge: 500,
    timeout: 15000
  });
}

export function requestSingleGpsFix() {
  return new Promise(resolve => {
    if (!canUseGeolocation()) return resolve(false);

    navigator.geolocation.getCurrentPosition(
      position => {
        onPosition(position);
        resolve(true);
      },
      () => resolve(false),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  });
}

function onPosition(position) {
  const latlng = [position.coords.latitude, position.coords.longitude];

  state.currentPosition = latlng;
  state.currentAccuracy = position.coords.accuracy || 0;

  updateUserPositionMarker(latlng, state.currentAccuracy);

  if (state.view === "setup") updateSetupStatus();

  if (state.view === "mission" && state.start && state.end) {
    const distance = distanceToRoute(latlng);
    updateMission(distance);
    addWalkPoint(latlng);
    addScore(latlng, distance);
  }
}

function onPositionError(error) {
  if (state.view !== "setup") return;

  el.setupStatus.textContent = error.code === 1
    ? "Standort blockiert. Erlaube Standortzugriff im Browser."
    : "GPS noch nicht verfügbar. Versuche es draußen erneut.";
}

function canUseGeolocation() {
  return "geolocation" in navigator && window.isSecureContext;
}
