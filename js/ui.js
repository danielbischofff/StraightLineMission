import { el } from "./dom.js";
import { state } from "./state.js";
import { DANGER_DISTANCE_METERS } from "./config.js";
import { drawRoute, map, routeLengthMeters } from "./map.js";
import { formatDistance, formatDuration } from "./utils.js";

export function show(view) {
  state.view = view;
  el.home.classList.toggle("active", view === "home");
  el.setup.classList.toggle("active", view === "setup");
  el.mission.classList.toggle("active", view === "mission");
  el.crosshair.classList.toggle("hidden", view !== "setup");

  setTimeout(() => map.invalidateSize(true), 100);
}

export function updateSetupUi() {
  const contentByStep = {
    start: {
      title: "1. Start setzen",
      copy: "Bewege die Karte. Der Punkt unter dem Fadenkreuz wird dein Start.",
      pill: "01/03",
      back: "Home",
      main: "Set start"
    },
    end: {
      title: "2. Ziel setzen",
      copy: "Bewege die Karte zum Ziel. Daraus entsteht deine direkte Linie.",
      pill: "02/03",
      back: "Change start",
      main: "Set target"
    },
    ready: {
      title: "3. Bereit",
      copy: "Route ist vorbereitet. Starte, sobald du am Startpunkt bist.",
      pill: "03/03",
      back: "Change target",
      main: "Start mission"
    }
  };

  const content = contentByStep[state.step];
  el.setupTitle.textContent = content.title;
  el.setupCopy.textContent = content.copy;
  el.stepPill.textContent = content.pill;
  el.backBtn.textContent = content.back;
  el.mainBtn.textContent = content.main;

  updateSetupStatus();
  drawRoute();
}

export function updateSetupStatus() {
  const c = map.getCenter();
  const gps = state.currentPosition ? `GPS ±${Math.round(state.currentAccuracy || 0)}m` : "GPS optional";
  const route = state.start && state.end ? ` · ${formatDistance(routeLengthMeters())}` : "";

  el.setupStatus.textContent = `${gps} · ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}${route}`;
}

export function updateMission(distance) {
  el.offset.textContent = formatDistance(distance);
  el.danger.classList.toggle("active", distance >= DANGER_DISTANCE_METERS);
}

export function updateTimer() {
  if (!state.startedAt) return;
  el.timer.textContent = formatDuration(Date.now() - state.startedAt);
}

export function renderHome() {
  const total = state.missions.reduce((sum, mission) => sum + Number(mission.score || 0), 0);
  const best = state.missions.reduce((max, mission) => Math.max(max, Number(mission.score || 0)), 0);

  el.totalScore.textContent = String(total);
  el.runCount.textContent = String(state.missions.length);
  el.bestScore.textContent = String(best);
  const hasActiveMission = Boolean(state.activeMission && state.activeMission.start && state.activeMission.end);
  el.historyHint.textContent = state.missions.length || hasActiveMission
    ? `${state.missions.length} saved${hasActiveMission ? " · 1 active" : ""}`
    : "empty";
  el.history.innerHTML = "";

  if (hasActiveMission) {
    const active = state.activeMission;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "card mission mission-button active-mission";
    item.dataset.resumeActive = "true";
    item.innerHTML = `
      <div>
        <div class="mission-title">Aktive Mission fortsetzen</div>
        <div class="mission-meta">
          ${new Date(active.createdAt).toLocaleDateString("de-DE")} ·
          ${formatDistance(active.distanceMeters || 0)} ·
          ${formatDuration(active.durationMs || 0)} ·
          ${active.samples || 0} gps
        </div>
      </div>
      <div class="points">${active.score || 0}</div>
    `;
    el.history.appendChild(item);
  }

  if (!state.missions.length && !hasActiveMission) {
    el.history.innerHTML = `
      <div class="card mission">
        <div>
          <div class="mission-title">No mission yet</div>
          <div class="mission-meta">Create your first straightline route.</div>
        </div>
        <div class="points">0</div>
      </div>
    `;
    return;
  }

  state.missions.forEach((mission, index) => {
    const canReplay = Boolean(mission.start && mission.end);
    const item = document.createElement(canReplay ? "button" : "div");
    if (canReplay) {
      item.type = "button";
      item.dataset.replayId = mission.id;
    }
    item.className = `card mission${canReplay ? " mission-button" : ""}`;
    item.innerHTML = `
      <div>
        <div class="mission-title">Mission ${String(state.missions.length - index).padStart(2, "0")}${canReplay ? " erneut laufen" : ""}</div>
        <div class="mission-meta">
          ${new Date(mission.createdAt).toLocaleDateString("de-DE")} ·
          ${formatDistance(mission.distanceMeters || 0)} ·
          ${formatDuration(mission.durationMs || 0)} ·
          ${mission.samples || 0} gps
        </div>
      </div>
      <div class="points">${mission.score || 0}</div>
    `;
    el.history.appendChild(item);
  });
}
