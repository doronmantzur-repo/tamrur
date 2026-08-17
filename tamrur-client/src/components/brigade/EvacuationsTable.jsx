// React
import { useMemo, useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Button, Group, Modal, Select, Table, Text, TextInput, Tooltip } from "@mantine/core";
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
  IconX,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import { EVAC_TEAM_STATUS_COLOR_VARS, EVAC_TEAM_STATUS_LABELS } from "../../constants/aerialEvacStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";
import { findLocationByPoint } from "../../utils/geo";

// Styles

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

const inputStyles = {
  input: {
    minHeight: "2.25rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
    fontSize: "var(--mantine-font-size-sm)",
  },
};

/** True if any field the brigade must fill in by hand is still empty. */
function isIncomplete(evac) {
  return REQUIRED_FIELDS.some((field) => !evac[field]);
}

/** Converts an ISO timestamp to the `datetime-local` input value format. */
function toLocalInputValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a `datetime-local` input value back to an ISO timestamp, or null if empty. */
function fromLocalInputValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
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
 * Renders the event's evacuations as a full, inline-editable table (start
 * time, type, departure, destination, radio sign, ETA, concluded time,
 * aerial mission, status). Covers every evacuation method (walk/ride/
 * aerial), not just aerial teams. Fields mirror the real `evacuations`
 * schema — no casualty linkage, since the DB doesn't support that
 * relationship. Departure/destination are edited as a location picker but
 * stored as raw points, since the DB has no location foreign key: picking a
 * location resolves it to its coordinates on save, and displaying an
 * existing point reverse-matches it back to a location name. A leading
 * column pulses a warning while a row is still missing brigade-entered
 * fields. Every column but the three time fields is sortable and filterable
 * (searchable pick-list); every column is sortable. Rows can be deleted via
 * a confirm modal. The card header also carries an active-teams count badge
 * (evacuations currently "started" out of the total — this used to be its
 * own stat tile on the page, moved here since it's this table's own data)
 * and the "request aerial evac"
 * action — requesting one, once approved, is what auto-creates a row here
 * in the first place, so it lives with this table rather than the page's
 * other event-level actions.
 *
 * @param {{
 *   evacuations: Array<object>,
 *   locations: Array<object>,
 *   aerialMissions: Array<object>,
 *   isCompleted: boolean,
 *   aerialEvacStatus: string | null | undefined,
 *   onUpdateEvacuation: (evacId: string, changes: object) => void,
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
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const locationOptions = locations.map((location) => ({ value: location.id, label: location.name }));
  const missionOptions = aerialMissions.map((mission) => ({
    value: mission.id,
    label: mission.radio_sign || "מסוק ללא כינוי קריאה",
  }));

  const columnAccessors = useMemo(
    () => ({
      method: (evac) => evac.method,
      departurePoint: (evac) => describeLocationPoint(evac.departurePoint, locations),
      destinationPoint: (evac) => describeLocationPoint(evac.destinationPoint, locations),
      forceRadioSign: (evac) => evac.forceRadioSign || "—",
      aerialMissionId: (evac) => evac.aerialMissionId || "—",
      status: (evac) => evac.status,
      startTime: (evac) => (evac.startTime ? new Date(evac.startTime).getTime() : null),
      eta: (evac) => (evac.eta ? new Date(evac.eta).getTime() : null),
      concludedAt: (evac) => (evac.concludedAt ? new Date(evac.concludedAt).getTime() : null),
    }),
    [locations],
  );

  const departureOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => describeLocationPoint(evac.departurePoint, locations)))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations, locations]);

  const destinationOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => describeLocationPoint(evac.destinationPoint, locations)))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations, locations]);

  const radioSignOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => evac.forceRadioSign || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations]);

  const startEdit = (evac) => {
    setEditingId(evac.id);
    setDraft({
      ...evac,
      departurePoint: findLocationByPoint(evac.departurePoint, locations)?.id || null,
      destinationPoint: findLocationByPoint(evac.destinationPoint, locations)?.id || null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    const departureLocation = locations.find((location) => location.id === draft.departurePoint);
    const destinationLocation = locations.find((location) => location.id === draft.destinationPoint);

    onUpdateEvacuation?.(editingId, {
      ...draft,
      departurePoint: departureLocation?.location || null,
      destinationPoint: destinationLocation?.location || null,
    });
    setEditingId(null);
    setDraft(null);
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

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
    let rows = evacuations.filter((evac) =>
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
  }, [evacuations, filters, sort, columnAccessors]);

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

  const deleteTarget = evacuations.find((evac) => evac.id === deleteTargetId) || null;
  const activeCount = evacuations.filter((evac) => evac.status === "started").length;

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
            {visibleEvacuations.length} מתוך {evacuations.length}
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
            {activeCount} מתוך {evacuations.length} צוותים פעילים
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
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <ColumnHeader label="שעת יציאה" {...sortProps("startTime")} />
              <ColumnHeader label="סוג" {...sortProps("method")} {...filterProps("method", METHOD_FILTER_OPTIONS)} />
              <ColumnHeader
                label="יציאה"
                {...sortProps("departurePoint")}
                {...filterProps("departurePoint", departureOptions)}
              />
              <ColumnHeader
                label="יעד"
                {...sortProps("destinationPoint")}
                {...filterProps("destinationPoint", destinationOptions)}
              />
              <ColumnHeader
                label="קריאת קשר"
                {...sortProps("forceRadioSign")}
                {...filterProps("forceRadioSign", radioSignOptions)}
              />
              <ColumnHeader label="ETA" {...sortProps("eta")} />
              <ColumnHeader label="זמן סיום" {...sortProps("concludedAt")} />
              <ColumnHeader
                label="משימה אווירית"
                {...sortProps("aerialMissionId")}
                {...filterProps("aerialMissionId", missionOptions)}
              />
              <ColumnHeader label="סטטוס" {...sortProps("status")} {...filterProps("status", STATUS_FILTER_OPTIONS)} />
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleEvacuations.map((evac, index) => {
              const isEditing = editingId === evac.id;
              const row = isEditing ? draft : evac;
              const MethodIcon = METHOD_ICONS[row.method] || IconHelicopter;
              const statusColor = EVAC_TEAM_STATUS_COLOR_VARS[row.status] || "var(--app-color-text-muted)";
              const incomplete = isIncomplete(evac);
              const mission = aerialMissions.find((m) => m.id === evac.aerialMissionId);

              return (
                <Table.Tr key={evac.id} className="app-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                  <Table.Td>
                    {incomplete && (
                      <Tooltip label="חסרים נתונים בשורה זו">
                        <IconAlertTriangle
                          className="app-pulse-scale"
                          size={18}
                          stroke={1.8}
                          color="var(--app-color-warning)"
                        />
                      </Tooltip>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <TextInput
                        type="datetime-local"
                        size="xs"
                        styles={inputStyles}
                        value={toLocalInputValue(draft.startTime)}
                        onChange={(e) => updateDraft("startTime", fromLocalInputValue(e.currentTarget.value))}
                      />
                    ) : row.startTime ? (
                      <Text ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                        {timeFormatter.format(new Date(row.startTime))}
                      </Text>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlayerPlay size={14} stroke={1.8} />}
                        onClick={() => startNow(evac.id)}
                      >
                        התחל עכשיו
                      </Button>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Select
                        size="xs"
                        styles={inputStyles}
                        data={METHOD_OPTIONS}
                        value={draft.method}
                        onChange={(value) => updateDraft("method", value)}
                        allowDeselect={false}
                      />
                    ) : (
                      <Group gap={6} wrap="nowrap">
                        <MethodIcon size={16} stroke={1.8} />
                        <Text fz="sm">{EVAC_METHOD_LABELS[row.method] || row.method}</Text>
                      </Group>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Select
                        size="xs"
                        styles={inputStyles}
                        placeholder="בחר מיקום"
                        data={locationOptions}
                        value={draft.departurePoint}
                        onChange={(value) => updateDraft("departurePoint", value)}
                        searchable
                      />
                    ) : (
                      <Text c={row.departurePoint ? undefined : "var(--app-color-text-muted)"}>
                        {describeLocationPoint(row.departurePoint, locations)}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Select
                        size="xs"
                        styles={inputStyles}
                        placeholder="בחר מיקום"
                        data={locationOptions}
                        value={draft.destinationPoint}
                        onChange={(value) => updateDraft("destinationPoint", value)}
                        searchable
                      />
                    ) : (
                      <Text c={row.destinationPoint ? undefined : "var(--app-color-text-muted)"}>
                        {describeLocationPoint(row.destinationPoint, locations)}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <TextInput
                        size="xs"
                        styles={inputStyles}
                        value={draft.forceRadioSign || ""}
                        onChange={(e) => updateDraft("forceRadioSign", e.currentTarget.value)}
                      />
                    ) : (
                      row.forceRadioSign || "—"
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <TextInput
                        type="datetime-local"
                        size="xs"
                        styles={inputStyles}
                        value={toLocalInputValue(draft.eta)}
                        onChange={(e) => updateDraft("eta", fromLocalInputValue(e.currentTarget.value))}
                      />
                    ) : (
                      <Text
                        c="var(--app-color-text-muted)"
                        ff='ui-monospace, "SF Mono", "Consolas", monospace'
                      >
                        {row.eta ? timeFormatter.format(new Date(row.eta)) : "טרם הוזן"}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <TextInput
                        type="datetime-local"
                        size="xs"
                        styles={inputStyles}
                        value={toLocalInputValue(draft.concludedAt)}
                        onChange={(e) => updateDraft("concludedAt", fromLocalInputValue(e.currentTarget.value))}
                      />
                    ) : row.concludedAt ? (
                      <Text c="var(--app-color-text-muted)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                        {timeFormatter.format(new Date(row.concludedAt))}
                      </Text>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        leftSection={<IconFlagCheck size={14} stroke={1.8} />}
                        onClick={() => finishEvacuation(evac.id)}
                      >
                        סיים פינוי
                      </Button>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Select
                        size="xs"
                        styles={inputStyles}
                        placeholder="בחר משימה"
                        data={missionOptions}
                        value={draft.aerialMissionId}
                        onChange={(value) => updateDraft("aerialMissionId", value)}
                        searchable
                        clearable
                      />
                    ) : (
                      <Text c="var(--app-color-text-muted)">{mission?.radio_sign || "—"}</Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Select
                        size="xs"
                        styles={inputStyles}
                        data={STATUS_OPTIONS}
                        value={draft.status}
                        onChange={(value) => updateDraft("status", value)}
                        allowDeselect={false}
                      />
                    ) : (
                      <Badge
                        leftSection={<MethodIcon size={12} stroke={1.8} />}
                        styles={{
                          root: {
                            backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
                            color: statusColor,
                          },
                        }}
                      >
                        {EVAC_TEAM_STATUS_LABELS[row.status] || row.status}
                      </Badge>
                    )}
                  </Table.Td>

                  <Table.Td>
                    {isEditing ? (
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          aria-label="שמור"
                          onClick={saveEdit}
                          styles={{ root: { color: "var(--app-color-success)" } }}
                        >
                          <IconCheck size={18} stroke={1.8} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          aria-label="בטל"
                          onClick={cancelEdit}
                          styles={{ root: { color: "var(--app-color-text-muted)" } }}
                        >
                          <IconX size={18} stroke={1.8} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          aria-label="ערוך שורה"
                          onClick={() => startEdit(evac)}
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
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {visibleEvacuations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={11} c="var(--app-color-text-muted)" ta="center">
                  {evacuations.length === 0 ? "אין פינויים לאירוע זה" : "אין פינויים התואמים לסינון"}
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
    </DashboardCard>
  );
};

export default EvacuationsTable;
