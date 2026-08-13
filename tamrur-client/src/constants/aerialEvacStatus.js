// React

// External libraries

// Internal application modules

// Styles

export const AERIAL_EVAC_LABELS = {
  no_needed: "לא נדרש",
  needed: "צריך פינוי אווירי",
  in_progress: "בטיפול",
  approved: "מאושר",
  denied: "נדחה",
};

/** In practice only needed/approved/denied are expected to be in real use; no_needed/in_progress get neutral placeholder colors until decided. */
export const AERIAL_EVAC_COLOR_VARS = {
  no_needed: "var(--app-color-text-muted)",
  needed: "var(--app-color-warning)",
  in_progress: "var(--app-color-primary)",
  approved: "var(--app-color-success)",
  denied: "var(--app-color-error)",
};

/** Statuses that pulse to catch the brigade's attention — the airforce's response to a request. */
export const PULSING_AERIAL_EVAC_STATUSES = ["approved", "denied"];

/** The evacuation *team's* own status, distinct from the event-level aerial-evac request status above. */
export const EVAC_TEAM_STATUS_LABELS = {
  not_started: "טרם יצא",
  started: "בדרך",
  completed: "הושלם",
};

export const EVAC_TEAM_STATUS_COLOR_VARS = {
  not_started: "var(--app-color-text-muted)",
  started: "var(--app-color-primary)",
  completed: "var(--app-color-success)",
};
