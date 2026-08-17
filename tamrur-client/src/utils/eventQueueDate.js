// React

// External libraries

// Internal application modules

// Styles

/** Midnight of the given date's local calendar day. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True if `a` and `b` fall on the same local calendar day. */
export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * True if `event` was open at any point during `date`'s calendar day —
 * created on or before that day, and either still open or closed on/after
 * it. A still-open event keeps appearing on every day up to today; a
 * completed one appears from its opening day through its closing day.
 *
 * @param {{ created_at: string, closure_at: string | null }} event
 * @param {Date} date
 * @returns {boolean}
 */
export function isEventActiveOnDate(event, date) {
  const day = startOfDay(date).getTime();
  if (startOfDay(event.created_at).getTime() > day) return false;
  if (!event.closure_at) return true;
  return startOfDay(event.closure_at).getTime() >= day;
}
