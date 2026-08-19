// React

// External libraries
import { ActionIcon, Badge, Box, Group, Select, Stack, Text } from "@mantine/core";
import { IconArrowsSort, IconPlus } from "@tabler/icons-react";
import { useDroppable } from "@dnd-kit/core";

// Internal application modules
import EventQueueCard from "./EventQueueCard";
import { CLOSED_STATUS } from "../../constants/eventStatus";

// Styles

/** Sort options for a single queue — every queue picks its own, independently of the others. */
const QUEUE_SORT_OPTIONS = [
  { value: "created_desc", label: "חדש קודם" },
  { value: "created_asc", label: "ישן קודם" },
  { value: "name", label: "שם (א-ת)" },
  { value: "type", label: "סוג אירוע" },
];

/**
 * One droppable queue column: a colored header bar naming the status and
 * how many events are in it, an optional "+" (gathering_casualties only —
 * every new event starts there, never dropped straight into another
 * status), a per-column sort picker, and the scrollable card list itself.
 * Only the closed column ever accepts a drop — every other status is
 * derived server-side, so dragging a card there wouldn't mean anything (see
 * EventQueueCard's `isDraggable`, which restricts the drag side of the same
 * restriction) — and, same as before, disabled entirely on a past date,
 * since the board is read-only history away from today.
 *
 * @param {{
 *   status: { key: string, label: string, color: string },
 *   events: Array<object>,
 *   isGatheringCasualtiesColumn: boolean,
 *   isToday: boolean,
 *   sortMode: string,
 *   onSortChange: (mode: string) => void,
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
  onAddEvent,
  onOpenEvent,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status.key,
    disabled: !isToday || status.key !== CLOSED_STATUS,
  });

  return (
    <Stack
      ref={setNodeRef}
      gap={0}
      style={{
        minHeight: 0,
        height: "100%",
        backgroundColor: "var(--app-color-surface)",
        border: `1px solid ${isOver ? status.color : "var(--app-color-border)"}`,
        boxShadow: isOver ? `0 0 0 1px ${status.color} inset` : "none",
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

        <Select
          size="xs"
          data={QUEUE_SORT_OPTIONS}
          value={sortMode}
          onChange={(value) => value && onSortChange(value)}
          leftSection={<IconArrowsSort size={13} stroke={2} />}
          allowDeselect={false}
          aria-label={`מיין את ${status.label} לפי`}
          styles={{
            input: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
              fontSize: "0.72rem",
              minHeight: "1.8rem",
              height: "1.8rem",
            },
          }}
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
