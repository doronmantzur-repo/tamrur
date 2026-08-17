// React

// External libraries
import { Badge, Box, Group, Text } from "@mantine/core";
import { IconClock, IconLock } from "@tabler/icons-react";
import { useDraggable } from "@dnd-kit/core";

// Internal application modules
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * The card's visual content only, with no drag/click wiring of its own —
 * shared between the real draggable card below and its `DragOverlay`
 * preview in `EventQueueBoard`. The overlay can't just render another
 * `EventQueueCard` for the same event, since `useDraggable` only allows one
 * registration per id and the overlay renders *alongside* the original
 * while a drag is in progress, not instead of it.
 *
 * @param {{ event: object }} props
 * @returns {JSX.Element} The card's inner content.
 */
export function EventQueueCardContent({ event }) {
  const isLocked = event.status === COMPLETED_STATUS;
  const color = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";

  return (
    <>
      <Badge
        size="xs"
        variant="outline"
        mb={6}
        styles={{
          root: {
            backgroundColor: "var(--app-color-surface)",
            borderColor: "var(--app-color-border)",
            color: "var(--app-color-text-muted)",
          },
        }}
      >
        {EVENT_TYPE_LABELS[event.type] || event.type}
      </Badge>

      <Text fz="sm" fw={700} mb={4} lineClamp={2}>
        {event.name}
      </Text>

      <Group gap={4} c="var(--app-color-text-muted)">
        <IconClock size={11} stroke={2} />
        <Text fz="xs" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
          {timeFormatter.format(new Date(event.created_at))}
        </Text>
      </Group>

      {isLocked && (
        <Group gap={4} mt={6} c={color}>
          <IconLock size={10} stroke={2.4} />
          <Text fz="xs">סופי — לא ניתן להזיז</Text>
        </Group>
      )}
    </>
  );
}

/**
 * One draggable card in the kanban board. Completed events (final, per the
 * app-wide "closing is one-way" rule — see EventBadgesRow) and anything on
 * a past date (the board is read-only history there) can't be dragged, so
 * the drag hook is disabled rather than just visually discouraged. Click
 * and drag share the element with no separate handle: the parent
 * `DndContext`'s `PointerSensor` uses a distance threshold, so a plain
 * click never starts a drag and this card's own `onClick` fires normally.
 *
 * The card itself stays put (just dimmed) while dragging — it does *not*
 * follow the pointer via `useDraggable`'s own `transform`. Each column's
 * card list scrolls (`overflow-y: auto`), which clips any child the moment
 * it's transformed outside that column's box — exactly what happens the
 * instant a drag crosses into a neighboring column. `EventQueueBoard`'s
 * `DragOverlay` (portal-rendered, unaffected by any column's overflow) is
 * what actually renders the moving copy.
 *
 * @param {{ event: object, isToday: boolean, onOpen: () => void }} props
 * @returns {JSX.Element} The kanban card.
 */
const EventQueueCard = ({ event, isToday, onOpen }) => {
  const isLocked = event.status === COMPLETED_STATUS;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    disabled: isLocked || !isToday,
  });

  return (
    <Box
      ref={setNodeRef}
      style={{
        backgroundColor: "var(--app-color-surface-high)",
        border: "1px solid var(--app-color-border)",
        borderRadius: "var(--mantine-radius-sm)",
        padding: "0.55rem 0.65rem",
        cursor: isLocked || !isToday ? "default" : "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "border-color 0.15s ease, filter 0.15s ease",
      }}
      onClick={onOpen}
      {...listeners}
      {...attributes}
    >
      <EventQueueCardContent event={event} />
    </Box>
  );
};

export default EventQueueCard;
