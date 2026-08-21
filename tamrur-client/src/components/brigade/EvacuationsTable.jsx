// React
import { useMemo, useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Button, Group, Modal, Stack, Table, Text, Tooltip } from "@mantine/core";
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
import { EVAC_TEAM_STATUS_COLOR_VARS, EVAC_TEAM_STATUS_LABELS } from "../../constants/aerialEvacStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";
import { findLocationByPoint } from "../../utils/geo";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';
const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

const METHOD_ICONS = {
  walk: IconWalk,
  ride: IconCar,
  aerial: IconHelicopter,
};

const METHOD_OPTIONS = Object.entries(EVAC_METHOD_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(EVAC_TEAM_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_FILTER_OPTIONS = STATUS_OPTIONS;
const METHOD_FILTER_OPTIONS = METHOD_OPTIONS;

/** Fields the brigade must still fill in before the evacuation is actionable. */
const REQUIRED_FIELDS = ["departurePoint", "destinationPoint", "startTime", "eta"];

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
 * empty, the matched location's name if found, or a fallback for a point
 * that doesn't correspond to any known location (e.g. set outside this UI).
 *
 * @param {object | null | undefined} point
 * @param {Array<object>} locations
 * @returns {string}
 */
function describeLocationPoint(point, locations) {
  if (!point) return "טרם הוזן";
  return findLocationByPoint(point, locations)?.name || "מיקום מותאם אישית";
}

/**
 * Renders the event's evacuations as a compact, read-only table (route,
 * type, timeline, radio sign, aerial mission, status). Covers every
 * evacuation method (walk/ride/aerial), not just aerial teams. Fields mirror
 * the real `evacuations` schema — no casualty linkage, since the DB doesn't
 * support that relationship.
 *
 * The pencil opens `EditEvacuationModal`, which only edits the exact
 * start/ETA/concluded timestamps — method, departure/destination, radio
 * sign, aerial mission, and status are all set through other flows (aerial
 * mission approval, the start-now/finish-evacuation quick actions) and
 * aren't meant to be hand-edited, per team decision. Those quick actions
 * stay as direct one-tap controls in the table itself rather than living
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
 *   aerialMissions: Array<object>,
 *   isCompleted: boolean,
 *   aerialEvacStatus: string | null | undefined,
 *   onUpdateEvacuation: (evacId: string, changes: object) => Promise<unknown>,
 *   onDeleteEvacuation: (evacId: string) => void,
 *   onRequestAerialEvac: () => void,
 * }} props
 * @returns {JSX.Element} The evacuations table.
 */
const EvacuationsTable = ({
  evacuations,
  locations,
  aerialMissions = [],
  isCompleted,
  aerialEvacStatus,
  onUpdateEvacuation,
  onDeleteEvacuation,
  onRequestAerialEvac,
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
      departurePoint: (evac) => describeLocationPoint(evac.departurePoint, locations),
      forceRadioSign: (evac) => evac.forceRadioSign || "—",
      aerialMissionId: (evac) => evac.aerialMissionId || "—",
      status: (evac) => evac.status,
      startTime: (evac) => (evac.startTime ? new Date(evac.startTime).getTime() : null),
    }),
    [locations],
  );

  const departureOptions = useMemo(() => {
    const values = [
      ...new Set(normalizedEvacuations.map((evac) => describeLocationPoint(evac.departurePoint, locations))),
    ];
    return values.map((value) => ({ value, label: value }));
  }, [normalizedEvacuations, locations]);

  const radioSignOptions = useMemo(() => {
    const values = [...new Set(normalizedEvacuations.map((evac) => evac.forceRadioSign || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [normalizedEvacuations]);

  const missionOptions = useMemo(
    () => aerialMissions.map((mission) => ({ value: mission.id, label: mission.radio_sign || "מסוק ללא כינוי קריאה" })),
    [aerialMissions],
  );

  const startNow = (evacId) => {
    onUpdateEvacuation?.(evacId, { startTime: new Date().toISOString() });
  };

  const finishEvacuation = (evacId) => {
    onUpdateEvacuation?.(evacId, { concludedAt: new Date().toISOString(), status: "completed" });
  };

  const handleRequestRideEvac = () => {
    // TODO: wire up ride evacuation request once there's a backend flow for it (mirrors onRequestAerialEvac).
  };

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

          <Button
            leftSection={
              aerialEvacStatus === "needed" ? (
                <IconCheck size={16} stroke={1.8} />
              ) : (
                <IconSend size={16} stroke={1.8} />
              )
            }
            size="xs"
            mih="2rem"
            disabled={isCompleted || aerialEvacStatus === "needed"}
            onClick={onRequestAerialEvac}
            styles={{
              root: {
                backgroundColor: "var(--app-color-primary)",
                color: "var(--app-color-primary-text)",
                "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                ...interactiveScaleStyles,
              },
            }}
          >
            {aerialEvacStatus === "needed" ? "פינוי אווירי התבקש" : "בקש פינוי אווירי"}
          </Button>

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
              <ColumnHeader label="ציר זמן" w="6.5rem" {...sortProps("startTime")} />
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
                label="קריאת קשר"
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
              <Table.Th w="3.5rem"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleEvacuations.map((evac, index) => {
              const MethodIcon = METHOD_ICONS[evac.method] || IconHelicopter;
              const statusColor = EVAC_TEAM_STATUS_COLOR_VARS[evac.status] || "var(--app-color-text-muted)";
              const incomplete = isIncomplete(evac);
              const mission = aerialMissions.find((m) => m.id === evac.aerialMissionId);

              return (
                <Table.Tr key={evac.id} className="app-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                  <Table.Td w="2.25rem" style={{ textAlign: "center" }}>
                    {incomplete && (
                      <Tooltip label="חסרים נתונים בשורה זו">
                        {/* The pulse's 1.25x peak scale needs headroom of its own —
                            centered in a fixed-width cell so it grows symmetrically
                            instead of visually spilling into the next column. */}
                        <Box style={{ display: "inline-flex" }}>
                          <IconAlertTriangle
                            className="app-pulse-scale"
                            size={18}
                            stroke={1.8}
                            color="var(--app-color-warning)"
                          />
                        </Box>
                      </Tooltip>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {/* Concluded: ETA is no longer relevant, only the actual
                        start->end times matter. Started but not concluded:
                        ETA is the best "end time" estimate there is, so it
                        gets the same visual weight as the start time, not a
                        muted afterthought — labeled so it's unambiguous
                        which value is which. */}
                    {evac.concludedAt ? (
                      <Text ff={MONO_FONT}>
                        {timeFormatter.format(new Date(evac.startTime))} ← {timeFormatter.format(new Date(evac.concludedAt))}
                      </Text>
                    ) : evac.startTime ? (
                      <Group gap={4} wrap="nowrap">
                        <Stack gap={0}>
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
                        <Tooltip label="סיים פינוי">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            aria-label="סיים פינוי"
                            onClick={() => finishEvacuation(evac.id)}
                          >
                            <IconFlagCheck size={14} stroke={1.8} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ) : (
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="התחל עכשיו">
                          <ActionIcon
                            size="sm"
                            aria-label="התחל עכשיו"
                            onClick={() => startNow(evac.id)}
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
                        <Stack gap={0}>
                          <Text fz="0.62rem" c="var(--app-color-text-muted)">
                            צפי
                          </Text>
                          <Text ff={MONO_FONT}>{evac.eta ? timeFormatter.format(new Date(evac.eta)) : "—"}</Text>
                        </Stack>
                      </Group>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      <MethodIcon size={16} stroke={1.8} />
                      <Text truncate>{EVAC_METHOD_LABELS[evac.method] || evac.method}</Text>
                    </Group>
                  </Table.Td>

                  <Table.Td>
                    <Stack gap={0}>
                      <Text truncate title={describeLocationPoint(evac.departurePoint, locations)}>
                        מ: {describeLocationPoint(evac.departurePoint, locations)}
                      </Text>
                      <Text
                        c="var(--app-color-text-muted)"
                        truncate
                        title={describeLocationPoint(evac.destinationPoint, locations)}
                      >
                        אל: {describeLocationPoint(evac.destinationPoint, locations)}
                      </Text>
                    </Stack>
                  </Table.Td>

                  <Table.Td>
                    <Text truncate>{evac.forceRadioSign || "—"}</Text>
                  </Table.Td>

                  <Table.Td>
                    <Text c="var(--app-color-text-muted)" truncate>
                      {mission?.radio_sign || "—"}
                    </Text>
                  </Table.Td>

                  <Table.Td>
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

                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        aria-label="ערוך שורה"
                        onClick={() => {
                          setEditingEvacuation(evac);
                          setEditOpenId((id) => id + 1);
                        }}
                        styles={{ root: { color: "var(--app-color-primary)" } }}
                      >
                        <IconPencil size={18} stroke={1.8} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        aria-label="מחק שורה"
                        onClick={() => setDeleteTargetId(evac.id)}
                        styles={{ root: { color: "var(--app-color-error)" } }}
                      >
                        <IconTrash size={18} stroke={1.8} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {visibleEvacuations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8} c="var(--app-color-text-muted)" ta="center">
                  {normalizedEvacuations.length === 0 ? "אין פינויים לאירוע זה" : "אין פינויים התואמים לסינון"}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <Modal opened={Boolean(deleteTarget)} onClose={() => setDeleteTargetId(null)} title="מחיקת פינוי" size="sm">
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
        opened={Boolean(editingEvacuation)}
        onClose={() => setEditingEvacuation(null)}
        onSave={onUpdateEvacuation}
      />
    </DashboardCard>
  );
};

export default EvacuationsTable;
