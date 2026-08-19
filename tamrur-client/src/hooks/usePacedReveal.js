// React
import { useEffect, useRef, useState } from "react";

// External libraries

// Internal application modules

// Styles

/**
 * Reveals a growing sequence (a live-streamed answer's length, an
 * accumulating list of steps, ...) at no faster than one chunk per
 * `minIntervalMs`, so a burst of real data that arrives within the same
 * frame still renders as a visible sequence instead of snapping in at once.
 * Never waits past what's already arrived — if new content lands slower than
 * `minIntervalMs` apart, it's revealed as soon as it's there, no artificial
 * lag added. `total` resets to 0 automatically whenever it drops below the
 * current reveal count (a new question replacing the old one).
 *
 * @param {number} total - The full length/count available so far.
 * @param {{ minIntervalMs?: number, step?: number }} [options]
 * @returns {number} How much of `total` should currently be shown.
 */
export function usePacedReveal(total, { minIntervalMs = 200, step = 1 } = {}) {
  const [visible, setVisible] = useState(0);
  const [trackedTotal, setTrackedTotal] = useState(total);
  const lastRevealRef = useRef(0);

  // Reset during render (not in the effect below) when `total` drops — a new
  // question replacing the old one — so the count clears immediately instead
  // of briefly showing a stale tail from the previous answer. `lastRevealRef`
  // is left as-is: it'll read as "long ago" either way, so the effect reveals
  // the first chunk of the new sequence without an artificial wait.
  if (total < trackedTotal) {
    setTrackedTotal(total);
    setVisible(0);
  } else if (total !== trackedTotal) {
    setTrackedTotal(total);
  }

  useEffect(() => {
    if (visible >= total) return undefined;

    const elapsed = Date.now() - lastRevealRef.current;
    const wait = Math.max(0, minIntervalMs - elapsed);

    const timer = setTimeout(() => {
      lastRevealRef.current = Date.now();
      setVisible((prev) => Math.min(total, prev + step));
    }, wait);

    return () => clearTimeout(timer);
  }, [total, visible, minIntervalMs, step]);

  return visible;
}
