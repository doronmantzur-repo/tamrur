// React
import { useEffect, useState } from "react";

// External libraries
import { Alert, Badge, Group, Modal, Stack, Tabs, Text } from "@mantine/core";
import { IconActivityHeartbeat, IconInfoCircle, IconStethoscope, IconUser } from "@tabler/icons-react";
import { useDispatch } from "react-redux";

// Internal application modules
import InjuryDetailsForm from "./InjuryDetailsForm";
import TreatmentsSection from "./TreatmentsSection";
import VitalsSection from "./VitalsSection";
import { MONO_FONT } from "./formStyles";
import { clearInjurySaveError } from "../../features/injuries/injuriesSlice";
import { clearTreatmentSaveError } from "../../features/treatments/treatmentsSlice";
import { clearVitalsSaveError } from "../../features/vitals/vitalsSlice";
import { URGENCY_COLOR_VARS, URGENCY_LABELS } from "../../constants/injuryStatus";

// Styles

/**
 * Renders the three record types belonging to one casualty, each on its own
 * tab: the `casualties` row itself, its `injuries-treatment` rows, and its
 * `vitals` rows.
 *
 * Treatments and vitals are foreign-keyed to an injury, so for a casualty that
 * hasn't been created yet those tabs stay locked until the details tab saves
 * and returns an id.
 *
 * @param {{ eventId: string, injury: Object | null, onCreated: (injury: Object) => void }} props
 * @returns {JSX.Element} The casualty editor.
 */
const CasualtyEditor = ({ eventId, injury, onCreated }) => {
  const [savedInjury, setSavedInjury] = useState(injury);
  const [activeTab, setActiveTab] = useState("details");

  const injuryId = savedInjury?.id ?? null;

  /**
   * Keeps the freshly created casualty in local state so the record tabs
   * unlock, and lets the page know it can select the new row.
   *
   * @param {Object} saved - The injury row returned by the server.
   * @returns {void}
   */
  function handleSaved(saved) {
    const isNew = !savedInjury;
    setSavedInjury(saved);

    if (isNew) {
      onCreated(saved);
      setActiveTab("treatments");
    }
  }

  return (
    <Stack gap="md">
      {!injuryId && (
        <Alert
          icon={<IconInfoCircle size={18} />}
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderInlineStart: "3px solid var(--app-color-primary)",
            },
            body: { color: "var(--app-color-text-muted)" },
          }}
        >
          שמור את פרטי הנפגע כדי לרשום לו טיפולים ומדדים
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        color="var(--app-color-primary)"
        styles={{
          tab: { color: "var(--app-color-text-muted)" },
          tabLabel: { fontWeight: 500 },
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="details" leftSection={<IconUser size={16} stroke={1.8} />}>
            פרטי נפגע
          </Tabs.Tab>
          <Tabs.Tab
            value="treatments"
            leftSection={<IconStethoscope size={16} stroke={1.8} />}
            disabled={!injuryId}
          >
            טיפולים
          </Tabs.Tab>
          <Tabs.Tab
            value="vitals"
            leftSection={<IconActivityHeartbeat size={16} stroke={1.8} />}
            disabled={!injuryId}
          >
            מדדים ובדיקות
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <InjuryDetailsForm eventId={eventId} injury={savedInjury} onSaved={handleSaved} />
        </Tabs.Panel>

        <Tabs.Panel value="treatments" pt="md">
          {injuryId && <TreatmentsSection eventId={eventId} injuryId={injuryId} />}
        </Tabs.Panel>

        <Tabs.Panel value="vitals" pt="md">
          {injuryId && <VitalsSection eventId={eventId} injuryId={injuryId} />}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

/**
 * Hosts the casualty editor in a modal.
 *
 * @param {{
 *   eventId: string,
 *   injury: Object | null,
 *   opened: boolean,
 *   onClose: () => void,
 *   onCreated: (injury: Object) => void,
 * }} props
 * @returns {JSX.Element} The casualty editing modal.
 */
const InjuryFormModal = ({ eventId, injury, opened, onClose, onCreated }) => {
  const dispatch = useDispatch();

  // A save that failed on the last casualty shouldn't greet the medic when the
  // next one is opened.
  useEffect(() => {
    if (!opened) return;

    dispatch(clearInjurySaveError());
    dispatch(clearTreatmentSaveError());
    dispatch(clearVitalsSaveError());
  }, [opened, dispatch]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="64rem"
      centered
      title={
        <Group gap="sm">
          <Text fz="lg" fw={700} c="var(--app-color-text)">
            {injury ? "עדכון נפגע" : "נפגע חדש"}
          </Text>
          {injury && (
            <>
              <Badge
                styles={{
                  root: {
                    backgroundColor: `color-mix(in srgb, ${URGENCY_COLOR_VARS[injury.urgency]} 16%, transparent)`,
                    color: URGENCY_COLOR_VARS[injury.urgency],
                  },
                }}
              >
                {URGENCY_LABELS[injury.urgency] || injury.urgency || "—"}
              </Badge>
              <Text fz="xs" c="var(--app-color-text-muted)" ff={MONO_FONT}>
                {String(injury.id).slice(0, 8)}
              </Text>
            </>
          )}
        </Group>
      }
      styles={{
        content: { backgroundColor: "var(--app-color-surface)" },
        header: {
          backgroundColor: "var(--app-color-surface)",
          borderBottom: "1px solid var(--app-color-border)",
        },
        body: { paddingTop: "var(--mantine-spacing-md)" },
      }}
    >
      {/* Mounted only while open, so every casualty's editor starts from that
          casualty's own values rather than the previously opened one's. It
          deliberately isn't keyed on the injury id: creating a casualty gives
          it one, and remounting there would throw away the form the medic is
          still working in. */}
      {opened && <CasualtyEditor eventId={eventId} injury={injury} onCreated={onCreated} />}
    </Modal>
  );
};

export default InjuryFormModal;