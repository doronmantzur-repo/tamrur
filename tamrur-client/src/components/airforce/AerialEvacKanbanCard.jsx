// React
import { useState } from "react";

// External libraries
import { Badge, Box, Group, Stack, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconClock, IconHelicopter } from "@tabler/icons-react";
import { useDraggable } from "@dnd-kit/core";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import CasualtiesCard from "../dashboard/CasualtiesCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

/**
 * The card's visual content only, with no drag wiring — shared between the
 * real draggable card below and its `DragOverlay` ghost in
 * `AerialEvacKanbanBoard`, same split `EventQueueCardContent` uses on the
 * brigade board and for the same reason: `useDraggable` only registers once
 * per id, and the overlay renders *alongside* the original while dragging,
 * not instead of it.
 *
 * Expandable to show the real casualty table — read-only here. Deciding
 * only happens by dragging the card to a column, not from inside it (see
 * `AerialEvacKanbanBoard`'s docstring for why).
 *
 * `isOpen`/`onToggleOpen` are owned by the caller (`AerialEvacKanbanCard`,
 * below) rather than local state here, so a click anywhere on the card can
 * drive the same toggle the chevron itself uses — this component no longer
 * has its own opinion about whether it's open. The `DragOverlay` ghost in
 * `AerialEvacKanbanBoard` doesn't pass either, since that copy is never
 * interactive; the defaults keep it rendering closed.
 *
 * @param {{ event: object, casualties: Array<object>, aerialStatus: string, isOpen?: boolean, onToggleOpen?: () => void }} props
 * @returns {JSX.Element} The card's inner content.
 */
export function AerialEvacKanbanCardContent({ event, casualties, aerialStatus, isOpen = false, onToggleOpen = () => {} }) {
  const waitSeconds = useElapsedSeconds(event.created_at, null);
  const color = AERIAL_EVAC_COLOR_VARS[aerialStatus] || "var(--app-color-text-muted)";

  return (
    <DashboardCard
      padding="sm"
      gap="xs"
      accentColor={color}
      titleContent={
        <Text fz="sm" fw={700} c="var(--app-color-text)" lineClamp={2}>
          {event.name || "אירוע ללא שם"}
        </Text>
      }
      headerExtra={
        <Box
          component="button"
          type="button"
          // The whole card also toggles on click (see `AerialEvacKanbanCard`
          // below) — stopping propagation here keeps a direct click on the
          // chevron from also bubbling into that handler and toggling twice
          // (which would cancel itself out).
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onToggleOpen();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: 0,
            padding: "0.15rem",
            cursor: "pointer",
            color: "var(--app-color-text-muted)",
            flexShrink: 0,
          }}
          aria-label={isOpen ? "הסתר פרטי נפגעים" : "הצג פרטי נפגעים"}
          title={isOpen ? "הסתר פרטי נפגעים" : "הצג פרטי נפגעים"}
        >
          {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </Box>
      }
    >
      <Stack gap="xs">
        {/* One row, right to left: aerial status, sitting, laying, time. */}
        <Group gap={6} wrap="nowrap" style={{ overflowX: "auto" }}>
          <Badge
            size="sm"
            leftSection={<IconHelicopter size={11} />}
            styles={{ root: { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color } }}
          >
            {AERIAL_EVAC_LABELS[aerialStatus] || aerialStatus}
          </Badge>

          <Badge
            size="xs"
            styles={{
              root: {
                backgroundColor: "color-mix(in srgb, var(--app-color-info) 16%, transparent)",
                color: "var(--app-color-info)",
              },
            }}
          >
            {casualties.filter((casualty) => casualty["evac-ability"] === "sit").length} ישיבה
          </Badge>

          <Badge
            size="xs"
            styles={{
              root: {
                backgroundColor: "color-mix(in srgb, var(--app-color-warning) 16%, transparent)",
                color: "var(--app-color-warning)",
              },
            }}
          >
            {casualties.filter((casualty) => casualty["evac-ability"] === "lie").length} שכיבה
          </Badge>

          <Group gap={4} c="var(--app-color-text-muted)" fz="0.7rem" ff={MONO_FONT} wrap="nowrap" style={{ flexShrink: 0 }}>
            <IconClock size={12} stroke={1.8} />
            {formatDuration(waitSeconds, { showDays: false })}
          </Group>
        </Group>

        {isOpen && (
          // Its own click boundary: the whole card toggles on click, but
          // once the detail table is open, clicking a row inside it (e.g.
          // the hover-highlighted rows CasualtiesCard now supports) should
          // read that row, not immediately collapse the card back out from
          // under it.
          <Box onClick={(clickEvent) => clickEvent.stopPropagation()}>
            <CasualtiesCard casualties={casualties} statBreakdown="ability" bare rowHover />
          </Box>
        )}
      </Stack>
    </DashboardCard>
  );
}

/**
 * One draggable kanban card. Only draggable while `isPending` — once
 * approved or denied, a card is terminal and can't be moved (see the
 * board's docstring). Click and drag share the element with no separate
 * handle: the parent `DndContext`'s `PointerSensor` uses a distance
 * threshold, so a plain click (e.g. the expand toggle) never starts a drag.
 *
 * The card itself stays in place (just dimmed) while dragging, same as the
 * brigade board's `EventQueueCard` and for the same reason: a column
 * scrolls (`overflow-y: auto`), which would clip a transformed child the
 * moment it crosses into a neighboring column — the board's `DragOverlay`
 * (portal-rendered, unaffected by any column's overflow) renders the moving
 * copy instead.
 *
 * Hover/press (`useHoverState` + `onMouseDown`/`onMouseUp`, matching
 * `EventQueueCard`'s own treatment) live on this wrapper `Box`, not on
 * `AerialEvacKanbanCardContent`'s `DashboardCard` — `DashboardCard` is a
 * shared component used well beyond this one card, so its own
 * background/border stay untouched; instead the wrapper adds an outward
 * glow ring (sized to match `DashboardCard`'s own `radius="sm"`) plus a
 * lift, around the outside of the card it already renders.
 *
 * A pending card also pulses a gold glow, via `app-pulse-glow-ring`
 * (`src/index.css`) — a box-shadow-only sibling of `app-pulse-glow` (the
 * header bell's own pulse) that skips its opacity dip, which on a full card
 * would read as it going translucent rather than just glowing. `color` sets
 * the gold accent since that keyframe's box-shadow is `currentColor`-based.
 * Lives on a second, outer `Box` rather than the hover-ring one below, since
 * an animated `box-shadow` would otherwise fight that element's own static
 * `box-shadow` on the same property (a CSS animation overrides whatever it's
 * animating for as long as it runs, inline style included).
 *
 * The expand/collapse toggle also lives here rather than inside
 * `AerialEvacKanbanCardContent`, so clicking anywhere on the card (not just
 * its chevron) opens/closes the casualty detail — same "the whole item is
 * clickable" treatment `EventQueueCard` gives the brigade board's cards.
 *
 * @param {{ event: object, mission: object | undefined, casualties: Array<object>, aerialStatus: string, isPending: boolean }} props
 * @returns {JSX.Element} The kanban card.
 */
const AerialEvacKanbanCard = ({ event, casualties, aerialStatus, isPending }) => {
  const { setNodeRef, isDragging, listeners, attributes } = useDraggable({
    id: event.id,
    disabled: !isPending,
  });
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const color = AERIAL_EVAC_COLOR_VARS[aerialStatus] || "var(--app-color-text-muted)";
  const isActive = isHovered && !isDragging;
  const isActivePressed = isPressed && !isDragging;
  const toggleOpen = () => setIsOpen((current) => !current);

  return (
    <Box
      className={isPending ? "app-pulse-glow-ring" : undefined}
      style={isPending ? { color: "var(--app-color-primary)", borderRadius: "var(--mantine-radius-sm)" } : undefined}
    >
      <Box
        ref={setNodeRef}
        onClick={toggleOpen}
        style={{
          cursor: isPending ? "grab" : "pointer",
          opacity: isDragging ? 0.4 : 1,
          borderRadius: "var(--mantine-radius-sm)",
          boxShadow: isActive ? `0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)` : "none",
          transform: isActivePressed ? "scale(0.97)" : isActive ? "translateY(-1px)" : "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        {...hoverHandlers}
        onMouseLeave={() => {
          hoverHandlers.onMouseLeave();
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        {...(isPending ? listeners : {})}
        {...(isPending ? attributes : {})}
      >
        <AerialEvacKanbanCardContent
          event={event}
          casualties={casualties}
          aerialStatus={aerialStatus}
          isOpen={isOpen}
          onToggleOpen={toggleOpen}
        />
      </Box>
    </Box>
  );
};

export default AerialEvacKanbanCard;
