// React

// External libraries
import { ActionIcon, Badge, Box, Group, Stack, Text, Tooltip } from "@mantine/core";
import {
  IconArrowsSort,
  IconChevronDown,
  IconFilter,
  IconFilterFilled,
  IconFilterX,
  IconHelicopter,
  IconPlus,
  IconTarget,
} from "@tabler/icons-react";
import { useDroppable } from "@dnd-kit/core";

// Internal application modules
import EventQueueCard from "./EventQueueCard";
import { CLOSED_STATUS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/** Sort options for a single queue — every queue picks its own, independently of the others. */
const QUEUE_SORT_OPTIONS = [
  { value: "created_desc", label: "אירוע חדש קודם" },
  { value: "created_asc", label: "אירוע ישן קודם" },
  { value: "name_asc", label: "שם (א-ת)" },
  { value: "name_desc", label: "שם (ת-א)" },
];

/** "הכל" (all) first, then every real value — same shape `EventQueueTable.jsx`'s own filter options use, just with an explicit "no filter" choice since this is a single-select dropdown rather than a checkbox list. */
const AERIAL_EVAC_FILTER_OPTIONS = [
  { value: "all", label: "הכל" },
  ...Object.entries(AERIAL_EVAC_LABELS).map(([value, label]) => ({ value, label })),
];
const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "הכל" },
  ...Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

/**
 * A plain HTML `<select>` styled to match this app's dark theme, shared by
 * the sort picker and the two filter dropdowns below — Mantine's form
 * inputs carry theme-forced sizing/spacing that fights a compact control
 * like this one, so a native element sidesteps it entirely rather than
 * fighting it. The closed box is fully styled (native selects don't allow
 * styling their open dropdown list, but that's a minor, well-understood
 * browser limitation).
 *
 * `tooltipLabel` is the short, column-agnostic hint shown on hover/focus
 * (e.g. "סנן לפי סוג אירוע") — naming which column it's in would be
 * redundant, since the tooltip only ever appears right on that column's own
 * control. `ariaLabel` stays fully explicit (e.g. "סנן את X לפי סוג אירוע")
 * since screen-reader users don't get that same visual column context.
 *
 * @param {{ icon: React.ComponentType, value: string, onChange: (value: string) => void, options: Array<{value: string, label: string}>, ariaLabel: string, tooltipLabel: string }} props
 * @returns {JSX.Element} The select field.
 */
function NativeSelectField({ icon: Icon, value, onChange, options, ariaLabel, tooltipLabel }) {
  return (
    <Tooltip label={tooltipLabel} position="top" withArrow>
      <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        <Icon
          size={13}
          stroke={2}
          style={{
            position: "absolute",
            insetInlineStart: "0.5rem",
            color: "var(--app-color-text-muted)",
            pointerEvents: "none",
          }}
        />
        <select
          aria-label={ariaLabel}
          value={value}
          onChange={(evt) => onChange(evt.target.value)}
          style={{
            width: "100%",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            boxSizing: "border-box",
            height: "1.8rem",
            paddingInlineStart: "1.6rem",
            paddingInlineEnd: "1.4rem",
            borderRadius: "var(--mantine-radius-sm)",
            border: "1px solid var(--app-color-border)",
            backgroundColor: "var(--app-color-surface-high)",
            color: "var(--app-color-text-muted)",
            fontFamily: "inherit",
            fontSize: "0.72rem",
            cursor: "pointer",
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <IconChevronDown
          size={12}
          stroke={2}
          style={{
            position: "absolute",
            insetInlineEnd: "0.5rem",
            color: "var(--app-color-text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
    </Tooltip>
  );
}

/**
 * The per-column filter row: a filter icon, with the aerial-evac and event-
 * type dropdowns to its left.
 *
 * Rest state matches the two meanings the icon can have:
 * - No filter applied: the exact same look the table view's own filter icon
 *   uses (`ColumnHeader.jsx` — outline `IconFilter`, muted). Hovering swaps
 *   it to the filled gold funnel (`IconFilterFilled`) as a "click to filter"
 *   invitation — glyph and color both change, which needs real hover state
 *   (`useHoverState`) rather than a CSS `&:hover`, since swapping which icon
 *   renders isn't something a style object can do.
 * - A filter applied: outline `IconFilterX` in red at rest ("something is
 *   filtered"); hovering fills the button solid red with a white icon,
 *   confirming "click to reset." Clicking while nothing is selected does
 *   nothing — there's nothing to reset.
 *
 * @param {{
 *   label: string,
 *   filters: { aerialEvac: string, type: string },
 *   onFilterChange: (key: "aerialEvac" | "type", value: string) => void,
 *   onClearFilters: () => void,
 * }} props
 * @returns {JSX.Element} The filter row.
 */
function QueueFilterRow({ label, filters, onFilterChange, onClearFilters }) {
  const isFilterActive = filters.aerialEvac !== "all" || filters.type !== "all";
  const [isHovered, hoverHandlers] = useHoverState();

  let icon;
  let iconColor;
  let backgroundColor = "transparent";

  if (isFilterActive) {
    icon = <IconFilterX size={14} stroke={1.8} />;
    if (isHovered) {
      backgroundColor = "var(--app-color-error)";
      iconColor = "#FFFFFF";
    } else {
      iconColor = "var(--app-color-error)";
    }
  } else if (isHovered) {
    icon = <IconFilterFilled size={14} />;
    iconColor = "var(--app-color-primary)";
  } else {
    icon = <IconFilter size={14} stroke={1.8} />;
    iconColor = "var(--app-color-text-muted)";
  }

  return (
    <Group gap={6} wrap="nowrap">
      <ActionIcon
        size="sm"
        variant="subtle"
        aria-label={isFilterActive ? "נקה סינון" : "סינון"}
        title={isFilterActive ? "נקה סינון" : "סינון"}
        onClick={() => isFilterActive && onClearFilters()}
        {...hoverHandlers}
        styles={{
          root: {
            flexShrink: 0,
            backgroundColor,
            color: iconColor,
            transition: "background-color 0.15s ease, color 0.15s ease",
          },
        }}
      >
        {icon}
      </ActionIcon>

      <NativeSelectField
        icon={IconHelicopter}
        value={filters.aerialEvac}
        onChange={(value) => onFilterChange("aerialEvac", value)}
        options={AERIAL_EVAC_FILTER_OPTIONS}
        ariaLabel={`סנן את ${label} לפי פינוי אווירי`}
        tooltipLabel="סנן לפי פינוי אווירי"
      />

      <NativeSelectField
        icon={IconTarget}
        value={filters.type}
        onChange={(value) => onFilterChange("type", value)}
        options={TYPE_FILTER_OPTIONS}
        ariaLabel={`סנן את ${label} לפי סוג אירוע`}
        tooltipLabel="סנן לפי סוג אירוע"
      />
    </Group>
  );
}

/**
 * One droppable queue column: a colored header bar naming the status and
 * how many events are in it, an optional "+" (gathering_casualties only —
 * every new event starts there, never dropped straight into another
 * status), a per-column sort picker, a per-column filter row (aerial-evac
 * status + event type, each independent of every other column's filters —
 * same "every queue picks its own" model the sort picker already uses), and
 * the scrollable card list itself. Only the closed column ever accepts a
 * drop — every other status is derived server-side, so dragging a card
 * there wouldn't mean anything (see EventQueueCard's `isDraggable`, which
 * restricts the drag side of the same restriction) — and, same as before,
 * disabled entirely on a past date, since the board is read-only history
 * away from today.
 *
 * @param {{
 *   status: { key: string, label: string, color: string },
 *   events: Array<object>,
 *   isGatheringCasualtiesColumn: boolean,
 *   isToday: boolean,
 *   sortMode: string,
 *   onSortChange: (mode: string) => void,
 *   filters: { aerialEvac: string, type: string },
 *   onFilterChange: (key: string, value: string) => void,
 *   onClearFilters: () => void,
 *   onAddEvent?: () => void,
 *   onOpenEvent: (id: string) => void,
 * }} props
 * @returns {JSX.Element} The queue column.
 */
const QueueColumn = ({
  status,
  events,
  isGatheringCasualtiesColumn,
  isToday,
  sortMode,
  onSortChange,
  filters,
  onFilterChange,
  onClearFilters,
  onAddEvent,
  onOpenEvent,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.key,
    disabled: !isToday || status.key !== CLOSED_STATUS,
  });
  const [isHovered, hoverHandlers] = useHoverState();

  // `isOver` (an active drag over this column) always wins over plain mouse
  // hover — both are folded into the same border/boxShadow computation
  // rather than a separate hover-only style, so there's exactly one place
  // deciding this element's visual state. The hover ring reuses the
  // column's own `status.color` at a lower mix than the isOver ring, and
  // stays inset (no size increase) — the grid this column sits in
  // (`EventQueueBoard.jsx`, no fixed column width, 0.75rem gap) has no room
  // for an outward-growing effect to grow into without visually touching
  // the next column.
  const borderColor = isOver
    ? status.color
    : isHovered
      ? `color-mix(in srgb, ${status.color} 35%, var(--app-color-border))`
      : "var(--app-color-border)";
  const boxShadow = isOver
    ? `0 0 0 1px ${status.color} inset`
    : isHovered
      ? `0 0 0 1px color-mix(in srgb, ${status.color} 25%, transparent) inset`
      : "none";

  return (
    <Stack
      ref={setNodeRef}
      gap={0}
      {...hoverHandlers}
      style={{
        minHeight: 0,
        height: "100%",
        backgroundColor: "var(--app-color-surface)",
        border: `1px solid ${borderColor}`,
        boxShadow,
        borderRadius: "var(--mantine-radius-sm)",
        overflow: "hidden",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <Box style={{ height: 3, backgroundColor: status.color, flexShrink: 0 }} />

      <Stack gap={8} p="sm" style={{ borderBottom: "1px solid var(--app-color-border)", flexShrink: 0 }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fz="sm" fw={700} c={status.color}>
            {status.label}
          </Text>
          <Group gap={6} wrap="nowrap">
            <Badge
              size="sm"
              styles={{
                root: {
                  backgroundColor: `color-mix(in srgb, ${status.color} 16%, transparent)`,
                  color: status.color,
                },
              }}
            >
              {events.length}
            </Badge>
            {isGatheringCasualtiesColumn && (
              <ActionIcon
                size="sm"
                radius="xl"
                aria-label="אירוע חדש"
                title="אירוע חדש"
                disabled={!isToday}
                onClick={onAddEvent}
                styles={{
                  root: {
                    backgroundColor: "var(--app-color-primary)",
                    color: "var(--app-color-primary-text)",
                    "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                  },
                }}
              >
                <IconPlus size={13} stroke={2.6} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        <NativeSelectField
          icon={IconArrowsSort}
          value={sortMode}
          onChange={onSortChange}
          options={QUEUE_SORT_OPTIONS}
          ariaLabel={`מיין את ${status.label} לפי`}
          tooltipLabel="מיין לפי"
        />

        <QueueFilterRow
          label={status.label}
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      </Stack>

      <Stack gap="xs" p="xs" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {events.length === 0 ? (
          <Box
            style={{
              border: "1px dashed var(--app-color-border)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "1.2rem 0.5rem",
              textAlign: "center",
            }}
          >
            <Text fz="xs" c="var(--app-color-text-muted)">
              אין אירועים בשלב זה
            </Text>
          </Box>
        ) : (
          events.map((event) => (
            <EventQueueCard key={event.id} event={event} isToday={isToday} onOpen={() => onOpenEvent(event.id)} />
          ))
        )}
      </Stack>
    </Stack>
  );
};

export default QueueColumn;
