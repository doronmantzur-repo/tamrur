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

// טיפולים is free text: each entry is `{ text, done }`, so a medic can write
// whatever was actually given and tick it off once administered.
//
// Rows written before that change hold a flat array of these fixed keys, which
// meant "this treatment was given". The labels are kept solely to render those
// legacy rows — see `normalizeTreatments` — and a row is rewritten in the new
// shape the first time anyone edits it.
export const TREATMENT_LABELS = {
  cat: "CAT",
  packing: "Packing",
  "first-care": "First Care",
  actiq: "Actiq",
  plasma: "פלסמה",
  hexakapron: "הקסאקפרון",
  "iv-access": "גישה ורידית",
  intubation: "אינטובציה",
  "pain-management": "טיפול בכאב",
  "repeat-vitals": "מדדים חוזרים",
};

/**
 * Reads the stored `treatments` value as a list of `{ text, done }` entries.
 *
 * Tolerates the legacy shape — a flat array of `TREATMENT_LABELS` keys — by
 * translating each key to its Hebrew label and marking it done, which is what
 * those rows meant. Anything unrecognisable is dropped rather than crashing a
 * casualty row.
 *
 * @param {unknown} value - The raw column value.
 * @returns {Array<{text: string, done: boolean}>} The normalised entries.
 */
export function normalizeTreatments(value) {
  if (!Array.isArray(value)) return [];

  return value.reduce((items, item) => {
    if (typeof item === "string") {
      return [...items, { text: TREATMENT_LABELS[item] ?? item, done: true }];
    }

    if (item && typeof item === "object" && typeof item.text === "string") {
      return [...items, { text: item.text, done: Boolean(item.done) }];
    }

    return items;
  }, []);
}

// מונשם — free text in the database, so an unlisted value still displays.
export const VENTILATION_LABELS = {
  none: "ללא",
  ambu: "אמבו",
  tube: "טובוס",
  cric: "קוניוטום",
};

export const VENTILATION_OPTIONS = toSelectOptions(VENTILATION_LABELS);

// ליווי — free text in the database. `escort-type` records which escort, while
// the older boolean `escort` column stays in sync server-side so the dashboard
// and brigade tables keep rendering their yes/no column.
export const ESCORT_TYPE_LABELS = {
  none: "ללא",
  matab: 'מט"ב',
  medic: "חובש",
};

export const ESCORT_TYPE_OPTIONS = toSelectOptions(ESCORT_TYPE_LABELS);

/**
 * Translates a stored value for display, falling back to the raw value so a
 * free-text entry that isn't in the label map still shows something useful.
 *
 * @param {Record<string, string>} labels - Value -> Hebrew label.
 * @param {string | null | undefined} value
 * @returns {string} The label, the raw value, or an em dash.
 */
export function labelFor(labels, value) {
  if (value === null || value === undefined || value === "") return "—";

  return labels[value] ?? value;
}
// איסוף נפגעים — whether medics are still collecting casualties at the scene.
// Drives the event's derived evac_status; see the server's 003 migration.
export const GATHERING_IN_PROGRESS = "in_progress";
export const GATHERING_COMPLETED = "completed";

export const GATHERING_STATUS_LABELS = {
  [GATHERING_IN_PROGRESS]: "בתהליך",
  [GATHERING_COMPLETED]: "הושלם",
};

// evac_status is derived server-side and never written by the client:
//   0 = no casualty evacuated yet
//   1 = evacuation under way
//   2 = gathering closed and every casualty evacuated
export const EVAC_STATUS_LABELS = {
  0: "פינוי טרם החל",
  1: "פינוי בתהליך",
  2: "פינוי הושלם",
};

export const EVAC_STATUS_COLOR_VARS = {
  0: "var(--app-color-text-muted)",
  1: "var(--app-color-warning)",
  2: "var(--app-color-success)",
};
