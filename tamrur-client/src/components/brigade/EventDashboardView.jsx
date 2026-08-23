// React
import { useEffect, useState } from "react";

// External libraries
import { Badge, Box, Button, Grid, Group, Loader, Modal, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconEye, IconPlus, IconShieldHalfFilled } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import ThemeToggleButton from "../common/ThemeToggleButton";
import EventDescriptionBlock from "./EventDescriptionBlock";
import EventBadgesRow from "./EventBadgesRow";
import EventTimerChip from "./EventTimerChip";
import EventActionButtons from "./EventActionButtons";
import EventMapCard from "./EventMapCard";
import CasualtiesTableCard from "./CasualtiesTableCard";
import EvacuatedCasualtiesCard from "./EvacuatedCasualtiesCard";
import EvacuationsTable from "./EvacuationsTable";
import CreateEventModal from "../events/CreateEventModal";
import EventSwitcher from "../dashboard/EventSwitcher";
import { CLOSED_STATUS, FULL_EVACUATION_STATUS } from "../../constants/eventStatus";
import { fetchLocations } from "../../features/locations/locationsSlice";
import { fetchForces } from "../../features/forces/forcesSlice";
import { fetchEventById, updateEvent, closeEvent } from "../../features/events/eventsSlice";
import { fetchAerialMissionsByEvent } from "../../features/aerialMission/aerialMissionSlice";
import {
  fetchEvacuationsByEvent,
  createEvacuation,
  updateEvacuation,
  deleteEvacuation,
} from "../../features/evacuations/evacuationsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/** Stable reference for "nothing fetched yet" so selector fallbacks don't create a new array every render. */
const EMPTY_ARRAY = [];

/**
 * The single-event dashboard, shared by the brigade page and the read-only
 * command view.
 *
 * Layout: a top bar (the shield icon and event name sharing one row on the
 * right, description and status badges stacked beneath that row; the
 * elapsed-time chip centered; the theme toggle and event actions on the left),
 * then one row split 1/5-2/5-2/5 between the event map, the casualties table
 * (not-yet-evacuated casualties only), and the evacuation team column — which
 * itself stacks EvacuationsTable above EvacuatedCasualtiesCard (a compact
 * reference of who's already evacuated and when, mirroring the medic page's own
 * active/evacuated split — casualties are split into the two halves once here
 * and handed to each card separately). The active-teams count lives as a badge
 * in EvacuationsTable's own header. The whole block fills its parent with no
 * page-level scroll; the bottom row takes whatever space is left and each card
 * scrolls its own content internally instead.
 *
 * The event, locations, forces, aerial missions, evacuations and casualties are
 * all fetched here and polled. An approved aerial mission's evacuation row is
 * created server-side (not here) once the airforce approves it.
 *
 * `readOnly` is what separates the two callers, and it is not a styling flag: in
 * read-only mode this component never constructs a mutation handler, never
 * renders a control that would call one, and never mounts the create/close
 * modals — so there is no reachable write path rather than a disabled one.
 * Reads and polling are unaffected, and purely local view state (collapsing the
 * map, sorting a table) still works, because neither touches the server.
 *
 * `onSelectEvent` adds the compact event switcher beside the event name. Both
 * pages pass one — the brigade navigates to the other event's route, the
 * command view swaps its local selection — so the control looks and behaves the
 * same on both without either page rebuilding it. Omitting it simply leaves the
 * switcher out.
 *
 * @param {{
 *   eventId: string,
 *   readOnly?: boolean,
 *   onSelectEvent?: (eventId: string) => void,
 * }} props
 * @returns {JSX.Element} The event dashboard.
 */
const EventDashboardView = ({ eventId, readOnly = false, onSelectEvent }) => {
  const dispatch = useDispatch();

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Recorded locally at the moment the brigade actually closes the event,
  // rather than trusting event.closure_at to round-trip back from the API —
  // this is what the header's timer freezes against, so it doesn't depend on
  // that round-trip.
  const [localClosureAt, setLocalClosureAt] = useState(null);

  const event = useSelector((state) => state.events.currentEvent);
  const currentEventStatus = useSelector((state) => state.events.currentEventStatus);
  const currentEventError = useSelector((state) => state.events.currentEventError);
  const locations = useSelector((state) => state.locations.locations);
  const forces = useSelector((state) => state.forces.forces);
  const aerialMissions =
    useSelector((state) => state.aerialMission.byEventId[eventId]) || EMPTY_ARRAY;
  const evacuations = useSelector((state) => state.evacuations.byEventId[eventId]) || EMPTY_ARRAY;
  const casualties = useSelector((state) => state.casualties.byEventId[eventId]) || EMPTY_ARRAY;
  const evacuatedCount = casualties.filter((casualty) => casualty.is_evacuated).length;

  // The airforce only ever writes the decision to the aerial_mission row, never
  // back onto the event — so once a mission exists for this event, its
  // request-status is the true answer; before that, the event's own aerial-evac
  // field (set by the brigade's request button) is all there is.
  const latestMission = aerialMissions[0];
  const aerialEvacStatus = latestMission ? latestMission["request-status"] : event?.["aerial-evac"];

  // Derived, not stored: true on first load and when the selected eventId has
  // changed but the fetch for it hasn't resolved yet — false during a background
  // polling refresh of the event already on screen, so that doesn't flash the
  // loader every poll interval.
  const isShowingCurrentEvent = event?.id === eventId;
  const isInitialLoad = currentEventStatus === "loading" && !isShowingCurrentEvent;

  useEffect(() => {
    dispatch(fetchLocations());
    dispatch(fetchForces());
  }, [dispatch]);

  useEffect(() => {
    if (!eventId) return undefined;

    dispatch(fetchEventById(eventId));

    // Other stakeholders (airforce approving a request, etc.) can change this
    // event at any time, so keep polling instead of fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchEventById(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  useEffect(() => {
    if (!eventId) return undefined;

    dispatch(fetchAerialMissionsByEvent(eventId));

    // Waiting on the airforce's decision, which can land at any time.
    const intervalId = setInterval(() => {
      dispatch(fetchAerialMissionsByEvent(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  useEffect(() => {
    if (!eventId) return undefined;

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
    if (!eventId) return undefined;

    dispatch(fetchCasualtiesByEvent(eventId));

    // Medics add/update casualties from their own page throughout the event, so
    // keep polling instead of fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchCasualtiesByEvent(eventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [eventId, dispatch]);

  // The evacuation row for an approved aerial mission is created server-side now
  // (tamrur-server's aerialMissionController, on approval), atomically and
  // idempotently via a partial unique index on evacuations.aerial_mission_id —
  // not here. Client-side polling can't coordinate across multiple brigade
  // tabs/sessions watching the same event, so a check-then-create done here was
  // a race: two tabs could each see "no row yet" and both create one.

  // Every mutation handler below exists only for the writable view. In read-only
  // mode they are never passed on, and nothing is rendered that could call them.
  const confirmCloseEvent = () => {
    dispatch(closeEvent(eventId));
    setLocalClosureAt(new Date().toISOString());
    setCloseConfirmOpen(false);
  };

  // Returns the dispatch's promise so EvacuationsTable can await it and release
  // its own optimistic "requesting" disable once the request settles, rather
  // than firing and forgetting.
  const handleRequestAerialEvac = () =>
    dispatch(updateEvent({ id: eventId, changes: { aerialEvac: "needed" } })).unwrap();

  // Returns the dispatch's promise so EvacuationsTable's inline row editor can
  // await it — a failed save needs to keep the row open with the user's input
  // intact instead of silently discarding it.
  const handleUpdateEvacuation = (evacId, changes) =>
    dispatch(updateEvacuation({ id: evacId, changes })).unwrap();

  const handleDeleteEvacuation = (evacId) => {
    dispatch(deleteEvacuation({ id: evacId, eventId }));
  };

  // Departure defaults to the event's own location — a ride pickup is presumably
  // always from the event scene, mirroring how aerial evacuations default
  // departure to the responding force's location. Unlike aerial requests,
  // there's no separate approval step: this directly creates the evacuations row.
  const handleCreateRideEvacuation = (fields) =>
    dispatch(
      createEvacuation({ eventId, method: "ride", departurePoint: event?.location, ...fields }),
    ).unwrap();

  const isEventClosed = event?.status === CLOSED_STATUS;
  const isEventFullEvacuation = event?.status === FULL_EVACUATION_STATUS;

  // Split once here, same as the medic page's own active/evacuated split —
  // CasualtiesTableCard gets the active half, EvacuatedCasualtiesCard the other,
  // so neither needs to know how the other one filters.
  const activeCasualties = casualties.filter((casualty) => !casualty.is_evacuated);
  const evacuatedCasualties = casualties.filter((casualty) => casualty.is_evacuated);

  return (
    <Stack align="stretch" gap="sm" style={{ flex: 1, minHeight: 0 }}>
      {/* A 3-column grid (not `justify="space-between"`) so the timer chip in
          the middle column sits truly centered on the page, regardless of the
          title and action groups on either side having different widths. */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          // The left column stacks the icon, name, description and badges, so
          // it's much taller than the timer chip or the button row —
          // top-aligning (not centering) keeps those two flush with the
          // icon/name instead of centered against the whole tall block.
          alignItems: "start",
          gap: "var(--mantine-spacing-sm)",
        }}
      >
        <Stack gap={2} style={{ justifySelf: "start" }}>
          {!isInitialLoad && isShowingCurrentEvent && event ? (
            <>
              {/* Icon and event name share one row (instead of the icon sitting
                  alone above a separate name row) so the description and badges
                  below both move up a row. */}
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
                {/* Directly beside the name it switches, so the current event
                    is stated once and the way to change it is right there. */}
                {onSelectEvent && <EventSwitcher value={eventId} onChange={onSelectEvent} />}
              </Group>

              <EventDescriptionBlock />
              <EventBadgesRow event={event} aerialEvacStatus={aerialEvacStatus} />
            </>
          ) : (
            <IconShieldHalfFilled
              aria-hidden="true"
              size={28}
              stroke={1.6}
              color="var(--app-color-primary)"
            />
          )}
        </Stack>

        <Stack gap={2} align="center" style={{ justifySelf: "center" }}>
          {!isInitialLoad && isShowingCurrentEvent && event && (
            <>
              <EventTimerChip event={event} localClosureAt={localClosureAt} />
              <Text
                fw={800}
                fz="1.75rem"
                lh={1.1}
                c="var(--app-color-text)"
                ff='ui-monospace, "SF Mono", "Consolas", monospace'
              >
                {`פונו ${evacuatedCount} מתוך ${casualties.length} נפגעים`}
              </Text>
            </>
          )}
        </Stack>

        <Group gap="xs" wrap="nowrap" style={{ justifySelf: "end" }}>
          <ThemeToggleButton />

          {readOnly ? (
            // States the mode plainly, so an operator who cannot find the action
            // buttons knows they were withheld rather than failing to render.
            <Badge
              variant="outline"
              leftSection={<IconEye size={14} stroke={1.8} />}
              styles={{
                root: {
                  backgroundColor: "var(--app-color-surface-high)",
                  borderColor: "var(--app-color-border)",
                  color: "var(--app-color-text-muted)",
                  height: "2.5rem",
                  paddingInline: "0.75rem",
                },
                label: { overflow: "visible" },
              }}
            >
              צפייה בלבד
            </Badge>
          ) : (
            <>
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
            </>
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
        <Box
          style={{
            display: "flex",
            gap: "var(--mantine-spacing-sm)",
            flex: 1,
            minHeight: 0,
            height: "100%",
          }}
        >
          {/* Folds to a slim strip (see EventMapCard) instead of the map card's
              usual 2/10 share, so the casualties/evacuation grid next to it can
              take that width back. Open by default. */}
          <Box
            style={{
              flex: isMapCollapsed ? "0 0 auto" : "0 0 20%",
              minWidth: 0,
              height: "100%",
              transition: "flex-basis 0.2s ease",
            }}
          >
            <EventMapCard
              event={event}
              locations={locations}
              forces={forces}
              collapsed={isMapCollapsed}
              onToggleCollapsed={() => setIsMapCollapsed((collapsed) => !collapsed)}
            />
          </Box>

          <Grid
            gutter="sm"
            columns={8}
            style={{ flex: 1, minWidth: 0 }}
            styles={{ root: { height: "100%" }, inner: { height: "100%" } }}
          >
            <Grid.Col span={{ base: 8, md: 4 }} style={{ height: "100%" }}>
              <CasualtiesTableCard casualties={activeCasualties} />
            </Grid.Col>
            <Grid.Col span={{ base: 8, md: 4 }} style={{ height: "100%" }}>
              {/* Evacuations gets the larger share (it is still the working
                  table — inline editing, request buttons); the
                  evacuated-casualties card underneath is a compact reference,
                  not a working table, so it does not need equal room. */}
              <Stack gap="sm" style={{ height: "100%" }}>
                <Box style={{ flex: 3, minHeight: 0 }}>
                  <EvacuationsTable
                    evacuations={evacuations}
                    locations={locations}
                    eventLocation={event?.location}
                    aerialMissions={aerialMissions}
                    isCompleted={isEventClosed}
                    aerialEvacStatus={aerialEvacStatus}
                    readOnly={readOnly}
                    onUpdateEvacuation={readOnly ? undefined : handleUpdateEvacuation}
                    onDeleteEvacuation={readOnly ? undefined : handleDeleteEvacuation}
                    onRequestAerialEvac={readOnly ? undefined : handleRequestAerialEvac}
                    onCreateRideEvacuation={readOnly ? undefined : handleCreateRideEvacuation}
                  />
                </Box>
                <Box style={{ flex: 2, minHeight: 0 }}>
                  <EvacuatedCasualtiesCard casualties={evacuatedCasualties} />
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>
      )}

      {/* Neither modal is mounted in read-only mode — not merely hidden, so
          there is nothing for any code path to open. */}
      {!readOnly && (
        <>
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
        </>
      )}
    </Stack>
  );
};

export default EventDashboardView;
