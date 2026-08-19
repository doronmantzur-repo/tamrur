// React
import { useEffect } from "react";

// External libraries
import { Badge, Group, Loader, Select, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { fetchEvents } from "../../features/events/eventsSlice";
import { CLOSED_STATUS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";

// Styles

/**
 * Renders a dropdown listing events, with closed events shown in a muted
 * color and active (non-closed) events highlighted in the app's primary
 * accent, so status reads at a glance.
 *
 * `compact` drops the field label and shortens the control, for pages that sit
 * it in a toolbar rather than giving it a row of its own.
 *
 * @param {{
 *   value: string | null,
 *   onChange: (eventId: string | null) => void,
 *   filterStatuses?: string[],
 *   compact?: boolean,
 * }} props - `filterStatuses`, if given, restricts the list to events whose
 *   status is in that array (e.g. `[CLOSED_STATUS]` for a reports page).
 * @returns {JSX.Element} The event selector dropdown.
 */
const EventSelector = ({ value, onChange, filterStatuses, compact = false }) => {
  const dispatch = useDispatch();
  const { events, status } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const visibleEvents = filterStatuses
    ? events.filter((event) => filterStatuses.includes(event.status))
    : events;

  const data = visibleEvents.map((event) => ({
    value: event.id,
    label: event.name || event.id,
    status: event.status,
  }));

  return (
    <Select
      label={compact ? undefined : "אירוע"}
      placeholder={status === "loading" ? "טוען אירועים..." : "בחר אירוע מהרשימה"}
      nothingFoundMessage="לא נמצאו אירועים"
      data={data}
      value={value}
      onChange={onChange}
      searchable
      clearable
      disabled={status === "loading"}
      rightSection={status === "loading" ? <Loader size="xs" color="var(--app-color-primary)" /> : undefined}
      checkIconPosition="right"
      dir="rtl"
      // Compact trims the label and the width, but deliberately NOT the height:
      // the theme pins every Input at 3rem to match its own `minTouchTarget`
      // token, and overriding that here left the wrapper at 3rem while the input
      // shrank — which is what pushed the clear button below the visible border.
      w={compact ? { base: "100%", xs: 260 } : { base: "100%", sm: 340 }}
      comboboxProps={{ shadow: "md" }}
      renderOption={({ option, checked }) => {
        const isClosed = option.status === CLOSED_STATUS;
        return (
          <Group
            justify="space-between"
            wrap="nowrap"
            w="100%"
            px="sm"
            py={6}
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              backgroundColor: isClosed
                ? "var(--app-color-surface-high)"
                : "color-mix(in srgb, var(--app-color-primary) 14%, transparent)",
              border: `1px solid ${checked ? "var(--app-color-primary)" : "transparent"}`,
            }}
          >
            <Text
              fz="sm"
              fw={checked ? 700 : 500}
              c={isClosed ? "var(--app-color-text-muted)" : "var(--app-color-text)"}
              truncate
            >
              {option.label}
            </Text>
            <Badge
              size="xs"
              styles={{
                root: {
                  backgroundColor: isClosed
                    ? "var(--app-color-surface)"
                    : "color-mix(in srgb, var(--app-color-primary) 30%, transparent)",
                  color: isClosed ? "var(--app-color-text-muted)" : "var(--app-color-primary)",
                },
              }}
            >
              {EVENT_STATUS_LABELS[option.status] || option.status}
            </Badge>
          </Group>
        );
      }}
      styles={{
        label: {
          color: "var(--app-color-text-muted)",
          marginBottom: "0.25rem",
        },
        input: {
          minHeight: "3rem",
          backgroundColor: "var(--app-color-background)",
          color: "var(--app-color-text)",
          borderColor: "var(--app-color-border)",
          fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
          "&:focus": {
            borderWidth: "2px",
            borderColor: "var(--app-color-primary)",
          },
        },
      }}
    />
  );
};

export default EventSelector;
