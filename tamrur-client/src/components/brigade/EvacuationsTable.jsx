// React
import { useMemo, useState } from "react";

// External libraries
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCar,
  IconCheck,
  IconFlagCheck,
  IconHelicopter,
  IconPencil,
  IconPlayerPlay,
  IconSend,
  IconTrash,
  IconTruck,
  IconWalk,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import EditEvacuationModal from "./EditEvacuationModal";
import RequestRideEvacuationModal from "./RequestRideEvacuationModal";
import {
  EVAC_TEAM_STATUS_COLOR_VARS,
  EVAC_TEAM_STATUS_LABELS,
} from "../../constants/aerialEvacStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";
import { findLocationByPoint } from "../../utils/geo";
import { hospitalLabel } from "../../constants/locationMarkers";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';
const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });
// Day+month only (no year) — the timeline column shows this above the time
// so two rows with the same time of day on different days aren't
// indistinguishable at a glance.
const dateFormatter = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" });

/** Date label for a timeline cell spanning two timestamps — a single date if both fall on the same day, or "start → end" if they don't. */
function formatDateRange(startIso, endIso) {
  const startDate = dateFormatter.format(new Date(startIso));
  if (!endIso) return startDate;
  const endDate = dateFormatter.format(new Date(endIso));
  return startDate === endDate ? startDate : `${startDate} ← ${endDate}`;
}

const METHOD_ICONS = {
  walk: IconWalk,
  ride: IconCar,
  aerial: IconHelicopter,
};

// Once a mission exists, aerialEvacStatus becomes its request-status
// ("needed" | "in_progress" | "approved" | "denied") rather than just the
// event's own request flag — the button must stay in the "already
// requested" state through all of those, not just "needed", or it
// re-enables and relabels itself as soon as the airforce starts working the
// mission. "denied" is deliberately excluded so a denial can be re-requested.
const AERIAL_EVAC_REQUESTED_STATUSES = ["needed", "in_progress", "approved"];

const METHOD_OPTIONS = Object.entries(EVAC_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const STATUS_OPTIONS = Object.entries(EVAC_TEAM_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const STATUS_FILTER_OPTIONS = STATUS_OPTIONS;
const METHOD_FILTER_OPTIONS = METHOD_OPTIONS;

/**
 * The three timing fields required for a row to count as complete — not
 * destination (also editable in EditEvacuationModal for ride evacuations,
 * but not required for completeness) or the remaining fields set through
 * other flows (method/departure/radio sign/aerial mission/status). A row
 * stays flagged incomplete for its whole lifecycle until all three are set,
 * i.e. until it's actually concluded.
 */
const REQUIRED_FIELDS = ["startTime", "eta", "concludedAt"];

/** Subtle hover/tap feedback for the request-aerial-evac button, matching the top bar's action buttons. */
const interactiveScaleStyles = {
  transition: "transform 0.15s ease",
  "&:hover:not(:disabled)": { transform: "scale(1.03)" },
  "&:active:not(:disabled)": { transform: "scale(0.97)" },
};

/** True if any field the brigade must fill in by hand is still empty. */
function isIncomplete(evac) {
  return REQUIRED_FIELDS.some((field) => !evac[field]);
}

/**
 * Labels a departure/destination point for display. The server stores a bare
 * point with no reference back to the locations table, so this reverse-
 * matches it against the fetched locations list — "טרם הוזן" if the field is
 * empty, the matched location's name if found (translated to Hebrew for
 * hospitals via `hospitalLabel`, matching the maps and the destination
 * picker), or `fallback` for a point that doesn't correspond to any known
 * location (e.g. set outside this UI).
 *
 * @param {object | null | undefined} point
 * @param {Array<object>} locations
 * @param {string} [fallback]
 * @returns {string}
 */
function describeLocationPoint(point, locations, fallback = "מיקום מותאם אישית") {
  if (!point) return "טרם הוזן";
  const location = findLocationByPoint(point, locations);
  if (!location) return fallback;
  return location.type === "hospital" ? hospitalLabel(location.name) : location.name;
}

/**
 * Describes an evacuation's departure point specifically. A ride
 * evacuation's departure always defaults to the event's own location (see
 * RequestRideEvacuationModal) rather than a hospital/pad/exchange point, so
 * it never matches `locations` — describe that case as "מיקום האירוע"
 * instead of the generic "unrecognized point" fallback. Aerial evacuations
 * default departure to the *responding force's* location instead (not the
 * event's), so they keep the generic fallback.
 *
 * @param {object} evac
 * @param {Array<object>} locations
 * @returns {string}
 */
function describeDeparturePoint(evac, locations) {
  return describeLocationPoint(evac.departurePoint, locations, evac.method === "ride" ? "מיקום האירוע" : undefined);
}

/**
 * One evacuation row — hover is real state (`useHoverState`) rather than a
 * `styles` "&:hover" key, since Mantine's `styles` prop merges into an
 * inline `style` attribute where pseudo-selectors are never compiled into
 * real CSS. Isolated in its own component so each row's hover state doesn't
 * leak into its siblings, since hooks can't run inside the parent's
 * `.map()` either way.
 *
 * The background lives on every `<Table.Td>`, not the `<Table.Tr>` — this
 * table has `border-collapse: collapse` (the app's own table reset), and
 * under that a `<tr>` isn't a real paintable box, so a radius set there
 * squares off instead of clipping the row's background. Rounding just the
 * outer two cells' outer corners (logical `border-*-*-radius`, so it's
 * correct in this RTL layout without hardcoding a side) reads as one
 * rounded row instead — the last visible cell differs by `readOnly`, since
 * the actions column doesn't render at all in that mode.
 *
 * @param {{
 *   evac: object,
 *   index: number,
 *   locations: Array<object>,
 *   aerialMissions: Array<object>,
 *   readOnly: boolean,
 *   onStartNow: () => void,
 *   onFinish: () => void,
 *   onEdit: () => void,
 *   onDelete: () => void,
 * }} props
 * @returns {JSX.Element} The row.
 */
function EvacuationRow({ evac, index, locations, aerialMissions, readOnly, onStartNow, onFinish, onEdit, onDelete }) {
  const [isHovered, hoverHandlers] = useHoverState();

  const MethodIcon = METHOD_ICONS[evac.method] || IconHelicopter;
  const statusColor = EVAC_TEAM_STATUS_COLOR_VARS[evac.status] || "var(--app-color-text-muted)";
  const incomplete = isIncomplete(evac);
  const mission = aerialMissions.find((m) => m.id === evac.aerialMissionId);

  const backgroundColor = isHovered ? "var(--app-effect-hover-background)" : "transparent";
  const cellStyle = { backgroundColor, transition: "background-color 0.15s ease" };
  const firstCellStyle = {
    ...cellStyle,
    textAlign: "center",
    borderStartStartRadius: "var(--mantine-radius-sm)",
    borderEndStartRadius: "var(--mantine-radius-sm)",
  };
  const lastCellStyle = {
    ...cellStyle,
    borderStartEndRadius: "var(--mantine-radius-sm)",
    borderEndEndRadius: "var(--mantine-radius-sm)",
  };

  return (
    <Table.Tr className="app-fade-in" style={{ animationDelay: `${index * 30}ms` }} {...hoverHandlers}>
      <Table.Td w="2.25rem" style={firstCellStyle}>
        {incomplete && (
          <Tooltip label="חסרים נתונים בשורה זו">
            {/* The pulse's 1.25x peak scale needs headroom of its own —
                centered in a fixed-width cell so it grows symmetrically
                instead of visually spilling into the next column. */}
            <Box style={{ display: "inline-flex" }}>
              <IconAlertTriangle className="app-pulse-scale" size={18} stroke={1.8} color="var(--app-color-warning)" />
            </Box>
          </Tooltip>
        )}
      </Table.Td>

      <Table.Td style={cellStyle}>
        {/* Concluded: ETA is no longer relevant, only the actual
            start->end times matter. Started but not concluded:
            ETA is the best "end time" estimate there is, so it
            gets the same visual weight as the start time, not a
            muted afterthought — labeled so it's unambiguous
            which value is which. */}
        {evac.concludedAt ? (
          <Stack gap={0}>
            <Text fz="0.62rem" c="var(--app-color-text-muted)" ff={MONO_FONT}>
              {formatDateRange(evac.startTime, evac.concludedAt)}
            </Text>
            <Text ff={MONO_FONT}>
              {timeFormatter.format(new Date(evac.startTime))} ← {timeFormatter.format(new Date(evac.concludedAt))}
            </Text>
          </Stack>
        ) : evac.startTime ? (
          <Group gap={4} wrap="nowrap">
            <Stack gap={0}>
              <Text fz="0.62rem" c="var(--app-color-text-muted)" ff={MONO_FONT}>
                {formatDateRange(evac.startTime, evac.eta)}
              </Text>
              <Group gap={4} wrap="nowrap">
                <Text fz="0.62rem" c="var(--app-color-text-muted)">
                  יצא
                </Text>
                <Text ff={MONO_FONT}>{timeFormatter.format(new Date(evac.startTime))}</Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                <Text fz="0.62rem" c="var(--app-color-text-muted)">
                  צפי
                </Text>
                <Text ff={MONO_FONT}>{evac.eta ? timeFormatter.format(new Date(evac.eta)) : "—"}</Text>
              </Group>
            </Stack>
            {!readOnly && (
              <Tooltip label="סיים פינוי">
                <ActionIcon size="sm" variant="light" color="green" aria-label="סיים פינוי" onClick={onFinish}>
                  <IconFlagCheck size={14} stroke={1.8} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        ) : (
          <Group gap={4} wrap="nowrap">
            {!readOnly && (
              <Tooltip label="התחל עכשיו">
                <ActionIcon
                  size="sm"
                  aria-label="התחל עכשיו"
                  onClick={onStartNow}
                  styles={{
                    root: {
                      backgroundColor: "var(--app-color-primary)",
                      color: "var(--app-color-primary-text)",
                      "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                    },
                  }}
                >
                  <IconPlayerPlay size={14} stroke={1.8} />
                </ActionIcon>
              </Tooltip>
            )}
            <Stack gap={0}>
              {evac.eta && (
                <Text fz="0.62rem" c="var(--app-color-text-muted)" ff={MONO_FONT}>
                  {dateFormatter.format(new Date(evac.eta))}
                </Text>
              )}
              <Text fz="0.62rem" c="var(--app-color-text-muted)">
                צפי
              </Text>
              <Text ff={MONO_FONT}>{evac.eta ? timeFormatter.format(new Date(evac.eta)) : "—"}</Text>
            </Stack>
          </Group>
        )}
      </Table.Td>

      <Table.Td style={cellStyle}>
        <Group gap={6} wrap="nowrap">
          <MethodIcon size={16} stroke={1.8} />
          <Text truncate>{EVAC_METHOD_LABELS[evac.method] || evac.method}</Text>
        </Group>
      </Table.Td>

      <Table.Td style={cellStyle}>
        <Stack gap={0}>
          <Text truncate title={describeDeparturePoint(evac, locations)}>
            מ: {describeDeparturePoint(evac, locations)}
          </Text>
          <Text c="var(--app-color-text-muted)" truncate title={describeLocationPoint(evac.destinationPoint, locations)}>
            אל: {describeLocationPoint(evac.destinationPoint, locations)}
          </Text>
        </Stack>
      </Table.Td>

      <Table.Td style={cellStyle}>
        <Text truncate>{evac.forceRadioSign || "—"}</Text>
      </Table.Td>

      <Table.Td style={cellStyle}>
        <Text c="var(--app-color-text-muted)" truncate>
          {mission?.radio_sign || "—"}
        </Text>
      </Table.Td>

      <Table.Td style={readOnly ? lastCellStyle : cellStyle}>
        <Badge
          size="sm"
          leftSection={<MethodIcon size={12} stroke={1.8} />}
          styles={{
            root: {
              backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
              color: statusColor,
            },
          }}
        >
          {EVAC_TEAM_STATUS_LABELS[evac.status] || evac.status}
        </Badge>
      </Table.Td>

      {!readOnly && (
        <Table.Td style={lastCellStyle}>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              aria-label="ערוך שורה"
              onClick={onEdit}
              styles={{ root: { color: "var(--app-color-primary)" } }}
            >
              <IconPencil size={18} stroke={1.8} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              aria-label="מחק שורה"
              onClick={onDelete}
              styles={{ root: { color: "var(--app-color-error)" } }}
            >
              <IconTrash size={18} stroke={1.8} />
            </ActionIcon>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  );
}

/**
 * Renders the event's evacuations as a compact, read-only table (route,
 * type, timeline, radio sign, aerial mission, status). Covers every
 * evacuation method (walk/ride/aerial), not just aerial teams. Fields mirror
 * the real `evacuations` schema — no casualty linkage, since the DB doesn't
 * support that relationship.
 *
 * The pencil opens `EditEvacuationModal`, which edits the start/ETA/
 * concluded timestamps plus departure and destination for ride evacuations —
 * method, radio sign, aerial mission, and status are all set through
 * other flows (aerial mission approval, the start-now/finish-evacuation
 * quick actions) and aren't meant to be hand-edited, per team decision.
 * Those quick actions stay as direct one-tap controls in the table itself rather than living
 * only in the modal, since they're time-critical enough that burying them
 * behind "open the edit modal" would cost real seconds in an actual
 * evacuation. Merging what used to be 3 separate time columns and 2
 * separate departure/destination columns down to one "ציר זמן" and one
 * "מסלול" column each is what lets this table fit its real available width
 * (see EventDashboardPage's grid) without horizontal scroll; the old
 * inline-editable version needed 11 columns wide enough to fit a
 * Select/datetime-local input each, which this version never has to
 * accommodate.
 *
 * A leading column pulses a warning while a row is still missing
 * brigade-entered fields. Sorting/filtering on the merged route and
 * timeline columns is scoped to one representative field each
 * (departurePoint, startTime) rather than every field that went into the
 * merge — a direct, accepted simplification of combining columns. Rows can
 * be deleted via a confirm modal. The card header also carries an
 * active-teams count badge (evacuations currently "started" out of the
 * total) and the "request aerial evac" action — requesting one, once
 * approved, is what auto-creates a row here in the first place, so it lives
 * with this table rather than the page's other event-level actions.
 *
 * @param {{
 *   evacuations: Array<object>,
 *   locations: Array<object>,
 *   eventLocation: object | null | undefined,
 *   aerialMissions: Array<object>,
 *   isCompleted: boolean,
 *   aerialEvacStatus: string | null | undefined,
 *   onUpdateEvacuation: (evacId: string, changes: object) => Promise<unknown>,
 *   onDeleteEvacuation: (evacId: string) => void,
 *   onRequestAerialEvac: () => Promise<unknown>,
 *   onCreateRideEvacuation: (fields: { destinationPoint: object, forceRadioSign: string }) => Promise<unknown>,
 * }} props
 * @returns {JSX.Element} The evacuations table.
 */
const EvacuationsTable = ({
  evacuations,
  locations,
  eventLocation,
  aerialMissions = [],
  isCompleted,
  aerialEvacStatus,
  readOnly = false,
  onUpdateEvacuation,
  onDeleteEvacuation,
  onRequestAerialEvac,
  onCreateRideEvacuation,
}) => {
  const [editingEvacuation, setEditingEvacuation] = useState(null);
  // Bumped on every open (not just when the row differs) so EditEvacuationModal
  // remounts fresh each time via its `key` — its own draft/status state is
  // seeded from lazy useState initializers, not a reset effect, so a fresh
  // mount is what actually resets it (see that file's comment).
  const [editOpenId, setEditOpenId] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});
  // Closes the window between clicking "request aerial evac" and the PUT
  // request's response actually updating aerialEvacStatus — without this,
  // that gap is fully clickable and a fast double-click (or an impatient
  // re-click) can fire the request twice. Only needed for the "not yet
  // requested" -> "requested" transition, so it's cleared once the request
  // settles either way, not tied to aerialEvacStatus itself (which handles
  // the persistent already-requested disable on its own).
  const [isRequestingAerialEvac, setIsRequestingAerialEvac] = useState(false);
  const [isCreateRideOpen, setIsCreateRideOpen] = useState(false);

  // The server returns scalar fields under their real DB column names
  // (snake_case) — matching the app's convention elsewhere (e.g. events'
  // gathering_status/evac_status) — while everything below this line
  // already reads camelCase. Normalized once, at the boundary, instead of
  // throughout the file. departurePoint/destinationPoint already arrive
  // camelCase (they need ST_AsGeoJSON server-side regardless, see
  // evacuationsModel.js), so they're untouched here.
  const normalizedEvacuations = useMemo(
    () =>
      evacuations.map((evac) => ({
        ...evac,
        startTime: evac.start_time,
        forceRadioSign: evac.force_radio_sign,
        concludedAt: evac.concluded_at,
        aerialMissionId: evac.aerial_mission_id,
      })),
    [evacuations],
  );

  const columnAccessors = useMemo(
    () => ({
      method: (evac) => evac.method,
      departurePoint: (evac) => describeDeparturePoint(evac, locations),
      forceRadioSign: (evac) => evac.forceRadioSign || "—",
      aerialMissionId: (evac) => evac.aerialMissionId || "—",
      status: (evac) => evac.status,
      startTime: (evac) => (evac.startTime ? new Date(evac.startTime).getTime() : null),
    }),
    [locations],
  );

  const departureOptions = useMemo(() => {
    const values = [
      ...new Set(normalizedEvacuations.map((evac) => describeDeparturePoint(evac, locations))),
    ];
    return values.map((value) => ({ value, label: value }));
  }, [normalizedEvacuations, locations]);

  const radioSignOptions = useMemo(() => {
    const values = [...new Set(normalizedEvacuations.map((evac) => evac.forceRadioSign || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [normalizedEvacuations]);

  const missionOptions = useMemo(
    () =>
      aerialMissions.map((mission) => ({
        value: mission.id,
        label: mission.radio_sign || "מסוק ללא כינוי קריאה",
      })),
    [aerialMissions],
  );

  const startNow = (evacId) => {
    onUpdateEvacuation?.(evacId, { startTime: new Date().toISOString() });
  };

  const finishEvacuation = (evacId) => {
    onUpdateEvacuation?.(evacId, { concludedAt: new Date().toISOString() });
  };

  const handleRequestRideEvac = () => {
    setIsCreateRideOpen(true);
  };

  const handleRequestAerialEvacClick = async () => {
    setIsRequestingAerialEvac(true);
    try {
      await onRequestAerialEvac?.();
    } finally {
      setIsRequestingAerialEvac(false);
    }
  };

  const handleSortClick = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key ? nextSortDirection(prev.direction) : "asc",
    }));
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

  const visibleEvacuations = useMemo(() => {
    let rows = normalizedEvacuations.filter((evac) =>
      Object.entries(filters).every(([key, values]) => {
        if (!values || values.size === 0) return true;
        return values.has(String(columnAccessors[key](evac)));
      }),
    );

    if (sort.key && sort.direction) {
      const accessor = columnAccessors[sort.key];
      rows = [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)));
      if (sort.direction === "desc") rows.reverse();
    }

    return rows;
  }, [normalizedEvacuations, filters, sort, columnAccessors]);

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

  const deleteTarget = normalizedEvacuations.find((evac) => evac.id === deleteTargetId) || null;
  const activeCount = normalizedEvacuations.filter((evac) => evac.status === "started").length;

  return (
    <DashboardCard
      title="פינויים"
      padding="md"
      gap="sm"
      fullHeight
      headerExtra={
        <Group gap="xs" wrap="wrap">
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
            {visibleEvacuations.length} מתוך {normalizedEvacuations.length}
          </Badge>

          <Badge
            leftSection={<IconTruck size={12} stroke={1.8} />}
            variant="outline"
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text-muted)",
              },
            }}
          >
            {activeCount} מתוך {normalizedEvacuations.length} צוותים פעילים
          </Badge>

          {/* Both dispatch triggers — aerial request and ride creation — are
              withheld in read-only mode. Command watches the picture; it does
              not task forces. */}
          {!readOnly && (
            <Button
              leftSection={
                AERIAL_EVAC_REQUESTED_STATUSES.includes(aerialEvacStatus) ? (
                  <IconCheck size={16} stroke={1.8} />
                ) : (
                  <IconSend size={16} stroke={1.8} />
                )
              }
              size="xs"
              mih="2rem"
              loading={isRequestingAerialEvac}
              disabled={
                isCompleted ||
                AERIAL_EVAC_REQUESTED_STATUSES.includes(aerialEvacStatus) ||
                isRequestingAerialEvac
              }
              onClick={handleRequestAerialEvacClick}
              styles={{
                root: {
                  backgroundColor: "var(--app-color-primary)",
                  color: "var(--app-color-primary-text)",
                  "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                  ...interactiveScaleStyles,
                },
              }}
            >
              {AERIAL_EVAC_REQUESTED_STATUSES.includes(aerialEvacStatus)
                ? "פינוי אווירי התבקש"
                : "בקש פינוי אווירי"}
            </Button>
          )}

          {!readOnly && (
            <Button
              leftSection={<IconCar size={16} stroke={1.8} />}
              variant="outline"
              size="xs"
              mih="2rem"
              onClick={handleRequestRideEvac}
              styles={{
                root: {
                  borderColor: "var(--app-color-border)",
                  color: "var(--app-color-text)",
                  ...interactiveScaleStyles,
                },
              }}
            >
              בקש פינוי רכב
            </Button>
          )}
        </Group>
      }
    >
      <Box style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {/* table-layout: fixed + an explicit width per column keeps the
            table's overall size constant, and — now that editing lives in
            EditEvacuationModal instead of inline cells — every column only
            has to fit compact display content (badges, short mono times,
            two-line text), not a Select/datetime-local input. That's what
            actually closes most of the horizontal-scroll gap; this table
            used to need ~11 columns' worth of edit-input-sized width. */}
        <Table verticalSpacing="sm" fz="xs" style={{ tableLayout: "fixed" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="2.25rem"></Table.Th>
              <ColumnHeader label="ציר זמן" w="7.5rem" {...sortProps("startTime")} />
              <ColumnHeader
                label="סוג"
                w="5.5rem"
                {...sortProps("method")}
                {...filterProps("method", METHOD_FILTER_OPTIONS)}
              />
              <ColumnHeader
                label="מסלול"
                w="7rem"
                {...sortProps("departurePoint")}
                {...filterProps("departurePoint", departureOptions)}
              />
              <ColumnHeader
                label='או"ק'
                w="5rem"
                {...sortProps("forceRadioSign")}
                {...filterProps("forceRadioSign", radioSignOptions)}
              />
              <ColumnHeader
                label="משימה אווירית"
                w="6rem"
                {...sortProps("aerialMissionId")}
                {...filterProps("aerialMissionId", missionOptions)}
              />
              <ColumnHeader
                label="סטטוס"
                w="6rem"
                {...sortProps("status")}
                {...filterProps("status", STATUS_FILTER_OPTIONS)}
              />
              {/* The row-actions column is dropped entirely in read-only mode
                  rather than left empty, so the remaining columns take the
                  width back. */}
              {!readOnly && <Table.Th w="3.5rem"></Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleEvacuations.map((evac, index) => (
              <EvacuationRow
                key={evac.id}
                evac={evac}
                index={index}
                locations={locations}
                aerialMissions={aerialMissions}
                readOnly={readOnly}
                onStartNow={() => startNow(evac.id)}
                onFinish={() => finishEvacuation(evac.id)}
                onEdit={() => {
                  setEditingEvacuation(evac);
                  setEditOpenId((id) => id + 1);
                }}
                onDelete={() => setDeleteTargetId(evac.id)}
              />
            ))}
            {visibleEvacuations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={readOnly ? 7 : 8} c="var(--app-color-text-muted)" ta="center">
                  {normalizedEvacuations.length === 0
                    ? "אין פינויים לאירוע זה"
                    : "אין פינויים התואמים לסינון"}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      {/* The delete confirmation and both editor modals are not mounted at all
          in read-only mode, so no code path can open one. */}
      {!readOnly && (
        <>
          <Modal
            opened={Boolean(deleteTarget)}
            onClose={() => setDeleteTargetId(null)}
            title="מחיקת פינוי"
            size="sm"
          >
            <Text fz="sm" mb="md">
              למחוק את הפינוי {deleteTarget?.forceRadioSign ? `(${deleteTarget.forceRadioSign})` : ""}? פעולה זו אינה
              הפיכה.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setDeleteTargetId(null)}>
                ביטול
              </Button>
              <Button
                styles={{ root: { backgroundColor: "var(--app-color-error)", color: "#FFFFFF" } }}
                onClick={() => {
                  onDeleteEvacuation?.(deleteTargetId);
                  setDeleteTargetId(null);
                }}
              >
                מחק
              </Button>
            </Group>
          </Modal>

          <EditEvacuationModal
            key={editOpenId}
            evacuation={editingEvacuation}
            locations={locations}
            eventLocation={eventLocation}
            opened={Boolean(editingEvacuation)}
            onClose={() => setEditingEvacuation(null)}
            onSave={onUpdateEvacuation}
          />

          <RequestRideEvacuationModal
            locations={locations}
            opened={isCreateRideOpen}
            onClose={() => setIsCreateRideOpen(false)}
            onCreate={onCreateRideEvacuation}
          />
        </>
      )}
    </DashboardCard>
  );
};

export default EvacuationsTable;
