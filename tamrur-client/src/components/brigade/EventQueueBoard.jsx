// React
import { useMemo, useState } from "react";

// External libraries
import { Alert, Box, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";

// Internal application modules
import QueueColumn from "./QueueColumn";
import { EventQueueCardContent } from "./EventQueueCard";
import { CLOSED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";

// Styles

/** `EVENT_STATUS_LABELS`' own insertion order is the canonical progression, already relied on elsewhere (e.g. EventBadgesRow's status menu). */
const STATUS_LIST = Object.entries(EVENT_STATUS_LABELS).map(([key, label]) => ({
  key,
  label,
  color: EVENT_STATUS_COLOR_VARS[key] || "var(--app-color-text-muted)",
}));

const SORTERS = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  name: (a, b) => a.name.localeCompare(b.name, "he"),
  type: (a, b) => (EVENT_TYPE_LABELS[a.type] || a.type).localeCompare(EVENT_TYPE_LABELS[b.type] || b.type, "he"),
};

/**
 * The kanban view: five status queues showing the brigade's events. `status`
 * is derived server-side from gathering_status/evac_status for every column
 * except the manual transition into "closed" — so dragging is restricted to
 * exactly one move, full_evacuation -> closed (enforced in EventQueueCard's
 * `isDraggable` and QueueColumn's `useDroppable`, not here); everything else
 * moves columns on its own as the underlying data changes. Dropping onto the
 * closed column opens a confirm modal first, since closing is final
 * everywhere else in the app (EventBadgesRow).
 *
 * Moves are optimistic: `statusOverrides` shows a card in its new column
 * the instant it's dropped, laid on top of the real `events` prop from
 * Redux (`effectiveEvents`), while `onCloseEvent` dispatches the real close
 * in the background. The override clears once that resolves (by then the
 * store has the real value anyway) or, on failure, clears and reverts the
 * card to its actual status while showing an error banner — otherwise a
 * card would visibly snap back to its old column for a moment and then jump
 * to the new one once the network round-trip finished, since nothing here
 * has any control over how long that takes.
 *
 * The "+" (gathering_casualties column only — new events can only ever start
 * there) navigates to the existing `/create-event` page rather than opening
 * its own form: that page already collects the location `createEvent`
 * requires (a lightweight inline form here couldn't, with no location
 * picker of its own) and already guarantees new events start as
 * "gathering_casualties" since it never sends a status. The whole board is
 * read-only (no drag, no "+") while `isToday` is false, since dragging
 * changes an event's *current* status, which isn't meaningful while
 * browsing a past day.
 *
 * @param {{
 *   events: Array<object>,
 *   isToday: boolean,
 *   onCloseEvent: (id: string|number) => Promise<unknown>,
 * }} props
 * @returns {JSX.Element} The kanban board.
 */
const EventQueueBoard = ({ events, isToday, onCloseEvent }) => {
  const navigate = useNavigate();

  const [sortModeByStatus, setSortModeByStatus] = useState(() =>
    Object.fromEntries(STATUS_LIST.map((s) => [s.key, "created_desc"])),
  );
  const [pendingDrop, setPendingDrop] = useState(null); // { eventId, name } | null
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeWidth, setActiveWidth] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({}); // { [eventId]: status }
  const [dropError, setDropError] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // The optimistic layer: same events, with any in-flight move's status
  // already applied, so the board reflects a drop instantly instead of
  // waiting on the network round-trip.
  const effectiveEvents = useMemo(
    () => events.map((event) => (event.id in statusOverrides ? { ...event, status: statusOverrides[event.id] } : event)),
    [events, statusOverrides],
  );

  const columns = useMemo(
    () =>
      STATUS_LIST.map((status) => ({
        status,
        events: effectiveEvents.filter((event) => event.status === status.key).sort(SORTERS[sortModeByStatus[status.key]]),
      })),
    [effectiveEvents, sortModeByStatus],
  );

  const handleSortChange = (statusKey, mode) => {
    setSortModeByStatus((prev) => ({ ...prev, [statusKey]: mode }));
  };

  const clearOverride = (eventId) => {
    setStatusOverrides((prev) => {
      if (!(eventId in prev)) return prev;
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  };

  /** Shows the move immediately, then reconciles once the real dispatch settles. */
  const applyOptimisticMove = (eventId, toStatus, dispatchMove) => {
    setDropError(null);
    setStatusOverrides((prev) => ({ ...prev, [eventId]: toStatus }));

    dispatchMove().then(
      () => clearOverride(eventId),
      (message) => {
        clearOverride(eventId);
        setDropError(message);
      },
    );
  };

  const handleDragStart = ({ active }) => {
    setActiveEvent(effectiveEvents.find((event) => event.id === active.id) ?? null);
    setActiveWidth(active.rect.current?.initial?.width ?? null);
  };

  const clearActiveDrag = () => {
    setActiveEvent(null);
    setActiveWidth(null);
  };

  // EventQueueCard's isDraggable and QueueColumn's useDroppable already
  // restrict drags to full_evacuation -> closed, so any drop that lands here
  // is that one move — just confirm it.
  const handleDragEnd = ({ active, over }) => {
    clearActiveDrag();

    if (!over) return;
    const eventId = active.id;
    const source = effectiveEvents.find((event) => event.id === eventId);
    if (!source || source.status === over.id) return;

    setPendingDrop({ eventId, name: source.name });
  };

  const handleConfirmClose = () => {
    if (!pendingDrop) return;
    const { eventId } = pendingDrop;
    setPendingDrop(null);
    applyOptimisticMove(eventId, CLOSED_STATUS, () => onCloseEvent(eventId));
  };

  return (
    <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
      {dropError && (
        <Alert
          icon={<IconAlertTriangle size={18} />}
          title="עדכון האירוע נכשל"
          withCloseButton
          onClose={() => setDropError(null)}
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
              borderInlineStart: "3px solid var(--app-color-error)",
            },
            title: { color: "var(--app-color-error)" },
            body: { color: "var(--app-color-text)" },
          }}
        >
          {dropError}
        </Alert>
      )}

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.75rem",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={clearActiveDrag}
        >
          {columns.map(({ status, events: columnEvents }) => (
            <QueueColumn
              key={status.key}
              status={status}
              events={columnEvents}
              isGatheringCasualtiesColumn={status.key === "gathering_casualties"}
              isToday={isToday}
              sortMode={sortModeByStatus[status.key]}
              onSortChange={(mode) => handleSortChange(status.key, mode)}
              onAddEvent={() => navigate("/create-event")}
              onOpenEvent={(id) => navigate(`/brigade/${id}`)}
            />
          ))}

          {/* Portal-rendered, so it's never clipped by a column's own
              overflow — see EventQueueCard's docstring for why that clipping
              made the dragged card disappear once it crossed into another
              column without this. */}
          <DragOverlay>
            {activeEvent && (
              <Box
                style={{
                  width: activeWidth ?? undefined,
                  backgroundColor: "var(--app-color-surface-high)",
                  border: "1px solid var(--app-color-primary)",
                  borderRadius: "var(--mantine-radius-sm)",
                  padding: "0.55rem 0.65rem",
                  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.4)",
                  cursor: "grabbing",
                }}
              >
                <EventQueueCardContent event={activeEvent} />
              </Box>
            )}
          </DragOverlay>
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
          לסגור את &laquo;{pendingDrop?.name}&raquo;? הפעולה סופית ולא ניתנת לביטול.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={() => setPendingDrop(null)}>
            ביטול
          </Button>
          <Button
            styles={{ root: { backgroundColor: "var(--app-color-warning)", color: "#FFFFFF" } }}
            onClick={handleConfirmClose}
          >
            סגור אירוע
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default EventQueueBoard;
