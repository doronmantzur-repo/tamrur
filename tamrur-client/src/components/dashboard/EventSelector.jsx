// React
import { useEffect, useState } from "react";

// External libraries
import { Badge, Group, Loader, Select, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { fetchEvents } from "../../features/events/eventsSlice";
import { CLOSED_STATUS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/**
 * One event row inside the dropdown's option list — hover/press feedback is
 * real state (`useHoverState` + local `isPressed`), not CSS `&:hover` keys
 * inside Mantine's `styles` prop: that prop flattens straight into a plain
 * inline `style` attribute in this app, so pseudo-selectors inside it are
 * silently dropped rather than compiled into real CSS. Isolated in its own
 * component (rather than computed inline in `renderOption`) so each row's
 * hover state doesn't leak into its siblings — hooks can't run inside a
 * `.map()`/render-prop callback either way.
 *
 * @param {{ option: { label: string, status: string }, checked: boolean }} props
 * @returns {JSX.Element} The option row.
 */
function EventOption({ option, checked }) {
  const isClosed = option.status === CLOSED_STATUS;
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  const restBackground = isClosed
    ? "var(--app-color-surface-high)"
    : "color-mix(in srgb, var(--app-color-primary) 14%, transparent)";
  const hoverBackground = isClosed
    ? "color-mix(in srgb, var(--app-color-text-muted) 12%, var(--app-color-surface-high))"
    : "color-mix(in srgb, var(--app-color-primary) 24%, transparent)";

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      w="100%"
      px="sm"
      py={6}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: isHovered ? hoverBackground : restBackground,
        border: `1px solid ${checked ? "var(--app-color-primary)" : "transparent"}`,
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        transition: "background-color 0.15s ease, transform 0.1s ease",
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
}

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
  const [isHovered, hoverHandlers] = useHoverState();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Same 3-state border-color pattern EventQueueBoardPage's own search input
  // uses — real `useHoverState`/`isFocused` state, not CSS `&:hover`/
  // `&:focus` keys inside Mantine's `styles` prop: that prop flattens
  // straight into a plain inline `style` attribute in this app, so
  // pseudo-selectors inside it are silently dropped rather than compiled
  // into real CSS (the previous `"&:focus"` key here never actually applied).
  const inputBorderColor = isFocused
    ? "var(--app-color-primary)"
    : isHovered
      ? "color-mix(in srgb, var(--app-color-primary) 45%, transparent)"
      : "var(--app-color-border)";

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
      {...hoverHandlers}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      // Compact trims the label and the width, but deliberately NOT the height:
      // the theme pins every Input at 3rem to match its own `minTouchTarget`
      // token, and overriding that here left the wrapper at 3rem while the input
      // shrank — which is what pushed the clear button below the visible border.
      w={compact ? { base: "100%", xs: 260 } : { base: "100%", sm: 340 }}
      comboboxProps={{ shadow: "md" }}
      renderOption={({ option, checked }) => <EventOption option={option} checked={checked} />}
      styles={{
        label: {
          color: "var(--app-color-text-muted)",
          marginBottom: "0.25rem",
        },
        input: {
          minHeight: "3rem",
          backgroundColor: "var(--app-color-background)",
          color: "var(--app-color-text)",
          borderWidth: isFocused ? "2px" : "1px",
          borderColor: inputBorderColor,
          fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
          transition: "border-color 0.15s ease",
        },
      }}
    />
  );
};

export default EventSelector;
