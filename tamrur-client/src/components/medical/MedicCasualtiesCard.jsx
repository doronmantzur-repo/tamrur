// React

// External libraries
import { Badge, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import MedicCasualtyCards from "./MedicCasualtyCards";
import MedicCasualtiesTable from "./MedicCasualtiesTable";
import { MONO_FONT, primaryButtonStyles } from "./formStyles";
import { URGENCY_COLOR_VARS, URGENCY_LABELS, URGENCY_ORDER } from "../../constants/casualtyStatus";
import { CASUALTY_TIER, useCasualtyTier } from "../../hooks/useCasualtyTier";

// Styles

/**
 * Renders the medic interface's casualty card: the urgency breakdown, the
 * add-casualty control, and the casualty list itself.
 *
 * The list re-lays-out with the viewport — the full triage table on a laptop,
 * a reduced table with an expandable detail row on a tablet, and stacked cards
 * on a phone. All three render the same editable cells.
 *
 * @param {{
 *   eventId: string,
 *   casualties: Array<Object>,
 *   isAdding: boolean,
 *   onAddingChange: (isAdding: boolean) => void,
 *   onOpenRecords: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The medic casualties card.
 */
const MedicCasualtiesCard = ({
  eventId,
  casualties,
  isAdding,
  onAddingChange,
  onOpenRecords,
}) => {
  const tier = useCasualtyTier();
  const rowErrorById = useSelector((state) => state.casualties.rowErrorById);
  const savingById = useSelector((state) => state.casualties.savingById);

  const countsByUrgency = URGENCY_ORDER.reduce((acc, key) => {
    acc[key] = casualties.filter((casualty) => casualty.urgency === key).length;
    return acc;
  }, {});

  return (
    <DashboardCard
      title="נפגעים"
      // Trims the card's own gutters where width is scarcest. Resolves to the
      // usual "lg" from md up, so the desktop view stays identical to the rest
      // of the dashboard.
      padding={{ base: "xs", sm: "md", md: "lg" }}
      headerExtra={
        <Group gap="sm">
          <Badge
            variant="outline"
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text-muted)",
              },
            }}
          >
            {casualties.length} סה״כ
          </Badge>
          <Button
            size="xs"
            h="2.25rem"
            mih="2.25rem"
            leftSection={<IconUserPlus size={16} stroke={1.8} />}
            disabled={isAdding}
            onClick={() => onAddingChange(true)}
            styles={primaryButtonStyles}
          >
            נפגע חדש
          </Button>
        </Group>
      }
    >
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {URGENCY_ORDER.map((key) => (
          <Stack
            key={key}
            gap={4}
            p="sm"
            style={{
              backgroundColor: "var(--app-color-surface-high)",
              border: "1px solid var(--app-color-border)",
              borderInlineStart: `3px solid ${URGENCY_COLOR_VARS[key]}`,
              borderRadius: "var(--mantine-radius-sm)",
            }}
          >
            <Text fz="1.35rem" fw={700} lh={1} ff={MONO_FONT}>
              {countsByUrgency[key]}
            </Text>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {URGENCY_LABELS[key]}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      {tier === CASUALTY_TIER.CARD ? (
        <MedicCasualtyCards
          eventId={eventId}
          casualties={casualties}
          rowErrorById={rowErrorById}
          savingById={savingById}
          isAdding={isAdding}
          onAddingChange={onAddingChange}
          onOpenRecords={onOpenRecords}
        />
      ) : (
        <MedicCasualtiesTable
          eventId={eventId}
          casualties={casualties}
          tier={tier}
          isAdding={isAdding}
          onAddingChange={onAddingChange}
          onOpenRecords={onOpenRecords}
        />
      )}
    </DashboardCard>
  );
};

export default MedicCasualtiesCard;
