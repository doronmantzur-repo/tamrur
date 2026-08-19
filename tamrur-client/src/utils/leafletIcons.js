// React

// External libraries
import L from "leaflet";

// Internal application modules

// Styles

/**
 * Builds a small circular div-icon marker. Colors are CSS vars, safe here
 * since Leaflet renders div-icons as real DOM elements (unlike its SVG path
 * renderer, which needs resolved hex values).
 *
 * @param {{ label: string, background: string, size?: number, glow?: boolean }} options
 * @returns {L.DivIcon}
 */
export function buildDivIcon({ label, background, size = 26, glow = false }) {
  const boxShadow = glow
    ? `0 0 0 2px var(--app-color-surface), 0 0 8px ${background}`
    : "0 0 0 2px var(--app-color-surface)";

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${background};box-shadow:${boxShadow};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${Math.round(size * 0.5)}px;
      font-family:ui-monospace, 'SF Mono', 'Consolas', monospace;
    ">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Inline-renders a Tabler icon's path data as raw SVG markup, for use inside a Leaflet div-icon. */
export function tablerSvg(paths, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}" />`).join("")}</svg>`;
}

/**
 * Same idea as buildDivIcon, but the glyph is a raster image (e.g. the saved
 * force-type icons) instead of an inline SVG/letter. The image is expected to
 * be a black silhouette on transparent background, so `brightness(0)
 * invert(1)` recolors it to solid white -- the same "white glyph on a
 * colored circle" look as every other marker on the map -- without needing
 * per-color image variants.
 *
 * @param {{ src: string, background: string, size?: number, glow?: boolean }} options
 * @returns {L.DivIcon}
 */
export function buildImageDivIcon({ src, background, size = 26, glow = false }) {
  const boxShadow = glow
    ? `0 0 0 2px var(--app-color-surface), 0 0 8px ${background}`
    : "0 0 0 2px var(--app-color-surface)";

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${background};box-shadow:${boxShadow};
      display:flex;align-items:center;justify-content:center;
    "><img src="${src}" style="width:60%;height:60%;object-fit:contain;filter:brightness(0) invert(1);" /></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
