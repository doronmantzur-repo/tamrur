// React

// External libraries
import { Badge, Box, Group, Text } from "@mantine/core";
import { IconClock, IconLock } from "@tabler/icons-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Internal application modules
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * One draggable card in the kanban board. Completed events (final, per the
 * app-wide "closing is one-way" rule — see EventBadgesRow) and anything on
 * a past date (the board is read-only history there) can't be dragged, so
 * the drag hook is disabled rather than just visually discouraged. Click
 * and drag share the element with no separate handle: the parent
 * `DndContext`'s `PointerSensor` uses a distance threshold, so a plain
 * click never starts a drag and this card's own `onClick` fires normally.
 *
 * @param {{ event: object, isToday: boolean, onOpen: () => void }} props
 * @returns {JSX.Element} The kanban card.
 */
const EventQueueCard = ({ event, isToday, onOpen }) => {
  const isLocked = event.status === COMPLETED_STATUS;
  const color = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    disabled: isLocked || !isToday,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "var(--app-color-surface-high)",
        border: "1px solid var(--app-color-border)",
        borderRadius: "var(--mantine-radius-sm)",
        padding: "0.55rem 0.65rem",
        cursor: isLocked || !isToday ? "default" : "grab",
        transition: "border-color 0.15s ease, filter 0.15s ease",
      }}
      onClick={onOpen}
      {...listeners}
      {...attributes}
    >
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
    </Box>
  );
};

export default EventQueueCard;
