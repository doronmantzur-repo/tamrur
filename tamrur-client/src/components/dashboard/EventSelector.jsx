// React
import { useEffect } from "react";

// External libraries
import { Badge, Group, Select, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { fetchEvents } from "../../features/events/eventsSlice";
import { COMPLETED_STATUS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";

// Styles

/**
 * Renders a dropdown listing every event, with completed events shown in a
 * muted color and active (non-completed) events highlighted in the app's
 * primary accent, so status reads at a glance.
 *
 * @param {{ value: string | null, onChange: (eventId: string | null) => void }} props
 * @returns {JSX.Element} The event selector dropdown.
 */
const EventSelector = ({ value, onChange }) => {
  const dispatch = useDispatch();
  const { events, status } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const data = events.map((event) => ({
    value: event.id,
    label: event.name || event.id,
    status: event.status,
  }));

  return (
    <Select
      label="אירוע"
      placeholder={status === "loading" ? "טוען אירועים..." : "בחר אירוע מהרשימה"}
      nothingFoundMessage="לא נמצאו אירועים"
      data={data}
      value={value}
      onChange={onChange}
      searchable
      clearable
      checkIconPosition="right"
      dir="rtl"
      w={{ base: "100%", sm: 340 }}
      comboboxProps={{ shadow: "md" }}
      renderOption={({ option, checked }) => {
        const isCompleted = option.status === COMPLETED_STATUS;
        return (
          <Group
            justify="space-between"
            wrap="nowrap"
            w="100%"
            px="sm"
            py={6}
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              backgroundColor: isCompleted
                ? "var(--app-color-surface-high)"
                : "color-mix(in srgb, var(--app-color-primary) 14%, transparent)",
              border: `1px solid ${checked ? "var(--app-color-primary)" : "transparent"}`,
            }}
          >
            <Text
              fz="sm"
              fw={checked ? 700 : 500}
              c={isCompleted ? "var(--app-color-text-muted)" : "var(--app-color-text)"}
              truncate
            >
              {option.label}
            </Text>
            <Badge
              size="xs"
              styles={{
                root: {
                  backgroundColor: isCompleted
                    ? "var(--app-color-surface)"
                    : "color-mix(in srgb, var(--app-color-primary) 30%, transparent)",
                  color: isCompleted ? "var(--app-color-text-muted)" : "var(--app-color-primary)",
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
