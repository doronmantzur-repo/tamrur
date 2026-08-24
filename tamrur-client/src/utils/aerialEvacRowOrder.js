// React

// External libraries

// Internal application modules

// Styles

/**
 * Default (no explicit sort applied) row order for an aerial-evac row —
 * most urgent first: lowest `evac-priority` among the row's helivac
 * casualties (`row.topPriority`, `null` last since a missing priority isn't
 * a low one, it's unknown), then longest-waiting first among ties
 * (`row.event.created_at`). Shared by the table view's sections and the
 * kanban board's columns so both order rows the same way instead of two
 * copies of the same comparator drifting apart.
 *
 * @param {{ topPriority: number | null, event: { created_at: string } }} a
 * @param {{ topPriority: number | null, event: { created_at: string } }} b
 * @returns {number} Standard `Array.prototype.sort` comparator result.
 */
export function byDefaultPriority(a, b) {
  if (a.topPriority !== b.topPriority) {
    if (a.topPriority === null) return 1;
    if (b.topPriority === null) return -1;
    return a.topPriority - b.topPriority;
  }

  return new Date(a.event.created_at) - new Date(b.event.created_at);
}
