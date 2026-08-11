// React

// External libraries
import { Badge, Group, Stack, Text } from "@mantine/core";
import { IconTarget } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "./DashboardCard";
import { COMPLETED_STATUS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

const dateTimeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "medium",
});

function formatDateTime(isoString) {
  return isoString ? dateTimeFormatter.format(new Date(isoString)) : "—";
}

/**
 * Renders the selected event's details: name, status, type, and either its
 * start/end times (once completed) or a live counter since it was created.
 *
 * @param {{ event: object }} props
 * @returns {JSX.Element} The event details card.
 */
const EventDetailsCard = ({ event }) => {
  const isCompleted = event.status === COMPLETED_STATUS;
  const elapsedSeconds = useElapsedSeconds(isCompleted ? null : event.created_at);

  return (
    <DashboardCard
      title={event.name || "אירוע ללא שם"}
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
        </Group>
      }
    >
      {isCompleted ? (
        <Group gap="xl">
          <Stack gap={2}>
            <Text fz="0.68rem" tt="uppercase" lts="0.04em" c="var(--app-color-text-muted)">
              התחיל
            </Text>
            <Text fz="sm" fw={600} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
              {formatDateTime(event.created_at)}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text fz="0.68rem" tt="uppercase" lts="0.04em" c="var(--app-color-text-muted)">
              הסתיים
            </Text>
            <Text fz="sm" fw={600} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
              {formatDateTime(event.closure_at)}
            </Text>
          </Stack>
        </Group>
      ) : (
        <Stack gap={2}>
          <Text fz="0.68rem" tt="uppercase" lts="0.04em" c="var(--app-color-text-muted)">
            זמן שחלף מאז פתיחת האירוע
          </Text>
          <Text
            fz="1.5rem"
            fw={700}
            c="var(--app-color-primary)"
            ff='ui-monospace, "SF Mono", "Consolas", monospace'
          >
            {formatDuration(elapsedSeconds)}
          </Text>
        </Stack>
      )}
    </DashboardCard>
  );
};

export default EventDetailsCard;
