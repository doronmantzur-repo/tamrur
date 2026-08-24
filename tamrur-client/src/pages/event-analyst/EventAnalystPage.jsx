// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Stack, Title } from "@mantine/core";
import { IconLayoutKanban } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventReportCard from "../../components/analyst/EventReportCard";
import ReportsFolderCard from "../../components/analyst/ReportsFolderCard";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import AccountControlsStack from "../../components/common/AccountControlsStack";
import { CLOSED_STATUS } from "../../constants/eventStatus";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const REPORTABLE_STATUSES = [CLOSED_STATUS];

/**
 * Renders the event-analyst page. Reports can only be generated for
 * closed events, so the dropdown here is restricted to those.
 *
 * @returns {JSX.Element} The event-analyst page.
 */
const EventAnalystPage = () => {
  const navigate = useNavigate();
  const [isBoardButtonHovered, boardButtonHoverHandlers] = useHoverState();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [folderHandle, setFolderHandle] = useState(null);
  const [reportsRefreshSignal, setReportsRefreshSignal] = useState(0);

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
          <ActionIcon
            aria-label="חזרה ללוח מעקב אירועים"
            title="חזרה ללוח מעקב אירועים"
            variant="default"
            size={40}
            radius="xl"
            onClick={() => navigate("/brigade")}
            {...boardButtonHoverHandlers}
            style={{
              backgroundColor: isBoardButtonHovered ? "var(--app-color-primary)" : "var(--app-color-surface)",
              borderColor: isBoardButtonHovered ? "var(--app-color-primary)" : "var(--app-color-border)",
              color: isBoardButtonHovered ? "var(--app-color-primary-text)" : "var(--app-color-text)",
              transform: isBoardButtonHovered ? "translateY(-1px)" : undefined,
              transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
            }}
          >
            <IconLayoutKanban aria-hidden="true" size={20} stroke={1.8} />
          </ActionIcon>

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
