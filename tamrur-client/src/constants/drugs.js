// React

// External libraries

// Internal application modules

// Styles

/**
 * Dose units, matching the `drugs_dose_unit_check` constraint. An unlisted
 * value fails the insert, so the form only ever offers these.
 * @type {Array<{value: string, label: string}>}
 */
export const DOSE_UNIT_OPTIONS = [
  { value: "mcg", label: "mcg" },
  { value: "mg", label: "mg" },
  { value: "g", label: "g" },
];

/**
 * Routes of administration, matching the `drugs_route_check` constraint. The
 * Hebrew gloss sits alongside the clinical abbreviation, which is what medics
 * actually write on the form.
 * @type {Array<{value: string, label: string}>}
 */
export const ROUTE_OPTIONS = [
  { value: "IV", label: "IV — תוך ורידי" },
  { value: "IM", label: "IM — תוך שרירי" },
  { value: "PO", label: "PO — פומי" },
  { value: "PR", label: "PR — רקטלי" },
  { value: "SC", label: "SC — תת עורי" },
  { value: "IO", label: "IO — תוך גרמי" },
  { value: "Inhalation", label: "Inhalation — בשאיפה" },
];

/** Short labels for the history table, where the full gloss would not fit. */
export const ROUTE_SHORT_LABELS = ROUTE_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.value }),
  {},
);

/**
 * Formats a dose for display.
 *
 * `dose_amount` is a Postgres `numeric`, which the pg driver hands back as a
 * string — so it has to be coerced rather than rendered raw.
 *
 * @param {string | number | null} amount
 * @param {string | null} unit
 * @returns {string} e.g. "5 mg", or an em dash when unset.
 */
export function formatDose(amount, unit) {
  if (amount === null || amount === undefined || amount === "") return "—";

  const value = Number(amount);
  if (Number.isNaN(value)) return "—";

  return `${value} ${unit ?? ""}`.trim();
}
