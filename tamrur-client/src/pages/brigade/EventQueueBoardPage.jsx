// React
import { useMemo, useState } from "react";

// External libraries
import { ActionIcon, Box, Group, Stack, Title, useMantineColorScheme } from "@mantine/core";
import { IconLayoutKanban, IconMap2, IconMoon, IconSearch, IconSun, IconTable } from "@tabler/icons-react";

// Internal application modules
import Layout from "../../components/layout/Layout";
import DateNavBar from "../../components/brigade/DateNavBar";
import EventQueueTable from "../../components/brigade/EventQueueTable";
import EventQueueMap from "../../components/brigade/EventQueueMap";
import EventQueueBoard from "../../components/brigade/EventQueueBoard";
import { COMPLETED_STATUS } from "../../constants/eventStatus";
import { mockQueueEvents } from "./mockEventQueueBoardData";
import { isEventActiveOnDate, isSameDay, startOfDay } from "../../utils/eventQueueDate";

// Styles

/** The three ways to look at the queue — table, map, and kanban are all built now. */
const VIEW_OPTIONS = [
  { key: "table", label: "טבלה", icon: IconTable },
  { key: "map", label: "מפה", icon: IconMap2 },
  { key: "board", label: "לוח", icon: IconLayoutKanban },
];

/**
 * The brigade's event queue board — every event, filterable by date and by
 * name, switchable between a table, a map, and a kanban board. Still on
 * mock data (`events` state, seeded from `mockQueueEvents`): Redux/API
 * wiring is a separate, later pass once the layout itself is signed off,
 * so the status-change/create handlers below just update local state —
 * nothing dispatches or fetches. Kanban drag/create is only live on
 * today's date; a past date is read-only history.
 *
 * @returns {JSX.Element} The event queue board page.
 */
const EventQueueBoardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [events, setEvents] = useState(mockQueueEvents);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const isToday = isSameDay(selectedDate, startOfDay(new Date()));

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter(
      (event) => isEventActiveOnDate(event, selectedDate) && (!query || event.name.toLowerCase().includes(query)),
    );
  }, [events, selectedDate, searchQuery]);

  const handleStatusChange = (eventId, status) => {
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, status } : event)));
  };

  const handleCompleteEvent = (eventId) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, status: COMPLETED_STATUS, closure_at: new Date().toISOString() } : event,
      ),
    );
  };

  const handleCreateEvent = ({ name, type }) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Math.max(...prev.map((event) => event.id)) + 1,
        name,
        type,
        status: "evaluated",
        created_at: new Date().toISOString(),
        closure_at: null,
        // No location picker in this simplified create flow — the event
        // just won't have a marker on the map view until one is added.
        location: null,
      },
    ]);
  };

  const isDark = colorScheme === "dark";

  return (
    <Layout>
      <Box
        aria-hidden="true"
        pos="absolute"
        inset={0}
        style={{
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.2,
          backgroundImage: "radial-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <Box
        aria-hidden="true"
        pos="absolute"
        inset={0}
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--app-color-surface-high) 50%, transparent), var(--app-color-background))",
        }}
      />

      <Stack
        align="stretch"
        h="100vh"
        px="var(--app-page-padding)"
        py="md"
        pos="relative"
        style={{ zIndex: 10, overflow: "hidden" }}
      >
        <Group justify="space-between" align="center">
          <Title order={1} fz="1.5rem" fw={700} c="var(--app-color-text)">
            לוח מעקב אירועים
          </Title>

          <ActionIcon
            aria-label="החלף מצב תצוגה"
            title="החלף מצב תצוגה"
            variant="default"
            size={40}
            radius="sm"
            onClick={() => toggleColorScheme()}
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text)",
              },
            }}
          >
            {isDark ? (
              <IconSun aria-hidden="true" size={20} stroke={1.8} />
            ) : (
              <IconMoon aria-hidden="true" size={20} stroke={1.8} />
            )}
          </ActionIcon>
        </Group>

        <Group justify="space-between" gap="sm" wrap="wrap">
          <Group
            gap="xs"
            style={{
              flex: 1,
              minWidth: "16rem",
              maxWidth: "22rem",
              backgroundColor: "var(--app-color-surface)",
              border: "1px solid var(--app-color-border)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "0.4rem 0.7rem",
            }}
          >
            <IconSearch size={15} stroke={2} color="var(--app-color-text-muted)" />
            <input
              type="text"
              placeholder="חיפוש אירוע לפי שם..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: 0,
                outline: "none",
                color: "var(--app-color-text)",
                fontFamily: "inherit",
                fontSize: "0.9rem",
              }}
            />
          </Group>

          <Group
            gap={4}
            p={4}
            style={{
              backgroundColor: "var(--app-color-surface)",
              border: "1px solid var(--app-color-border)",
              borderRadius: "var(--mantine-radius-sm)",
            }}
          >
            {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
              <Box
                key={key}
                component="button"
                type="button"
                onClick={() => setViewMode(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "calc(var(--mantine-radius-sm) - 0.05rem)",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  backgroundColor: viewMode === key ? "var(--app-color-primary)" : "transparent",
                  color: viewMode === key ? "var(--app-color-primary-text)" : "var(--app-color-text-muted)",
                }}
              >
                <Icon size={15} stroke={2} />
                {label}
              </Box>
            ))}
          </Group>
        </Group>

        <DateNavBar selectedDate={selectedDate} onChange={setSelectedDate} />

        {viewMode === "table" && <EventQueueTable events={visibleEvents} />}

        {viewMode === "map" && <EventQueueMap events={visibleEvents} />}

        {viewMode === "board" && (
          <EventQueueBoard
            events={visibleEvents}
            isToday={isToday}
            onStatusChange={handleStatusChange}
            onCompleteEvent={handleCompleteEvent}
            onCreateEvent={handleCreateEvent}
          />
        )}
      </Stack>
    </Layout>
  );
};

export default EventQueueBoardPage;
