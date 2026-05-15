import { state } from "./state.js";
import { el } from "./dom.js";
import { addWalkPoint, distanceToRoute, updateUserPositionMarker } from "./map.js";
import { addScore, saveActiveMissionProgress } from "./mission.js";
import { updateMission, updateSetupStatus } from "./ui.js";
import { handleRouteAlarm } from "./audio.js";

const QUICK_FIX_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 60000,
  timeout: 10000
};

const ACCURATE_FIX_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 25000
};

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
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
  return true;
}

export function stopGpsWatch() {
  if (state.watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  stopTemporaryWatch();
}

export async function requestSingleGpsFix() {
  if (!canUseGeolocation()) {
    return { ok: false, message: getGpsSupportMessage() };
  }

  el.setupStatus.textContent = "GPS wird gesucht … bitte Standort erlauben.";

  const permission = await getLocationPermissionState();
  if (permission === "denied") {
    return {
      ok: false,
      message: "Standort ist im Browser blockiert. iPhone: Safari > Aa > Website-Einstellungen > Standort > Erlauben."
    };
  }

  // iOS Safari is most reliable when the permission prompt is tied to one
  // direct user action and geolocation calls are not fired in parallel.
  const quickFix = await getPosition(QUICK_FIX_OPTIONS);
  if (quickFix.ok) {
    onPosition(quickFix.position);
    return { ok: true, message: "GPS gefunden." };
  }

  const accurateFix = await getPosition(ACCURATE_FIX_OPTIONS);
  if (accurateFix.ok) {
    onPosition(accurateFix.position);
    return { ok: true, message: "GPS gefunden." };
  }

  const watchFix = await getFirstWatchPosition();
  if (watchFix.ok) {
    onPosition(watchFix.position);
    return { ok: true, message: "GPS gefunden." };
  }

  return {
    ok: false,
    message: gpsErrorMessage(watchFix.error || accurateFix.error || quickFix.error)
  };
}

function getPosition(options) {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({ ok: true, position }),
      error => resolve({ ok: false, error }),
      options
    );
  });
}

function getFirstWatchPosition() {
  return new Promise(resolve => {
    let finished = false;
    let lastError = null;

    const finish = result => {
      if (finished) return;
      finished = true;
      stopTemporaryWatch();
      resolve(result);
    };

    temporaryWatchId = navigator.geolocation.watchPosition(
      position => finish({ ok: true, position }),
      error => {
        lastError = error;
        if (error.code === error.PERMISSION_DENIED) finish({ ok: false, error });
      },
      WATCH_OPTIONS
    );

    window.setTimeout(() => finish({ ok: false, error: lastError }), 32000);
  });
}

async function getLocationPermissionState() {
  if (!navigator.permissions || !navigator.permissions.query) return "unknown";

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
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
    handleRouteAlarm(distance);
    addWalkPoint(latlng);
    addScore(latlng, distance);
    saveActiveMissionProgress();
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
  if (!error) {
    return "GPS konnte keinen Standort liefern. Standortzugriff prüfen und erneut tippen.";
  }

  if (error.code === error.PERMISSION_DENIED) {
    return "Standort blockiert. iPhone: Einstellungen > Datenschutz & Sicherheit > Ortungsdienste > Safari-Websites > Beim Verwenden erlauben; Präziser Standort einschalten.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "iPhone liefert keine Position. Ortungsdienste, WLAN/Mobile Daten aktivieren und draußen erneut tippen.";
  }

  if (error.code === error.TIMEOUT) {
    return "GPS-Timeout. Tippe erneut auf GPS; iOS braucht manchmal einen zweiten Versuch.";
  }

  return "GPS nicht verfügbar. Bitte Standortfreigabe und HTTPS prüfen.";
}
