// React

// External libraries

// Internal application modules

// Styles

export const EVENT_STATUS_LABELS = {
  evaluated: "מוערך",
  controlled: "בשליטה",
  ready_for_evacuation: "מוכן לפינוי",
  evacuation_started: "פינוי החל",
  completed: "הושלם",
};

/** Traffic-light progression: red (just evaluated) through green (completed). */
export const EVENT_STATUS_COLOR_VARS = {
  evaluated: "var(--app-color-error)",
  controlled: "var(--app-color-orange)",
  ready_for_evacuation: "var(--app-color-warning)",
  evacuation_started: "var(--app-color-success-light)",
  completed: "var(--app-color-success)",
};

export const EVENT_TYPE_LABELS = {
  explosive: "מטען נפץ",
  gunfire: "ירי",
  mortar: "מרגמה",
  "anti-tank": "נ״ט",
  phosphorus: "זרחן לבן",
};

export const COMPLETED_STATUS = "completed";
