// React
import { Fragment, useState } from "react";

// External libraries
import {
  ActionIcon,
  Box,
  Checkbox,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import NewCasualtyForm from "./NewCasualtyForm";
import CasualtyRecordsPanel from "./CasualtyRecordsPanel";
import { useCasualtyRecordCounts } from "./useCasualtyRecordCounts";
import {
  ACTIONS_WIDTH,
  EVACUATED_WIDTH,
  EXPANDER_WIDTH,
  groupHeaders,
  hiddenFields,
  renderCell,
  visibleFields,
} from "./casualtyFields";
import { MONO_FONT } from "./formStyles";
import { useCellSave } from "./useCellSave";

// Styles

const groupHeaderStyle = {
  backgroundColor: "var(--app-color-surface-high)",
  color: "var(--app-color-text-muted)",
};

/**
 * Renders the per-casualty controls the row itself has no room for, as a
 * labelled grid. Shared by the tablet detail row and the phone card.
 *
 * @param {{ fields: Array<Object>, casualty: Object, save: Function }} props
 * @returns {JSX.Element} The labelled field grid.
 */
export const CasualtyFieldsPanel = ({ fields, casualty, save }) => (
  <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm">
    {fields.map((field) => (
      <Stack key={field.key} gap={2}>
        <Text fz="0.68rem" c="var(--app-color-text-muted)">
          {field.header}
        </Text>
        {renderCell(field, casualty, save)}
      </Stack>
    ))}
  </SimpleGrid>
);

/**
 * Renders the loader / error / records controls that sit at the end of every
 * casualty, in both the table and the card layouts.
 *
 * @param {{ rowError: string | undefined, isSaving: boolean, onOpenRecords: () => void }} props
 * @returns {JSX.Element} The actions group.
 */
export const CasualtyActions = ({ rowError, isSaving, onOpenRecords }) => (
  <Group gap={4} wrap="nowrap">
    {isSaving && <Loader size={16} color="var(--app-color-primary)" />}
    {rowError && (
      <Tooltip label={rowError} multiline w={220}>
        <IconAlertTriangle size={16} color="var(--app-color-error)" />
      </Tooltip>
    )}
    {/* Recording only. The log of what was already recorded lives in the row's
        expanded panel, so the two concerns don't share a surface. */}
    <Tooltip label="עדכן תרופה/מדדים">
      <ActionIcon
        aria-label="עדכן תרופה/מדדים"
        variant="subtle"
        onClick={onOpenRecords}
      >
        <IconPlus size={18} stroke={2.2} color="var(--app-color-primary)" />
      </ActionIcon>
    </Tooltip>
  </Group>
);

/**
 * Renders one saved casualty. Every cell edits where it sits and writes its own
 * column — there is no row-level edit mode or save button.
 *
 * @param {{
 *   casualty: Object,
 *   fields: Array<Object>,
 *   overflow: Array<Object>,
 *   columnCount: number,
 *   isOpen: boolean,
 *   onToggleOpen: () => void,
 *   rowError: string | undefined,
 *   isSaving: boolean,
 *   onOpenRecords: () => void,
 * }} props
 * @returns {JSX.Element} The casualty row, plus its detail row when expanded.
 */
const CasualtyRow = ({
  eventId,
  casualty,
  fields,
  overflow,
  columnCount,
  onToggleEvacuated,
  isOpen,
  onToggleOpen,
  rowError,
  isSaving,
  onOpenRecords,
}) => {
  const save = useCellSave(casualty.id);
  const hasOverflow = overflow.length > 0;
  const recordCount = useCasualtyRecordCounts(eventId, casualty.id).total;

  return (
    <Fragment>
      <Table.Tr>
        {
          <Table.Td>
            <ActionIcon
              aria-label={isOpen ? "הסתר פרטים" : "הצג פרטים"}
              title={isOpen ? "הסתר פרטים" : "הצג פרטים"}
              variant="subtle"
              onClick={onToggleOpen}
            >
              {/* Chevrons point up/down, which needs no mirroring in RTL. */}
              {isOpen ? (
                <IconChevronUp size={18} color="var(--app-color-primary)" />
              ) : (
                <IconChevronDown size={18} color="var(--app-color-primary)" />
              )}
            </ActionIcon>
            {recordCount > 0 && (
              <Text fz="0.6rem" ta="center" c="var(--app-color-text-muted)" ff={MONO_FONT}>
                {recordCount}
              </Text>
            )}
          </Table.Td>
        }

        {fields.map((field) => (
          <Table.Td key={field.key}>{renderCell(field, casualty, save)}</Table.Td>
        ))}

        <Table.Td>
          <Checkbox
            aria-label={casualty.is_evacuated ? "בטל סימון פונה" : "סמן כפונה"}
            title={casualty.is_evacuated ? "בטל סימון פונה" : "סמן כפונה"}
            checked={Boolean(casualty.is_evacuated)}
            onChange={(event) => onToggleEvacuated(casualty, event.currentTarget.checked)}
            color="var(--app-color-primary)"
            styles={{ input: { cursor: "pointer" } }}
          />
        </Table.Td>

        <Table.Td>
          <CasualtyActions
            rowError={rowError}
            isSaving={isSaving}
            onOpenRecords={onOpenRecords}
          />
        </Table.Td>
      </Table.Tr>

      {/* The columns that don't fit this tier, disclosed beneath the row — the
          same pattern the brigade dashboard's casualties table uses. */}
      {isOpen && (
        <Table.Tr>
          <Table.Td
            colSpan={columnCount}
            p="md"
            style={{ backgroundColor: "var(--app-color-surface-high)" }}
          >
            <Stack gap="md">
              {hasOverflow && (
                <CasualtyFieldsPanel fields={overflow} casualty={casualty} save={save} />
              )}
              <CasualtyRecordsPanel eventId={eventId} casualtyId={casualty.id} />
            </Stack>
          </Table.Td>
        </Table.Tr>
      )}
    </Fragment>
  );
};

/**
 * Renders the operational triage and evacuation table, grouped the way the
 * paper form is: איסוף פצועים / טריאז' / סיכום טריאז' / דגשים לפינוי.
 *
 * Columns, their widths and their grouping all come from `CASUALTY_FIELDS`, so
 * the header, the `<colgroup>` and the rows cannot drift apart. On the
 * `compact` tier the non-core columns move into a detail row opened by the
 * chevron, which keeps the table inside a tablet's width without hiding
 * anything.
 *
 * Cells are edited where they sit: text and number cells commit on Enter or
 * when focus leaves and discard on Escape; the dropdown cells write as soon as
 * a value is picked; the yes/no cells write on the click itself. Each cell
 * sends only its own column, so two medics working the same casualty don't
 * overwrite each other's other fields.
 *
 * @param {{
 *   eventId: string,
 *   casualties: Array<Object>,
 *   tier: "full" | "compact",
 *   isAdding: boolean,
 *   onAddingChange: (isAdding: boolean) => void,
 *   onOpenRecords: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The casualty table.
 */
const MedicCasualtiesTable = ({
  eventId,
  casualties,
  tier,
  isAdding,
  onAddingChange,
  onOpenRecords,
  onToggleEvacuated,
  emptyMessage = "לא נרשמו נפגעים באירוע זה",
}) => {
  // Only one detail row is open at a time, mirroring the brigade table.
  const [openCasualtyId, setOpenInjuryId] = useState(null);
  const rowErrorById = useSelector((state) => state.casualties.rowErrorById);
  const savingById = useSelector((state) => state.casualties.savingById);

  const fields = visibleFields(tier);
  const overflow = hiddenFields(tier);
  const groups = groupHeaders(fields);
  // The expander is always present now: it carries the treatment/test history
  // on every tier, and on the compact tier the overflow fields as well.
  const columnCount = fields.length + 3;

  return (
    <Box style={{ overflowX: "auto" }}>
      <Table
        layout="fixed"
        horizontalSpacing={6}
        verticalSpacing="xs"
        fz="sm"
        withTableBorder
        withColumnBorders
      >
        {/* table-layout:fixed takes column widths from <col>, NOT from the
            header cells — and the first header row here carries the grouped
            colSpans, which cannot express per-column widths. Putting the widths
            anywhere else silently gets ignored. */}
        <colgroup>
          <col style={{ width: `${EXPANDER_WIDTH}px` }} />
          {fields.map((field) => (
            <col key={field.key} style={field.width ? { width: `${field.width}px` } : undefined} />
          ))}
          <col style={{ width: `${EVACUATED_WIDTH}px` }} />
          <col style={{ width: `${ACTIONS_WIDTH}px` }} />
        </colgroup>

        <Table.Thead>
          <Table.Tr>
            <Table.Th rowSpan={2} style={groupHeaderStyle} />
            {groups.map((group) => (
              <Table.Th key={group.key} colSpan={group.span} ta="center" style={groupHeaderStyle}>
                {group.label}
              </Table.Th>
            ))}
            <Table.Th rowSpan={2} ta="center" style={groupHeaderStyle}>
              פונה
            </Table.Th>
            <Table.Th rowSpan={2} ta="center" style={groupHeaderStyle}>
              <Text fz="0.68rem" lh={1.25}>
                עדכן תרופה/מדדים
              </Text>
            </Table.Th>
          </Table.Tr>
          <Table.Tr>
            {fields.map((field) => (
              <Table.Th key={field.key}>{tier === "compact" ? field.short : field.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {casualties.map((casualty) => (
            <CasualtyRow
              key={casualty.id}
              eventId={eventId}
              casualty={casualty}
              fields={fields}
              overflow={overflow}
              columnCount={columnCount}
              isOpen={openCasualtyId === casualty.id}
              onToggleOpen={() =>
                setOpenInjuryId((current) => (current === casualty.id ? null : casualty.id))
              }
              rowError={rowErrorById[casualty.id]}
              isSaving={Boolean(savingById[casualty.id])}
              onOpenRecords={() => onOpenRecords(casualty)}
              onToggleEvacuated={onToggleEvacuated}
            />
          ))}

          {/* Full-span so the create form can never widen the table, and so one
              layout serves every tier. */}
          {isAdding && (
            <Table.Tr
              style={{
                backgroundColor: "color-mix(in srgb, var(--app-color-primary) 10%, transparent)",
              }}
            >
              <Table.Td colSpan={columnCount} p="md">
                <NewCasualtyForm eventId={eventId} onDone={() => onAddingChange(false)} />
              </Table.Td>
            </Table.Tr>
          )}

          {casualties.length === 0 && !isAdding && (
            <Table.Tr>
              <Table.Td colSpan={columnCount} c="var(--app-color-text-muted)" ta="center">
                {emptyMessage}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Box>
  );
};

export default MedicCasualtiesTable;
