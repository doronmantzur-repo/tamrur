// React
import { Fragment, useState } from "react";

// External libraries
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Popover,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronsDown,
  IconChevronsUp,
  IconChevronUp,
  IconFilter,
  IconFilterFilled,
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
import { URGENCY_FILTER_OPTIONS } from "../../constants/casualtyStatus";
import { MONO_FONT } from "./formStyles";
import { useCellSave } from "./useCellSave";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const groupHeaderStyle = {
  backgroundColor: "var(--app-color-surface-high)",
  color: "var(--app-color-text-muted)",
};

/**
 * The urgency filter popover's "נקה סינון" (clear filter) button — same
 * treatment as the brigade tables' equivalent (`ColumnHeader.jsx`'s
 * `ClearFilterButton`): hover/press feedback is real state (`useHoverState`
 * + local `isPressed`), not CSS `&:hover`/`&:active` keys inside Mantine's
 * `styles` prop, which flattens straight into a plain inline `style`
 * attribute here and silently drops pseudo-selectors. Stays disabled (not
 * conditionally unrendered) while nothing is selected, matching this
 * popover's existing convention — a disabled native button never fires
 * mouse events, so `isHovered` naturally never goes true in that state.
 *
 * @param {{ onClick: () => void, disabled: boolean }} props
 * @returns {JSX.Element} The clear-filter button.
 */
function ClearFilterButton({ onClick, disabled }) {
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Button
      size="compact-xs"
      variant="subtle"
      disabled={disabled}
      onClick={onClick}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      styles={{
        root: {
          backgroundColor: "transparent",
          color: isHovered ? "var(--app-color-primary)" : "var(--app-color-text-muted)",
          textDecoration: isHovered ? "underline" : "none",
          transform: isPressed ? "scale(0.95)" : isHovered ? "scale(1.05)" : "scale(1)",
          transition: "color 0.15s ease, transform 0.15s ease",
        },
      }}
    >
      נקה סינון
    </Button>
  );
}

/**
 * The urgency column's own multi-select filter, opened from its header.
 *
 * Lives in the header rather than in a toolbar so the control sits on the
 * column it filters. The trigger fills in and shows a count once anything is
 * ticked, so a filtered table can never look like the whole table.
 *
 * @param {{ selected: Array<string>, onChange: (selected: Array<string>) => void }} props
 * @returns {JSX.Element} The header filter.
 */
const UrgencyHeaderFilter = ({ selected, onChange }) => {
  const isFiltering = selected.length > 0;
  const [isHovered, hoverHandlers] = useHoverState();

  // Same 4-state glyph/color treatment as the brigade board's per-column
  // filter icon (ColumnHeader.jsx / QueueColumn.jsx's QueueFilterRow) —
  // outline -> filled glyph swap plus a color/background transition, in
  // primary/gold since clicking this icon always opens the filter popover
  // rather than clearing directly (the popover has its own "נקה סינון"
  // button for that).
  let icon;
  let iconColor;
  let backgroundColor = "transparent";

  if (isFiltering) {
    icon = <IconFilterFilled size={14} />;
    if (isHovered) {
      backgroundColor = "var(--app-color-primary)";
      iconColor = "var(--app-color-primary-text)";
    } else {
      iconColor = "var(--app-color-primary)";
    }
  } else if (isHovered) {
    icon = <IconFilterFilled size={14} />;
    iconColor = "var(--app-color-primary)";
  } else {
    icon = <IconFilter size={14} />;
    iconColor = "var(--app-color-text-muted)";
  }

  return (
    <Popover position="bottom" withArrow shadow="md" withinPortal trapFocus>
      <Popover.Target>
        <ActionIcon
          aria-label={isFiltering ? `סנן דחיפות (${selected.length} נבחרו)` : "סנן דחיפות"}
          title={isFiltering ? `סנן דחיפות (${selected.length} נבחרו)` : "סנן דחיפות"}
          variant="subtle"
          size="1.4rem"
          {...hoverHandlers}
          styles={{
            root: {
              backgroundColor,
              color: iconColor,
              transition: "background-color 0.15s ease, color 0.15s ease",
            },
          }}
        >
          {icon}
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown
        p="sm"
        style={{
          backgroundColor: "var(--app-color-surface)",
          borderColor: "var(--app-color-border)",
        }}
      >
        {/* dir=rtl so the checkbox sits to the right of its label, matching
            every other control on the page. */}
        <Stack gap="xs" dir="rtl">
          <Checkbox.Group value={selected} onChange={onChange}>
            <Stack gap={6}>
              {URGENCY_FILTER_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  color="var(--app-color-primary)"
                  styles={{ label: { fontSize: "0.8rem", color: "var(--app-color-text)" } }}
                />
              ))}
            </Stack>
          </Checkbox.Group>

          <ClearFilterButton onClick={() => onChange([])} disabled={!isFiltering} />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

/**
 * The second header row's label cells for the two ungrouped columns.
 *
 * The field labels beside them are single-line, so they centre without help;
 * these two have to be centred explicitly, because "עדכן תרופה/מדדים" wraps and
 * would otherwise sit top-aligned against its taller neighbours.
 */
const labelHeaderStyle = {
  verticalAlign: "middle",
  lineHeight: 1.25,
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
      <ActionIcon aria-label="עדכן תרופה/מדדים" variant="subtle" onClick={onOpenRecords}>
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
          <Table.Td key={field.key} className={field.centered ? "medic-cell-center" : undefined}>
            {renderCell(field, casualty, save)}
          </Table.Td>
        ))}

        <Table.Td className="medic-cell-center">
          <Checkbox
            aria-label={casualty.is_evacuated ? "בטל סימון פונה" : "סמן כפונה"}
            title={casualty.is_evacuated ? "בטל סימון פונה" : "סמן כפונה"}
            checked={Boolean(casualty.is_evacuated)}
            onChange={(event) => onToggleEvacuated(casualty, event.currentTarget.checked)}
            color="var(--app-color-primary)"
            styles={{ input: { cursor: "pointer" } }}
          />
        </Table.Td>

        <Table.Td className="medic-cell-center">
          <CasualtyActions rowError={rowError} isSaving={isSaving} onOpenRecords={onOpenRecords} />
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
 *   hideReadyForEvac?: boolean,
 *   urgencyFilter?: Array<string>,
 *   onUrgencyFilterChange?: (selected: Array<string>) => void,
 * }} props
 * @returns {JSX.Element} The casualty table.
 *
 * `hideReadyForEvac` drops the מוכן לפינוי column. Set it on the evacuated
 * list, where "ready to be evacuated" is a question already answered — the
 * column is presentation only, so the field is still stored and still edited
 * from the active table.
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
  hideReadyForEvac = false,
  urgencyFilter = [],
  onUrgencyFilterChange,
}) => {
  // Only one detail row is open at a time, mirroring the brigade table.
  // A set rather than a single id: "expand all" has no meaning in a
  // one-at-a-time accordion. Rows opened individually and rows opened by the
  // global toggle live in the same place, so the two stay in step.
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const rowErrorById = useSelector((state) => state.casualties.rowErrorById);
  const savingById = useSelector((state) => state.casualties.savingById);

  const visibleIds = casualties.map((casualty) => casualty.id);
  const allExpanded = visibleIds.length > 0 && visibleIds.every((id) => expandedIds.has(id));

  /**
   * Opens or closes one row, leaving the others alone.
   *
   * @param {string} casualtyId
   * @returns {void}
   */
  function toggleRow(casualtyId) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(casualtyId)) next.delete(casualtyId);
      else next.add(casualtyId);
      return next;
    });
  }

  /**
   * Opens every row currently rendered, or closes all of them.
   *
   * Only the rows on screen are added — a casualty that arrives later from a
   * poll stays collapsed rather than springing open under the medic.
   *
   * @returns {void}
   */
  function toggleAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(visibleIds));
  }

  // Dropped from the visible columns *and* the overflow panel: filtering only
  // the former would relocate the column into the expanded detail row on the
  // compact tier rather than hide it.
  const keep = (list) =>
    hideReadyForEvac ? list.filter((field) => field.key !== "evac-ready") : list;

  const fields = keep(visibleFields(tier));
  const overflow = keep(hiddenFields(tier));
  // Spans are counted from the fields actually rendered, so דגשים לפינוי
  // narrows by one on its own; the null-width פציעות column absorbs the freed
  // 52px, which keeps the table full-width without any hand-tuned widths.
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
            <Table.Th rowSpan={2} ta="center" style={groupHeaderStyle}>
              <Tooltip label={allExpanded ? "סגור הכל" : "פתח הכל"}>
                <ActionIcon
                  aria-label={allExpanded ? "סגור הכל" : "פתח הכל"}
                  variant="subtle"
                  onClick={toggleAll}
                  disabled={visibleIds.length === 0}
                >
                  {allExpanded ? (
                    <IconChevronsUp size={18} color="var(--app-color-primary)" />
                  ) : (
                    <IconChevronsDown size={18} color="var(--app-color-primary)" />
                  )}
                </ActionIcon>
              </Tooltip>
            </Table.Th>
            {groups.map((group) => (
              <Table.Th key={group.key} colSpan={group.span} ta="center" style={groupHeaderStyle}>
                {group.label}
              </Table.Th>
            ))}
            {/* פונה and the actions column belong to no group, but they still
                sit in the group band so the header keeps one unbroken row of
                surface-high across its full width. Their labels live in the
                second row with every other column label, rather than spanning
                both rows. */}
            <Table.Th style={groupHeaderStyle} aria-hidden />
            <Table.Th style={groupHeaderStyle} aria-hidden />
          </Table.Tr>
          <Table.Tr>
            {fields.map((field) => (
              <Table.Th key={field.key} ta={field.centered ? "center" : undefined}>
                {field.key === "urgency" && onUrgencyFilterChange ? (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <span>{tier === "compact" ? field.short : field.header}</span>
                    <UrgencyHeaderFilter
                      selected={urgencyFilter}
                      onChange={onUrgencyFilterChange}
                    />
                  </Group>
                ) : tier === "compact" ? (
                  field.short
                ) : (
                  field.header
                )}
              </Table.Th>
            ))}
            <Table.Th ta="center" style={labelHeaderStyle}>
              פונה
            </Table.Th>
            {/* Two lines at the table's normal header size, rather than one line
                shrunk until it fits the 96px column.
                The slash ends the first line rather than starting the second: it
                is a bidi-neutral character, so on its own at the head of an RTL
                line it gets reordered to the far end and the label reads
                "עדכן תרופה מדדים /". Kept inside the first line's run, it stays
                put. */}
            <Table.Th ta="center" style={labelHeaderStyle}>
              עדכן תרופה/
              <br />
              מדדים
            </Table.Th>
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
              isOpen={expandedIds.has(casualty.id)}
              onToggleOpen={() => toggleRow(casualty.id)}
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
