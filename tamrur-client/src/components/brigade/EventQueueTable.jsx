// React
import { useMemo, useState } from "react";

// External libraries
import { Badge, Box, Table } from "@mantine/core";
import { useNavigate } from "react-router-dom";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import { EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

/** Truncates overflowing cell content with an ellipsis instead of wrapping — the fixed column widths below need this, since a value wider than its column would otherwise wrap and grow the row. The full value is still available via each cell's `title` tooltip on hover. */
const ELLIPSIS_STYLE = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const dateTimeFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const TYPE_FILTER_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_FILTER_OPTIONS = Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/** Accessors used for both sorting and filter-value matching (filter matching always compares as strings). */
const COLUMN_ACCESSORS = {
  name: (event) => event.name,
  type: (event) => event.type,
  status: (event) => event.status,
  created_at: (event) => new Date(event.created_at).getTime(),
  closure_at: (event) => (event.closure_at ? new Date(event.closure_at).getTime() : null),
};

/**
 * One clickable row — hover and press feedback are real state
 * (`useHoverState` + `onMouseDown`/`onMouseUp`, `onMouseLeave` resetting
 * both) rather than a `styles` "&:hover"/"&:active" key, since Mantine's
 * `styles` prop merges straight into an inline `style` attribute where
 * pseudo-selectors are never compiled into real CSS. Isolated in its own
 * component so each row's hover/press state doesn't leak into its
 * siblings — hooks can't run inside the parent's `.map()` either way.
 *
 * The background lives on every `<Table.Td>`, not the `<Table.Tr>` — the
 * table has `border-collapse: collapse` (the app's own table reset), and
 * under that a `<tr>` isn't a real paintable box, so a radius set there
 * squares off instead of clipping the row's background. Rounding just the
 * outer two cells' outer corners (logical `border-*-*-radius`, so it's
 * correct in this RTL layout without hardcoding a side) reads as one
 * rounded row instead.
 *
 * @param {{ event: object, index: number, onOpen: () => void }} props
 * @returns {JSX.Element} The table row.
 */
function EventRow({ event, index, onOpen }) {
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  const backgroundColor = isPressed
    ? "color-mix(in srgb, var(--app-color-primary) 16%, var(--app-effect-hover-background))"
    : isHovered
      ? "var(--app-effect-hover-background)"
      : "transparent";
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
    <Table.Tr
      className="app-fade-in"
      onClick={onOpen}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{ animationDelay: `${index * 30}ms`, cursor: "pointer" }}
    >
      <Table.Td fw={600} style={{ ...firstCellStyle, ...ELLIPSIS_STYLE }} title={event.name}>
        {event.name}
      </Table.Td>
      <Table.Td style={cellStyle} title={EVENT_TYPE_LABELS[event.type] || event.type}>
        <Badge
          size="sm"
          variant="outline"
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
              maxWidth: "100%",
              overflow: "hidden",
            },
            label: ELLIPSIS_STYLE,
          }}
        >
          {EVENT_TYPE_LABELS[event.type] || event.type}
        </Badge>
      </Table.Td>
      <Table.Td style={cellStyle} title={EVENT_STATUS_LABELS[event.status] || event.status}>
        <Badge
          size="sm"
          styles={{
            root: {
              backgroundColor: `color-mix(in srgb, ${EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)"} 16%, transparent)`,
              color: EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)",
              maxWidth: "100%",
              overflow: "hidden",
            },
            label: ELLIPSIS_STYLE,
          }}
        >
          {EVENT_STATUS_LABELS[event.status] || event.status}
        </Badge>
      </Table.Td>
      <Table.Td
        c="var(--app-color-text-muted)"
        ff={MONO_FONT}
        style={{ ...cellStyle, ...ELLIPSIS_STYLE }}
        title={dateTimeFormatter.format(new Date(event.created_at))}
      >
        {dateTimeFormatter.format(new Date(event.created_at))}
      </Table.Td>
      <Table.Td
        c="var(--app-color-text-muted)"
        ff={MONO_FONT}
        style={{ ...lastCellStyle, ...ELLIPSIS_STYLE }}
        title={event.closure_at ? dateTimeFormatter.format(new Date(event.closure_at)) : "פעיל"}
      >
        {event.closure_at ? dateTimeFormatter.format(new Date(event.closure_at)) : "פעיל"}
      </Table.Td>
    </Table.Tr>
  );
}

/**
 * A flat, sortable and filterable list of every event visible on the queue
 * board's currently selected date — the table view alongside the map and
 * kanban views. Read-only: clicking a row opens that event's single-event
 * dashboard, matching how a kanban card or map marker opens it too. Wrapped
 * in `DashboardCard`, the same card chrome (surface, border, gold accent bar,
 * title row) every table on that single-event dashboard already uses
 * (`CasualtiesTableCard`, `EvacuationsTable`), so this page's table reads as
 * the same app rather than a bare bordered box — the outer `Box`'s
 * `flex: 1, minHeight: 0` is what actually makes it fill the page, same as
 * before; `DashboardCard`'s own `fullHeight` just fills that.
 *
 * @param {{ events: Array<object> }} props
 * @returns {JSX.Element} The event queue table.
 */
const EventQueueTable = ({ events }) => {
  const navigate = useNavigate();
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

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

  const rows = useMemo(() => {
    let visible = events.filter((event) =>
      Object.entries(filters).every(([key, values]) => {
        if (!values || values.size === 0) return true;
        return values.has(String(COLUMN_ACCESSORS[key](event)));
      }),
    );

    if (sort.key && sort.direction) {
      const accessor = COLUMN_ACCESSORS[sort.key];
      visible = [...visible].sort((a, b) => compareValues(accessor(a), accessor(b)));
      if (sort.direction === "desc") visible.reverse();
    }

    return visible;
  }, [events, filters, sort]);

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
    <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <DashboardCard
        title="אירועים"
        padding="md"
        gap="sm"
        fullHeight
        headerExtra={
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
            {rows.length} מתוך {events.length}
          </Badge>
        }
      >
        <Box style={{ flex: 1, minHeight: 0, overflow: "auto", scrollbarGutter: "stable" }}>
          {/* table-layout: fixed + an explicit width per column keeps column
              widths constant regardless of what's rendered in the body —
              including the spanning "no results" row shown when a filter
              matches nothing, which under the default auto layout would
              otherwise resize every column. Headers are also sticky
              (`sticky` on each ColumnHeader) so they stay visible while
              scrolling a long, filtered list. */}
          <Table verticalSpacing="sm" fz="sm" style={{ width: "100%", tableLayout: "fixed" }}>
            <Table.Thead>
              <Table.Tr>
                <ColumnHeader label="שם אירוע" w="12rem" sticky {...sortProps("name")} />
                <ColumnHeader
                  label="סוג"
                  w="7rem"
                  sticky
                  {...sortProps("type")}
                  {...filterProps("type", TYPE_FILTER_OPTIONS)}
                />
                <ColumnHeader
                  label="סטטוס"
                  w="8rem"
                  sticky
                  {...sortProps("status")}
                  {...filterProps("status", STATUS_FILTER_OPTIONS)}
                />
                <ColumnHeader label="נפתח" w="8.5rem" sticky {...sortProps("created_at")} />
                <ColumnHeader label="נסגר" w="8.5rem" sticky {...sortProps("closure_at")} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((event, index) => (
                <EventRow key={event.id} event={event} index={index} onOpen={() => navigate(`/brigade/${event.id}`)} />
              ))}
              {rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} c="var(--app-color-text-muted)" ta="center" py="xl">
                    {events.length === 0 ? "אין אירועים להצגה בתאריך זה" : "אין אירועים התואמים לסינון"}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </DashboardCard>
    </Box>
  );
};

export default EventQueueTable;
