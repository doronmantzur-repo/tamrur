// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Button, Grid, Group, Stack, Title, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconPlus, IconSun } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventHeaderCard from "../../components/brigade/EventHeaderCard";
import EventMapCard from "../../components/brigade/EventMapCard";
import InjuriesTableCard from "../../components/brigade/InjuriesTableCard";
import EvacuationsTable from "../../components/brigade/EvacuationsTable";
import { COMPLETED_STATUS } from "../../constants/eventStatus";
import { mockEvacuations, mockEvent, mockInjuries, mockLocations } from "./mockEventDashboardData";

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

/**
 * Renders the brigade single-event dashboard: the event header (name, timer,
 * injury/evacuation summary, status controls), then one row split 1/5-2/5-2/5
 * between the event map, the injuries table, and the evacuation team table.
 * Currently backed by hardcoded mock data, no Redux/API wiring yet.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  const [event, setEvent] = useState(mockEvent);
  const [evacuations, setEvacuations] = useState(mockEvacuations);
  const [injuries] = useState(mockInjuries);

  const isDark = colorScheme === "dark";

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

  const handleUpdateEvacuation = (evacId, changes) => {
    setEvacuations((prev) => (
      prev.map((evac) => (evac.id === evacId ? { ...evac, ...changes } : evac))
    ));
  };

  const handleDeleteEvacuation = (evacId) => {
    setEvacuations((prev) => prev.filter((evac) => evac.id !== evacId));
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
            onAdvanceStatus={handleAdvanceStatus}
            onCloseEvent={handleCloseEvent}
          />

          <Grid gutter="sm" columns={10}>
            <Grid.Col span={{ base: 10, md: 2 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
              <EventMapCard event={event} locations={mockLocations} />
            </Grid.Col>
            <Grid.Col span={{ base: 10, md: 4 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
              <InjuriesTableCard injuries={injuries} />
            </Grid.Col>
            <Grid.Col span={{ base: 10, md: 4 }} style={{ height: DASHBOARD_ROW_HEIGHT }}>
              <EvacuationsTable
                evacuations={evacuations}
                locations={mockLocations}
                onUpdateEvacuation={handleUpdateEvacuation}
                onDeleteEvacuation={handleDeleteEvacuation}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Stack>
    </Layout>
  );
};

export default EventDashboardPage;
