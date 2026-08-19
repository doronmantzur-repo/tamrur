// External libraries
import { Badge, Group, Stack, Text } from "@mantine/core";
import { IconHelicopter, IconTarget } from "@tabler/icons-react";

// Internal application modules
import { EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, PULSING_AERIAL_EVAC_STATUSES } from "../../constants/aerialEvacStatus";

// Styles

/**
 * Shared chrome for every badge here, merged into each one's own colors:
 * a fixed height matching the top bar's open/close-event buttons (2.5rem),
 * so every row in the top bar reads as the same scale, plus hover feedback.
 */
const badgeChromeStyles = {
  height: "2.5rem",
  transition: "transform 0.15s ease, filter 0.15s ease",
  "&:hover": { transform: "scale(1.06)", filter: "brightness(1.12)" },
};

/** The small caption sitting above each badge, like a borderless table's header row. */
const badgeColumnLabelStyles = {
  fz: "0.62rem",
  fw: 600,
  tt: "uppercase",
  lts: "0.03em",
  c: "var(--app-color-text-muted)",
};

/**
 * Renders one badge column: a small caption above the badge naming what it
 * shows, mimicking a borderless table's header/value pair — self-explanatory
 * without needing a hover tooltip.
 *
 * @param {{ label: string, children: React.ReactNode }} props
 * @returns {JSX.Element} The labeled badge column.
 */
function BadgeColumn({ label, children }) {
  return (
    <Stack gap={2} align="center">
      <Text {...badgeColumnLabelStyles}>{label}</Text>
      {children}
    </Stack>
  );
}

/**
 * Renders the type/status/aerial-evac badges for the top bar, sitting under
 * the event name and description (see `EventDescriptionBlock`) rather than in
 * their own header card. The status badge is read-only — `status` is derived
 * server-side from gathering_status/evac_status, so there is nothing for the
 * brigade to pick here; closing the event (the one manual transition) is done
 * via `EventActionButtons`, not this row.
 *
 * @param {{
 *   event: object,
 *   aerialEvacStatus: string | null | undefined,
 * }} props
 * @returns {JSX.Element} The badges row.
 */
const EventBadgesRow = ({ event, aerialEvacStatus }) => {
  const showAerialEvacBadge = aerialEvacStatus && aerialEvacStatus !== "no_needed";
  const aerialEvacColor = AERIAL_EVAC_COLOR_VARS[aerialEvacStatus] || "var(--app-color-text-muted)";
  const statusColor = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";

  return (
    <Group gap="md" align="flex-end">
      <BadgeColumn label="סטטוס אירוע">
        <Badge
          size="lg"
          styles={{
            root: {
              ...badgeChromeStyles,
              backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
              color: statusColor,
            },
          }}
        >
          {EVENT_STATUS_LABELS[event.status] || event.status}
        </Badge>
      </BadgeColumn>

      <BadgeColumn label="סוג אירוע">
        <Badge
          size="lg"
          leftSection={<IconTarget size={14} />}
          variant="outline"
          styles={{
            root: {
              ...badgeChromeStyles,
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
            },
          }}
        >
          {EVENT_TYPE_LABELS[event.type] || event.type}
        </Badge>
      </BadgeColumn>

      {showAerialEvacBadge && (
        <BadgeColumn label="פינוי אווירי">
          <Badge
            size="lg"
            leftSection={<IconHelicopter size={14} />}
            className={PULSING_AERIAL_EVAC_STATUSES.includes(aerialEvacStatus) ? "app-pulse-glow" : undefined}
            styles={{
              root: {
                ...badgeChromeStyles,
                backgroundColor: `color-mix(in srgb, ${aerialEvacColor} 16%, transparent)`,
                color: aerialEvacColor,
              },
            }}
          >
            {AERIAL_EVAC_LABELS[aerialEvacStatus] || aerialEvacStatus}
          </Badge>
        </BadgeColumn>
      )}
    </Group>
  );
};

export default EventBadgesRow;
