// React
import { useEffect, useRef, useState } from "react";

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
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventDescriptionBlock from "../../components/brigade/EventDescriptionBlock";
import EventBadgesRow from "../../components/brigade/EventBadgesRow";
import EvacuationProgressCard from "../../components/brigade/EvacuationProgressCard";
import EventTimerChip from "../../components/brigade/EventTimerChip";
import EventActionButtons from "../../components/brigade/EventActionButtons";
import EventMapCard from "../../components/brigade/EventMapCard";
import CasualtiesTableCard from "../../components/brigade/CasualtiesTableCard";
import EvacuationsTable from "../../components/brigade/EvacuationsTable";
import { COMPLETED_STATUS } from "../../constants/eventStatus";
import { fetchLocations } from "../../features/locations/locationsSlice";
import { fetchEventById, updateEvent } from "../../features/events/eventsSlice";
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
 * Renders the brigade single-event dashboard: a top bar (the shield icon
 * and event name sharing one row on the right, description and status
 * badges stacked beneath that row; the elapsed-time chip centered; the
 * theme toggle/open-event/close-event actions on the left), then an
 * evacuation-progress card — a segmented bar by evacuated/urgency, a "טרם
 * פונו" bracket, the evacuated percentage, and a row of compact stat tiles
 * (total/urgent/evacuated/non-urgent/deceased) that double as the bar's
 * legend. That single card replaces both the old badges-only header card
 * and the page's separate 4-tile stat row — the active-teams count that
 * used to be a tile here now lives as a badge in EvacuationsTable's own
 * header instead. Below that, one row split 1/5-2/5-2/5 between the event
 * map, the casualties table, and the evacuation team table. The whole page
 * is pinned to the viewport height with no page-level scroll; the bottom
 * row fills whatever space is left and each of its three cards scrolls its
 * own content internally instead. The event (by :eventId), locations,
 * aerial missions, evacuations, and casualties are all fetched from the
 * API. An approved aerial mission with no evacuation row yet auto-creates
 * one in the background.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { eventId } = useParams();

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Recorded locally at the moment the brigade actually closes the event,
  // rather than trusting event.closure_at to round-trip back from the API
  // (there's no backend in this repo to confirm it does) — this is what the
  // header's timer freezes against, so it doesn't depend on that round-trip.
  const [localClosureAt, setLocalClosureAt] = useState(null);

  // Tracks mission ids we've already dispatched an auto-create for, so a
  // slow create request doesn't get triggered again by the next poll tick
  // before the new row has landed back in state.
  const autoCreatedMissionIds = useRef(new Set());

  const event = useSelector((state) => state.events.currentEvent);
  const currentEventStatus = useSelector((state) => state.events.currentEventStatus);
  const currentEventError = useSelector((state) => state.events.currentEventError);
  const locations = useSelector((state) => state.locations.locations);
  const aerialMissions = useSelector((state) => state.aerialMission.byEventId[eventId]) || EMPTY_ARRAY;
  const evacuations = useSelector((state) => state.evacuations.byEventId[eventId]) || EMPTY_ARRAY;
  const casualties = useSelector((state) => state.casualties.byEventId[eventId]) || EMPTY_ARRAY;

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

    // The brigade edits rows inline, and an approval can auto-create one in
    // the background, so keep polling instead of fetching once.
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

  // Auto-creates an evacuation row for any approved aerial mission that
  // doesn't have one yet, prefilled with whatever the airforce/event already
  // gave us — the brigade fills in the rest. Guarded against both a mission
  // that already has a row (checked against the fetched evacuations) and a
  // create that's in flight but hasn't landed back in state yet (checked
  // against the ref).
  useEffect(() => {
    aerialMissions
      .filter((mission) => mission["request-status"] === "approved")
      .forEach((mission) => {
        const alreadyExists = evacuations.some((evac) => evac.aerialMissionId === mission.id);
        if (alreadyExists || autoCreatedMissionIds.current.has(mission.id)) return;

        autoCreatedMissionIds.current.add(mission.id);
        const landingPad = locations.find((location) => location.id === mission.landing_pad_id);

        dispatch(
          createEvacuation({
            eventId,
            method: "aerial",
            aerialMissionId: mission.id,
            forceRadioSign: mission.radio_sign,
            departurePoint: landingPad?.location,
          }),
        );
      });
  }, [aerialMissions, evacuations, locations, eventId, dispatch]);

  const isDark = colorScheme === "dark";

  // The actual close dispatch, only ever called once the confirmation modal is accepted.
  const confirmCloseEvent = () => {
    const closureAt = new Date().toISOString();
    dispatch(updateEvent({ id: eventId, changes: { status: COMPLETED_STATUS, closure_at: closureAt } }));
    setLocalClosureAt(closureAt);
    setCloseConfirmOpen(false);
  };

  // Setting status to "completed" via the dropdown leads to the same
  // confirmation as the close-event button, since both result in the event
  // closing. The dropdown itself never offers "completed" as a target once
  // the event is already closed — closing is final, not reversible from
  // here — so there's no reopening branch to handle.
  const handleStatusChange = (nextStatus) => {
    if (nextStatus === COMPLETED_STATUS) {
      setCloseConfirmOpen(true);
      return;
    }

    dispatch(updateEvent({ id: eventId, changes: { status: nextStatus } }));
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

  const isEventCompleted = event?.status === COMPLETED_STATUS;

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
                  <EventBadgesRow event={event} aerialEvacStatus={aerialEvacStatus} onStatusChange={handleStatusChange} />
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
                    {casualties.length} נפגעים
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
                onClick={() => navigate("/create-event")}
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
                <EventActionButtons isCompleted={isEventCompleted} onCloseEvent={() => setCloseConfirmOpen(true)} />
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
              <EvacuationProgressCard casualties={casualties} />

              <Grid
                gutter="sm"
                columns={10}
                style={{ flex: 1, minHeight: 0 }}
                styles={{ root: { height: "100%" }, inner: { height: "100%" } }}
              >
                <Grid.Col span={{ base: 10, md: 2 }} style={{ height: "100%" }}>
                  <EventMapCard event={event} locations={locations} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: "100%" }}>
                  <CasualtiesTableCard casualties={casualties} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: "100%" }}>
                  <EvacuationsTable
                    evacuations={evacuations}
                    locations={locations}
                    aerialMissions={aerialMissions}
                    isCompleted={isEventCompleted}
                    aerialEvacStatus={aerialEvacStatus}
                    onUpdateEvacuation={handleUpdateEvacuation}
                    onDeleteEvacuation={handleDeleteEvacuation}
                    onRequestAerialEvac={handleRequestAerialEvac}
                  />
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
          האם אתה בטוח שברצונך לסגור את האירוע? האירוע יסומן כהושלם. ניתן יהיה לפתוח אותו מחדש מאוחר יותר במידת הצורך.
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
    </Layout>
  );
};

export default EventDashboardPage;
