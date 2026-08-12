// React
import { useCallback, useEffect, useState } from "react";

// External libraries
import { ActionIcon, Alert, Box, Loader, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import { IconAlertTriangle, IconMoon, IconSun } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import EventSelector from "../../components/dashboard/EventSelector";
import EventDetailsCard from "../../components/dashboard/EventDetailsCard";
import MedicInjuriesCard from "../../components/medical/MedicInjuriesCard";
import InjuryFormModal from "../../components/medical/InjuryFormModal";
import { fetchInjuriesByEvent } from "../../features/injuries/injuriesSlice";
import { fetchTreatmentsByEvent } from "../../features/treatments/treatmentsSlice";
import { fetchVitalsByEvent } from "../../features/vitals/vitalsSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/**
 * Renders the medic interface: casualty entry and the treatment and vitals
 * records logged against each casualty.
 *
 * @returns {JSX.Element} The medic page.
 */
const MedicPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [selectedEventId, setSelectedEventId] = useState(null);
  // The last event whose records have finished loading. Comparing it against
  // the selection derives the loading flag, so a background poll — which
  // doesn't touch it — can't flash the spinner over a populated table.
  const [loadedEventId, setLoadedEventId] = useState(null);
  // null = closed. { injury: null } opens a blank form, { injury } edits one.
  const [editing, setEditing] = useState(null);
  const dispatch = useDispatch();

  const selectedEvent = useSelector((state) =>
    state.events.events.find((event) => event.id === selectedEventId),
  );
  const injuries = useSelector((state) => state.injuries.byEventId[selectedEventId] || []);
  const loadError = useSelector(
    (state) => state.injuries.error || state.treatments.error || state.vitals.error,
  );

  const loadEventRecords = useCallback(
    (eventId) =>
      Promise.all([
        dispatch(fetchInjuriesByEvent(eventId)),
        dispatch(fetchTreatmentsByEvent(eventId)),
        dispatch(fetchVitalsByEvent(eventId)),
      ]),
    [dispatch],
  );

  const isEditorOpen = editing !== null;
  const isLoadingEvent = Boolean(selectedEventId) && loadedEventId !== selectedEventId;

  useEffect(() => {
    if (!selectedEventId) return;

    loadEventRecords(selectedEventId).finally(() => setLoadedEventId(selectedEventId));
  }, [selectedEventId, loadEventRecords]);

  useEffect(() => {
    // Several medics can be logging against the same event at once, so keep
    // polling instead of fetching once. Polling pauses while a casualty is open
    // for editing, so a refresh can't swap the records out from under the form.
    if (!selectedEventId || isEditorOpen) return undefined;

    const intervalId = setInterval(() => {
      loadEventRecords(selectedEventId);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedEventId, isEditorOpen, loadEventRecords]);

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
              ממשק רפואי
            </Title>

            <EventSelector value={selectedEventId} onChange={setSelectedEventId} />

            {selectedEvent && loadError && !isLoadingEvent && (
              <Alert
                icon={<IconAlertTriangle size={18} />}
                title="טעינת נתוני האירוע נכשלה"
                styles={{
                  root: {
                    backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
                    borderInlineStart: "3px solid var(--app-color-error)",
                  },
                  title: { color: "var(--app-color-error)" },
                  body: { color: "var(--app-color-text)" },
                }}
              >
                {loadError}
              </Alert>
            )}

            {selectedEvent && isLoadingEvent && (
              <Stack align="center" gap="sm" py="xl">
                <Loader color="var(--app-color-primary)" />
                <Text fz="sm" c="var(--app-color-text-muted)">
                  טוען נתוני אירוע...
                </Text>
              </Stack>
            )}

            {selectedEvent && !isLoadingEvent && (
              <>
                <EventDetailsCard event={selectedEvent} />
                <MedicInjuriesCard
                  eventId={selectedEventId}
                  injuries={injuries}
                  onAddCasualty={() => setEditing({ injury: null })}
                  onEditCasualty={(injury) => setEditing({ injury })}
                />
              </>
            )}

            {!selectedEvent && (
              <Text fz="sm" c="var(--app-color-text-muted)">
                בחר אירוע כדי להזין ולעדכן נתוני נפגעים
              </Text>
            )}
          </Stack>
        </Box>
      </Stack>

      {selectedEventId && (
        <InjuryFormModal
          eventId={selectedEventId}
          injury={editing?.injury ?? null}
          opened={isEditorOpen}
          onClose={() => setEditing(null)}
          // Keep editing the casualty that was just created, now that it has an
          // id — the modal switches itself to the treatments tab.
          onCreated={(injury) => setEditing({ injury })}
        />
      )}
    </Layout>
  );
};

export default MedicPage;