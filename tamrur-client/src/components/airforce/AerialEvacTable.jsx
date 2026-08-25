// React
import { Fragment, useMemo, useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Collapse, Divider, Group, Stack, Table, Title, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp, IconClock, IconCopy, IconHelicopter } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import CasualtiesCard from "../dashboard/CasualtiesCard";
import AerialEvacDecisionFooter from "./AerialEvacDecisionFooter";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, getAerialMissionStatus } from "../../constants/aerialEvacStatus";
import { EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { EVAC_ABILITY_COLOR_VARS, EVAC_ABILITY_LABELS, getMostUrgentEvacPriority } from "../../constants/casualtyStatus";
import { toLatLng } from "../../utils/geo";
import { compareValues, nextSortDirection } from "../../utils/tableFilterSort";
import { byDefaultPriority } from "../../utils/aerialEvacRowOrder";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

/** The chevron column plus the 7 data columns. */
const COLUMN_COUNT = 8;

/** Statuses ordered logically, for a stable filter-list order regardless of which ones happen to be present. */
const AERIAL_EVAC_STATUS_ORDER = ["needed", "in_progress", "approved", "denied", "no_needed"];

const TYPE_FILTER_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_FILTER_OPTIONS = Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/** Accessors used for both sorting and filter-value matching (filter matching always compares as strings). */
const COLUMN_ACCESSORS = {
  name: (row) => row.event.name,
  type: (row) => row.event.type,
  status: (row) => row.event.status,
  aerialEvac: (row) => row.aerialStatus,
  casualties: (row) => row.casualties.length,
  elapsed: (row) => new Date(row.event.created_at).getTime(),
};

/**
 * The location cell: click the coordinates to copy them, with a "מיקום הועתק"
 * tooltip confirming it right where you clicked. Isolated in its own
 * component so `useClipboard`'s per-row copied state doesn't leak into
 * every other row — hooks can't run inside the parent's `.map()` either way.
 *
 * @param {{ latLng: { lat: number, lng: number } | null, style?: object }} props
 * @returns {JSX.Element} The location table cell.
 */
function LocationCell({ latLng, style }) {
  const clipboard = useClipboard({ timeout: 1200 });

  if (!latLng) {
    return (
      <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT} style={style}>
        —
      </Table.Td>
    );
  }

  const text = `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`;

  return (
    <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT} style={style}>
      <Tooltip label="מיקום הועתק" opened={clipboard.copied} position="top" withArrow>
        <Group
          gap={4}
          wrap="nowrap"
          onClick={() => clipboard.copy(text)}
          title="העתק מיקום"
          style={{ display: "inline-flex", cursor: "pointer" }}
        >
          <IconCopy size={13} stroke={1.8} />
          {text}
        </Group>
      </Tooltip>
    </Table.Td>
  );
}

/**
 * The elapsed-time cell, isolated in its own component so `useElapsedSeconds`
 * ticks once per row — hooks can't run inside the parent's `.map()`.
 *
 * @param {{ event: object, style?: object }} props
 * @returns {JSX.Element} The elapsed-time table cell.
 */
function ElapsedCell({ event, style }) {
  const seconds = useElapsedSeconds(event.created_at, null);

  return (
    <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT} style={style}>
      <Group gap={6} wrap="nowrap">
        <IconClock size={14} stroke={1.8} />
        {formatDuration(seconds, { showDays: false })}
      </Group>
    </Table.Td>
  );
}

/**
 * One event row (plus its expanded detail row, when open) — hover is real
 * state (`useHoverState`) rather than a `styles` "&:hover" key, since
 * Mantine's `styles` prop merges into an inline `style` attribute where
 * pseudo-selectors are never compiled into real CSS. Isolated in its own
 * component so each row's hover state doesn't leak into its siblings, since
 * hooks can't run inside the parent's `.map()` either way.
 *
 * The background lives on every `<Table.Td>`, not the `<Table.Tr>` — this
 * table has `border-collapse: collapse` (the app's own table reset), and
 * under that a `<tr>` isn't a real paintable box, so a radius set there
 * squares off instead of clipping the row's background (see
 * `EventQueueTable.jsx`'s own row for the same fix). Rounding just the
 * outer two cells' outer corners (logical `border-*-*-radius`, so it's
 * correct in this RTL layout without hardcoding a side) reads as one
 * rounded row instead.
 *
 * @param {{
 *   event: object,
 *   mission: object | undefined,
 *   casualties: Array<object>,
 *   aerialStatus: string,
 *   index: number,
 *   dimmed: boolean,
 *   isRowOpen: boolean,
 *   onToggleRow: () => void,
 * }} props
 * @returns {JSX.Element} The event row (and its detail row, when open).
 */
function EventRow({ event, mission, casualties, aerialStatus, index, dimmed, isRowOpen, onToggleRow }) {
  const [isHovered, hoverHandlers] = useHoverState();

  const evacColor = AERIAL_EVAC_COLOR_VARS[aerialStatus] || "var(--app-color-text-muted)";
  const latLng = toLatLng(event.location);
  const sitCount = casualties.filter((casualty) => casualty["evac-ability"] === "sit").length;
  const lieCount = casualties.filter((casualty) => casualty["evac-ability"] === "lie").length;
  const rowOpacity = dimmed ? 0.7 : 1;

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
    <Fragment>
      <Table.Tr className="app-fade-in" style={{ animationDelay: `${index * 30}ms`, opacity: rowOpacity }} {...hoverHandlers}>
        <Table.Td style={firstCellStyle}>
          <ActionIcon
            aria-label={isRowOpen ? "הסתר פרטים" : "הצג פרטים"}
            title={isRowOpen ? "הסתר פרטים" : "הצג פרטים"}
            variant="subtle"
            onClick={onToggleRow}
          >
            {isRowOpen ? (
              <IconChevronUp size={18} color="var(--app-color-primary)" />
            ) : (
              <IconChevronDown size={18} color="var(--app-color-primary)" />
            )}
          </ActionIcon>
        </Table.Td>

        <Table.Td fw={600} style={cellStyle}>
          {event.name || "אירוע ללא שם"}
        </Table.Td>

        <Table.Td style={cellStyle}>
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

        <Table.Td style={cellStyle}>
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

        <Table.Td style={cellStyle}>
          <Badge
            size="sm"
            leftSection={<IconHelicopter size={12} />}
            styles={{ root: { backgroundColor: `color-mix(in srgb, ${evacColor} 16%, transparent)`, color: evacColor } }}
          >
            {AERIAL_EVAC_LABELS[aerialStatus] || aerialStatus}
          </Badge>
        </Table.Td>

        <Table.Td style={cellStyle}>
          <Group gap={6} wrap="nowrap">
            <Badge
              size="sm"
              styles={{
                root: {
                  backgroundColor: `color-mix(in srgb, ${EVAC_ABILITY_COLOR_VARS.sit} 16%, transparent)`,
                  color: EVAC_ABILITY_COLOR_VARS.sit,
                },
              }}
            >
              {sitCount} {EVAC_ABILITY_LABELS.sit}
            </Badge>
            <Badge
              size="sm"
              styles={{
                root: {
                  backgroundColor: `color-mix(in srgb, ${EVAC_ABILITY_COLOR_VARS.lie} 16%, transparent)`,
                  color: EVAC_ABILITY_COLOR_VARS.lie,
                },
              }}
            >
              {lieCount} {EVAC_ABILITY_LABELS.lie}
            </Badge>
          </Group>
        </Table.Td>

        <LocationCell latLng={latLng} style={cellStyle} />

        <ElapsedCell event={event} style={lastCellStyle} />
      </Table.Tr>

      {isRowOpen && (
        <Table.Tr style={{ opacity: rowOpacity }}>
          <Table.Td colSpan={COLUMN_COUNT} p="md" style={{ backgroundColor: "var(--app-color-surface-high)" }}>
            {/* Same card shell the triage queue uses (surface, border,
                top accent bar colored by the decision) so an expanded
                row reads as the same functionality, just in a
                different layout — not a lighter variant. */}
            <Box
              style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor: "var(--app-color-surface)",
                border: "1px solid var(--app-color-border)",
                borderRadius: "var(--mantine-radius-sm)",
                padding: "var(--mantine-spacing-lg)",
              }}
            >
              <Box
                aria-hidden="true"
                style={{
                  position: "absolute",
                  insetInline: 0,
                  top: 0,
                  height: "4px",
                  backgroundColor:
                    aerialStatus === "approved" || aerialStatus === "denied" ? evacColor : "var(--app-color-primary)",
                }}
              />

              <Stack gap="lg">
                <CasualtiesCard casualties={casualties} statBreakdown="ability" bare rowHover />
                <Divider color="var(--app-color-border)" />
                <AerialEvacDecisionFooter event={event} mission={mission} />
              </Stack>
            </Box>
          </Table.Td>
        </Table.Tr>
      )}
    </Fragment>
  );
}

/**
 * One of the two sections the table splits into — pending or decided — each
 * with its own independent sort *and* filter state, so a column click or a
 * filter pick in one never affects the other. `dimmed` fades every row in
 * this section uniformly (decided) or not at all (pending) — no per-row
 * branch needed since a section is always homogeneous.
 *
 * @param {{
 *   title: string,
 *   rows: Array<object>,
 *   totalCount: number,
 *   emptyMessage: string,
 *   accentColor: string,
 *   dimmed: boolean,
 *   collapsible: boolean,
 *   isOpen: boolean,
 *   onToggleOpen: () => void,
 *   aerialEvacFilterOptions: Array<{ value: string, label: string }>,
 *   showAerialEvacFilter: boolean,
 *   showAerialEvacSort: boolean,
 *   expandedIds: Set<string>,
 *   onToggleRow: (id: string) => void,
 * }} props
 * @returns {JSX.Element} The section's table card.
 */
function EventTableSection({
  title,
  rows: sectionRows,
  totalCount,
  emptyMessage,
  accentColor,
  dimmed,
  collapsible,
  isOpen,
  onToggleOpen,
  aerialEvacFilterOptions,
  showAerialEvacFilter,
  showAerialEvacSort,
  expandedIds,
  onToggleRow,
}) {
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const handleSortClick = (key) => {
    setSort((prev) => ({ key, direction: prev.key === key ? nextSortDirection(prev.direction) : "asc" }));
  };

  const handleToggleFilter = (key, value) => {
    setFilters((prev) => {
      const current = prev[key] || new Set();
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  };

  const handleClearFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const rows = useMemo(() => {
    const filtered = sectionRows.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (!values || values.size === 0) return true;
        return values.has(String(COLUMN_ACCESSORS[key](row)));
      }),
    );

    if (sort.key && sort.direction) {
      const accessor = COLUMN_ACCESSORS[sort.key];
      const sorted = [...filtered].sort((a, b) => compareValues(accessor(a), accessor(b)));
      if (sort.direction === "desc") sorted.reverse();
      return sorted;
    }

    return [...filtered].sort(byDefaultPriority);
  }, [sectionRows, filters, sort]);

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

  const countBadge = (
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
      {rows.length} מתוך {totalCount}
    </Badge>
  );

  const tableBody = (
    <Box style={{ overflowX: "auto" }}>
      <Table verticalSpacing="sm" fz="sm" style={{ width: "100%" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40} />
            <ColumnHeader label="שם אירוע" {...sortProps("name")} />
            <ColumnHeader label="סוג" {...sortProps("type")} {...filterProps("type", TYPE_FILTER_OPTIONS)} />
            <ColumnHeader label="סטטוס" {...sortProps("status")} {...filterProps("status", STATUS_FILTER_OPTIONS)} />
            <ColumnHeader
              label="פינוי אווירי"
              {...(showAerialEvacSort ? sortProps("aerialEvac") : {})}
              {...(showAerialEvacFilter ? filterProps("aerialEvac", aerialEvacFilterOptions) : {})}
            />
            <ColumnHeader label="נפגעים" {...sortProps("casualties")} />
            <ColumnHeader label="מיקום" />
            <ColumnHeader label="זמן מאירוע" {...sortProps("elapsed")} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(({ event, mission, casualties, aerialStatus }, index) => (
            <EventRow
              key={event.id}
              event={event}
              mission={mission}
              casualties={casualties}
              aerialStatus={aerialStatus}
              index={index}
              dimmed={dimmed}
              isRowOpen={expandedIds.has(event.id)}
              onToggleRow={() => onToggleRow(event.id)}
            />
          ))}

          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={COLUMN_COUNT} c="var(--app-color-text-muted)" ta="center" py="xl">
                {emptyMessage}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Box>
  );

  return (
    <DashboardCard
      padding="md"
      gap="sm"
      accentColor={accentColor}
      titleContent={
        collapsible ? (
          <Group
            gap="xs"
            wrap="nowrap"
            onClick={onToggleOpen}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            {isOpen ? (
              <IconChevronUp size={18} color="var(--app-color-text-muted)" />
            ) : (
              <IconChevronDown size={18} color="var(--app-color-text-muted)" />
            )}
            <Title order={2} fz="lg" fw={700} c="var(--app-color-text)">
              {title}
            </Title>
          </Group>
        ) : (
          <Title order={2} fz="lg" fw={700} c="var(--app-color-text)">
            {title}
          </Title>
        )
      }
      headerExtra={countBadge}
    >
      {collapsible ? <Collapse expanded={isOpen}>{tableBody}</Collapse> : tableBody}
    </DashboardCard>
  );
}

/**
 * The airforce page's table view: the same events the triage queue shows,
 * split into two sections — "ממתינות להחלטה" (pending, always open) above
 * "הוכרעו" (decided — approved and denied together, collapsed by default)
 * — so pending events are unmistakable at a glance instead of relying on
 * sort order and dimming alone. A decided event never actually leaves the
 * page's data set (`event["aerial-evac"]` never changes on decision), so
 * the collapse keeps that section from dominating the page as it grows.
 * Every row in either section expands to the same casualty table and
 * approve/deny footer the triage queue offers — this view only changes the
 * layout, not the functionality.
 *
 * The "פינוי אווירי" column and filter read the *mission's* effective status
 * (`getAerialMissionStatus`), not `event["aerial-evac"]` — deciding never
 * changes that field, so it would otherwise show "needed" forever regardless
 * of what was actually decided.
 *
 * @param {{ events: Array<object>, casualtiesByEventId: Record<string, Array<object>>, missionsByEventId: Record<string, Array<object>> }} props
 * @returns {JSX.Element} The events table.
 */
const AerialEvacTable = ({ events, casualtiesByEventId, missionsByEventId }) => {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isDecidedOpen, setIsDecidedOpen] = useState(false);

  const rowsData = useMemo(
    () =>
      events.map((event) => {
        const mission = missionsByEventId[event.id]?.[0];
        const aerialStatus = getAerialMissionStatus(mission);
        const casualties = (casualtiesByEventId[event.id] || []).filter((casualty) => casualty.helivac);
        return {
          event,
          mission,
          casualties,
          aerialStatus,
          isPending: aerialStatus === "needed",
          topPriority: getMostUrgentEvacPriority(casualties),
        };
      }),
    [events, casualtiesByEventId, missionsByEventId],
  );

  const aerialEvacFilterOptions = useMemo(() => {
    const present = new Set(rowsData.map((row) => row.aerialStatus));
    return AERIAL_EVAC_STATUS_ORDER.filter((status) => present.has(status)).map((status) => ({
      value: status,
      label: AERIAL_EVAC_LABELS[status] || status,
    }));
  }, [rowsData]);

  const toggleRow = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { pendingRows, decidedRows } = useMemo(
    () => ({
      pendingRows: rowsData.filter((row) => row.isPending),
      decidedRows: rowsData.filter((row) => !row.isPending),
    }),
    [rowsData],
  );

  const pendingTotal = pendingRows.length;
  const decidedTotal = decidedRows.length;

  const sharedProps = {
    aerialEvacFilterOptions,
    expandedIds,
    onToggleRow: toggleRow,
  };

  return (
    <Stack gap="lg">
      <EventTableSection
        title="ממתינות להחלטה"
        rows={pendingRows}
        totalCount={pendingTotal}
        emptyMessage={pendingTotal === 0 ? "אין אירועים הממתינים לפינוי אווירי" : "אין אירועים התואמים לסינון"}
        accentColor="var(--app-color-warning)"
        dimmed={false}
        collapsible={false}
        showAerialEvacFilter={false}
        showAerialEvacSort={false}
        {...sharedProps}
      />

      <EventTableSection
        title="הוכרעו"
        rows={decidedRows}
        totalCount={decidedTotal}
        emptyMessage={decidedTotal === 0 ? "טרם הוכרעו אירועים" : "אין אירועים התואמים לסינון"}
        accentColor="var(--app-color-text-muted)"
        dimmed
        collapsible
        isOpen={isDecidedOpen}
        onToggleOpen={() => setIsDecidedOpen((current) => !current)}
        showAerialEvacFilter
        showAerialEvacSort
        {...sharedProps}
      />
    </Stack>
  );
};

export default AerialEvacTable;
