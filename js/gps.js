import { state } from "./state.js";
import { el } from "./dom.js";
import { addWalkPoint, distanceToRoute, updateUserPositionMarker } from "./map.js";
import { addScore } from "./mission.js";
import { updateMission, updateSetupStatus } from "./ui.js";

const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 25000
};

const LOW_ACCURACY_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 60000,
  timeout: 12000
};

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 30000
};

let temporaryWatchId = null;

export function getGpsSupportMessage() {
  if (!("geolocation" in navigator)) {
    return "Dieser Browser unterstützt keine Standortbestimmung.";
  }

  if (!window.isSecureContext) {
    return "Standort braucht HTTPS. Öffne die GitHub-Pages-URL mit https://.";
  }

  return "GPS bereit. Tippe auf GPS und erlaube den Standortzugriff.";
}

export function canUseGeolocation() {
  return "geolocation" in navigator && window.isSecureContext;
}

export function requestGpsWatch() {
  if (!canUseGeolocation()) {
    el.offset.textContent = "kein GPS";
    return false;
  }

  if (state.watchId !== null) return true;

  el.offset.textContent = "GPS …";
  state.watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, WATCH_OPTIONS);

  // iOS/Safari liefert den ersten Watch-Wert manchmal spät. Dieser zusätzliche
  // Einzel-Fix triggert die Permission-Abfrage und gibt schneller Feedback.
  navigator.geolocation.getCurrentPosition(onPosition, onPositionError, LOW_ACCURACY_OPTIONS);

  return true;
}

export function stopGpsWatch() {
  if (state.watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  stopTemporaryWatch();
}

export function requestSingleGpsFix() {
  return new Promise(resolve => {
    if (!canUseGeolocation()) {
      resolve({ ok: false, message: getGpsSupportMessage() });
      return;
    }

    let settled = false;
    let lastError = null;

    const finishOk = position => {
      if (settled) return;
      settled = true;
      stopTemporaryWatch();
      onPosition(position);
      resolve({ ok: true, message: "GPS gefunden." });
    };

    const rememberError = error => {
      lastError = error;
    };

    const finishError = () => {
      if (settled) return;
      settled = true;
      stopTemporaryWatch();
      resolve({
        ok: false,
        message: lastError ? gpsErrorMessage(lastError) : "GPS konnte keinen Standort liefern. Standortzugriff prüfen und erneut tippen."
      });
    };

    el.setupStatus.textContent = "GPS wird gesucht … bitte Standort erlauben.";

    // Robuster iPhone-Pfad: watchPosition startet auf iOS oft zuverlässiger als
    // nur getCurrentPosition. Der Watch wird nach dem ersten Fix sofort beendet.
    temporaryWatchId = navigator.geolocation.watchPosition(finishOk, rememberError, WATCH_OPTIONS);

    // Parallel ein schneller Cache-/Netzwerk-Fix. Falls der exakte GPS-Fix lange
    // braucht, kann Safari damit trotzdem schon eine nutzbare Position liefern.
    navigator.geolocation.getCurrentPosition(finishOk, rememberError, LOW_ACCURACY_OPTIONS);

    window.setTimeout(() => {
      navigator.geolocation.getCurrentPosition(finishOk, rememberError, HIGH_ACCURACY_OPTIONS);
    }, 300);

    window.setTimeout(finishError, 32000);
  });
}

function stopTemporaryWatch() {
  if (temporaryWatchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(temporaryWatchId);
    temporaryWatchId = null;
  }
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
  const message = gpsErrorMessage(error);

  if (state.view === "setup") {
    el.setupStatus.textContent = message;
  }

  if (state.view === "mission") {
    el.offset.textContent = "kein GPS";
  }
}

function gpsErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Standort blockiert. iPhone: Safari öffnen > Aa > Website-Einstellungen > Standort > Erlauben.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "iPhone liefert keine Position. Ortungsdienste, WLAN/Mobile Daten aktivieren und draußen erneut tippen.";
  }

  if (error.code === error.TIMEOUT) {
    return "GPS-Timeout. Tippe erneut auf GPS; iOS braucht manchmal einen zweiten Versuch.";
  }

  return "GPS nicht verfügbar. Bitte Standortfreigabe und HTTPS prüfen.";
}
