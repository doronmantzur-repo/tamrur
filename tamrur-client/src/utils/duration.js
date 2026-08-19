// React

// External libraries

// Internal application modules

// Styles

/**
 * Formats a duration in seconds as `HH:MM:SS`, prefixed with `Nד׳ ` once it
 * spans more than a day — unless `showDays` is false, in which case hours
 * just keep accumulating past 24 instead (e.g. `27:14:05`).
 *
 * @param {number} totalSeconds - The duration, in seconds.
 * @param {{ showDays?: boolean }} [options]
 * @returns {string} The formatted duration.
 */
export function formatDuration(totalSeconds, { showDays = true } = {}) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = showDays ? Math.floor(safeSeconds / 86400) : 0;
  const hours = showDays ? Math.floor((safeSeconds % 86400) / 3600) : Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (value) => String(value).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return days > 0 ? `${days}ד׳ ${clock}` : clock;
}
