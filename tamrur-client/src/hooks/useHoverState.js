// React
import { useState } from "react";

// External libraries

// Internal application modules

// Styles

/**
 * Tracks pointer-hover state for a single element via plain event handlers,
 * for components that need a real `:hover` style change but can't rely on
 * one — Mantine's `styles` prop merges straight into an inline `style`
 * attribute (see `getStyle` in `@mantine/core`), so a `"&:hover": {...}` key
 * inside it is not compiled into CSS the way it was under Mantine 6's
 * Emotion-based styling; it's just an invalid property React silently drops.
 *
 * @returns {[boolean, { onMouseEnter: () => void, onMouseLeave: () => void }]}
 */
export function useHoverState() {
  const [isHovered, setIsHovered] = useState(false);
  return [isHovered, { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) }];
}
