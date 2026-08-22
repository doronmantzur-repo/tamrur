// React
import { useEffect } from "react";

// External libraries
import { Box, SimpleGrid, Stack } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthFooter from "../../components/auth/AuthFooter";
import AerialEvacCard from "../../components/airforce/AerialEvacCard";
import CasualtiesCard from "../../components/dashboard/CasualtiesCard";
import ThemeToggle from "../../components/common/ThemeToggle";
import { fetchEvents } from "../../features/events/eventsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { fetchAerialMissionsByEvent } from "../../features/aerialMission/aerialMissionSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/**
 * Renders the aerial evacuation request page.
 *
 * @returns {JSX.Element} The aerial evacuation request page.
 */
const AerialEvacuationPage = () => {
  const dispatch = useDispatch();
  const events = useSelector((state) => state.events.events);
  const casualtiesByEventId = useSelector((state) => state.casualties.byEventId);
  const missionsByEventId = useSelector((state) => state.aerialMission.byEventId);

  // A card renders only for open events with a live aerial-evac request.
  const aerialEvacEvents = events.filter(
    (event) => event.status !== "completed" && event["aerial-evac"] === "needed",
  );

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    const eventIds = aerialEvacEvents.map((event) => event.id);
    if (eventIds.length === 0) return undefined;

    const fetchAll = () => {
      eventIds.forEach((eventId) => {
        dispatch(fetchCasualtiesByEvent(eventId));
        dispatch(fetchAerialMissionsByEvent(eventId));
      });
    };

    fetchAll();

    // Other operators can log casualties or act on mission requests at any
    // time, so keep polling instead of fetching once.
    const intervalId = setInterval(fetchAll, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // Only re-run when the set of relevant events actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, aerialEvacEvents.map((event) => event.id).join(",")]);

  return (
    <Layout>
      <Box pos="absolute" top="md" right="md" style={{ zIndex: 20 }}>
        <ThemeToggle />
      </Box>

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
        align="center"
        justify="center"
        mih="100vh"
        px="var(--app-page-padding-mobile)"
        py="xl"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Box w="100%" maw={1240}>
          <Stack align="stretch" gap="xl">
            <AuthHeader />

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
              {aerialEvacEvents.map((event) => (
                <Stack key={event.id} align="stretch" gap="md">
                  <AerialEvacCard
                    event={event}
                    mission={missionsByEventId[event.id]?.[0]}
                  />
                  {/* Airforce only needs to see who's actually waiting on them,
                      broken down by evacuation posture rather than triage
                      urgency — that's what determines how each casualty
                      loads onto the helicopter. */}
                  <CasualtiesCard
                    casualties={(casualtiesByEventId[event.id] || []).filter((casualty) => casualty.helivac)}
                    statBreakdown="ability"
                  />
                </Stack>
              ))}
            </SimpleGrid>

            <AuthFooter />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default AerialEvacuationPage;
