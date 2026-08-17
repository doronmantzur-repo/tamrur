// React
import { useMemo, useState } from "react";

// External libraries
import { Badge, Box, Table } from "@mantine/core";
import { useNavigate } from "react-router-dom";

// Internal application modules
import ColumnHeader from "../dashboard/ColumnHeader";
import { EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';
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
 * A flat, sortable and filterable list of every event visible on the queue
 * board's currently selected date — the table view alongside the map and
 * kanban views still to come. Read-only: clicking a row opens that event's
 * single-event dashboard, matching how a kanban card or map marker will
 * open it too.
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
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--app-color-surface)",
        border: "1px solid var(--app-color-border)",
        borderRadius: "var(--mantine-radius-sm)",
        overflow: "hidden",
      }}
    >
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table verticalSpacing="xs" fz="sm" style={{ width: "100%" }}>
          <Table.Thead>
            <Table.Tr>
              <ColumnHeader label="שם אירוע" {...sortProps("name")} />
              <ColumnHeader label="סוג" {...sortProps("type")} {...filterProps("type", TYPE_FILTER_OPTIONS)} />
              <ColumnHeader label="סטטוס" {...sortProps("status")} {...filterProps("status", STATUS_FILTER_OPTIONS)} />
              <ColumnHeader label="נפתח" {...sortProps("created_at")} />
              <ColumnHeader label="נסגר" {...sortProps("closure_at")} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((event) => (
              <Table.Tr
                key={event.id}
                className="app-fade-in"
                onClick={() => navigate(`/brigade/${event.id}`)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td fw={600}>{event.name}</Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    variant="outline"
                    styles={{
                      root: {
                        backgroundColor: "var(--app-color-surface-high)",
                        borderColor: "var(--app-color-border)",
                        color: "var(--app-color-text-muted)",
                      },
                    }}
                  >
                    {EVENT_TYPE_LABELS[event.type] || event.type}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="sm"
                    styles={{
                      root: {
                        backgroundColor: `color-mix(in srgb, ${EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)"} 16%, transparent)`,
                        color: EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)",
                      },
                    }}
                  >
                    {EVENT_STATUS_LABELS[event.status] || event.status}
                  </Badge>
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT}>
                  {dateTimeFormatter.format(new Date(event.created_at))}
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT}>
                  {event.closure_at ? dateTimeFormatter.format(new Date(event.closure_at)) : "פעיל"}
                </Table.Td>
              </Table.Tr>
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
    </Box>
  );
};

export default EventQueueTable;
