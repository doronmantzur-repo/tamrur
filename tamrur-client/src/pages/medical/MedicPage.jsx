// React
import { useCallback, useEffect, useState } from "react";

// External libraries
import {
  ActionIcon,
  Alert,
  Box,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertTriangle, IconMessageQuestion } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import MedicEventBar from "../../components/medical/MedicEventBar";
import MedicCasualtiesCard from "../../components/medical/MedicCasualtiesCard";
import CasualtyFormModal from "../../components/medical/CasualtyFormModal";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import AccountControlsStack from "../../components/common/AccountControlsStack";
import { useHoverState } from "../../hooks/useHoverState";
import { fetchCasualtiesByEvent } from "../../features/casualties/casualtiesSlice";
import { fetchEvents } from "../../features/events/eventsSlice";
import { fetchTreatmentsByEvent } from "../../features/treatments/treatmentsSlice";
import { fetchVitalsByEvent } from "../../features/vitals/vitalsSlice";
import { fetchDrugsByEvent } from "../../features/drugs/drugsSlice";
import { POLL_INTERVAL_MS } from "../../constants/polling";

// Styles

/**
 * Renders the medic interface: casualty entry and the treatment and vitals
 * records logged against each casualty.
 *
 * @returns {JSX.Element} The medic page.
 */
const MedicPage = () => {
  const navigate = useNavigate();
  const [isQueryButtonHovered, queryButtonHoverHandlers] = useHoverState();
  const [selectedEventId, setSelectedEventId] = useState(null);
  // The last event whose records have finished loading. Comparing it against
  // the selection derives the loading flag, so a background poll — which
  // doesn't touch it — can't flash the spinner over a populated table.
  const [loadedEventId, setLoadedEventId] = useState(null);
  // The casualty whose treatment/vitals records are open, by id — held as an id
  // rather than the row itself so a background poll keeps the modal's header in
  // sync instead of freezing a stale copy.
  const [recordsCasualtyId, setRecordsCasualtyId] = useState(null);
  // Whether the table is showing its blank "new casualty" row.
  const [isAdding, setIsAdding] = useState(false);
  const dispatch = useDispatch();

  const selectedEvent = useSelector((state) =>
    state.events.events.find((event) => event.id === selectedEventId),
  );
  const casualties = useSelector(
    (state) => state.casualties.byEventId[selectedEventId] || [],
  );
  const recordsCasualty =
    casualties.find((casualty) => casualty.id === recordsCasualtyId) ?? null;
  const loadError = useSelector(
    (state) =>
      state.casualties.error ||
      state.treatments.error ||
      state.vitals.error ||
      state.drugs.error,
  );

  const loadEventRecords = useCallback(
    (eventId) =>
      Promise.all([
        dispatch(fetchCasualtiesByEvent(eventId)),
        dispatch(fetchTreatmentsByEvent(eventId)),
        dispatch(fetchVitalsByEvent(eventId)),
        dispatch(fetchDrugsByEvent(eventId)),
        // The event carries gathering_status and the derived evac_status, both
        // of which another medic can move — poll them alongside the casualties.
        dispatch(fetchEvents()),
      ]),
    [dispatch],
  );

  const isEditorOpen = recordsCasualtyId !== null || isAdding;
  const isLoadingEvent =
    Boolean(selectedEventId) && loadedEventId !== selectedEventId;

  useEffect(() => {
    if (!selectedEventId) return;

    loadEventRecords(selectedEventId).finally(() =>
      setLoadedEventId(selectedEventId),
    );
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

  return (
    <Layout>
      <div
        style={{
          position: "absolute",
          top: "var(--mantine-spacing-md)",
          left: "var(--mantine-spacing-md)",
          zIndex: 20,
        }}
      >
        <AccountControlsStack align="flex-start">
          <ActionIcon
            aria-label="שאילתת ספר הטראומה"
            title="שאילתת ספר הטראומה"
            variant="default"
            size={40}
            radius="xl"
            onClick={() => navigate("/query")}
            {...queryButtonHoverHandlers}
            style={{
              backgroundColor: isQueryButtonHovered ? "var(--app-color-primary)" : "var(--app-color-surface)",
              borderColor: isQueryButtonHovered ? "var(--app-color-primary)" : "var(--app-color-border)",
              color: isQueryButtonHovered ? "var(--app-color-primary-text)" : "var(--app-color-text)",
              transform: isQueryButtonHovered ? "translateY(-1px)" : undefined,
              transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
            }}
          >
            <IconMessageQuestion aria-hidden="true" size={20} stroke={1.8} />
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
        pt={112}
        pb="md"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Box w="100%" maw={1240} style={{ marginInline: "auto" }}>
          {/* Tight rhythm on purpose: everything above the casualty table is
              chrome, and the table is what the medic actually works in. The
              extra top offset (vs. the pb below) clears the absolutely
              positioned corner cluster — now two rows tall (AccountBar above
              the other controls) — otherwise the event dropdown here can run
              under them on narrower viewports. */}
          <Stack align="stretch" gap="sm">
            <MedicEventBar
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              event={selectedEvent}
            />

            {selectedEvent && loadError && !isLoadingEvent && (
              <Alert
                icon={<IconAlertTriangle size={18} />}
                title="טעינת נתוני האירוע נכשלה"
                styles={{
                  root: {
                    backgroundColor:
                      "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
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
              <Stack align="center" gap="xs" py="lg">
                <Loader color="var(--app-color-primary)" />
                <Text fz="sm" c="var(--app-color-text-muted)">
                  טוען נתוני אירוע...
                </Text>
              </Stack>
            )}

            {selectedEvent && !isLoadingEvent && (
              <MedicCasualtiesCard
                event={selectedEvent}
                casualties={casualties}
                isAdding={isAdding}
                onAddingChange={setIsAdding}
                onOpenRecords={(casualty) => setRecordsCasualtyId(casualty.id)}
              />
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
        <CasualtyFormModal
          eventId={selectedEventId}
          casualty={recordsCasualty}
          opened={recordsCasualty !== null}
          onClose={() => setRecordsCasualtyId(null)}
        />
      )}
    </Layout>
  );
};

export default MedicPage;
