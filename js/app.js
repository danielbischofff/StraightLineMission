import { el } from "./dom.js";
import { map } from "./map.js";
import { renderHome, updateSetupStatus } from "./ui.js";
import { centerOnUser } from "./map.js";
import { deleteMission, finishMission, renameMission, restartMissionFromHistory, resumeActiveMission } from "./mission.js";
import { cancelSetup, setupBack, setupNext, startSetup, useGps } from "./setup.js";
import { state } from "./state.js";

function boot() {
  if (!window.L || !window.turf) {
    document.body.innerHTML = "<p style='padding:20px;font-family:sans-serif'>Kartenbibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen.</p>";
    return;
  }


  el.newBtn.addEventListener("click", startSetup);
  el.cancelSetupBtn.addEventListener("click", cancelSetup);
  el.backBtn.addEventListener("click", setupBack);
  el.gpsBtn.addEventListener("click", useGps);
  el.mainBtn.addEventListener("click", setupNext);
  el.centerBtn.addEventListener("click", centerOnUser);
  el.finishBtn.addEventListener("click", finishMission);
  el.history.addEventListener("click", event => {
    const resumeButton = event.target.closest("[data-resume-active]");
    if (resumeButton) {
      resumeActiveMission();
      return;
    }

    const renameButton = event.target.closest("[data-rename-id]");
    if (renameButton) {
      renameMission(renameButton.dataset.renameId);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
      deleteMission(deleteButton.dataset.deleteId);
      return;
    }

    const replayButton = event.target.closest("[data-replay-id]");
    if (replayButton) restartMissionFromHistory(replayButton.dataset.replayId);
  });

  map.on("move", () => {
    if (state.view === "setup") updateSetupStatus();
  });

  window.addEventListener("resize", () => {
    setTimeout(() => map.invalidateSize(true), 150);
  });

  renderHome();
}

boot();
