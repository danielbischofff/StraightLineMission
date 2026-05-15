import { el } from "./dom.js";
import { map } from "./map.js";
import { renderHome, updateSetupStatus } from "./ui.js";
import { centerOnUser } from "./map.js";
import { finishMission } from "./mission.js";
import { setupBack, setupNext, startSetup, useGps } from "./setup.js";
import { state } from "./state.js";

function boot() {
  if (!window.L || !window.turf) {
    document.body.innerHTML = "<p style='padding:20px;font-family:sans-serif'>Kartenbibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen.</p>";
    return;
  }


  el.newBtn.addEventListener("click", startSetup);
  el.backBtn.addEventListener("click", setupBack);
  el.gpsBtn.addEventListener("click", useGps);
  el.mainBtn.addEventListener("click", setupNext);
  el.centerBtn.addEventListener("click", centerOnUser);
  el.finishBtn.addEventListener("click", finishMission);

  map.on("move", () => {
    if (state.view === "setup") updateSetupStatus();
  });

  window.addEventListener("resize", () => {
    setTimeout(() => map.invalidateSize(true), 150);
  });

  renderHome();
}

boot();
