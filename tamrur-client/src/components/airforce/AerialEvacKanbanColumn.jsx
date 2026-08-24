// React

// External libraries
import { Badge, Box, Group, Stack, Text } from "@mantine/core";
import { IconArrowsSort, IconChevronDown } from "@tabler/icons-react";
import { useDroppable } from "@dnd-kit/core";

// Internal application modules
import AerialEvacKanbanCard from "./AerialEvacKanbanCard";

// Styles

/** Every column picks its own sort, independently of the others — same idea as the brigade board's own per-column `Select`. */
const SORT_OPTIONS = [
  { value: "elapsed_asc", label: "זמן: הכי ותיק קודם" },
  { value: "elapsed_desc", label: "זמן: הכי חדש קודם" },
  { value: "casualties_desc", label: "נפגעים: הכי הרבה קודם" },
  { value: "casualties_asc", label: "נפגעים: הכי מעט קודם" },
];

/**
 * The per-column sort picker, as a plain HTML `<select>` rather than
 * Mantine's — same reasoning as `RadioSignInput`: Mantine's form inputs
 * carry theme-forced sizing/spacing that fights a compact control like this
 * one, and a native element sidesteps it entirely rather than fighting it.
 * The closed box is fully styled (native selects don't allow styling their
 * open dropdown list, but that's a minor, well-understood browser
 * limitation, not the same alignment bug `RadioSignInput` worked around).
 *
 * @param {{ value: string, onChange: (value: string) => void, ariaLabel: string }} props
 * @returns {JSX.Element} The sort picker.
 */
function KanbanSortSelect({ value, onChange, ariaLabel }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <IconArrowsSort
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
        {SORT_OPTIONS.map((option) => (
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
  );
}

/**
 * One kanban column. Only the approved/denied columns ever accept a drop
 * (`droppable={false}` for pending) — nothing is ever dragged back into
 * pending, since a decision is final; see `AerialEvacKanbanBoard`'s
 * docstring for the full rule.
 *
 * @param {{
 *   columnKey: string,
 *   label: string,
 *   color: string,
 *   rows: Array<object>,
 *   droppable: boolean,
 *   emptyMessage: string,
 *   sortMode: string,
 *   onSortChange: (mode: string) => void,
 * }} props
 * @returns {JSX.Element} The column.
 */
const AerialEvacKanbanColumn = ({ columnKey, label, color, rows, droppable, emptyMessage, sortMode, onSortChange }) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey, disabled: !droppable });

  return (
    <Stack
      ref={setNodeRef}
      gap={0}
      style={{
        minHeight: 0,
        backgroundColor: "var(--app-color-surface)",
        border: `1px solid ${isOver ? color : "var(--app-color-border)"}`,
        boxShadow: isOver ? `0 0 0 1px ${color} inset` : "none",
        borderRadius: "var(--mantine-radius-sm)",
        overflow: "hidden",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <Box style={{ height: 3, backgroundColor: color, flexShrink: 0 }} />

      <Stack gap={8} p="sm" style={{ borderBottom: "1px solid var(--app-color-border)", flexShrink: 0 }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fz="sm" fw={700} c={color}>
            {label}
          </Text>
          <Badge
            size="sm"
            styles={{ root: { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color } }}
          >
            {rows.length}
          </Badge>
        </Group>

        <KanbanSortSelect value={sortMode} onChange={onSortChange} ariaLabel={`מיין את ${label} לפי`} />
      </Stack>

      <Stack gap="xs" p="xs" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <Box
            style={{
              border: "1px dashed var(--app-color-border)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "1.2rem 0.5rem",
              textAlign: "center",
            }}
          >
            <Text fz="xs" c="var(--app-color-text-muted)">
              {emptyMessage}
            </Text>
          </Box>
        ) : (
          rows.map(({ event, casualties, aerialStatus, isPending }) => (
            <AerialEvacKanbanCard
              key={event.id}
              event={event}
              casualties={casualties}
              aerialStatus={aerialStatus}
              isPending={isPending}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
};

export default AerialEvacKanbanColumn;
