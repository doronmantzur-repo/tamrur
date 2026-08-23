// React
import { useEffect, useState } from "react";

// External libraries
import { Box, Stack, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventDashboardView from "../../components/brigade/EventDashboardView";
import { fetchEvents } from "../../features/events/eventsSlice";

// Styles

/**
 * Renders the command-level (division) dashboard: the brigade's single-event
 * view, read-only.
 *
 * The layout, metrics and live feeds are not reimplemented here — this page
 * renders the same EventDashboardView the brigade page does, with `readOnly`,
 * so the two cannot drift apart. That flag is enforced inside the view and
 * inside EvacuationsTable by not building the mutation handlers and not
 * rendering the controls that would call them, rather than by disabling them in
 * the UI.
 *
 * The brigade reaches a single event through the route (/brigade/:eventId),
 * whereas command watches the whole picture and has no event in its URL. So the
 * first event is selected on arrival and changed from the switcher beside the
 * event name — the page adds no chrome of its own for that.
 *
 * @returns {JSX.Element} The read-only command dashboard page.
 */
const DashboardPage = () => {
  const dispatch = useDispatch();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const events = useSelector((state) => state.events.events);
  const eventsStatus = useSelector((state) => state.events.status);

  // EventSwitcher fetches this list too, but it only mounts once an event is
  // showing — which cannot happen until something picks the first one.
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Land on an event rather than an empty page: with the selector gone there is
  // nothing else to choose one, and a command view opening on "pick something"
  // shows less than it could.
  //
  // Derived rather than pushed into state by an effect — an effect would set
  // state during render-commit and cascade an extra render, and it would also
  // have to guard against overwriting a choice already made. Falling back only
  // while the selection is empty does both for free.
  const activeEventId = selectedEventId ?? events[0]?.id ?? null;

  const hasNoEvents = eventsStatus === "succeeded" && events.length === 0;

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
        {activeEventId ? (
          <EventDashboardView eventId={activeEventId} readOnly onSelectEvent={setSelectedEventId} />
        ) : (
          <Stack align="center" justify="center" gap="xs" style={{ flex: 1, minHeight: 0 }}>
            <Text fz="sm" c="var(--app-color-text-muted)">
              {hasNoEvents ? "לא נמצאו אירועים" : "טוען אירועים..."}
            </Text>
          </Stack>
        )}
      </Stack>
    </Layout>
  );
};

export default DashboardPage;
