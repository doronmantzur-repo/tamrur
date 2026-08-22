// React

// External libraries
import { Box, Group, Text } from "@mantine/core";

// Internal application modules
import { STAR_OF_DAVID_PATHS } from "../../constants/locationMarkers";

// Styles

/** A single legend row: a small colored badge (circle) followed by its Hebrew label. */
export function LegendEntry({ children, label }) {
  return (
    <Group gap={6} wrap="nowrap">
      {children}
      <Text fz="xs" c="var(--app-color-text-muted)">
        {label}
      </Text>
    </Group>
  );
}

/** A round 16px legend badge: either a colored circle with a short text glyph, or a colored circle wrapping an icon/image (via children). */
export function LegendBadge({ background, children }) {
  return (
    <Box
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        backgroundColor: background,
        color: "#fff",
        fontSize: "0.6rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * React version of the hospital marker's Star of David glyph, for use in a
 * map legend (a real DOM icon, not a Leaflet div-icon string) -- draws from
 * the same STAR_OF_DAVID_PATHS as HOSPITAL_ICON (constants/locationMarkers)
 * so the marker and its legend swatch can't drift out of sync. Same call
 * shape as the Tabler icon components it stands in for (`size`, `stroke`,
 * `color`), since no stock "star of david" icon exists to import instead.
 *
 * @param {{ size?: number, stroke?: number, color?: string }} props
 */
export function StarOfDavidIcon({ size = 16, stroke = 1.8, color }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {STAR_OF_DAVID_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
