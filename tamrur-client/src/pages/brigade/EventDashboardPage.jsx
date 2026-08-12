// React
import { useMemo, useRef, useState } from "react";

// External libraries
import { ActionIcon, Box, Button, Grid, Group, Stack, Title, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconPlus, IconSun } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventHeaderCard from "../../components/brigade/EventHeaderCard";
import EventMapCard from "../../components/brigade/EventMapCard";
import InjuriesTableCard from "../../components/brigade/InjuriesTableCard";
import EvacuationsModal from "../../components/brigade/EvacuationsModal";
import { COMPLETED_STATUS } from "../../constants/eventStatus";
import {
  mockEvacuations,
  mockEvent,
  mockInjuries,
  mockLandingPads,
} from "./mockEventDashboardData";

// Styles

const STATUS_ORDER = [
  "evaluated",
  "controlled",
  "ready_for_evacuation",
  "evacuation_started",
  "completed",
];

/**
 * Renders the brigade single-event dashboard: the event header (name, timer,
 * injury/evacuation summary, status controls), then a row split evenly
 * between the event map and the full injuries table (whose evacuation
 * timeline opens inline, as a row under the relevant injury). The full
 * evacuations table lives in a modal opened from the header's "פינויים"
 * stat. Currently backed by hardcoded mock data, no Redux/API wiring yet.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const mapRowRef = useRef(null);

  const [event, setEvent] = useState(mockEvent);
  const [evacuations, setEvacuations] = useState(mockEvacuations);
  const [injuries] = useState(mockInjuries);

  const [evacuationsModalOpen, setEvacuationsModalOpen] = useState(false);

  // Only one injury's evacuation timeline can be open at a time; opening
  // another closes the previous one automatically since this is a single value.
  const [openInjuryId, setOpenInjuryId] = useState(null);

  const isDark = colorScheme === "dark";

  const evacuationByInjuryId = useMemo(() => {
    const map = {};
    evacuations.forEach((evac) => {
      evac.injuryIds.forEach((injuryId) => {
        map[injuryId] = evac;
      });
    });
    return map;
  }, [evacuations]);

  const handleAdvanceStatus = () => {
    setEvent((prev) => {
      const currentIndex = STATUS_ORDER.indexOf(prev.status);
      const nextStatus = STATUS_ORDER[currentIndex + 1];
      return nextStatus ? { ...prev, status: nextStatus } : prev;
    });
  };

  const handleCloseEvent = () => {
    setEvent((prev) => ({
      ...prev,
      status: COMPLETED_STATUS,
      closure_at: new Date().toISOString(),
    }));
  };

  const handleCreateEvacuation = (newEvac) => {
    setEvacuations((prev) => [...prev, newEvac]);
  };

  const handleToggleInjuryEye = (injuryId) => {
    setOpenInjuryId((prev) => (prev === injuryId ? null : injuryId));
  };

  const handleJumpToInjuries = () => {
    mapRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

          <EventHeaderCard
            event={event}
            injuries={injuries}
            evacuations={evacuations}
            landingPads={mockLandingPads}
            onAdvanceStatus={handleAdvanceStatus}
            onCloseEvent={handleCloseEvent}
            onCreateEvacuation={handleCreateEvacuation}
            onOpenInjuries={handleJumpToInjuries}
            onOpenEvacuations={() => setEvacuationsModalOpen(true)}
          />

          <Grid gutter="sm" ref={mapRowRef}>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <EventMapCard event={event} landingPads={mockLandingPads} evacuations={evacuations} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <InjuriesTableCard
                injuries={injuries}
                evacuations={evacuations}
                evacuationByInjuryId={evacuationByInjuryId}
                openInjuryId={openInjuryId}
                onToggleInjuryEye={handleToggleInjuryEye}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        <EvacuationsModal
          opened={evacuationsModalOpen}
          onClose={() => setEvacuationsModalOpen(false)}
          evacuations={evacuations}
        />
      </Stack>
    </Layout>
  );
};

export default EventDashboardPage;
