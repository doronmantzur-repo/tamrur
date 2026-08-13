// React

// External libraries

// Internal application modules

// Styles

/** Compares two primitive values for sorting; nulls/undefined always sort last. */
export function compareValues(a, b) {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "he");
}

/** Cycles a column's sort direction: none -> asc -> desc -> none. */
export function nextSortDirection(direction) {
  if (direction === "asc") return "desc";
  if (direction === "desc") return null;
  return "asc";
}

/** Toggles a value's membership in a Set, returning a new Set (never mutates the input). */
export function toggleSetValue(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
