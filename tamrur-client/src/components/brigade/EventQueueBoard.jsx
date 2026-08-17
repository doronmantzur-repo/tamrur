// React
import { useMemo, useState } from "react";

// External libraries
import { Box, Button, Group, Modal, Select, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconShieldHalfFilled } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";

// Internal application modules
import QueueColumn from "./QueueColumn";
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";

// Styles

/** `EVENT_STATUS_LABELS`' own insertion order is the canonical progression, already relied on elsewhere (e.g. EventBadgesRow's status menu). */
const STATUS_LIST = Object.entries(EVENT_STATUS_LABELS).map(([key, label]) => ({
  key,
  label,
  color: EVENT_STATUS_COLOR_VARS[key] || "var(--app-color-text-muted)",
}));

const TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const SORTERS = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  name: (a, b) => a.name.localeCompare(b.name, "he"),
  type: (a, b) => (EVENT_TYPE_LABELS[a.type] || a.type).localeCompare(EVENT_TYPE_LABELS[b.type] || b.type, "he"),
};

/**
 * The kanban view: five status queues the brigade drags events between.
 * Every queue sorts independently (`sortModeByStatus`, not one board-wide
 * order). Dropping into "completed" opens a confirm modal first — that
 * status is final everywhere else in the app (EventBadgesRow) — every
 * other move applies immediately. New events can only ever be created into
 * "evaluated" (the "+" only exists on that column, per product decision),
 * never opened directly into a later status. The whole board is read-only
 * (no drag, no create) while `isToday` is false, since dragging changes an
 * event's *current* status, which isn't meaningful while browsing a past
 * day. Still mock data: `onStatusChange`/`onCompleteEvent`/`onCreateEvent`
 * just update the page's local state, no dispatch/fetch here.
 *
 * @param {{
 *   events: Array<object>,
 *   isToday: boolean,
 *   onStatusChange: (id: string|number, status: string) => void,
 *   onCompleteEvent: (id: string|number) => void,
 *   onCreateEvent: (input: { name: string, type: string }) => void,
 * }} props
 * @returns {JSX.Element} The kanban board.
 */
const EventQueueBoard = ({ events, isToday, onStatusChange, onCompleteEvent, onCreateEvent }) => {
  const navigate = useNavigate();

  const [sortModeByStatus, setSortModeByStatus] = useState(() =>
    Object.fromEntries(STATUS_LIST.map((s) => [s.key, "created_desc"])),
  );
  const [pendingDrop, setPendingDrop] = useState(null); // { eventId, name } | null
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState(TYPE_OPTIONS[0].value);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = useMemo(
    () =>
      STATUS_LIST.map((status) => ({
        status,
        events: events.filter((event) => event.status === status.key).sort(SORTERS[sortModeByStatus[status.key]]),
      })),
    [events, sortModeByStatus],
  );

  const handleSortChange = (statusKey, mode) => {
    setSortModeByStatus((prev) => ({ ...prev, [statusKey]: mode }));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const eventId = active.id;
    const toStatus = over.id;
    const source = events.find((event) => event.id === eventId);
    if (!source || source.status === toStatus) return;

    if (toStatus === COMPLETED_STATUS) {
      setPendingDrop({ eventId, name: source.name });
      return;
    }

    onStatusChange(eventId, toStatus);
  };

  const handleConfirmComplete = () => {
    if (!pendingDrop) return;
    onCompleteEvent(pendingDrop.eventId);
    setPendingDrop(null);
  };

  const openCreateModal = () => {
    setCreateName("");
    setCreateType(TYPE_OPTIONS[0].value);
    setCreateOpen(true);
  };

  const handleCreateConfirm = () => {
    const name = createName.trim();
    if (!name) return;
    onCreateEvent({ name, type: createType });
    setCreateOpen(false);
  };

  return (
    <>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.75rem",
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {columns.map(({ status, events: columnEvents }) => (
            <QueueColumn
              key={status.key}
              status={status}
              events={columnEvents}
              isEvaluatedColumn={status.key === "evaluated"}
              isToday={isToday}
              sortMode={sortModeByStatus[status.key]}
              onSortChange={(mode) => handleSortChange(status.key, mode)}
              onAddEvent={openCreateModal}
              onOpenEvent={(id) => navigate(`/brigade/${id}`)}
            />
          ))}
        </DndContext>
      </Box>

      <Modal
        opened={Boolean(pendingDrop)}
        onClose={() => setPendingDrop(null)}
        centered
        radius="sm"
        title={
          <Group gap="xs" wrap="nowrap">
            <IconAlertTriangle size={22} stroke={1.8} color="var(--app-color-warning)" />
            <Text fw={700} fz="lg" c="var(--app-color-text)">
              סגירת אירוע
            </Text>
          </Group>
        }
        styles={{
          content: {
            border: "1px solid color-mix(in srgb, var(--app-color-warning) 40%, transparent)",
            backgroundColor: "var(--app-color-surface)",
          },
          header: { backgroundColor: "var(--app-color-surface)" },
        }}
      >
        <Text fz="sm" c="var(--app-color-text-muted)" mb="lg">
          להעביר את &laquo;{pendingDrop?.name}&raquo; לסטטוס <strong>הושלם</strong>? האירוע יסומן כהושלם ולא ניתן יהיה לשנות זאת.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setPendingDrop(null)}>
            ביטול
          </Button>
          <Button
            styles={{ root: { backgroundColor: "var(--app-color-warning)", color: "#FFFFFF" } }}
            onClick={handleConfirmComplete}
          >
            סגור אירוע
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        centered
        radius="sm"
        title={
          <Group gap="xs" wrap="nowrap">
            <IconShieldHalfFilled size={20} stroke={1.8} color="var(--app-color-primary)" />
            <Text fw={700} fz="lg" c="var(--app-color-text)">
              אירוע חדש
            </Text>
          </Group>
        }
        styles={{
          content: {
            border: "1px solid color-mix(in srgb, var(--app-color-primary) 40%, transparent)",
            backgroundColor: "var(--app-color-surface)",
          },
          header: { backgroundColor: "var(--app-color-surface)" },
        }}
      >
        <Text fz="xs" c="var(--app-color-text-muted)" mb="md">
          כל אירוע חדש נפתח בסטטוס <strong>מוערך</strong> — לא ניתן לפתוח אירוע ישירות בסטטוס אחר.
        </Text>

        <TextInput
          label="שם האירוע"
          placeholder='לדוגמה: "פיצוץ ליד ציר 90"'
          value={createName}
          onChange={(event) => setCreateName(event.currentTarget.value)}
          mb="sm"
          autoFocus
        />

        <Select label="סוג אירוע" data={TYPE_OPTIONS} value={createType} onChange={setCreateType} allowDeselect={false} mb="lg" />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setCreateOpen(false)}>
            ביטול
          </Button>
          <Button
            disabled={!createName.trim()}
            styles={{
              root: {
                backgroundColor: "var(--app-color-primary)",
                color: "var(--app-color-primary-text)",
                "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
              },
            }}
            onClick={handleCreateConfirm}
          >
            פתח אירוע
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default EventQueueBoard;
