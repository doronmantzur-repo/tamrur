// React

// External libraries

// Internal application modules

// Styles

export const EVENT_STATUS_LABELS = {
  gathering_casualties: "איסוף פצועים",
  casualties_assessment: "הערכת פצועים",
  evacuation_initiated: "פינוי החל",
  full_evacuation: "פינוי מלא",
  closed: "אירוע נסגר",
};

/**
 * Pastel/categorical, not a red-to-green traffic-light ramp (team decision) —
 * these are sequential workflow stages, not severity levels. `status` is
 * otherwise fully derived server-side from gathering_status/evac_status; the
 * only manual transition is closing (full_evacuation -> closed).
 */
export const EVENT_STATUS_COLOR_VARS = {
  gathering_casualties: "var(--app-color-status-gathering-casualties)",
  casualties_assessment: "var(--app-color-status-casualties-assessment)",
  evacuation_initiated: "var(--app-color-status-evacuation-initiated)",
  full_evacuation: "var(--app-color-status-full-evacuation)",
  closed: "var(--app-color-status-closed)",
};

export const EVENT_TYPE_LABELS = {
  explosive: "מטען נפץ",
  gunfire: "ירי",
  mortar: "מרגמה",
  "anti-tank": "נ״ט",
  phosphorus: "זרחן לבן",
};

export const CLOSED_STATUS = "closed";
export const FULL_EVACUATION_STATUS = "full_evacuation";
