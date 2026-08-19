// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Stack, Title, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventReportCard from "../../components/analyst/EventReportCard";
import ReportsFolderCard from "../../components/analyst/ReportsFolderCard";
import { CLOSED_STATUS } from "../../constants/eventStatus";

// Styles

const REPORTABLE_STATUSES = [CLOSED_STATUS];

/**
 * Renders the event-analyst page. Reports can only be generated for
 * closed events, so the dropdown here is restricted to those.
 *
 * @returns {JSX.Element} The event-analyst page.
 */
const EventAnalystPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [folderHandle, setFolderHandle] = useState(null);
  const [reportsRefreshSignal, setReportsRefreshSignal] = useState(0);

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
              ניתוח אירוע
            </Title>

            <EventSelector
              value={selectedEventId}
              onChange={setSelectedEventId}
              filterStatuses={REPORTABLE_STATUSES}
            />

            <ReportsFolderCard
              folderHandle={folderHandle}
              onFolderChange={setFolderHandle}
              refreshSignal={reportsRefreshSignal}
            />

            <EventReportCard
              key={selectedEventId}
              eventId={selectedEventId}
              folderHandle={folderHandle}
              onReportSaved={() => setReportsRefreshSignal((n) => n + 1)}
            />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default EventAnalystPage;
