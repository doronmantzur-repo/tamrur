// React
import { useEffect, useRef, useState } from "react";

// External libraries
import { ActionIcon, Box, Button, Grid, Group, Loader, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconPlus, IconSun } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventHeaderCard from "../../components/brigade/EventHeaderCard";
import EventMapCard from "../../components/brigade/EventMapCard";
import InjuriesTableCard from "../../components/brigade/InjuriesTableCard";
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
import { POLL_INTERVAL_MS } from "../../constants/polling";
import { mockInjuries } from "./mockEventDashboardData";

// Styles

const STATUS_ORDER = [
  "evaluated",
  "controlled",
  "ready_for_evacuation",
  "evacuation_started",
  "completed",
];

/** Row height shared by the map, injuries, and evacuations cards so the three stay level. */
const DASHBOARD_ROW_HEIGHT = "32rem";

/** Stable reference for "nothing fetched yet" so selector fallbacks don't create a new array every render. */
const EMPTY_ARRAY = [];

/**
 * Renders the brigade single-event dashboard: the event header (name, timer,
 * injury/evacuation summary, status controls), then one row split 1/5-2/5-2/5
 * between the event map, the injuries table, and the evacuation team table.
 * The event (by :eventId), locations, aerial missions, and evacuations are
 * all fetched from the API; injuries are still hardcoded mock data, owned by
 * a teammate's in-progress work elsewhere. An approved aerial mission with
 * no evacuation row yet auto-creates one in the background.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { eventId } = useParams();

  const [injuries] = useState(mockInjuries);

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

  const handleAdvanceStatus = () => {
    const currentIndex = STATUS_ORDER.indexOf(event.status);
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    if (nextStatus) {
      dispatch(updateEvent({ id: eventId, changes: { status: nextStatus } }));
    }
  };

  const handleCloseEvent = () => {
    dispatch(
      updateEvent({
        id: eventId,
        changes: { status: COMPLETED_STATUS, closure_at: new Date().toISOString() },
      }),
    );
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
        mih="100vh"
        px="var(--app-page-padding)"
        py="md"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Stack align="stretch" gap="sm">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Title order={1} c="var(--app-color-primary)" fz="1.5rem" fw={700}>
              לוח בקרה: חטיבה
            </Title>

            <Group gap="xs" wrap="nowrap">
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
            </Group>
          </Group>

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
              <EventHeaderCard
                event={event}
                injuries={injuries}
                evacuations={evacuations}
                aerialEvacStatus={aerialEvacStatus}
                onAdvanceStatus={handleAdvanceStatus}
                onCloseEvent={handleCloseEvent}
                onRequestAerialEvac={handleRequestAerialEvac}
              />

              <Grid gutter="sm" columns={10}>
                <Grid.Col span={{ base: 10, md: 2 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
                  <EventMapCard event={event} locations={locations} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
                  <InjuriesTableCard injuries={injuries} />
                </Grid.Col>
                <Grid.Col span={{ base: 10, md: 4 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
                  <EvacuationsTable
                    evacuations={evacuations}
                    locations={locations}
                    aerialMissions={aerialMissions}
                    onUpdateEvacuation={handleUpdateEvacuation}
                    onDeleteEvacuation={handleDeleteEvacuation}
                  />
                </Grid.Col>
              </Grid>
            </>
          )}
        </Stack>
      </Stack>
    </Layout>
  );
};

export default EventDashboardPage;
