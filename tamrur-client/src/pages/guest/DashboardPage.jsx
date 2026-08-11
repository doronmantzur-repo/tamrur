// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Stack, Title, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventDetailsCard from "../../components/dashboard/EventDetailsCard";

// Styles

/**
 * Renders the Tamrur event dashboard page.
 *
 * @returns {JSX.Element} The Tamrur dashboard page.
 */
const DashboardPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const selectedEvent = useSelector((state) =>
    state.events.events.find((event) => event.id === selectedEventId),
  );

  const isDark = colorScheme === "dark";

  return (
    <Layout>
      <ActionIcon
        aria-label="החלף מצב תצוגה"
        title="החלף מצב תצוגה"
        variant="default"
        size={40}
        radius="xl"
        onClick={() => toggleColorScheme()}
        pos="absolute"
        top="md"
        right="md"
        style={{
          zIndex: 20,
          backgroundColor: "var(--app-color-surface)",
          borderColor: "var(--app-color-border)",
          color: "var(--app-color-text)",
        }}
      >
        {isDark ? (
          <IconSun aria-hidden="true" size={20} stroke={1.8} />
        ) : (
          <IconMoon aria-hidden="true" size={20} stroke={1.8} />
        )}
      </ActionIcon>

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

            {selectedEvent && <EventDetailsCard event={selectedEvent} />}
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default DashboardPage;
