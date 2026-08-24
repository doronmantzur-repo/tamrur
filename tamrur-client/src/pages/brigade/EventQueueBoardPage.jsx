// React
import { useEffect, useMemo, useState } from "react";

// External libraries
import { ActionIcon, Alert, Box, Button, Group, Loader, Stack, Text, Title } from "@mantine/core";
import {
  IconAlertTriangle,
  IconLayoutKanban,
  IconMap2,
  IconPlus,
  IconReportAnalytics,
  IconSearch,
  IconTable,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import DateNavBar from "../../components/brigade/DateNavBar";
import EventQueueTable from "../../components/brigade/EventQueueTable";
import EventQueueMap from "../../components/brigade/EventQueueMap";
import EventQueueBoard from "../../components/brigade/EventQueueBoard";
import AccountControlsStack from "../../components/common/AccountControlsStack";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import CreateEventModal from "../../components/events/CreateEventModal";
import { fetchEvents, closeEvent } from "../../features/events/eventsSlice";
import { fetchForces } from "../../features/forces/forcesSlice";
import { fetchLocations } from "../../features/locations/locationsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";
import { isEventActiveOnDate, isSameDay, startOfDay } from "../../utils/eventQueueDate";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/** The three ways to look at the queue. */
const VIEW_OPTIONS = [
  { key: "table", label: "טבלה", icon: IconTable },
  { key: "map", label: "מפה", icon: IconMap2 },
  { key: "board", label: "לוח", icon: IconLayoutKanban },
];

/**
 * The brigade's event queue board — every event, filterable by date and by
 * name, switchable between a table, a map, and a kanban board. All three
 * views now read the same real event list (`fetchEvents`, polled like every
 * other brigade page — see `POLL_INTERVAL_MS`). Kanban's only drag action
 * (full_evacuation -> closed, everything else being server-derived) dispatches
 * `closeEvent` (via `handleCloseEvent` below, returning the dispatch's
 * promise) — the optimistic move and the revert-on-failure both live in
 * EventQueueBoard itself, since it's the one that needs to react to
 * success/failure, not this page. The header's own "פתח אירוע" button opens
 * the existing `CreateEventForm` in a modal (`CreateEventModal`) — available
 * regardless of which of the three views is active, rather than only from
 * inside the kanban board (which also keeps its own separate "+" for
 * creating directly into that view). Uses the existing form rather than a
 * lightweight inline one, since it already handles the one thing a lighter
 * form couldn't (a required location pin) and already guarantees new events
 * start as "gathering_casualties" (status is never sent from that form —
 * the server always decides it).
 *
 * @returns {JSX.Element} The event queue board page.
 */
const EventQueueBoardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAnalystButtonHovered, analystButtonHoverHandlers] = useHoverState();
  const [isCreateEventHovered, createEventHoverHandlers] = useHoverState();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const events = useSelector((state) => state.events.events);
  const apiStatus = useSelector((state) => state.events.status);
  const apiError = useSelector((state) => state.events.error);
  const forces = useSelector((state) => state.forces.forces);
  const locations = useSelector((state) => state.locations.locations);
  const casualtiesByEventId = useSelector((state) => state.casualties.byEventId);

  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const isToday = isSameDay(selectedDate, startOfDay(new Date()));

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchForces());
    dispatch(fetchLocations());

    // Other brigade members can open/close events at any time, so keep
    // polling instead of fetching once — same pattern every other brigade
    // page already uses. Forces/locations are static reference data, so
    // they're fetched once here, not polled.
    const intervalId = setInterval(() => {
      dispatch(fetchEvents());
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  const isInitialLoad = apiStatus === "loading" && events.length === 0;

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter(
      (event) => isEventActiveOnDate(event, selectedDate) && (!query || event.name.toLowerCase().includes(query)),
    );
  }, [events, selectedDate, searchQuery]);

  // The map view's event popups show each event's evacuated/total casualty
  // count, which the event list itself doesn't carry — only fetched while
  // the map is actually being viewed, to avoid firing one request per
  // visible event on every poll tick when nobody's looking at the map.
  useEffect(() => {
    if (viewMode !== "map") return;
    visibleEvents.forEach((event) => {
      dispatch(fetchCasualtiesByEvent(event.id));
    });
  }, [dispatch, viewMode, visibleEvents]);

  // Returns the dispatch's promise (rather than catching here) so
  // EventQueueBoard can await it: it needs to know success/failure itself,
  // to revert its own optimistic move if the close fails.
  const handleCloseEvent = (eventId) => dispatch(closeEvent(eventId)).unwrap();

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

          <AccountControlsStack>
            <ActionIcon
              aria-label="מעבר לניתוח אירוע"
              title="מעבר לניתוח אירוע"
              variant="default"
              size={40}
              radius="xl"
              onClick={() => navigate("/analyst")}
              {...analystButtonHoverHandlers}
              style={{
                backgroundColor: isAnalystButtonHovered ? "var(--app-color-primary)" : "var(--app-color-surface)",
                borderColor: isAnalystButtonHovered ? "var(--app-color-primary)" : "var(--app-color-border)",
                color: isAnalystButtonHovered ? "var(--app-color-primary-text)" : "var(--app-color-text)",
                transform: isAnalystButtonHovered ? "translateY(-1px)" : undefined,
                transition:
                  "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
              }}
            >
              <IconReportAnalytics aria-hidden="true" size={20} stroke={1.8} />
            </ActionIcon>

            <Button
              leftSection={<IconPlus size={18} stroke={1.8} />}
              size="sm"
              mih="2.5rem"
              onClick={() => setIsCreateOpen(true)}
              {...createEventHoverHandlers}
              styles={{
                root: {
                  background: "linear-gradient(135deg, var(--app-color-primary), var(--app-color-primary-hover))",
                  color: "var(--app-color-primary-text)",
                  boxShadow:
                    "0 8px 22px -6px color-mix(in srgb, var(--app-color-primary) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.4)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  // Mantine's `styles` prop merges straight into an inline
                  // `style` attribute, so a nested "&:hover" key here is
                  // never compiled into real CSS — this is driven by
                  // useHoverState instead.
                  transform: isCreateEventHovered ? "translateY(-1px)" : undefined,
                },
              }}
            >
              פתח אירוע
            </Button>

            {/* Last child, so it renders visually leftmost in this RTL row —
                every page's controls row keeps the theme toggle there. */}
            <ThemeToggleButton variant="glass" />
          </AccountControlsStack>
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
            mt={56}
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

        {apiStatus === "failed" && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title="טעינת האירועים נכשלה"
            styles={{
              root: {
                backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
                borderInlineStart: "3px solid var(--app-color-error)",
              },
              title: { color: "var(--app-color-error)" },
              body: { color: "var(--app-color-text)" },
            }}
          >
            {apiError}
          </Alert>
        )}

        {isInitialLoad && (
          <Stack align="center" gap="xs" py="xl">
            <Loader color="var(--app-color-primary)" />
            <Text fz="sm" c="var(--app-color-text-muted)">
              טוען אירועים...
            </Text>
          </Stack>
        )}

        {!isInitialLoad && viewMode === "table" && <EventQueueTable events={visibleEvents} />}

        {!isInitialLoad && viewMode === "map" && (
          <EventQueueMap
            events={visibleEvents}
            forces={forces}
            locations={locations}
            casualtiesByEventId={casualtiesByEventId}
          />
        )}

        {!isInitialLoad && viewMode === "board" && (
          <EventQueueBoard events={visibleEvents} isToday={isToday} onCloseEvent={handleCloseEvent} />
        )}
      </Stack>

      <CreateEventModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setIsCreateOpen(false)}
      />
    </Layout>
  );
};

export default EventQueueBoardPage;
