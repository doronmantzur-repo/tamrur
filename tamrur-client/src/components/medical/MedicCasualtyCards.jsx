// React

// External libraries
import { Checkbox, Group, Paper, Stack, Text } from "@mantine/core";

// Internal application modules
import NewCasualtyForm from "./NewCasualtyForm";
import { CasualtyActions, CasualtyFieldsPanel } from "./MedicCasualtiesTable";
import CasualtyRecordsPanel from "./CasualtyRecordsPanel";
import { CASUALTY_FIELDS, renderCell } from "./casualtyFields";
import { MONO_FONT } from "./formStyles";
import { useCellSave } from "./useCellSave";

// Styles

/** The casualty number and urgency are promoted into the card's header line. */
const HEADER_KEYS = ["casualty-number", "urgency"];

const URGENCY_FIELD = CASUALTY_FIELDS.find((field) => field.key === "urgency");

const BODY_FIELDS = CASUALTY_FIELDS.filter((field) => !HEADER_KEYS.includes(field.key));

/**
 * Renders one casualty as a card.
 *
 * @param {{ casualty: Object, rowError: string | undefined, isSaving: boolean, onOpenRecords: () => void }} props
 * @returns {JSX.Element} The casualty card.
 */
const CasualtyCard = ({ eventId, casualty, rowError, isSaving, onOpenRecords, onToggleEvacuated }) => {
  const save = useCellSave(casualty.id);

  return (
    <Paper
      withBorder
      radius="sm"
      p="sm"
      style={{
        backgroundColor: "var(--app-color-surface-high)",
        borderColor: "var(--app-color-border)",
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap="xs" wrap="nowrap">
          <Text fz="sm" fw={700} ff={MONO_FONT}>
            {casualty["casualty-number"] != null ? `#${casualty["casualty-number"]}` : "—"}
          </Text>
          {/* Still the editable cell, so the most-changed field stays one tap
              away without opening anything. */}
          {renderCell(URGENCY_FIELD, casualty, save)}
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Checkbox
            aria-label={casualty.is_evacuated ? "בטל סימון פונה" : "סמן כפונה"}
            checked={Boolean(casualty.is_evacuated)}
            onChange={(changed) => onToggleEvacuated(casualty, changed.currentTarget.checked)}
            label={
              <Text fz="0.68rem" c="var(--app-color-text-muted)">
                פונה
              </Text>
            }
            color="var(--app-color-primary)"
          />
          <CasualtyActions rowError={rowError} isSaving={isSaving} onOpenRecords={onOpenRecords} />
        </Group>
      </Group>

      <CasualtyFieldsPanel fields={BODY_FIELDS} casualty={casualty} save={save} />

      <Stack gap="xs" mt="sm">
        <CasualtyRecordsPanel eventId={eventId} casualtyId={casualty.id} />
      </Stack>
    </Paper>
  );
};

/**
 * Renders the casualties as stacked cards, for screens too narrow for any
 * useful table.
 *
 * Every control is the same one the table renders, so editing behaves
 * identically — a card is a re-layout, not a second implementation.
 *
 * @param {{
 *   eventId: string,
 *   casualties: Array<Object>,
 *   rowErrorById: Record<string, string>,
 *   savingById: Record<string, boolean>,
 *   isAdding: boolean,
 *   onAddingChange: (isAdding: boolean) => void,
 *   onOpenRecords: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The casualty card list.
 */
const MedicCasualtyCards = ({
  eventId,
  casualties,
  rowErrorById,
  savingById,
  isAdding,
  onAddingChange,
  onOpenRecords,
  onToggleEvacuated,
}) => (
  <Stack gap="sm">
    {isAdding && (
      <Paper
        withBorder
        radius="sm"
        p="sm"
        style={{
          backgroundColor: "color-mix(in srgb, var(--app-color-primary) 10%, transparent)",
          borderColor: "var(--app-color-primary)",
        }}
      >
        <NewCasualtyForm eventId={eventId} onDone={() => onAddingChange(false)} />
      </Paper>
    )}

    {casualties.map((casualty) => (
      <CasualtyCard
        key={casualty.id}
        eventId={eventId}
        casualty={casualty}
        rowError={rowErrorById[casualty.id]}
        isSaving={Boolean(savingById[casualty.id])}
        onOpenRecords={() => onOpenRecords(casualty)}
        onToggleEvacuated={onToggleEvacuated}
      />
    ))}

    {casualties.length === 0 && !isAdding && (
      <Text fz="sm" ta="center" c="var(--app-color-text-muted)">
        לא נרשמו נפגעים באירוע זה
      </Text>
    )}
  </Stack>
);

export default MedicCasualtyCards;
