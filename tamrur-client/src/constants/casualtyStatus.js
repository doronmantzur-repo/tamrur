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
  urgent: "var(--app-color-error)",
  expectant: "var(--app-color-warning)",
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

/**
 * Builds Mantine `Select` data from a label map.
 *
 * @param {Record<string, string>} labels - Value -> Hebrew label.
 * @param {Array<string>} [order] - Optional explicit ordering of the values.
 * @returns {Array<{value: string, label: string}>} Mantine select options.
 */
function toSelectOptions(labels, order) {
  return (order ?? Object.keys(labels)).map((value) => ({ value, label: labels[value] }));
}

// urgency and evac-ability are Postgres enums — an unlisted value fails the
// insert, so the medic form only ever offers these.
export const URGENCY_OPTIONS = toSelectOptions(URGENCY_LABELS, URGENCY_ORDER);

export const EVAC_ABILITY_OPTIONS = toSelectOptions(EVAC_ABILITY_LABELS);

export const EVAC_DEST_OPTIONS = toSelectOptions(EVAC_DEST_LABELS);