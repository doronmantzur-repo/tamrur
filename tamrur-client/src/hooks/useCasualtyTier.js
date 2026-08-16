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

  // `lg` (1200px), not `md`: the full table carries 13 columns, and below about
  // 1200px the fixed columns leave the free-text פציעות column under ~120px.
  // The 992–1199 band is better served by the compact tier, where the
  // lower-priority columns move into the expandable detail row.
  const isFull = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`, true, options);
  const isTable = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, options);

  if (isFull) return CASUALTY_TIER.FULL;
  return isTable ? CASUALTY_TIER.COMPACT : CASUALTY_TIER.CARD;
}
