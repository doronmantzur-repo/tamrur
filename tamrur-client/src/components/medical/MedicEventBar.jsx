// React

// External libraries
import { Badge, Group, Text, Title } from "@mantine/core";
import { IconClock, IconTarget } from "@tabler/icons-react";

// Internal application modules
import EventSwitcher from "../dashboard/EventSwitcher";
import { MONO_FONT } from "./formStyles";
import { CLOSED_STATUS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

const dateTimeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Renders the medic page's single top bar: the page title, the event picker and
 * the selected event's identity and running clock.
 *
 * These were three stacked blocks — a heading, a labelled dropdown of its own,
 * and a full `EventDetailsCard` — which together pushed the casualty table
 * about 440px down the page. A medic working an incident needs the table, not
 * the chrome, so the same information is folded into one row that wraps only
 * when it has to.
 *
 * The picker is the compact EventSwitcher the dashboards use, sitting beside
 * the event name rather than repeating that name inside a 260px combobox.
 * Unlike those dashboards it does NOT fall back to the first event when nothing
 * is chosen: this page writes casualties against the selection, and quietly
 * defaulting it would let a medic file into the wrong incident. Until they pick
 * one the bar says so, and the switcher is the only control offered.
 *
 * @param {{
 *   selectedEventId: string | null,
 *   onSelectEvent: (eventId: string | null) => void,
 *   event: Object | undefined,
 * }} props
 * @returns {JSX.Element} The medic page header bar.
 */
const MedicEventBar = ({ selectedEventId, onSelectEvent, event }) => {
  const isClosed = event?.status === CLOSED_STATUS;
  // An unselected event has nothing to count from; a closed one freezes
  // at its closure time instead of ticking against now.
  const elapsedSeconds = useElapsedSeconds(event?.created_at, isClosed ? event.closure_at : null);

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Group align="center" wrap="nowrap" gap="sm">
        <Title
          order={1}
          c="var(--app-color-primary)"
          fz="1.15rem"
          fw={700}
          style={{ whiteSpace: "nowrap" }}
        >
          ממשק רפואי
        </Title>
      </Group>

      <Group align="center" wrap="wrap" gap="xs">
        <Text
          fz="sm"
          fw={700}
          c={event ? "var(--app-color-text)" : "var(--app-color-text-muted)"}
          truncate
          maw={240}
        >
          {event ? event.name || "אירוע ללא שם" : "לא נבחר אירוע"}
        </Text>

        {/* Beside the name it switches, and the only picker on the page — so it
            has to read as "choose one" before anything is selected. */}
        <EventSwitcher
          value={selectedEventId}
          onChange={onSelectEvent}
          label={event ? "החלף אירוע" : "בחר אירוע"}
        />

        {event && (
          <>
            <Badge
              size="sm"
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
              size="sm"
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

            <Group
              gap={4}
              wrap="nowrap"
              align="center"
              px="xs"
              py={2}
              style={{
                backgroundColor: "var(--app-color-surface-high)",
                border: "1px solid var(--app-color-border)",
                borderRadius: "var(--mantine-radius-sm)",
              }}
            >
              <IconClock size={14} color="var(--app-color-text-muted)" />
              <Text
                fz="sm"
                fw={700}
                ff={MONO_FONT}
                c={isClosed ? "var(--app-color-text-muted)" : "var(--app-color-primary)"}
                title={isClosed ? "מועד סיום האירוע" : "זמן שחלף מאז פתיחת האירוע"}
              >
                {isClosed
                  ? dateTimeFormatter.format(new Date(event.closure_at ?? event.created_at))
                  : formatDuration(elapsedSeconds)}
              </Text>
            </Group>
          </>
        )}
      </Group>
    </Group>
  );
};

export default MedicEventBar;
