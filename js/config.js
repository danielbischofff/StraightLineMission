export const STORAGE_KEY = "straightline_missions_clean_v1";
export const LEGACY_STORAGE_KEY = "straightline_missions_v3";

export const DANGER_DISTANCE_METERS = 35;
export const DEFAULT_CENTER = [52.52, 13.405];
export const DEFAULT_ZOOM = 15;
export const USER_ZOOM = 18;

export const TILE_LAYER = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  options: {
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
  }
};
