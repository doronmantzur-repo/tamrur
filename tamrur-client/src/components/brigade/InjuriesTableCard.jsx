// React
import { useMemo, useState } from "react";

// External libraries
import { Badge, Box, Table } from "@mantine/core";
import { IconBandage, IconCheck, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import { EVAC_ABILITY_LABELS, URGENCY_COLOR_VARS, URGENCY_LABELS, URGENCY_ORDER } from "../../constants/injuryStatus";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

function YesNo({ value }) {
  return value ? (
    <IconCheck size={16} color="var(--app-color-success)" />
  ) : (
    <IconX size={16} color="var(--app-color-text-muted)" />
  );
}

const BOOL_FILTER_OPTIONS = [
  { value: "true", label: "כן" },
  { value: "false", label: "לא" },
];

const URGENCY_FILTER_OPTIONS = URGENCY_ORDER.map((key) => ({ value: key, label: URGENCY_LABELS[key] }));
const ABILITY_FILTER_OPTIONS = Object.keys(EVAC_ABILITY_LABELS).map((key) => ({
  value: key,
  label: EVAC_ABILITY_LABELS[key],
}));

/** Accessors used for both sorting and filter-value matching (filter matching always compares as strings). */
const COLUMN_ACCESSORS = {
  urgency: (injury) => injury.urgency,
  "evac-ability": (injury) => injury["evac-ability"],
  "evac-priority": (injury) => injury["evac-priority"],
  escort: (injury) => Boolean(injury.escort),
  "recommended-evac-dest": (injury) => injury["recommended-evac-dest"] || "—",
  "evac-ready": (injury) => Boolean(injury["evac-ready"]),
  created_at: (injury) => injury.created_at,
};

/**
 * Renders the full injuries table as its own card, meant to sit beside the
 * event map and the evacuations table. The DB has no link between an injury
 * and an evacuation, so this only shows the injury's own fields. Every
 * column is sortable (click header, one active column at a time); every
 * column but the creation time also has a searchable filter pick-list.
 *
 * @param {{ injuries: Array<object> }} props
 * @returns {JSX.Element} The injuries table card.
 */
const InjuriesTableCard = ({ injuries }) => {
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const priorityOptions = useMemo(() => {
    const values = [...new Set(injuries.map((injury) => injury["evac-priority"]).filter((v) => v != null))].sort(
      (a, b) => a - b,
    );
    return values.map((value) => ({ value: String(value), label: String(value) }));
  }, [injuries]);

  const destOptions = useMemo(() => {
    const values = [...new Set(injuries.map((injury) => injury["recommended-evac-dest"] || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [injuries]);

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

  const visibleInjuries = useMemo(() => {
    let rows = injuries.filter((injury) =>
      Object.entries(filters).every(([key, values]) => {
        if (!values || values.size === 0) return true;
        return values.has(String(COLUMN_ACCESSORS[key](injury)));
      }),
    );

    if (sort.key && sort.direction) {
      const accessor = COLUMN_ACCESSORS[sort.key];
      rows = [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)));
      if (sort.direction === "desc") rows.reverse();
    }

    return rows;
  }, [injuries, filters, sort]);

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
      title="נפגעים"
      padding="md"
      gap="sm"
      fullHeight
      headerExtra={
        <Badge
          leftSection={<IconBandage size={12} />}
          variant="outline"
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
            },
          }}
        >
          {visibleInjuries.length} מתוך {injuries.length}
        </Badge>
      }
    >
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <ColumnHeader
                label="דחיפות"
                {...sortProps("urgency")}
                {...filterProps("urgency", URGENCY_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="יכולת פינוי"
                {...sortProps("evac-ability")}
                {...filterProps("evac-ability", ABILITY_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="עדיפות"
                {...sortProps("evac-priority")}
                {...filterProps("evac-priority", priorityOptions)}
              />
              <ColumnHeader label="ליווי" {...sortProps("escort")} {...filterProps("escort", BOOL_FILTER_OPTIONS)} />
              <ColumnHeader
                label="יעד מומלץ"
                {...sortProps("recommended-evac-dest")}
                {...filterProps("recommended-evac-dest", destOptions)}
              />
              <ColumnHeader
                label="מוכן לפינוי"
                {...sortProps("evac-ready")}
                {...filterProps("evac-ready", BOOL_FILTER_OPTIONS)}
              />
              <ColumnHeader label="נפתח" {...sortProps("created_at")} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleInjuries.map((injury) => (
              <Table.Tr key={injury.id}>
                <Table.Td>
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
                </Table.Td>
                <Table.Td>{EVAC_ABILITY_LABELS[injury["evac-ability"]] || "—"}</Table.Td>
                <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                  {injury["evac-priority"] ?? "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={injury.escort} />
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)">
                  {injury["recommended-evac-dest"] || "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={injury["evac-ready"]} />
                </Table.Td>
                <Table.Td
                  c="var(--app-color-text-muted)"
                  ff='ui-monospace, "SF Mono", "Consolas", monospace'
                >
                  {injury.created_at ? timeFormatter.format(new Date(injury.created_at)) : "—"}
                </Table.Td>
              </Table.Tr>
            ))}
            {visibleInjuries.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} c="var(--app-color-text-muted)" ta="center">
                  {injuries.length === 0 ? "לא נרשמו נפגעים באירוע זה" : "אין נפגעים התואמים לסינון"}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default InjuriesTableCard;
