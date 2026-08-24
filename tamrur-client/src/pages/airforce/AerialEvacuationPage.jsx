// React
import { useEffect, useState } from "react";

// External libraries
import { Box, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconHistory, IconLayoutKanban, IconList, IconTable } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthFooter from "../../components/auth/AuthFooter";
import AerialEvacCard from "../../components/airforce/AerialEvacCard";
import TriageQueueList from "../../components/airforce/TriageQueueList";
import CasualtiesCard from "../../components/dashboard/CasualtiesCard";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import AccountControlsStack from "../../components/common/AccountControlsStack";
import { fetchEvents } from "../../features/events/eventsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { fetchAerialMissionsByEvent } from "../../features/aerialMission/aerialMissionSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/**
 * The ways to look at the aerial-evac queue. "legacy" is temporary scaffolding
 * for the rollout: it keeps today's 2-column card grid reachable while table
 * and kanban are still placeholders, and should be removed once both ship.
 */
const VIEW_OPTIONS = [
  { key: "triage", label: "תור", icon: IconList },
  { key: "table", label: "טבלה", icon: IconTable },
  { key: "kanban", label: "לוח", icon: IconLayoutKanban },
  { key: "legacy", label: "תצוגה קודמת", icon: IconHistory },
];

/**
 * Renders the aerial evacuation request page.
 *
 * @returns {JSX.Element} The aerial evacuation request page.
 */
const AerialEvacuationPage = () => {
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("triage");
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
      <div
        style={{
          position: "absolute",
          top: "var(--mantine-spacing-md)",
          left: "var(--app-page-padding)",
          zIndex: 20,
        }}
      >
        <AccountControlsStack>
          <ThemeToggleButton variant="glass" />
        </AccountControlsStack>
      </div>

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

            <Group justify="flex-end">
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

            {viewMode === "triage" && (
              <TriageQueueList
                events={aerialEvacEvents}
                casualtiesByEventId={casualtiesByEventId}
                missionsByEventId={missionsByEventId}
              />
            )}

            {(viewMode === "table" || viewMode === "kanban") && (
              <Text ta="center" c="var(--app-color-text-muted)" py="xl">
                התצוגה הזו תמומש בהמשך
              </Text>
            )}

            {/* Temporary: today's original view, kept reachable until table
                and kanban are both implemented — remove this branch and the
                "legacy" tab in VIEW_OPTIONS once they are. */}
            {viewMode === "legacy" && (
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
            )}

            <AuthFooter />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default AerialEvacuationPage;
