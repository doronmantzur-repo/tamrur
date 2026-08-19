// React

// External libraries
import { Box, Group, Text } from "@mantine/core";

// Internal application modules

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
