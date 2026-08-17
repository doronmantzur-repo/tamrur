// React

// External libraries
import { Group, Stack, Text } from "@mantine/core";

// Internal application modules

// Styles

/**
 * Single at-a-glance stat tile: a big monospace number with a label, optional
 * icon, and optional caption, tinted by the stat's accent color (e.g.
 * error-red for a critical count), with a matching colored ring border and a
 * small lift on hover. `compact` shrinks padding and the icon so several
 * tiles can sit in place of a legend (e.g. EvacuationProgressCard's category
 * tiles) instead of taking a full stat-row's worth of height, gives every
 * tile a solid background — blending each accent at least halfway to black
 * rather than just tinting a neutral surface, so the result is always dark
 * enough for fixed white text regardless of how light the accent itself is
 * (a pale accent like the muted "unassessed" gray would otherwise wash out
 * white text, and a near-black accent like "deceased" would make matching
 * dark text unreadable against its own background — this sidesteps both) —
 * and centers only the value itself; the label/icon row keeps its normal
 * space-between layout either way.
 *
 * `onClick`/`dimmed`/`highlighted` support EvacuationProgressCard's linked
 * bar-segment/tile selection: clicking either dims every other tile/segment
 * and highlights the clicked category's counterpart, via a shared "selected
 * key" the parent owns — this component just renders whichever of the two
 * states it's told to. `pulsing` flags a tile whose category still has
 * outstanding work, via a tile-only pulse animation (see `app-pulse-glow-tile`
 * in index.css) — the glow color is the tile's own accent, via `currentColor`,
 * so each category pulses in its own color rather than one generic tone.
 *
 * The caller (EvacuationProgressCard) only ever passes `pulsing={true}` when
 * *nothing* is selected — never for just the selected tile while others are
 * dimmed. Every pulsing tile therefore starts and stops together: an
 * earlier version kept the selected tile pulsing continuously while others
 * paused, which let it drift onto its own clock (nothing else stayed
 * running long enough to share a phase with) — everyone toggling together,
 * every time, is what actually keeps them in sync, since re-adding this
 * class always restarts its animation from 0%. The selected-tile ring uses
 * `outline`/`filter` rather than `box-shadow` so it can't be overridden by
 * the pulse animation on the rare frame both are true.
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   sub?: string,
 *   icon?: React.ComponentType<{ size?: number, stroke?: number, color?: string }>,
 *   accentColor: string,
 *   compact?: boolean,
 *   onClick?: () => void,
 *   dimmed?: boolean,
 *   highlighted?: boolean,
 *   pulsing?: boolean,
 * }} props
 * @returns {JSX.Element} The stat tile.
 */
const StatTile = ({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
  compact = false,
  onClick,
  dimmed = false,
  highlighted = false,
  pulsing = false,
}) => (
  <Stack
    gap={compact ? 2 : 4}
    p={compact ? "xs" : "md"}
    onClick={onClick}
    className={pulsing ? "app-pulse-glow-tile" : undefined}
    styles={{
      root: {
        background: compact
          ? `color-mix(in srgb, ${accentColor} 60%, black)`
          : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 20%, transparent), color-mix(in srgb, ${accentColor} 5%, transparent))`,
        border: `1px solid color-mix(in srgb, ${accentColor} ${compact ? 70 : 30}%, transparent)`,
        borderRadius: "var(--mantine-radius-sm)",
        backdropFilter: "blur(4px)",
        color: accentColor,
        cursor: onClick ? "pointer" : undefined,
        opacity: dimmed ? 0.4 : 1,
        outline: highlighted ? "2px solid #FFFFFF" : "none",
        outlineOffset: highlighted ? "1px" : undefined,
        filter: highlighted ? `drop-shadow(0 0 8px ${accentColor})` : "none",
        transition: "transform 0.15s ease, opacity 0.15s ease, outline 0.15s ease, filter 0.15s ease",
        "&:hover": { transform: "translateY(-2px) scale(1.03)" },
      },
    }}
  >
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Text
        fz={compact ? "0.62rem" : "0.78rem"}
        fw={600}
        tt="uppercase"
        lts="0.04em"
        c={compact ? "#FFFFFF" : "var(--app-color-text-muted)"}
      >
        {label}
      </Text>
      {Icon && <Icon size={compact ? 14 : 22} stroke={1.8} color={compact ? "#FFFFFF" : accentColor} />}
    </Group>
    <Text
      fz={compact ? "1.5rem" : "2.75rem"}
      fw={800}
      lh={1.1}
      ta={compact ? "center" : undefined}
      c={compact ? "#FFFFFF" : accentColor}
      ff='ui-monospace, "SF Mono", "Consolas", monospace'
    >
      {value}
    </Text>
    {sub && (
      <Text fz={compact ? "0.65rem" : "0.8rem"} c={compact ? "#FFFFFF" : "var(--app-color-text-muted)"}>
        {sub}
      </Text>
    )}
  </Stack>
);

export default StatTile;
