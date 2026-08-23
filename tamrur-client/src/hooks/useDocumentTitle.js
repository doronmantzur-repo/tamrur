// React
import { useEffect } from "react";

// External libraries

// Internal application modules

// Styles

/**
 * Keeps the browser tab's title in sync with `title` for as long as the
 * calling component is mounted.
 *
 * @param {string} title - The title to set.
 * @returns {void}
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
