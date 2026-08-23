// React

// External libraries
import { Box, Stack } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";

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
  const navigate = useNavigate();

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
        <Stack align="stretch" gap="sm" style={{ flex: 1, minHeight: 0 }}>
          {/* A 3-column grid (not `justify="space-between"`) so the timer
              chip in the middle column sits truly centered on the page,
              regardless of the title and action groups on either side
              having different widths. */}
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              // The left column now stacks the icon, name, description, and
              // badges, so it's much taller than the timer chip or the
              // button row — top-aligning (not centering) keeps those two
              // flush with the icon/name instead of centered against the
              // whole tall block.
              alignItems: "start",
              gap: "var(--mantine-spacing-sm)",
            }}
          >
            <Stack gap={2} style={{ justifySelf: "start" }}>
              {!isInitialLoad && isShowingCurrentEvent && event ? (
                <>
                  {/* Icon and event name share one row (instead of the icon
                      sitting alone above a separate name row) so the
                      description and badges below both move up a row —
                      keeping this section's total height from growing
                      compared to before the progress bar/tiles were added
                      below it. */}
                  <Group gap="xs" wrap="nowrap">
                    <IconShieldHalfFilled
                      aria-hidden="true"
                      size={28}
                      stroke={1.6}
                      color="var(--app-color-primary)"
                    />
                    <Title order={1} c="var(--app-color-text)" fz="1.5rem" fw={700}>
                      {event.name || "אירוע ללא שם"}
                    </Title>
                  </Group>

                  <EventDescriptionBlock />
                  <EventBadgesRow event={event} aerialEvacStatus={aerialEvacStatus} />
                </>
              ) : (
                <IconShieldHalfFilled aria-hidden="true" size={28} stroke={1.6} color="var(--app-color-primary)" />
              )}
            </Stack>

            <Stack gap={2} align="center" style={{ justifySelf: "center" }}>
              {!isInitialLoad && isShowingCurrentEvent && event && (
                <>
                  <EventTimerChip event={event} localClosureAt={localClosureAt} />
                  <Text fw={800} fz="1.75rem" lh={1.1} c="var(--app-color-text)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {`פונו ${evacuatedCount} מתוך ${casualties.length} נפגעים`}
                  </Text>
                </>
              )}
            </Stack>

            <Group gap="xs" wrap="nowrap" style={{ justifySelf: "end" }}>
              <ThemeToggleButton />

              <Button
                leftSection={<IconPlus size={18} stroke={1.8} />}
                size="sm"
                mih="2.5rem"
                onClick={() => setIsCreateOpen(true)}
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

              {!isInitialLoad && isShowingCurrentEvent && event && (
                <EventActionButtons
                  isCompleted={isEventClosed}
                  canClose={isEventFullEvacuation}
                  onCloseEvent={() => setCloseConfirmOpen(true)}
                />
              )}
            </Group>
          </Box>

          {isInitialLoad && (
            <Stack align="center" gap="sm" py="xl">
              <Loader color="var(--app-color-primary)" />
              <Text fz="sm" c="var(--app-color-text-muted)">
                טוען נתוני אירוע...
              </Text>
            </Stack>
          )}

          {!isInitialLoad && !isShowingCurrentEvent && currentEventStatus === "failed" && (
            <Text fz="sm" c="var(--app-color-error)" ta="center" py="xl">
              {currentEventError || "שגיאה בטעינת האירוע"}
            </Text>
          )}

          {!isInitialLoad && isShowingCurrentEvent && (
            <Box
              style={{
                display: "flex",
                gap: "var(--mantine-spacing-sm)",
                flex: 1,
                minHeight: 0,
                height: "100%",
              }}
            >
              {/* Folds to a slim strip (see EventMapCard) instead of the map
                  card's usual 2/10 share, so the casualties/evacuation grid
                  next to it can take that width back. Open by default. */}
              <Box
                style={{
                  flex: isMapCollapsed ? "0 0 auto" : "0 0 20%",
                  minWidth: 0,
                  height: "100%",
                  transition: "flex-basis 0.2s ease",
                }}
              >
                <EventMapCard
                  event={event}
                  locations={locations}
                  forces={forces}
                  collapsed={isMapCollapsed}
                  onToggleCollapsed={() => setIsMapCollapsed((collapsed) => !collapsed)}
                />
              </Box>

              <Grid
                gutter="sm"
                columns={8}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ root: { height: "100%" }, inner: { height: "100%" } }}
              >
                <Grid.Col span={{ base: 8, md: 4 }} style={{ height: "100%" }}>
                  <CasualtiesTableCard casualties={activeCasualties} />
                </Grid.Col>
                <Grid.Col span={{ base: 8, md: 4 }} style={{ height: "100%" }}>
                  {/* Evacuations gets the larger share (it's still the
                      working table — inline editing, request buttons);
                      the evacuated-casualties card underneath is a
                      compact reference, not a working table, so it
                      doesn't need equal room. */}
                  <Stack gap="sm" style={{ height: "100%" }}>
                    <Box style={{ flex: 3, minHeight: 0 }}>
                      <EvacuationsTable
                        evacuations={evacuations}
                        locations={locations}
                        eventLocation={event?.location}
                        aerialMissions={aerialMissions}
                        isCompleted={isEventClosed}
                        aerialEvacStatus={aerialEvacStatus}
                        onUpdateEvacuation={handleUpdateEvacuation}
                        onDeleteEvacuation={handleDeleteEvacuation}
                        onRequestAerialEvac={handleRequestAerialEvac}
                        onCreateRideEvacuation={handleCreateRideEvacuation}
                      />
                    </Box>
                    <Box style={{ flex: 2, minHeight: 0 }}>
                      <EvacuatedCasualtiesCard casualties={evacuatedCasualties} />
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Box>
          )}
        </Stack>
        {/* The event lives in the route here, so switching is a navigation.
            `replace` keeps Back pointing at wherever the operator came from
            rather than accumulating one history entry per switch. */}
        <EventDashboardView
          eventId={eventId}
          onSelectEvent={(nextId) => navigate(`/brigade/${nextId}`, { replace: true })}
        />
      </Stack>
    </Layout>
  );
};

export default EventDashboardPage;
