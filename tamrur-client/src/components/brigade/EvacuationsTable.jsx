// React
import { useMemo, useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Button, Group, Modal, Select, Table, Text, TextInput, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCar,
  IconCheck,
  IconHelicopter,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ColumnHeader from "../dashboard/ColumnHeader";
import { EVAC_TEAM_STATUS_COLOR_VARS, EVAC_TEAM_STATUS_LABELS } from "../../constants/aerialEvacStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";
import { compareValues, nextSortDirection, toggleSetValue } from "../../utils/tableFilterSort";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

const METHOD_ICONS = {
  chopper: IconHelicopter,
  vehicle: IconCar,
};

const METHOD_OPTIONS = Object.entries(EVAC_METHOD_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(EVAC_TEAM_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_FILTER_OPTIONS = STATUS_OPTIONS;
const METHOD_FILTER_OPTIONS = METHOD_OPTIONS;

/** Fields the brigade must still fill in before the evacuation is actionable. */
const REQUIRED_FIELDS = ["departurePoint", "destinationPoint", "startTime", "eta"];

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

function locationName(locations, id) {
  return locations.find((location) => location.id === id)?.name || null;
}

/**
 * Renders the event's evacuations as a full, inline-editable table (start
 * time, type, departure, destination, radio sign, ETA, mission id, status).
 * Covers every evacuation method (ground and aerial), not just aerial teams.
 * Fields mirror the real `evacuations` schema — no injury linkage, since the
 * DB doesn't support that relationship. A leading column pulses a warning
 * while a row is still missing brigade-entered fields. Every column but the
 * two time fields is sortable and filterable (searchable pick-list); every
 * column is sortable. Rows can be deleted via a confirm modal.
 *
 * @param {{
 *   evacuations: Array<object>,
 *   locations: Array<object>,
 *   onUpdateEvacuation: (evacId: string, changes: object) => void,
 *   onDeleteEvacuation: (evacId: string) => void,
 * }} props
 * @returns {JSX.Element} The evacuations table.
 */
const EvacuationsTable = ({ evacuations, locations, onUpdateEvacuation, onDeleteEvacuation }) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});

  const locationOptions = locations.map((location) => ({ value: location.id, label: location.name }));

  const columnAccessors = useMemo(
    () => ({
      method: (evac) => evac.method,
      departurePoint: (evac) => locationName(locations, evac.departurePoint) || "טרם הוזן",
      destinationPoint: (evac) => locationName(locations, evac.destinationPoint) || "טרם הוזן",
      forceRadioSign: (evac) => evac.forceRadioSign || "—",
      aerialMissionId: (evac) => evac.aerialMissionId || "—",
      status: (evac) => evac.status,
      startTime: (evac) => (evac.startTime ? new Date(evac.startTime).getTime() : null),
      eta: (evac) => (evac.eta ? new Date(evac.eta).getTime() : null),
    }),
    [locations],
  );

  const departureOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => locationName(locations, evac.departurePoint) || "טרם הוזן"))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations, locations]);

  const destinationOptions = useMemo(() => {
    const values = [
      ...new Set(evacuations.map((evac) => locationName(locations, evac.destinationPoint) || "טרם הוזן")),
    ];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations, locations]);

  const radioSignOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => evac.forceRadioSign || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations]);

  const missionIdOptions = useMemo(() => {
    const values = [...new Set(evacuations.map((evac) => evac.aerialMissionId || "—"))];
    return values.map((value) => ({ value, label: value }));
  }, [evacuations]);

  const startEdit = (evac) => {
    setEditingId(evac.id);
    setDraft({ ...evac });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    onUpdateEvacuation?.(editingId, draft);
    setEditingId(null);
    setDraft(null);
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
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

  return (
    <DashboardCard
      title="פינויים"
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
          {visibleEvacuations.length} מתוך {evacuations.length}
        </Badge>
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
              <ColumnHeader
                label="מספר משימה"
                {...sortProps("aerialMissionId")}
                {...filterProps("aerialMissionId", missionIdOptions)}
              />
              <ColumnHeader label="סטטוס" {...sortProps("status")} {...filterProps("status", STATUS_FILTER_OPTIONS)} />
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleEvacuations.map((evac) => {
              const isEditing = editingId === evac.id;
              const row = isEditing ? draft : evac;
              const MethodIcon = METHOD_ICONS[row.method] || IconHelicopter;
              const statusColor = EVAC_TEAM_STATUS_COLOR_VARS[row.status] || "var(--app-color-text-muted)";
              const incomplete = isIncomplete(evac);

              return (
                <Table.Tr key={evac.id}>
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
                    ) : (
                      <Text
                        ff='ui-monospace, "SF Mono", "Consolas", monospace'
                        c={row.startTime ? undefined : "var(--app-color-text-muted)"}
                      >
                        {row.startTime ? timeFormatter.format(new Date(row.startTime)) : "טרם הוזן"}
                      </Text>
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
                        {locationName(locations, row.departurePoint) || "טרם הוזן"}
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
                        {locationName(locations, row.destinationPoint) || "טרם הוזן"}
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
                        size="xs"
                        styles={inputStyles}
                        value={draft.aerialMissionId || ""}
                        onChange={(e) => updateDraft("aerialMissionId", e.currentTarget.value)}
                      />
                    ) : (
                      <Text c="var(--app-color-text-muted)">{row.aerialMissionId || "—"}</Text>
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
                <Table.Td colSpan={10} c="var(--app-color-text-muted)" ta="center">
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
