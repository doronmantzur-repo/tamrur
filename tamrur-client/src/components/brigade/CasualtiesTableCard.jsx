// React
import { useMemo, useState } from "react";

// External libraries
import { Badge, Box, Table } from "@mantine/core";
import { IconBandage, IconCheck, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import {
  EVAC_ABILITY_LABELS,
  URGENCY_LABELS,
  URGENCY_ORDER,
  urgencyBadgeColors,
  urgencyLabel,
} from "../../constants/casualtyStatus";
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
  urgency: (casualty) => casualty.urgency,
  "evac-ability": (casualty) => casualty["evac-ability"],
  "evac-priority": (casualty) => casualty["evac-priority"],
  escort: (casualty) => Boolean(casualty.escort),
  "recommended-evac-dest": (casualty) => casualty["recommended-evac-dest"] || "—",
  "evac-ready": (casualty) => Boolean(casualty["evac-ready"]),
  created_at: (casualty) => casualty.created_at,
};

/**
 * Renders the full casualties table as its own card, meant to sit beside the
 * event map and the evacuations table. The DB has no link between a casualty
 * and an evacuation, so this only shows the casualty's own fields. Every
 * column is sortable (click header, one active column at a time); every
 * column but the creation time also has a searchable filter pick-list.
 *
 * @param {{ casualties: Array<object> }} props
 * @returns {JSX.Element} The casualties table card.
 */
const CasualtiesTableCard = ({ casualties }) => {
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const priorityOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["evac-priority"]).filter((v) => v != null))].sort(
      (a, b) => a - b,
    );
    return values.map((value) => ({ value: String(value), label: String(value) }));
  }, [casualties]);

  const destOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["recommended-evac-dest"] || "—"))];
    return values.map((value) => ({ value, label: value }));
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
          {visibleCasualties.length} מתוך {casualties.length}
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
            {visibleCasualties.map((casualty, index) => (
              <Table.Tr key={casualty.id} className="app-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                <Table.Td>
                  <Badge
                    styles={{
                      root: {
                        ...urgencyBadgeColors(casualty.urgency),
                      },
                    }}
                  >
                    {urgencyLabel(casualty.urgency)}
                  </Badge>
                </Table.Td>
                <Table.Td>{EVAC_ABILITY_LABELS[casualty["evac-ability"]] || "—"}</Table.Td>
                <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                  {casualty["evac-priority"] ?? "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={casualty.escort} />
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)">
                  {casualty["recommended-evac-dest"] || "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={casualty["evac-ready"]} />
                </Table.Td>
                <Table.Td
                  c="var(--app-color-text-muted)"
                  ff='ui-monospace, "SF Mono", "Consolas", monospace'
                >
                  {casualty.created_at ? timeFormatter.format(new Date(casualty.created_at)) : "—"}
                </Table.Td>
              </Table.Tr>
            ))}
            {visibleCasualties.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} c="var(--app-color-text-muted)" ta="center">
                  {casualties.length === 0 ? "לא נרשמו נפגעים באירוע זה" : "אין נפגעים התואמים לסינון"}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default CasualtiesTableCard;
