// React
import { useEffect } from "react";

// External libraries
import { Badge, Button, Group, Loader, Menu, ScrollArea, Text } from "@mantine/core";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { fetchEvents } from "../../features/events/eventsSlice";
import { EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";

// Styles

/**
 * A compact "switch event" control, for pages that already show the current
 * event's name and only need a way to move to another one.
 *
 * Replaces the full-width EventSelector on the dashboards: the event name is
 * already the page's heading, so repeating it inside a 260-340px combobox spent
 * a header row on information that was on screen twice. This is a button plus a
 * menu, and it sits next to the name it switches.
 *
 * The list, its loading state and its status colouring match EventSelector, so
 * the two read the same wherever they appear. Mantine's Menu brings the
 * accessibility behaviour with it: the trigger is a real button with
 * aria-expanded/aria-haspopup, items are a menu/menuitem tree, and the menu
 * closes on outside click and on Escape.
 *
 * @param {{
 *   value: string | null,
 *   onChange: (eventId: string) => void,
 *   label?: string,
 * }} props
 * @returns {JSX.Element} The event switcher.
 */
const EventSwitcher = ({ value, onChange, label = "החלף אירוע" }) => {
  const dispatch = useDispatch();
  const { events, status } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const isLoading = status === "loading" && events.length === 0;

  return (
    <Menu
      shadow="md"
      radius="sm"
      position="bottom-end"
      // Portalled so the menu escapes the dashboard's `overflow: hidden`
      // columns; without it the list is clipped by the header row it opens
      // from. Being in a portal also keeps it out of the grid's flow, so
      // opening it cannot reflow the cards underneath.
      withinPortal
      zIndex={300}
      trapFocus
    >
      <Menu.Target>
        <Button
          variant="subtle"
          size="compact-sm"
          rightSection={<IconChevronDown size={14} stroke={2} />}
          loading={isLoading}
          disabled={isLoading}
          // Height is left to the theme's 3rem minTouchTarget, which every
          // other button here honours. It makes this one ~17px taller than the
          // heading beside it, and since it is the tallest thing in that row it
          // sets the row's height — but the space this change actually saves is
          // the whole selector row it replaced, and undercutting an app-wide
          // touch-target token to reclaim 17px more is a poor trade. Compact
          // here means the 93px-wide button that replaced a 260px combobox.
          styles={{
            root: {
              color: "var(--app-color-primary)",
              paddingInline: "0.5rem",
            },
            label: { fontSize: "0.8rem", fontWeight: 600 },
          }}
        >
          {label}
        </Button>
      </Menu.Target>

      <Menu.Dropdown
        style={{
          backgroundColor: "var(--app-color-surface)",
          borderColor: "var(--app-color-border)",
          minWidth: "16rem",
          maxWidth: "22rem",
        }}
      >
        <Menu.Label>אירועים</Menu.Label>

        {events.length === 0 ? (
          <Menu.Item disabled>
            <Text fz="sm" c="var(--app-color-text-muted)">
              {status === "loading" ? "טוען אירועים..." : "לא נמצאו אירועים"}
            </Text>
          </Menu.Item>
        ) : (
          // A long event list would otherwise run off the viewport; the menu
          // scrolls internally instead.
          <ScrollArea.Autosize mah={320} type="auto">
            {events.map((event) => {
              const isActive = event.id === value;
              // Per-status pastel, not open-vs-closed green/grey: event status is
              // a sequential workflow stage, not a severity — see the note on
              // EVENT_STATUS_COLOR_VARS. Same lookup and 16% tint the queue
              // board and EventBadgesRow use, so the badges match across pages.
              const statusColor =
                EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";

              return (
                <Menu.Item
                  key={event.id}
                  onClick={() => onChange(event.id)}
                  // The active row is marked three ways rather than by colour
                  // alone: a tick, a tinted background, and aria-current for
                  // anything reading the menu aloud.
                  aria-current={isActive ? "true" : undefined}
                  leftSection={
                    isActive ? (
                      <IconCheck size={16} stroke={2.2} color="var(--app-color-primary)" />
                    ) : (
                      <span style={{ display: "inline-block", width: 16 }} />
                    )
                  }
                  style={{
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--app-color-primary) 14%, transparent)"
                      : undefined,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm" w="100%">
                    <Text
                      fz="sm"
                      fw={isActive ? 700 : 500}
                      c={isActive ? "var(--app-color-primary)" : "var(--app-color-text)"}
                      truncate
                    >
                      {event.name || event.id}
                    </Text>

                    <Badge
                      size="xs"
                      variant="light"
                      styles={{
                        root: {
                          flexShrink: 0,
                          backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
                          color: statusColor,
                        },
                      }}
                    >
                      {EVENT_STATUS_LABELS[event.status] || event.status}
                    </Badge>
                  </Group>
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        )}

        {status === "loading" && events.length > 0 && (
          <Menu.Item disabled>
            <Group gap="xs" wrap="nowrap">
              <Loader size="xs" color="var(--app-color-primary)" />
              <Text fz="xs" c="var(--app-color-text-muted)">
                מרענן...
              </Text>
            </Group>
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default EventSwitcher;
