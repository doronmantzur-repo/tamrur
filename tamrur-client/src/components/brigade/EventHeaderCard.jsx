// React
import { useState } from "react";

// External libraries
import { Badge, Button, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconHelicopter,
  IconPlayerTrackNext,
  IconSend,
  IconTarget,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import RequestEvacuationModal from "./RequestEvacuationModal";
import {
  COMPLETED_STATUS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from "../../constants/eventStatus";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { URGENCY_COLOR_VARS, URGENCY_LABELS, URGENCY_ORDER } from "../../constants/injuryStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

/** Order events progress through; "advance status" moves one step forward. */
const STATUS_ORDER = [
  "evaluated",
  "controlled",
  "ready_for_evacuation",
  "evacuation_started",
  "completed",
];

/** Per-evacuation statuses tracked in the header summary (excludes the event-level "not needed" state). */
const EVAC_STATUS_ORDER = ["needed", "in_progress", "approved", "denied"];

/** Plain (non-interactive) stat block: just the timer. */
const plainStatStyles = { padding: "0.75rem 1rem" };

/** Clickable stat blocks (injuries/evacuations): tile chrome + hover affordance. */
const tileStatStyles = {
  root: {
    display: "block",
    borderRadius: "var(--mantine-radius-sm)",
    border: "1px solid var(--app-color-border)",
    backgroundColor: "var(--app-color-surface-high)",
    padding: "0.75rem 1rem",
    minWidth: "13rem",
    "&:hover": {
      borderColor: "var(--app-effect-hover-border)",
      backgroundColor: "var(--app-effect-hover-background)",
    },
  },
};

const statNumberStyles = {
  fz: "2rem",
  fw: 700,
  lh: 1.1,
  c: "var(--app-color-primary)",
  ff: 'ui-monospace, "SF Mono", "Consolas", monospace',
};

const statLabelStyles = {
  fz: "0.68rem",
  tt: "uppercase",
  lts: "0.04em",
  c: "var(--app-color-text-muted)",
};

/** Counts items by a key, against a fixed set of possible values. */
function countBy(items, order, getKey) {
  return order.reduce((acc, key) => {
    acc[key] = items.filter((item) => getKey(item) === key).length;
    return acc;
  }, {});
}

/**
 * Renders the brigade event dashboard's header: name, description, type/status/
 * aerial-evac badges, three large at-a-glance stats spaced across the row
 * (elapsed time, plus clickable injuries/evacuations tiles), and the event's
 * actions (advance status, request evacuation, close event).
 *
 * @param {{
 *   event: object,
 *   injuries: Array<object>,
 *   evacuations: Array<object>,
 *   landingPads: Array<object>,
 *   onAdvanceStatus: () => void,
 *   onCloseEvent: () => void,
 *   onCreateEvacuation: (evac: object) => void,
 *   onOpenInjuries: () => void,
 *   onOpenEvacuations: () => void,
 * }} props
 * @returns {JSX.Element} The event header card.
 */
const EventHeaderCard = ({
  event,
  injuries,
  evacuations,
  landingPads,
  onAdvanceStatus,
  onCloseEvent,
  onCreateEvacuation,
  onOpenInjuries,
  onOpenEvacuations,
}) => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const isCompleted = event.status === COMPLETED_STATUS;
  const elapsedSeconds = useElapsedSeconds(isCompleted ? null : event.created_at);

  const currentIndex = STATUS_ORDER.indexOf(event.status);
  const nextStatus = currentIndex >= 0 ? STATUS_ORDER[currentIndex + 1] : null;

  const urgencyCounts = countBy(injuries, URGENCY_ORDER, (injury) => injury.urgency);
  const evacStatusCounts = countBy(evacuations, EVAC_STATUS_ORDER, (evac) => evac.status);
  const aerialEvacColor = AERIAL_EVAC_COLOR_VARS[event["aerial-evac"]] || "var(--app-color-text-muted)";

  return (
    <DashboardCard
      title={event.name || "אירוע ללא שם"}
      padding="md"
      gap="sm"
      headerExtra={
        <Group gap="xs">
          <Badge
            styles={{
              root: {
                backgroundColor: "color-mix(in srgb, var(--app-color-warning) 16%, transparent)",
                color: "var(--app-color-warning)",
              },
            }}
          >
            {EVENT_STATUS_LABELS[event.status] || event.status}
          </Badge>
          <Badge
            leftSection={<IconTarget size={12} />}
            variant="outline"
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text-muted)",
              },
            }}
          >
            {EVENT_TYPE_LABELS[event.type] || event.type}
          </Badge>
          <Badge
            leftSection={<IconHelicopter size={12} />}
            styles={{
              root: {
                backgroundColor: `color-mix(in srgb, ${aerialEvacColor} 16%, transparent)`,
                color: aerialEvacColor,
              },
            }}
          >
            {AERIAL_EVAC_LABELS[event["aerial-evac"]] || event["aerial-evac"]}
          </Badge>
        </Group>
      }
    >
      {event.description && (
        <Text fz="sm" c="var(--app-color-text-muted)">
          {event.description}
        </Text>
      )}

      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={2} style={plainStatStyles}>
          <Text {...statLabelStyles}>זמן שחלף מאז פתיחת האירוע</Text>
          <Text {...statNumberStyles}>{formatDuration(elapsedSeconds)}</Text>
        </Stack>

        <UnstyledButton onClick={onOpenInjuries} styles={tileStatStyles}>
          <Stack gap={2}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text {...statLabelStyles}>נפגעים</Text>
              <IconChevronLeft size={14} stroke={2} color="var(--app-color-text-muted)" />
            </Group>
            <Text {...statNumberStyles}>{injuries.length}</Text>
            <Group gap={6} wrap="wrap">
              {URGENCY_ORDER.map((key) => (
                <Badge
                  key={key}
                  size="sm"
                  styles={{
                    root: {
                      backgroundColor: `color-mix(in srgb, ${URGENCY_COLOR_VARS[key]} 16%, transparent)`,
                      color: URGENCY_COLOR_VARS[key],
                    },
                  }}
                >
                  {urgencyCounts[key]} {URGENCY_LABELS[key]}
                </Badge>
              ))}
            </Group>
          </Stack>
        </UnstyledButton>

        <UnstyledButton onClick={onOpenEvacuations} styles={tileStatStyles}>
          <Stack gap={2}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text {...statLabelStyles}>פינויים</Text>
              <IconChevronLeft size={14} stroke={2} color="var(--app-color-text-muted)" />
            </Group>
            <Text {...statNumberStyles}>{evacuations.length}</Text>
            <Group gap={6} wrap="wrap">
              {EVAC_STATUS_ORDER.map((key) => (
                <Badge
                  key={key}
                  size="sm"
                  styles={{
                    root: {
                      backgroundColor: `color-mix(in srgb, ${AERIAL_EVAC_COLOR_VARS[key]} 16%, transparent)`,
                      color: AERIAL_EVAC_COLOR_VARS[key],
                    },
                  }}
                >
                  {evacStatusCounts[key]} {AERIAL_EVAC_LABELS[key]}
                </Badge>
              ))}
            </Group>
          </Stack>
        </UnstyledButton>
      </Group>

      <Group gap="sm" wrap="wrap">
        <Button
          leftSection={<IconPlayerTrackNext size={16} stroke={1.8} />}
          variant="outline"
          size="sm"
          mih="2.25rem"
          disabled={isCompleted || !nextStatus}
          onClick={onAdvanceStatus}
          styles={{
            root: {
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text)",
            },
          }}
        >
          {nextStatus ? `קדם סטטוס ל${EVENT_STATUS_LABELS[nextStatus]}` : "קדם סטטוס"}
        </Button>

        <Button
          leftSection={<IconSend size={16} stroke={1.8} />}
          size="sm"
          mih="2.25rem"
          onClick={() => setRequestModalOpen(true)}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            },
          }}
        >
          בקש פינוי אווירי
        </Button>

        <Button
          leftSection={<IconCheck size={16} stroke={1.8} />}
          size="sm"
          mih="2.25rem"
          disabled={isCompleted}
          onClick={onCloseEvent}
          styles={{
            root: {
              backgroundColor: "var(--app-color-error)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "var(--app-color-error)",
                opacity: 0.9,
              },
            },
          }}
        >
          סגור אירוע
        </Button>
      </Group>

      <RequestEvacuationModal
        opened={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onCreate={onCreateEvacuation}
        event={event}
        landingPads={landingPads}
      />
    </DashboardCard>
  );
};

export default EventHeaderCard;
