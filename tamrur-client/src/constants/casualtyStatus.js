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

// Urgency is optional: a casualty can be logged before anyone has triaged them.
// These give that state a name and a neutral colour instead of leaving lookups
// undefined, which produced `color-mix(in srgb, undefined 16%, transparent)` —
// invalid CSS that silently dropped the badge's styling.
export const URGENCY_NONE_LABEL = "ללא דחיפות";
export const URGENCY_NONE_PLACEHOLDER = "בחר דחיפות...";
export const URGENCY_NONE_COLOR_VAR = "var(--app-color-text-muted)";

/**
 * The Hebrew label for an urgency value, including the not-yet-triaged case.
 *
 * @param {string | null | undefined} value
 * @returns {string} The label to display.
 */
export function urgencyLabel(value) {
  if (value === null || value === undefined || value === "") return URGENCY_NONE_LABEL;

  return URGENCY_LABELS[value] ?? value;
}

/**
 * Badge colours for an urgency value, falling back to the muted neutral when a
 * casualty has not been triaged yet.
 *
 * @param {string | null | undefined} value
 * @returns {{backgroundColor: string, color: string}} Badge root styles.
 */
export function urgencyBadgeColors(value) {
  const color = URGENCY_COLOR_VARS[value] ?? URGENCY_NONE_COLOR_VAR;

  return {
    backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
    color,
  };
}

/**
 * The evacuation postures a casualty can be recorded with.
 *
 * `walk` is deliberately absent: only sitting and lying are offered now. The
 * Postgres enum still contains `walk`, so the label below is kept purely so a
 * legacy row written before this change still renders "הליכה" rather than a raw
 * `walk` — see EVAC_ABILITY_LABELS.
 */
export const EVAC_ABILITY_ORDER = ["sit", "lie"];

/**
 * Display labels, including the retired `walk` value.
 *
 * Read-only: use EVAC_ABILITY_OPTIONS for anything the medic can pick from.
 */
export const EVAC_ABILITY_LABELS = {
  sit: "ישיבה",
  lie: "שכיבה",
  // Retired — never offered, only rendered if an old row still holds it.
  walk: "הליכה",
};

export const EVAC_ABILITY_COLOR_VARS = {
  sit: "var(--app-color-success)",
  lie: "var(--app-color-warning)",
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

// Built from the explicit order, not from the label map, so the retired `walk`
// label can stay readable without becoming selectable again.
export const EVAC_ABILITY_OPTIONS = toSelectOptions(EVAC_ABILITY_LABELS, EVAC_ABILITY_ORDER);

// A casualty who cannot sit up is the more acute of the two, so שכיבה carries
// the amber and ישיבה the calm blue. `walk` is retired but still mapped, so a
// legacy row keeps a colour rather than falling back to the muted default.
export const EVAC_ABILITY_COLOR_VARS = {
  sit: "var(--app-color-info)",
  lie: "var(--app-color-warning)",
  walk: "var(--app-color-success)",
};

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

// Airway management, escalating: unassisted, bag-valve-mask, endotracheal tube,
// surgical airway. קוניוטום is the most invasive of the four, so it is the one
// value rendered as a solid badge rather than a tint — see SOLID_STATUS_VALUES.
export const VENTILATION_COLOR_VARS = {
  none: "var(--app-color-text-muted)",
  ambu: "var(--app-color-warning)",
  tube: "var(--app-color-error)",
  cric: "var(--app-color-error)",
};

// ליווי — free text in the database. `escort-type` records which escort, while
// the older boolean `escort` column stays in sync server-side so the dashboard
// and brigade tables keep rendering their yes/no column.
export const ESCORT_TYPE_LABELS = {
  none: "ללא",
  matab: 'מט"ב',
  medic: "חובש",
};

export const ESCORT_TYPE_OPTIONS = toSelectOptions(ESCORT_TYPE_LABELS);

// Escort seniority, not severity — hence the two hues outside the red/amber/green
// scale: a חובש is a medic, מט"ב the more advanced caregiver.
export const ESCORT_TYPE_COLOR_VARS = {
  none: "var(--app-color-text-muted)",
  medic: "var(--app-color-info)",
  matab: "var(--app-color-accent)",
};

/**
 * Values rendered as a solid badge instead of a tint.
 *
 * Reserved for the single most acute value in a dimension, so it reads as an
 * alert at a glance across a full table rather than as one tint among several.
 */
export const SOLID_STATUS_VALUES = new Set(["cric"]);

/**
 * Badge colours for a status value, tinted from one of the palette's hues.
 *
 * Mirrors `urgencyBadgeColors`: a 16% tint carries the hue without competing
 * with the urgency badge beside it, and an unmapped value falls back to the
 * muted neutral rather than producing `color-mix(..., undefined, ...)`, which
 * is invalid CSS and silently drops all styling.
 *
 * @param {Record<string, string>} colorVars - Value -> CSS colour variable.
 * @param {string | null | undefined} value
 * @returns {{backgroundColor: string, color: string}} Badge root styles.
 */
export function statusBadgeColors(colorVars, value) {
  const color = colorVars[value] ?? "var(--app-color-text-muted)";

  if (SOLID_STATUS_VALUES.has(value)) {
    return { backgroundColor: color, color: "var(--app-color-primary-text)" };
  }

  return { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color };
}

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
// Drives the event's derived evac_status; see the server's 006 migration.
export const GATHERING_IN_PROGRESS = "in_progress";
export const GATHERING_COMPLETED = "completed";

export const GATHERING_STATUS_LABELS = {
  [GATHERING_IN_PROGRESS]: "בתהליך",
  [GATHERING_COMPLETED]: "הושלם",
};

export const GATHERING_STATUS_COLOR_VARS = {
  [GATHERING_IN_PROGRESS]: "var(--app-color-warning)",
  [GATHERING_COMPLETED]: "var(--app-color-success)",
};

// evac_status is derived server-side and never written by the client. It is a
// Postgres enum ("event-evac-status") — the integers 0/1/2 it used to hold were
// migrated in the server's 006 migration, so nothing sends or compares numbers
// any more.
export const EVAC_STATUS_PENDING = "pending"; // no casualty evacuated yet
export const EVAC_STATUS_INITIATED = "initiated"; // evacuation under way
export const EVAC_STATUS_FULL = "full"; // gathering closed, everyone evacuated

export const EVAC_STATUS_LABELS = {
  [EVAC_STATUS_PENDING]: "פינוי טרם החל",
  [EVAC_STATUS_INITIATED]: "פינוי בתהליך",
  [EVAC_STATUS_FULL]: "פינוי הושלם",
};

export const EVAC_STATUS_COLOR_VARS = {
  [EVAC_STATUS_PENDING]: "var(--app-color-text-muted)",
  [EVAC_STATUS_INITIATED]: "var(--app-color-warning)",
  [EVAC_STATUS_FULL]: "var(--app-color-success)",
};

// ---------------------------------------------------------------------------
// Casualty table view state — filtering and sorting
//
// Both are presentation only. They re-order and hide rows already in the store;
// nothing here refetches, and the fetched array itself is never mutated.
// ---------------------------------------------------------------------------

/** Sentinel for "not triaged yet", since the stored value is `null`. */
export const URGENCY_FILTER_NONE = "__none__";

/**
 * The urgency filter's checkboxes: every value the column can actually hold.
 *
 * Built from URGENCY_ORDER rather than hand-listed, so a future urgency level
 * appears in the filter the moment it is added to the enum.
 */
export const URGENCY_FILTER_OPTIONS = [
  ...URGENCY_ORDER.map((value) => ({ value, label: URGENCY_LABELS[value] })),
  { value: URGENCY_FILTER_NONE, label: URGENCY_NONE_LABEL },
];

/**
 * Sort options, keyed by the database column each one reads.
 *
 * All four are numeric, so one comparator covers them.
 */
export const CASUALTY_SORT_OPTIONS = [
  { value: "casualty-number", label: "מספר פצוע" },
  { value: "evac-priority", label: "קדימות לפינוי" },
  { value: "ai_evacuation_priority", label: "קדימות לפינוי (AI)" },
  { value: "treatment-priority", label: "קדימות לטיפול" },
];

export const DEFAULT_CASUALTY_SORT = "casualty-number";

export const SORT_DIRECTIONS = { ASC: "asc", DESC: "desc" };

/**
 * Whether a casualty matches the urgency selection.
 *
 * An empty selection means "no filter applied", not "match nothing" — a medic
 * who unticks the last box wants the whole table back, not an empty one.
 *
 * @param {Object} casualty
 * @param {Array<string>} selected - URGENCY_FILTER_OPTIONS values that are ticked.
 * @returns {boolean}
 */
export function matchesUrgencySelection(casualty, selected) {
  if (!selected || selected.length === 0) return true;

  // An untriaged casualty may hold null, undefined or "" depending on how the
  // row was written; all three mean the same thing to the medic.
  const isBlank =
    casualty.urgency === null || casualty.urgency === undefined || casualty.urgency === "";

  return isBlank ? selected.includes(URGENCY_FILTER_NONE) : selected.includes(casualty.urgency);
}

/**
 * Sorts casualties by one numeric column, blanks last.
 *
 * Blanks sink to the bottom in *both* directions rather than following the sort:
 * "no evacuation priority set" is not a low priority, it is missing information,
 * and a medic scanning from the top should never have to page past it.
 *
 * Returns a new array — the store's array is frozen by RTK in development and
 * sorting in place would throw.
 *
 * @param {Array<Object>} casualties
 * @param {string} column - A CASUALTY_SORT_OPTIONS value.
 * @param {"asc" | "desc"} direction
 * @returns {Array<Object>} The sorted copy.
 */
export function sortCasualties(casualties, column, direction) {
  const rank = (casualty) => {
    const value = casualty[column];
    if (value === null || value === undefined || value === "") return null;

    // Postgres hands `numeric` back as a string, so coerce before comparing.
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? null : asNumber;
  };

  const sign = direction === SORT_DIRECTIONS.DESC ? -1 : 1;

  return [...casualties].sort((a, b) => {
    const left = rank(a);
    const right = rank(b);

    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;

    return (left - right) * sign;
  });
}
