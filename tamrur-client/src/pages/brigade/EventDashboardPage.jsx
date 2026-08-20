// React
import { useEffect, useState } from "react";

// External libraries
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { IconAlertTriangle, IconMoon, IconPlus, IconShieldHalfFilled, IconSun } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventDescriptionBlock from "../../components/brigade/EventDescriptionBlock";
import EventBadgesRow from "../../components/brigade/EventBadgesRow";
import EventTimerChip from "../../components/brigade/EventTimerChip";
import EventActionButtons from "../../components/brigade/EventActionButtons";
import EventMapCard from "../../components/brigade/EventMapCard";
import CasualtiesTableCard from "../../components/brigade/CasualtiesTableCard";
import EvacuatedCasualtiesCard from "../../components/brigade/EvacuatedCasualtiesCard";
import EvacuationsTable from "../../components/brigade/EvacuationsTable";
import CreateEventModal from "../../components/events/CreateEventModal";
import { CLOSED_STATUS, FULL_EVACUATION_STATUS } from "../../constants/eventStatus";
import { fetchLocations } from "../../features/locations/locationsSlice";
import { fetchForces } from "../../features/forces/forcesSlice";
import { fetchEventById, updateEvent, closeEvent } from "../../features/events/eventsSlice";
import { fetchAerialMissionsByEvent } from "../../features/aerialMission/aerialMissionSlice";
import {
  fetchEvacuationsByEvent,
  updateEvacuation,
  deleteEvacuation,
} from "../../features/evacuations/evacuationsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/** Stable reference for "nothing fetched yet" so selector fallbacks don't create a new array every render. */
const EMPTY_ARRAY = [];

/**
 * Renders the brigade single-event dashboard: a top bar (the shield icon
 * and event name sharing one row on the right, description and status
 * badges stacked beneath that row; the elapsed-time chip centered; the
 * theme toggle/open-event/close-event actions on the left), then one row
 * split 1/5-2/5-2/5 between the event map, the casualties table (not-yet-
 * evacuated casualties only), and the evacuation team column — which itself
 * stacks EvacuationsTable (the working table, most of the column's height)
 * above EvacuatedCasualtiesCard (a compact read-only reference of who's
 * already evacuated and when, mirroring the medic page's own
 * active/evacuated split — casualties are split into the two halves once
 * here and handed to each card separately). The active-teams count lives as
 * a badge in EvacuationsTable's own header. The whole page is pinned to the
 * viewport height with no page-level scroll; the bottom row fills whatever
 * space is left and each card scrolls its own content internally instead.
 * The event (by :eventId), locations, forces, aerial missions, evacuations,
 * and casualties are all fetched from the API. An approved aerial mission's
 * evacuation row is created server-side (not here) once the airforce
 * approves it.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dispatch = useDispatch();
  const { eventId } = useParams();

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Recorded locally at the moment the brigade actually closes the event,
  // rather than trusting event.closure_at to round-trip back from the API
  // (there's no backend in this repo to confirm it does) — this is what the
  // header's timer freezes against, so it doesn't depend on that round-trip.
  const [localClosureAt, setLocalClosureAt] = useState(null);

  const event = useSelector((state) => state.events.currentEvent);
  const currentEventStatus = useSelector((state) => state.events.currentEventStatus);
  const currentEventError = useSelector((state) => state.events.currentEventError);
  const locations = useSelector((state) => state.locations.locations);
  const forces = useSelector((state) => state.forces.forces);
  const aerialMissions = useSelector((state) => state.aerialMission.byEventId[eventId]) || EMPTY_ARRAY;
  const evacuations = useSelector((state) => state.evacuations.byEventId[eventId]) || EMPTY_ARRAY;
  const casualties = useSelector((state) => state.casualties.byEventId[eventId]) || EMPTY_ARRAY;
  const evacuatedCount = casualties.filter((casualty) => casualty.is_evacuated).length;

  // The airforce only ever writes the decision to the aerial_mission row,
  // never back onto the event — so once a mission exists for this event,
  // its request-status is the true answer; before that, the event's own
  // aerial-evac field (set by the brigade's request button) is all there is.
  const latestMission = aerialMissions[0];
  const aerialEvacStatus = latestMission ? latestMission["request-status"] : event?.["aerial-evac"];

  // Derived, not stored: true on first load and when the route's eventId
  // has changed but the fetch for it hasn't resolved yet — false during a
  // background polling refresh of the event already on screen, so that
  // doesn't flash the loader every poll interval.
  const isShowingCurrentEvent = event?.id === eventId;
  const isInitialLoad = currentEventStatus === "loading" && !isShowingCurrentEvent;

  useEffect(() => {
    dispatch(fetchLocations());
    dispatch(fetchForces());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchEventById(eventId));

    // Other stakeholders (airforce approving a request, etc.) can change
    // this event at any time, so keep polling instead of fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchEventById(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  useEffect(() => {
    dispatch(fetchAerialMissionsByEvent(eventId));

    // Waiting on the airforce's decision, which can land at any time.
    const intervalId = setInterval(() => {
      dispatch(fetchAerialMissionsByEvent(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  useEffect(() => {
    dispatch(fetchEvacuationsByEvent(eventId));

    // The brigade edits rows inline, and the server creates one in the
    // background on an approved aerial mission, so keep polling instead of
    // fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchEvacuationsByEvent(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  useEffect(() => {
    dispatch(fetchCasualtiesByEvent(eventId));

    // Medics add/update casualties from their own page throughout the event,
    // so keep polling instead of fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchCasualtiesByEvent(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  // The evacuation row for an approved aerial mission is created server-side
  // now (tamrur-server's aerialMissionController, on approval), atomically
  // and idempotently via a partial unique index on evacuations.aerial_mission_id
  // — not here. Client-side polling can't coordinate across multiple brigade
  // tabs/sessions watching the same event, so a check-then-create done here
  // was a race: two tabs could each see "no row yet" and both create one.

  const isDark = colorScheme === "dark";

  // The actual close dispatch, only ever called once the confirmation modal is
  // accepted. closure_at is stamped server-side now (see POST /events/:id/close),
  // so localClosureAt just captures "now" for the timer to freeze against
  // without waiting on the response round-trip.
  const confirmCloseEvent = () => {
    dispatch(closeEvent(eventId));
    setLocalClosureAt(new Date().toISOString());
    setCloseConfirmOpen(false);
  };

  const handleRequestAerialEvac = () => {
    dispatch(updateEvent({ id: eventId, changes: { aerialEvac: "needed" } }));
  };

  const handleUpdateEvacuation = (evacId, changes) => {
    dispatch(updateEvacuation({ id: evacId, changes }));
  };

  const handleDeleteEvacuation = (evacId) => {
    dispatch(deleteEvacuation({ id: evacId, eventId }));
  };

  const isEventClosed = event?.status === CLOSED_STATUS;
  const isEventFullEvacuation = event?.status === FULL_EVACUATION_STATUS;

  // Split once here, same as the medic page's own active/evacuated split —
  // CasualtiesTableCard gets the active half, EvacuatedCasualtiesCard the
  // other, so neither needs to know how the other one filters.
  const activeCasualties = casualties.filter((casualty) => !casualty.is_evacuated);
  const evacuatedCasualties = casualties.filter((casualty) => casualty.is_evacuated);

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
          backgroundImage:
            "radial-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px)",
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
        style={{
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <Stack align="stretch" gap="sm" style={{ flex: 1, minHeight: 0 }}>
          {/* A 3-column grid (not `justify="space-between"`) so the timer
              chip in the middle column sits truly centered on the page,
              regardless of the title and action groups on either side
              having different widths. */}
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              // The left column now stacks the icon, name, description, and
              // badges, so it's much taller than the timer chip or the
              // button row — top-aligning (not centering) keeps those two
              // flush with the icon/name instead of centered against the
              // whole tall block.
              alignItems: "start",
              gap: "var(--mantine-spacing-sm)",
            }}
          >
            <Stack gap={2} style={{ justifySelf: "start" }}>
              {!isInitialLoad && isShowingCurrentEvent && event ? (
                <>
                  {/* Icon and event name share one row (instead of the icon
                      sitting alone above a separate name row) so the
                      description and badges below both move up a row —
                      keeping this section's total height from growing
                      compared to before the progress bar/tiles were added
                      below it. */}
                  <Group gap="xs" wrap="nowrap">
                    <IconShieldHalfFilled
                      aria-hidden="true"
                      size={28}
                      stroke={1.6}
                      color="var(--app-color-primary)"
                    />
                    <Title order={1} c="var(--app-color-text)" fz="1.5rem" fw={700}>
                      {event.name || "אירוע ללא שם"}
                    </Title>
                  </Group>

                  <EventDescriptionBlock />
                  <EventBadgesRow event={event} aerialEvacStatus={aerialEvacStatus} />
                </>
              ) : (
                <IconShieldHalfFilled aria-hidden="true" size={28} stroke={1.6} color="var(--app-color-primary)" />
              )}
            </Stack>

            <Stack gap={2} align="center" style={{ justifySelf: "center" }}>
              {!isInitialLoad && isShowingCurrentEvent && event && (
                <>
                  <EventTimerChip event={event} localClosureAt={localClosureAt} />
                  <Text fw={800} fz="1.75rem" lh={1.1} c="var(--app-color-text)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {`פונו ${evacuatedCount} מתוך ${casualties.length} נפגעים`}
                  </Text>
                </>
              )}
            </Stack>

            <Group gap="xs" wrap="nowrap" style={{ justifySelf: "end" }}>
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

              <Button
                leftSection={<IconPlus size={18} stroke={1.8} />}
                size="sm"
                mih="2.5rem"
                onClick={() => setIsCreateOpen(true)}
                styles={{
                  root: {
                    backgroundColor: "var(--app-color-primary)",
                    color: "var(--app-color-primary-text)",
                    "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                  },
                }}
              >
                פתח אירוע
              </Button>

              {!isInitialLoad && isShowingCurrentEvent && event && (
                <EventActionButtons
                  isCompleted={isEventClosed}
                  canClose={isEventFullEvacuation}
                  onCloseEvent={() => setCloseConfirmOpen(true)}
                />
              )}
            </Group>
          </Box>

          {isInitialLoad && (
            <Stack align="center" gap="sm" py="xl">
              <Loader color="var(--app-color-primary)" />
              <Text fz="sm" c="var(--app-color-text-muted)">
                טוען נתוני אירוע...
              </Text>
            </Stack>
          )}

          {!isInitialLoad && !isShowingCurrentEvent && currentEventStatus === "failed" && (
            <Text fz="sm" c="var(--app-color-error)" ta="center" py="xl">
              {currentEventError || "שגיאה בטעינת האירוע"}
            </Text>
          )}

          {!isInitialLoad && isShowingCurrentEvent && (
            <>
              <Grid
                gutter="sm"
                columns={10}
                style={{ flex: 1, minHeight: 0 }}
                styles={{ root: { height: "100%" }, inner: { height: "100%" } }}
              >
                <Grid.Col span={{ base: 10, md: 2 }} style={{ height: "100%" }}>
                  <EventMapCard event={event} locations={locations} forces={forces} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: "100%" }}>
                  <CasualtiesTableCard casualties={activeCasualties} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: "100%" }}>
                  {/* Evacuations gets the larger share (it's still the
                      working table — inline editing, request buttons);
                      the evacuated-casualties card underneath is a
                      compact reference, not a working table, so it
                      doesn't need equal room. */}
                  <Stack gap="sm" style={{ height: "100%" }}>
                    <Box style={{ flex: 3, minHeight: 0 }}>
                      <EvacuationsTable
                        evacuations={evacuations}
                        locations={locations}
                        aerialMissions={aerialMissions}
                        isCompleted={isEventClosed}
                        aerialEvacStatus={aerialEvacStatus}
                        onUpdateEvacuation={handleUpdateEvacuation}
                        onDeleteEvacuation={handleDeleteEvacuation}
                        onRequestAerialEvac={handleRequestAerialEvac}
                      />
                    </Box>
                    <Box style={{ flex: 2, minHeight: 0 }}>
                      <EvacuatedCasualtiesCard casualties={evacuatedCasualties} />
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </>
          )}
        </Stack>
      </Stack>

      <Modal
        opened={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        centered
        radius="sm"
        title={
          <Group gap="xs" wrap="nowrap">
            <IconAlertTriangle size={22} stroke={1.8} color="var(--app-color-warning)" />
            <Text fw={700} fz="lg" c="var(--app-color-text)">
              סגירת אירוע
            </Text>
          </Group>
        }
        styles={{
          content: {
            border: "1px solid color-mix(in srgb, var(--app-color-warning) 40%, transparent)",
            backgroundColor: "var(--app-color-surface)",
          },
          header: { backgroundColor: "var(--app-color-surface)" },
        }}
      >
        <Text fz="sm" c="var(--app-color-text-muted)" mb="lg">
          האם אתה בטוח שברצונך לסגור את האירוע? הפעולה סופית ולא ניתנת לביטול.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setCloseConfirmOpen(false)}>
            ביטול
          </Button>
          <Button
            styles={{ root: { backgroundColor: "var(--app-color-warning)", color: "#FFFFFF" } }}
            onClick={confirmCloseEvent}
          >
            סגור אירוע
          </Button>
        </Group>
      </Modal>

      <CreateEventModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setIsCreateOpen(false)}
      />
    </Layout>
  );
};

export default EventDashboardPage;
