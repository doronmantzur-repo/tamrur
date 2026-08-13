// React

// External libraries
import { useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

// Internal application modules

// Styles

/**
 * How the casualty list lays itself out at the current viewport width.
 * @type {{FULL: string, COMPACT: string, CARD: string}}
 */
export const CASUALTY_TIER = {
  FULL: "full",
  COMPACT: "compact",
  CARD: "card",
};

/**
 * Picks the casualty layout for the current viewport.
 *
 * This has to be a JS media query rather than Mantine's `visibleFrom` /
 * `hiddenFrom`: hiding a column with CSS leaves the grouped header's `colSpan`
 * untouched, so the group bars would sit one column too wide, and no CSS can
 * turn a `<table>` into a stack of cards.
 *
 * `getInitialValueInEffect: false` reads `matchMedia` synchronously during the
 * first render so the layout doesn't visibly flip after mount. That is safe
 * here because the app is a client-only Vite SPA — there is no SSR pass to
 * mismatch against.
 *
 * @returns {string} One of `CASUALTY_TIER`.
 */
export function useCasualtyTier() {
  const theme = useMantineTheme();
  const options = { getInitialValueInEffect: false };

  const isFull = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, options);
  const isTable = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, options);

  if (isFull) return CASUALTY_TIER.FULL;
  return isTable ? CASUALTY_TIER.COMPACT : CASUALTY_TIER.CARD;
}
