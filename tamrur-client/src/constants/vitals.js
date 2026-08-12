// React

// External libraries

// Internal application modules

// Styles

/**
 * The vitals columns the medic interface captures.
 *
 * `key` is what the server's POST/PUT body expects, `column` is what comes
 * back on the row — they differ because the response mirrors the raw Postgres
 * column names, including the misspelled "repiratory-rate". One table drives
 * the form fields, the validation ranges and the summary rendering, so the two
 * spellings only have to be reconciled here.
 *
 * @type {Array<{key: string, column: string, label: string, unit: string, min: number, max: number, decimalScale: number}>}
 */
export const VITALS_FIELDS = [
  { key: "pulse", column: "pulse", label: "דופק", unit: "לדקה", min: 0, max: 300, decimalScale: 0 },
  { key: "spo2", column: "spo2", label: "ריווי חמצן", unit: "%", min: 0, max: 100, decimalScale: 0 },
  {
    key: "respiratoryRate",
    column: "repiratory-rate",
    label: "קצב נשימה",
    unit: "לדקה",
    min: 0,
    max: 120,
    decimalScale: 0,
  },
  {
    key: "oralTemperature",
    column: "oral-temperature",
    label: "חום (פה)",
    unit: "°C",
    min: 20,
    max: 45,
    decimalScale: 1,
  },
  {
    key: "rectalTemperature",
    column: "rectal-temperature",
    label: "חום (רקטלי)",
    unit: "°C",
    min: 20,
    max: 45,
    decimalScale: 1,
  },
];

/** Blood pressure is stored as a JSON object rather than a plain number column. */
export const BLOOD_PRESSURE_COLUMN = "blood-pressure";

export const BLOOD_PRESSURE_RANGE = { min: 0, max: 300 };

export const BLOOD_PRESSURE_LABELS = {
  systolic: "סיסטולי",
  diastolic: "דיאסטולי",
};

/**
 * Renders a vitals row's blood pressure as `systolic/diastolic`.
 *
 * @param {{systolic?: number, diastolic?: number} | null | undefined} bloodPressure
 * @returns {string} The formatted reading, or an em dash when unrecorded.
 */
export function formatBloodPressure(bloodPressure) {
  if (!bloodPressure) return "—";

  const { systolic, diastolic } = bloodPressure;
  if (systolic == null && diastolic == null) return "—";

  return `${systolic ?? "—"}/${diastolic ?? "—"}`;
}