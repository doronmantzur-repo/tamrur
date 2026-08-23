// React
import { useState } from "react";

// External libraries
import { Box, Group, Stack, Text } from "@mantine/core";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventDashboardView from "../../components/brigade/EventDashboardView";

// Styles

/**
 * Renders the command-level (division) dashboard: the brigade's single-event
 * view, read-only.
 *
 * The layout, metrics and live feeds are not reimplemented here — this page
 * renders the same EventDashboardView the brigade page does, with
 * `readOnly`, so the two cannot drift apart. That flag is enforced inside the
 * view and inside EvacuationsTable by not building the mutation handlers and
 * not rendering the controls that would call them, rather than by disabling
 * them in the UI.
 *
 * The one structural difference is deliberate: the brigade reaches a single
 * event through the route (/brigade/:eventId), whereas command watches the
 * whole picture, so this page picks the event from a selector and holds the
 * choice in local state.
 *
 * @returns {JSX.Element} The read-only command dashboard page.
 */
const DashboardPage = () => {
  const [selectedEventId, setSelectedEventId] = useState(null);

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
          backgroundImage: "radial-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px)",
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
        h="100vh"
        px="var(--app-page-padding)"
        py="md"
        pos="relative"
        style={{
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* The selector is the only chrome this page adds. Kept compact and on
            one row so the dashboard below still gets nearly the whole viewport,
            matching the brigade page's height budget. */}
        <Group gap="sm" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Text
            fz="0.875rem"
            fw={500}
            c="var(--app-color-text-muted)"
            style={{ whiteSpace: "nowrap" }}
          >
            אירוע
          </Text>
          <Box w={320} style={{ flexShrink: 0 }}>
            <EventSelector value={selectedEventId} onChange={setSelectedEventId} compact />
          </Box>
        </Group>

        {selectedEventId ? (
          <EventDashboardView eventId={selectedEventId} readOnly />
        ) : (
          <Stack align="center" justify="center" gap="xs" style={{ flex: 1, minHeight: 0 }}>
            <Text fz="sm" c="var(--app-color-text-muted)">
              בחר אירוע כדי להציג את תמונת המצב
            </Text>
          </Stack>
        )}
      </Stack>
    </Layout>
  );
};

export default DashboardPage;
