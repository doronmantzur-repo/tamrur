// React

// External libraries

// Internal application modules

// Styles

/**
 * The current time, as the ISO string the server stores.
 *
 * @returns {string} An ISO 8601 timestamp for right now.
 */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Converts an ISO timestamp to the local wall-clock string a `datetime-local`
 * input expects (`YYYY-MM-DDTHH:mm`).
 *
 * `toISOString` is UTC, so the offset has to be subtracted first — otherwise
 * the field shows a reading logged at 14:00 local as 11:00.
 *
 * @param {string | null | undefined} isoString
 * @returns {string} The local-time input value, or "" when unparseable.
 */
export function isoToLocalInputValue(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 16);
}

/**
 * Converts a `datetime-local` value back to an ISO timestamp.
 *
 * The browser hands back local wall-clock time, which `new Date(...)` parses in
 * the local zone — so the round trip lands back on the original instant.
 *
 * @param {string} inputValue
 * @returns {string | null} An ISO 8601 timestamp, or null when unparseable.
 */
export function localInputValueToIso(inputValue) {
  if (!inputValue) return null;

  const date = new Date(inputValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}