// React
import { useEffect, useState } from "react";

// External libraries
import { Box, Loader, Stack, Text, Title } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventDetailsCard from "../../components/dashboard/EventDetailsCard";
import CasualtiesCard from "../../components/dashboard/CasualtiesCard";
import ThemeToggle from "../../components/common/ThemeToggle";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/**
 * Renders the Tamrur event dashboard page.
 *
 * @returns {JSX.Element} The Tamrur dashboard page.
 */
const DashboardPage = () => {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const dispatch = useDispatch();
  const selectedEvent = useSelector((state) =>
    state.events.events.find((event) => event.id === selectedEventId),
  );
  const casualties = useSelector((state) => state.casualties.byEventId[selectedEventId] || []);

  useEffect(() => {
    if (!selectedEventId) return undefined;

    // Only show the loading indicator for the initial fetch of a newly
    // selected event — background polling refreshes should stay silent.
    setIsLoadingEvent(true);
    dispatch(fetchCasualtiesByEvent(selectedEventId)).finally(() => setIsLoadingEvent(false));

    // Other operators can log casualties for this event at any time, so keep
    // polling instead of fetching once.
    const intervalId = setInterval(() => {
      dispatch(fetchCasualtiesByEvent(selectedEventId));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedEventId, dispatch]);

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
        align="stretch"
        mih="100vh"
        px="var(--app-page-padding-mobile)"
        py="xl"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Box w="100%" maw={1240} style={{ marginInline: "auto" }}>
          <Stack align="stretch" gap="xl">
            <Title order={1} c="var(--app-color-primary)" fz="1.75rem" fw={700}>
              לוח בקרה
            </Title>

            <EventSelector value={selectedEventId} onChange={setSelectedEventId} />

            {selectedEvent && isLoadingEvent && (
              <Stack align="center" gap="sm" py="xl">
                <Loader color="var(--app-color-primary)" />
                <Text fz="sm" c="var(--app-color-text-muted)">
                  טוען נתוני אירוע...
                </Text>
              </Stack>
            )}

            {selectedEvent && !isLoadingEvent && (
              <>
                <EventDetailsCard event={selectedEvent} />
                <CasualtiesCard casualties={casualties} />
              </>
            )}
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default DashboardPage;
