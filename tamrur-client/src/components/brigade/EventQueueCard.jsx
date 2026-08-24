// React
import { useState } from "react";

// External libraries
import { Badge, Box, Group, Text } from "@mantine/core";
import { IconClock, IconHelicopter, IconLock } from "@tabler/icons-react";
import { useDraggable } from "@dnd-kit/core";

// Internal application modules
import {
  CLOSED_STATUS,
  EVENT_STATUS_COLOR_VARS,
  EVENT_TYPE_LABELS,
  FULL_EVACUATION_STATUS,
} from "../../constants/eventStatus";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, PULSING_AERIAL_EVAC_STATUSES } from "../../constants/aerialEvacStatus";
import { useHoverState } from "../../hooks/useHoverState";

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
  // Only the terminal state gets the "final" badge — the three earlier
  // statuses aren't draggable either (see EventQueueCard below) but they're
  // not final, they're mid-flight and will move columns on their own as
  // gathering_status/evac_status change, so labeling them "final" would be
  // wrong.
  const isClosed = event.status === CLOSED_STATUS;
  const color = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";

  // Same field EventBadgesRow reads for its own aerial-evac badge — the
  // brigade side has no aerial-mission data loaded here, so this is the
  // event's own request flag, not a mission's (possibly more current)
  // decision; hidden entirely once "no_needed", same as there.
  const aerialEvacStatus = event["aerial-evac"];
  const showAerialEvacBadge = aerialEvacStatus && aerialEvacStatus !== "no_needed";
  const aerialEvacColor = AERIAL_EVAC_COLOR_VARS[aerialEvacStatus] || "var(--app-color-text-muted)";

  return (
    <>
      <Group gap={4} wrap="wrap" mb={6}>
        <Badge
          size="xs"
          variant="outline"
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

        {showAerialEvacBadge && (
          <Badge
            size="xs"
            leftSection={<IconHelicopter size={11} />}
            className={PULSING_AERIAL_EVAC_STATUSES.includes(aerialEvacStatus) ? "app-pulse-glow" : undefined}
            styles={{
              root: {
                backgroundColor: `color-mix(in srgb, ${aerialEvacColor} 16%, transparent)`,
                color: aerialEvacColor,
              },
            }}
          >
            {AERIAL_EVAC_LABELS[aerialEvacStatus] || aerialEvacStatus}
          </Badge>
        )}
      </Group>

      <Text fz="sm" fw={700} mb={4} lineClamp={2}>
        {event.name}
      </Text>

      <Group gap={4} c="var(--app-color-text-muted)">
        <IconClock size={11} stroke={2} />
        <Text fz="xs" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
          {timeFormatter.format(new Date(event.created_at))}
        </Text>
      </Group>

      {isClosed && (
        <Group gap={4} mt={6} c={color}>
          <IconLock size={10} stroke={2.4} />
          <Text fz="xs">סופי — לא ניתן להזיז</Text>
        </Group>
      )}
    </>
  );
}

/**
 * One draggable card in the kanban board. `status` is derived server-side
 * from gathering_status/evac_status for every status except full_evacuation
 * (see EventBadgesRow) — a card is only ever draggable while it's at
 * full_evacuation, since that's the one status with a manual transition
 * (closing). Anything on a past date (the board is read-only history there)
 * also can't be dragged, so the drag hook is disabled rather than just
 * visually discouraged. Click
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
 * Hover feedback (tinted background/border in the event's own status color,
 * plus a small lift) applies to every card regardless of `isDraggable` —
 * every card opens on click, only dragging is status/date-gated — via
 * `useHoverState`, this app's working hover mechanism for a plain inline-
 * styled `Box` (a `"&:hover"` key in Mantine's `styles` prop is silently
 * dropped here, see that hook's own docstring). Pressed state (mouse down,
 * not yet released) shrinks the card slightly, same `onMouseDown`/`onMouseUp`
 * + `onMouseLeave` reset pattern `EventActionButtons` already uses for its
 * own press feedback — the leave-reset matters here too, since pressing down
 * then dragging the pointer off the card without releasing shouldn't leave
 * it stuck looking pressed.
 *
 * @param {{ event: object, isToday: boolean, onOpen: () => void }} props
 * @returns {JSX.Element} The kanban card.
 */
const EventQueueCard = ({ event, isToday, onOpen }) => {
  const isDraggable = event.status === FULL_EVACUATION_STATUS;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    disabled: !isDraggable || !isToday,
  });
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  const statusColor = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";
  const isActive = isHovered && !isDragging;
  const isActivePressed = isPressed && !isDragging;

  return (
    <Box
      ref={setNodeRef}
      style={{
        backgroundColor: isActive
          ? `color-mix(in srgb, ${statusColor} 10%, var(--app-color-surface-high))`
          : "var(--app-color-surface-high)",
        border: `1px solid ${isActive ? `color-mix(in srgb, ${statusColor} 45%, transparent)` : "var(--app-color-border)"}`,
        borderRadius: "var(--mantine-radius-sm)",
        padding: "0.55rem 0.65rem",
        // Never the plain arrow: every card opens on click (pointer), and a
        // draggable one also gets the hand-drag cursor (grab) on top of that.
        cursor: isDraggable && isToday ? "grab" : "pointer",
        opacity: isDragging ? 0.4 : 1,
        transform: isActivePressed ? "scale(0.97)" : isActive ? "translateY(-1px)" : "none",
        transition: "transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
      }}
      onClick={onOpen}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...listeners}
      {...attributes}
    >
      <EventQueueCardContent event={event} />
    </Box>
  );
};

export default EventQueueCard;
