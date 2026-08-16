// React

// External libraries
import { Badge, Group, Stack, Text } from "@mantine/core";
import { IconActivityHeartbeat, IconPill, IconStethoscope } from "@tabler/icons-react";

// Internal application modules
import DrugsSection from "./DrugsSection";
import TreatmentsSection from "./TreatmentsSection";
import { useCasualtyRecordCounts } from "./useCasualtyRecordCounts";
import VitalsSection from "./VitalsSection";

// Styles

/**
 * Renders the heading for one record group, with its count.
 *
 * @param {{ icon: React.ReactNode, title: string, count: number }} props
 * @returns {JSX.Element}
 */
const GroupHeading = ({ icon, title, count }) => (
  <Group gap="xs" align="center">
    {icon}
    <Text fz="sm" fw={700} c="var(--app-color-text)">
      {title}
    </Text>
    <Badge
      size="sm"
      styles={{
        root: {
          backgroundColor: "var(--app-color-surface)",
          color: "var(--app-color-text-muted)",
          border: "1px solid var(--app-color-border)",
        },
      }}
    >
      {count}
    </Badge>
  </Group>
);

/**
 * One casualty's recorded treatments and tests, shown inline beneath their row.
 *
 * This is the history half of the record-keeping split: adding a record happens
 * in the modal behind the row's + button, while everything already recorded —
 * with its timestamp, notes and edit/delete controls — is read here without
 * leaving the table.
 *
 * @param {{ eventId: string, casualtyId: string }} props
 * @returns {JSX.Element} The records panel.
 */
const CasualtyRecordsPanel = ({ eventId, casualtyId }) => {
  const counts = useCasualtyRecordCounts(eventId, casualtyId);

  if (counts.total === 0) {
    return (
      <Text fz="sm" c="var(--app-color-text-muted)">
        אין תרופות, טיפולים או בדיקות מתועדים
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {counts.drugs > 0 && (
        <Stack gap="xs">
          <GroupHeading
            icon={<IconPill size={16} stroke={1.8} color="var(--app-color-primary)" />}
            title="תרופות"
            count={counts.drugs}
          />
          <DrugsSection eventId={eventId} casualtyId={casualtyId} view="history" />
        </Stack>
      )}

      {counts.treatments > 0 && (
        <Stack gap="xs">
          <GroupHeading
            icon={<IconStethoscope size={16} stroke={1.8} color="var(--app-color-primary)" />}
            title="טיפולים"
            count={counts.treatments}
          />
          <TreatmentsSection eventId={eventId} injuryId={casualtyId} view="history" />
        </Stack>
      )}

      {counts.vitals > 0 && (
        <Stack gap="xs">
          <GroupHeading
            icon={
              <IconActivityHeartbeat size={16} stroke={1.8} color="var(--app-color-primary)" />
            }
            title="מדדים ובדיקות"
            count={counts.vitals}
          />
          <VitalsSection eventId={eventId} injuryId={casualtyId} view="history" />
        </Stack>
      )}
    </Stack>
  );
};

export default CasualtyRecordsPanel;
