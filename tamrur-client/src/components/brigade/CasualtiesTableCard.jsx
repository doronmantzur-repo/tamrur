// React
import { Fragment, useMemo, useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Group, Stack, Table, Text } from "@mantine/core";
import {
  IconBandage,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import {
  ESCORT_TYPE_LABELS,
  EVAC_ABILITY_LABELS,
  normalizeTreatments,
  URGENCY_LABELS,
  URGENCY_ORDER,
  urgencyBadgeColors,
  urgencyLabel,
  VENTILATION_LABELS,
} from "../../constants/casualtyStatus";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

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
const VENTILATION_FILTER_OPTIONS = Object.keys(VENTILATION_LABELS).map((key) => ({
  value: key,
  label: VENTILATION_LABELS[key],
}));
const ESCORT_TYPE_FILTER_OPTIONS = Object.keys(ESCORT_TYPE_LABELS).map((key) => ({
  value: key,
  label: ESCORT_TYPE_LABELS[key],
}));

/** Number of columns in the main row: the chevron plus the 8 default-visible fields. */
const COLUMN_COUNT = 9;

/** Accessors used for both sorting and filter-value matching (filter matching always compares as strings). */
const COLUMN_ACCESSORS = {
  "casualty-number": (casualty) => casualty["casualty-number"],
  urgency: (casualty) => casualty.urgency,
  "evac-priority": (casualty) => casualty["evac-priority"],
  "evac-ability": (casualty) => casualty["evac-ability"],
  ventilation: (casualty) => casualty.ventilation,
  "escort-type": (casualty) => casualty["escort-type"],
  helivac: (casualty) => Boolean(casualty.helivac),
  "evac-ready": (casualty) => Boolean(casualty["evac-ready"]),
};

/**
 * Renders a casualty's fields that don't fit the default row, disclosed
 * beneath it when the chevron is opened — same pattern the medic page's
 * casualties table uses for its own overflow fields, but read-only here.
 *
 * @param {{ casualty: object }} props
 * @returns {JSX.Element} The expanded detail panel.
 */
function CasualtyDetails({ casualty }) {
  const treatments = normalizeTreatments(casualty.treatments);

  return (
    <Group align="flex-start" gap="xl" wrap="wrap">
      <Stack gap={2} style={{ flex: 2, minWidth: "12rem" }}>
        <Text fz="0.68rem" c="var(--app-color-text-muted)">
          פציעות
        </Text>
        <Text fz="sm">{casualty.description || "—"}</Text>
      </Stack>

      <Stack gap={2}>
        <Text fz="0.68rem" c="var(--app-color-text-muted)">
          קדימות לטיפול
        </Text>
        <Text fz="sm" ff={MONO_FONT}>
          {casualty["treatment-priority"] ?? "—"}
        </Text>
      </Stack>

      <Stack gap={2} style={{ flex: 1, minWidth: "10rem" }}>
        <Text fz="0.68rem" c="var(--app-color-text-muted)">
          טיפולים
        </Text>
        {treatments.length === 0 ? (
          <Text fz="sm" c="var(--app-color-text-muted)">
            —
          </Text>
        ) : (
          <Stack gap={4}>
            {treatments.map((treatment, index) => (
              <Group key={index} gap={6} wrap="nowrap">
                {treatment.done ? (
                  <IconCheck size={14} color="var(--app-color-success)" />
                ) : (
                  <IconX size={14} color="var(--app-color-text-muted)" />
                )}
                <Text fz="sm">{treatment.text}</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Group>
  );
}

/**
 * Renders the full casualties table as its own card, meant to sit beside the
 * event map and the evacuations table. Expects only not-yet-evacuated
 * casualties — the caller (EventDashboardPage) splits the full list in two,
 * same as the medic page's own active/evacuated split; already-evacuated
 * casualties get their own read-only card instead (see
 * `EvacuatedCasualtiesCard`, stacked under EvacuationsTable), so there's no
 * "פונה" column here — every row in this table is implicitly not evacuated.
 * Every default column is sortable (click header, one active column at a
 * time) and filterable via a searchable pick-list. The columns the paper
 * form treats as secondary (פציעות, טיפולים, קדימות לטיפול) live in a
 * per-row detail panel disclosed by the chevron, rather than cluttering the
 * default view.
 *
 * @param {{ casualties: Array<object> }} props
 * @returns {JSX.Element} The casualties table card.
 */
const CasualtiesTableCard = ({ casualties }) => {
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleRow = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const priorityOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["evac-priority"]).filter((v) => v != null))].sort(
      (a, b) => a - b,
    );
    return values.map((value) => ({ value: String(value), label: String(value) }));
  }, [casualties]);

  const numberOptions = useMemo(() => {
    const values = [...new Set(casualties.map((casualty) => casualty["casualty-number"]).filter((v) => v != null))].sort(
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
              <Table.Th />
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
              <ColumnHeader
                label="יכולת פינוי"
                {...sortProps("evac-ability")}
                {...filterProps("evac-ability", ABILITY_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="מונשם"
                {...sortProps("ventilation")}
                {...filterProps("ventilation", VENTILATION_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="ליווי"
                {...sortProps("escort-type")}
                {...filterProps("escort-type", ESCORT_TYPE_FILTER_OPTIONS)}
              />
              <ColumnHeader label="מוסק" {...sortProps("helivac")} {...filterProps("helivac", BOOL_FILTER_OPTIONS)} />
              <ColumnHeader
                label="מוכן לפינוי"
                {...sortProps("evac-ready")}
                {...filterProps("evac-ready", BOOL_FILTER_OPTIONS)}
              />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleCasualties.map((casualty, index) => {
              const isOpen = expandedIds.has(casualty.id);

              return (
                <Fragment key={casualty.id}>
                  <Table.Tr className="app-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                    <Table.Td>
                      <ActionIcon
                        aria-label={isOpen ? "הסתר פרטים" : "הצג פרטים"}
                        title={isOpen ? "הסתר פרטים" : "הצג פרטים"}
                        variant="subtle"
                        onClick={() => toggleRow(casualty.id)}
                      >
                        {isOpen ? (
                          <IconChevronUp size={18} color="var(--app-color-primary)" />
                        ) : (
                          <IconChevronDown size={18} color="var(--app-color-primary)" />
                        )}
                      </ActionIcon>
                    </Table.Td>
                    <Table.Td ff={MONO_FONT}>{casualty["casualty-number"] ?? "—"}</Table.Td>
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
                    <Table.Td ff={MONO_FONT}>{casualty["evac-priority"] ?? "—"}</Table.Td>
                    <Table.Td>{EVAC_ABILITY_LABELS[casualty["evac-ability"]] || "—"}</Table.Td>
                    <Table.Td>{VENTILATION_LABELS[casualty.ventilation] || "—"}</Table.Td>
                    <Table.Td>{ESCORT_TYPE_LABELS[casualty["escort-type"]] || "—"}</Table.Td>
                    <Table.Td>
                      <YesNo value={casualty.helivac} />
                    </Table.Td>
                    <Table.Td>
                      <YesNo value={casualty["evac-ready"]} />
                    </Table.Td>
                  </Table.Tr>

                  {isOpen && (
                    <Table.Tr>
                      <Table.Td
                        colSpan={COLUMN_COUNT}
                        p="md"
                        style={{ backgroundColor: "var(--app-color-surface-high)" }}
                      >
                        <CasualtyDetails casualty={casualty} />
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              );
            })}
            {visibleCasualties.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={COLUMN_COUNT} c="var(--app-color-text-muted)" ta="center">
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
