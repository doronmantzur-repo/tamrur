// React
import { useEffect, useState } from "react";

// External libraries

// Internal application modules

// Styles

function secondsBetween(startIso, endIso) {
  if (!startIso) return 0;
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  return (end - new Date(startIso).getTime()) / 1000;
}

/**
 * Ticks once a second, returning the number of seconds between `startIso`
 * and now. Pass `endIso` to freeze the count at a fixed duration (between
 * `startIso` and `endIso`) instead of ticking against the current time, e.g.
 * once an event is closed — otherwise switching `startIso` to `null` to
 * "stop" it would reset the count to 0 rather than hold its last value.
 * Pass `startIso` as `null`/`undefined` to hold the count at 0 without
 * starting a timer.
 *
 * @param {string | null | undefined} startIso - ISO timestamp to count up from.
 * @param {string | null | undefined} [endIso] - ISO timestamp to freeze the count at, instead of ticking against now.
 * @returns {number} Elapsed seconds.
 */
export function useElapsedSeconds(startIso, endIso) {
  const [elapsed, setElapsed] = useState(() => secondsBetween(startIso, endIso));

  useEffect(() => {
    setElapsed(secondsBetween(startIso, endIso));

    if (!startIso || endIso) return undefined;

    const intervalId = setInterval(() => {
      setElapsed(secondsBetween(startIso, endIso));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startIso, endIso]);

  return elapsed;
}
