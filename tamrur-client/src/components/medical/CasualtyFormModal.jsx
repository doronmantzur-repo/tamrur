// React
import { useEffect } from "react";

// External libraries
import { Badge, Group, Modal, Tabs, Text } from "@mantine/core";
import { IconActivityHeartbeat, IconStethoscope } from "@tabler/icons-react";
import { useDispatch } from "react-redux";

// Internal application modules
import TreatmentsSection from "./TreatmentsSection";
import VitalsSection from "./VitalsSection";
import { MONO_FONT } from "./formStyles";
import { clearCasualtySaveError } from "../../features/casualties/casualtiesSlice";
import { clearTreatmentSaveError } from "../../features/treatments/treatmentsSlice";
import { clearVitalsSaveError } from "../../features/vitals/vitalsSlice";
import { urgencyBadgeColors, urgencyLabel } from "../../constants/casualtyStatus";

// Styles

/**
 * Records a new treatment or test against one casualty.
 *
 * Recording only: what has already been logged is read in the row's expanded
 * panel in the table, not here, so the modal stays a short form rather than a
 * form plus a growing history. The casualty's own fields are edited inline in
 * the table for the same reason.
 *
 * @param {{
 *   eventId: string,
 *   casualty: Object | null,
 *   opened: boolean,
 *   onClose: () => void,
 * }} props
 * @returns {JSX.Element} The casualty records modal.
 */
const CasualtyFormModal = ({ eventId, casualty, opened, onClose }) => {
  const dispatch = useDispatch();

  // A save that failed on the last casualty shouldn't greet the medic when the
  // next one is opened.
  useEffect(() => {
    if (!opened) return;

    dispatch(clearCasualtySaveError());
    dispatch(clearTreatmentSaveError());
    dispatch(clearVitalsSaveError());
  }, [opened, dispatch]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="52rem"
      centered
      title={
        <Group gap="sm">
          <Text fz="lg" fw={700} c="var(--app-color-text)">
            רישום טיפול / בדיקה
          </Text>
          {casualty && (
            <>
              <Badge
                styles={{
                  root: urgencyBadgeColors(casualty.urgency),
                }}
              >
                {urgencyLabel(casualty.urgency)}
              </Badge>
              <Text fz="sm" c="var(--app-color-text-muted)" ff={MONO_FONT}>
                {casualty["casualty-number"] != null
                  ? `פצוע ${casualty["casualty-number"]}`
                  : String(casualty.id).slice(0, 8)}
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
      {/* Mounted only while open, so each casualty's sections start from that
          casualty's own records rather than the previously opened one's. The
          treatment and vitals rows are still foreign-keyed by "injury-id", which
          the casualties rename deliberately left alone. */}
      {opened && casualty && (
        <Tabs
          defaultValue="treatments"
          color="var(--app-color-primary)"
          styles={{
            tab: { color: "var(--app-color-text-muted)" },
            tabLabel: { fontWeight: 500 },
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="treatments" leftSection={<IconStethoscope size={16} stroke={1.8} />}>
              טיפולים
            </Tabs.Tab>
            <Tabs.Tab
              value="vitals"
              leftSection={<IconActivityHeartbeat size={16} stroke={1.8} />}
            >
              מדדים ובדיקות
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="treatments" pt="md">
            <TreatmentsSection eventId={eventId} injuryId={casualty.id} view="form" />
          </Tabs.Panel>

          <Tabs.Panel value="vitals" pt="md">
            <VitalsSection eventId={eventId} injuryId={casualty.id} view="form" />
          </Tabs.Panel>
        </Tabs>
      )}
    </Modal>
  );
};

export default CasualtyFormModal;
