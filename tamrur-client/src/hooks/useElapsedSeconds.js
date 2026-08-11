// React
import { useEffect, useState } from "react";

// External libraries

// Internal application modules

// Styles

function secondsSince(isoString) {
  return isoString ? (Date.now() - new Date(isoString).getTime()) / 1000 : 0;
}

/**
 * Ticks once a second, returning the number of seconds elapsed since `startIso`.
 * Pass `null`/`undefined` to hold it at 0 without starting a timer.
 *
 * @param {string | null | undefined} startIso - ISO timestamp to count up from.
 * @returns {number} Elapsed seconds.
 */
export function useElapsedSeconds(startIso) {
  const [elapsed, setElapsed] = useState(() => secondsSince(startIso));

  useEffect(() => {
    setElapsed(secondsSince(startIso));

    if (!startIso) return undefined;

    const intervalId = setInterval(() => {
      setElapsed(secondsSince(startIso));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startIso]);

  return elapsed;
}
