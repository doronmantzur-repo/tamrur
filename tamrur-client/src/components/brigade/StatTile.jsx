// React

// External libraries
import { Group, Stack, Text } from "@mantine/core";

// Internal application modules

// Styles

/**
 * Single at-a-glance stat tile: a big monospace number with a label, optional
 * icon, and optional caption, on a diagonal gradient tinted by the stat's
 * accent color (e.g. error-red for a critical count), with a matching
 * colored ring border and a small lift on hover.
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   sub?: string,
 *   icon?: React.ComponentType<{ size?: number, stroke?: number, color?: string }>,
 *   accentColor: string,
 * }} props
 * @returns {JSX.Element} The stat tile.
 */
const StatTile = ({ label, value, sub, icon: Icon, accentColor }) => (
  <Stack
    gap={4}
    p="md"
    styles={{
      root: {
        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 20%, transparent), color-mix(in srgb, ${accentColor} 5%, transparent))`,
        border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
        borderRadius: "var(--mantine-radius-sm)",
        backdropFilter: "blur(4px)",
        transition: "transform 0.15s ease",
        "&:hover": { transform: "translateY(-2px) scale(1.03)" },
      },
    }}
  >
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Text fz="0.78rem" fw={600} tt="uppercase" lts="0.04em" c="var(--app-color-text-muted)">
        {label}
      </Text>
      {Icon && <Icon size={22} stroke={1.8} color={accentColor} />}
    </Group>
    <Text fz="2.75rem" fw={800} lh={1.1} c={accentColor} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
      {value}
    </Text>
    {sub && (
      <Text fz="0.8rem" c="var(--app-color-text-muted)">
        {sub}
      </Text>
    )}
  </Stack>
);

export default StatTile;
