// React
import { useEffect, useState } from "react";

// External libraries
import { Box, Group, Stack } from "@mantine/core";
import { IconLayoutKanban, IconList, IconTable } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import AppBrandMark from "../../components/common/AppBrandMark";
import AuthFooter from "../../components/auth/AuthFooter";
import TriageQueueList from "../../components/airforce/TriageQueueList";
import AerialEvacTable from "../../components/airforce/AerialEvacTable";
import AerialEvacKanbanBoard from "../../components/airforce/AerialEvacKanbanBoard";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import AccountControlsStack from "../../components/common/AccountControlsStack";
import { fetchEvents } from "../../features/events/eventsSlice";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { fetchAerialMissionsByEvent } from "../../features/aerialMission/aerialMissionSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/** The three ways to look at the aerial-evac queue. Triage is the default — the "what needs my attention right now" view. */
const VIEW_OPTIONS = [
  { key: "triage", label: "תור", icon: IconList },
  { key: "table", label: "טבלה", icon: IconTable },
  { key: "kanban", label: "לוח", icon: IconLayoutKanban },
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

      {/* `justify="flex-start"` (not `center`) — the brand/table/triage/kanban
          views each render a different content height, and centering here
          would re-center the whole block vertically every time the view
          switches, reading as the page suddenly jumping up or down. Anchoring
          to the top keeps everything landing in the same place regardless of
          which view's content is shorter or taller. */}
      <Stack
        align="center"
        justify="flex-start"
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
            {/* The app's brand mark and the account controls share this row,
                same as the brigade board page — the mark is centered via
                absolute + a relative wrapper since there's no page title on
                this side to `space-between` against. */}
            <Group justify="flex-end" align="center" pos="relative">
              <Box style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                <AppBrandMark />
              </Box>

              <AccountControlsStack>
                <ThemeToggleButton variant="glass" />
              </AccountControlsStack>
            </Group>

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

            {viewMode === "table" && (
              <AerialEvacTable
                events={aerialEvacEvents}
                casualtiesByEventId={casualtiesByEventId}
                missionsByEventId={missionsByEventId}
              />
            )}

            {viewMode === "kanban" && (
              <AerialEvacKanbanBoard
                events={aerialEvacEvents}
                casualtiesByEventId={casualtiesByEventId}
                missionsByEventId={missionsByEventId}
              />
            )}

            <AuthFooter />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default AerialEvacuationPage;
