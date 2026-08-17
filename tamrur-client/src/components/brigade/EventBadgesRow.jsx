// External libraries
import { Badge, Group, Menu, Stack, Text } from "@mantine/core";
import { IconAmbulance, IconChevronDown, IconHelicopter, IconTarget, IconUsers } from "@tabler/icons-react";

// Internal application modules
import {
  COMPLETED_STATUS,
  EVENT_STATUS_COLOR_VARS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from "../../constants/eventStatus";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, PULSING_AERIAL_EVAC_STATUSES } from "../../constants/aerialEvacStatus";
import {
  EVAC_STATUS_COLOR_VARS,
  EVAC_STATUS_LABELS,
  GATHERING_STATUS_COLOR_VARS,
  GATHERING_STATUS_LABELS,
} from "../../constants/casualtyStatus";

// Styles

/** All statuses the brigade can manually set the event to, in their natural progression order. */
const STATUS_OPTIONS = Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

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
 * Renders the type/status/aerial-evac/gathering/evac-status badges for the
 * top bar, sitting under the event name and description (see
 * `EventDescriptionBlock`) rather than in their own header card. The status badge
 * is itself the control: click it to open a menu of every non-completed
 * status and set the event to any of them directly, since progress here
 * isn't strictly linear — except "completed" is final: once the event is
 * closed, the badge turns into a plain, non-clickable label instead of a
 * menu, since closing is a one-way action the brigade can no longer undo
 * from here (per team decision, 2026-08-16).
 *
 * @param {{
 *   event: object,
 *   aerialEvacStatus: string | null | undefined,
 *   onStatusChange: (nextStatus: string) => void,
 * }} props
 * @returns {JSX.Element} The badges row.
 */
const EventBadgesRow = ({ event, aerialEvacStatus, onStatusChange }) => {
  const isCompleted = event.status === COMPLETED_STATUS;

  const showAerialEvacBadge = aerialEvacStatus && aerialEvacStatus !== "no_needed";
  const aerialEvacColor = AERIAL_EVAC_COLOR_VARS[aerialEvacStatus] || "var(--app-color-text-muted)";

  const showGatheringBadge = Boolean(event.gathering_status);
  const gatheringColor = GATHERING_STATUS_COLOR_VARS[event.gathering_status] || "var(--app-color-text-muted)";

  const showEvacStatusBadge = event.evac_status !== null && event.evac_status !== undefined;
  const evacStatusColor = EVAC_STATUS_COLOR_VARS[event.evac_status] || "var(--app-color-text-muted)";

  return (
    <Group gap="md" align="flex-end">
      <BadgeColumn label="סטטוס אירוע">
        {isCompleted ? (
          <Badge
            size="lg"
            styles={{
              root: {
                ...badgeChromeStyles,
                backgroundColor: `color-mix(in srgb, ${EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)"} 16%, transparent)`,
                color: EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)",
              },
            }}
          >
            {EVENT_STATUS_LABELS[event.status] || event.status}
          </Badge>
        ) : (
          <Menu shadow="md" position="bottom-start" withinPortal>
            <Menu.Target>
              <Badge
                size="lg"
                rightSection={<IconChevronDown size={14} stroke={2} />}
                style={{ cursor: "pointer" }}
                styles={{
                  root: {
                    ...badgeChromeStyles,
                    backgroundColor: `color-mix(in srgb, ${EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)"} 16%, transparent)`,
                    color: EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)",
                  },
                }}
              >
                {EVENT_STATUS_LABELS[event.status] || event.status}
              </Badge>
            </Menu.Target>
            <Menu.Dropdown>
              {STATUS_OPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  onClick={() => onStatusChange(option.value)}
                  disabled={option.value === event.status}
                  styles={{
                    itemLabel: { color: EVENT_STATUS_COLOR_VARS[option.value] || "var(--app-color-text)" },
                  }}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
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

      {showGatheringBadge && (
        <BadgeColumn label="איסוף נפגעים">
          <Badge
            size="lg"
            leftSection={<IconUsers size={14} />}
            styles={{
              root: {
                ...badgeChromeStyles,
                backgroundColor: `color-mix(in srgb, ${gatheringColor} 16%, transparent)`,
                color: gatheringColor,
              },
            }}
          >
            {GATHERING_STATUS_LABELS[event.gathering_status] || event.gathering_status}
          </Badge>
        </BadgeColumn>
      )}

      {showEvacStatusBadge && (
        <BadgeColumn label="פינוי נפגעים">
          <Badge
            size="lg"
            leftSection={<IconAmbulance size={14} />}
            styles={{
              root: {
                ...badgeChromeStyles,
                backgroundColor: `color-mix(in srgb, ${evacStatusColor} 16%, transparent)`,
                color: evacStatusColor,
              },
            }}
          >
            {EVAC_STATUS_LABELS[event.evac_status] ?? event.evac_status}
          </Badge>
        </BadgeColumn>
      )}
    </Group>
  );
};

export default EventBadgesRow;
