// React

// External libraries

// Internal application modules

// Styles

export const URGENCY_ORDER = ["non-urgent", "urgent", "expectant", "deceased"];

export const URGENCY_LABELS = {
  "non-urgent": "לא דחוף",
  urgent: "דחוף",
  expectant: "ממתין",
  deceased: "חלל",
};

export const URGENCY_COLOR_VARS = {
  "non-urgent": "var(--app-color-success)",
  urgent: "var(--app-color-warning)",
  expectant: "var(--app-color-error)",
  deceased: "var(--app-color-text-muted)",
};

export const EVAC_ABILITY_LABELS = {
  walk: "הליכה",
  sit: "ישיבה",
  lie: "שכיבה",
};

// recommended-evac-dest is free text, not a fixed enum — translate the known
// values and fall back to showing whatever else comes through as-is.
export const EVAC_DEST_LABELS = {
  hospital: "בית-חולים",
};
