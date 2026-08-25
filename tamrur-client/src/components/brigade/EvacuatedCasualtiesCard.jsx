// React
import { useMemo, useState } from "react";

// External libraries
import { Badge, Box, Table } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import { URGENCY_LABELS, URGENCY_ORDER, urgencyBadgeColors, urgencyLabel } from "../../constants/casualtyStatus";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

const URGENCY_FILTER_OPTIONS = URGENCY_ORDER.map((key) => ({ value: key, label: URGENCY_LABELS[key] }));

/** Accessors used for both sorting and filter-value matching (filter matching always compares as strings). */
const COLUMN_ACCESSORS = {
  "casualty-number": (casualty) => casualty["casualty-number"],
  urgency: (casualty) => casualty.urgency,
  "evac-priority": (casualty) => casualty["evac-priority"],
  evacuated_at: (casualty) => (casualty.evacuated_at ? new Date(casualty.evacuated_at).getTime() : null),
};

/**
 * One evacuated-casualty row — hover is real state (`useHoverState`) rather
 * than a `styles` "&:hover" key, since Mantine's `styles` prop merges into
 * an inline `style` attribute where pseudo-selectors are never compiled
 * into real CSS. Isolated in its own component so each row's hover state
 * doesn't leak into its siblings, since hooks can't run inside the
 * parent's `.map()` either way.
 *
 * The background lives on every `<Table.Td>`, not the `<Table.Tr>` — this
 * table has `border-collapse: collapse` (the app's own table reset), and
 * under that a `<tr>` isn't a real paintable box, so a radius set there
 * squares off instead of clipping the row's background. Rounding just the
 * outer two cells' outer corners (logical `border-*-*-radius`, so it's
 * correct in this RTL layout without hardcoding a side) reads as one
 * rounded row instead.
 *
 * @param {{ casualty: object }} props
 * @returns {JSX.Element} The row.
 */
function EvacuatedCasualtyRow({ casualty }) {
  const [isHovered, hoverHandlers] = useHoverState();

  const backgroundColor = isHovered ? "var(--app-effect-hover-background)" : "transparent";
  const cellStyle = { backgroundColor, transition: "background-color 0.15s ease" };
  const firstCellStyle = {
    ...cellStyle,
    borderStartStartRadius: "var(--mantine-radius-sm)",
    borderEndStartRadius: "var(--mantine-radius-sm)",
  };
  const lastCellStyle = {
    ...cellStyle,
    borderStartEndRadius: "var(--mantine-radius-sm)",
    borderEndEndRadius: "var(--mantine-radius-sm)",
  };

  return (
    <Table.Tr className="app-fade-in" {...hoverHandlers}>
      <Table.Td ff={MONO_FONT} style={firstCellStyle}>
        {casualty["casualty-number"] ?? "—"}
      </Table.Td>
      <Table.Td style={cellStyle}>
        <Badge
          size="sm"
          styles={{
            root: { ...urgencyBadgeColors(casualty.urgency) },
          }}
        >
          {urgencyLabel(casualty.urgency)}
        </Badge>
      </Table.Td>
      <Table.Td ff={MONO_FONT} style={cellStyle}>
        {casualty["evac-priority"] ?? "—"}
      </Table.Td>
      <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT} style={lastCellStyle}>
        {casualty.evacuated_at ? timeFormatter.format(new Date(casualty.evacuated_at)) : "—"}
      </Table.Td>
    </Table.Tr>
  );
}

/**
 * Renders a compact, read-only reference table of already-evacuated
 * casualties, stacked under EvacuationsTable — the counterpart to
 * CasualtiesTableCard (which shows only not-yet-evacuated ones), mirroring
 * the medic page's own active/evacuated split. Deliberately smaller than
 * the other tables: just enough to answer "who's been evacuated and when,"
 * not a working table (no expand-per-row, no editing — those live on the
 * medic page, which owns this data). `casualty-number`, `urgency`, and
 * `evac-priority` are all sortable and filterable, matching the other
 * brigade tables (`evac-priority` mirrors CasualtiesTableCard's own column
 * of the same name); `evacuated_at` is sort-only (a timestamp isn't a
 * useful filter category) — it's the one piece of information this view
 * adds that nothing else on the page shows.
 *
 * @param {{ casualties: Array<object> }} props
 * @returns {JSX.Element} The evacuated-casualties card.
 */
const EvacuatedCasualtiesCard = ({ casualties }) => {
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const numberOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["casualty-number"]).filter((v) => v != null))].sort(
      (a, b) => a - b,
    );
    return values.map((value) => ({ value: String(value), label: String(value) }));
  }, [casualties]);

  const priorityOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["evac-priority"]).filter((v) => v != null))].sort(
      (a, b) => a - b,
    );
    return values.map((value) => ({ value: String(value), label: String(value) }));
  }, [casualties]);

  const handleSortClick = (key) => {
    setSort((prev) => ({ key, direction: prev.key === key ? nextSortDirection(prev.direction) : "asc" }));
  };

  const handleToggleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: toggleSetValue(prev[key] || new Set(), value) }));
  };

  const handleClearFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const visibleCasualties = useMemo(() => {
    let rows = casualties.filter((casualty) =>
      Object.entries(filters).every(([key, values]) => {
        if (!values || values.size === 0) return true;
        return values.has(String(COLUMN_ACCESSORS[key](casualty)));
      }),
    );

    if (sort.key && sort.direction) {
      const accessor = COLUMN_ACCESSORS[sort.key];
      rows = [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)));
      if (sort.direction === "desc") rows.reverse();
    }

    return rows;
  }, [casualties, filters, sort]);

  const sortProps = (key) => ({
    sortDirection: sort.key === key ? sort.direction : null,
    onSortClick: () => handleSortClick(key),
  });

  const filterProps = (key, options) => ({
    filterOptions: options,
    activeFilterValues: filters[key],
    onToggleFilterValue: (value) => handleToggleFilter(key, value),
    onClearFilter: () => handleClearFilter(key),
  });

  return (
    <DashboardCard
      title="נפגעים שפונו"
      padding="sm"
      gap="xs"
      fullHeight
      headerExtra={
        <Badge
          leftSection={<IconCheck size={12} />}
          variant="outline"
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
            },
          }}
        >
          {visibleCasualties.length} מתוך {casualties.length}
        </Badge>
      }
    >
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {/* Explicit width prevents this table (only 4 narrow columns) from
            shrinking to its natural content width and — since the page is
            RTL — snapping flush to the right edge of its container with
            empty space on the left, instead of filling the card evenly. */}
        <Table verticalSpacing={4} fz="xs" style={{ width: "100%" }}>
          <Table.Thead>
            <Table.Tr>
              <ColumnHeader
                label="מס' פצוע"
                {...sortProps("casualty-number")}
                {...filterProps("casualty-number", numberOptions)}
              />
              <ColumnHeader
                label="דחיפות"
                {...sortProps("urgency")}
                {...filterProps("urgency", URGENCY_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="עדיפות לפינוי"
                {...sortProps("evac-priority")}
                {...filterProps("evac-priority", priorityOptions)}
              />
              <ColumnHeader label="שעת פינוי" {...sortProps("evacuated_at")} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleCasualties.map((casualty) => (
              <EvacuatedCasualtyRow key={casualty.id} casualty={casualty} />
            ))}
            {visibleCasualties.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} c="var(--app-color-text-muted)" ta="center">
                  {casualties.length === 0 ? "טרם פונו נפגעים" : "אין נפגעים התואמים לסינון"}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default EvacuatedCasualtiesCard;
