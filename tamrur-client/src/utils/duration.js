// React

// External libraries

// Internal application modules

// Styles

/**
 * Formats a duration in seconds as `HH:MM:SS`, prefixed with `Nד׳ ` once it
 * spans more than a day.
 *
 * @param {number} totalSeconds - The duration, in seconds.
 * @returns {string} The formatted duration.
 */
export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (value) => String(value).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return days > 0 ? `${days}ד׳ ${clock}` : clock;
}
