// React

// External libraries
import { Box, Stack } from "@mantine/core";
import { useParams } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventDashboardView from "../../components/brigade/EventDashboardView";

// Styles

/**
 * Renders the brigade single-event dashboard for the event in the route.
 *
 * The dashboard itself lives in EventDashboardView, which the division's
 * read-only page renders too — this page is the writable caller, so it takes
 * the default `readOnly={false}` and keeps every action control.
 *
 * @returns {JSX.Element} The brigade event dashboard page.
 */
const EventDashboardPage = () => {
  const { eventId } = useParams();

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
        <EventDashboardView eventId={eventId} />
      </Stack>
    </Layout>
  );
};

export default EventDashboardPage;
