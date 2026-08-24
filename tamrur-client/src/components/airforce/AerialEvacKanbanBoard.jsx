// React
import { useMemo, useState } from "react";

// External libraries
import { Box } from "@mantine/core";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";

// Internal application modules
import AerialEvacKanbanColumn from "./AerialEvacKanbanColumn";
import AerialEvacKanbanDecisionModal from "./AerialEvacKanbanDecisionModal";
import { AerialEvacKanbanCardContent } from "./AerialEvacKanbanCard";
import { AERIAL_EVAC_COLOR_VARS, getAerialMissionStatus } from "../../constants/aerialEvacStatus";
import { getMostUrgentEvacPriority } from "../../constants/casualtyStatus";

// Styles

// The option labels themselves live in AerialEvacKanbanColumn.jsx (it's the
// one rendering the select) — these keys just need to match its values.
const SORT_COMPARATORS = {
  elapsed_asc: (a, b) => new Date(a.event.created_at) - new Date(b.event.created_at),
  elapsed_desc: (a, b) => new Date(b.event.created_at) - new Date(a.event.created_at),
  casualties_desc: (a, b) => b.casualties.length - a.casualties.length,
  casualties_asc: (a, b) => a.casualties.length - b.casualties.length,
};

const DEFAULT_SORT = "elapsed_asc";

/** Right to left under this RTL app, matching the brigade board's own array-order convention: pending is rightmost, denied leftmost. */
const COLUMNS = [
  // Droppable too, not just approved/denied: `closestCenter` only ever
  // considers *registered* (non-disabled) droppables, so if pending weren't
  // one, dragging back over it while still holding would keep reporting
  // whichever of approved/denied is nearest as `over` — the card would look
  // stuck to a neighboring column even while hovering pending itself.
  // Dropping back on pending is already a no-op via handleDragEnd's
  // `over.id === row.aerialStatus` guard, since a pending row's own status
  // *is* "needed".
  { key: "needed", label: "ממתינות להחלטה", droppable: true, emptyMessage: "אין אירועים הממתינים לפינוי אווירי" },
  { key: "approved", label: "אושרו", droppable: true, emptyMessage: "עדיין לא אושרו אירועים" },
  { key: "denied", label: "נדחו", droppable: true, emptyMessage: "עדיין לא נדחו אירועים" },
];

/**
 * The airforce page's kanban view: the same events the triage queue and
 * table show, as three columns — pending / approved / denied — instead of
 * a ranked list or a sortable table. A card is draggable only while
 * pending, and only onto approved or denied: a decision is final (the same
 * rule `useAerialEvacDecision` already encodes — there is no "undecide"
 * dispatch), so nothing is ever dragged back out of either column.
 *
 * Dropping never moves anything by itself — it opens
 * `AerialEvacKanbanDecisionModal` (deny's confirm, or approve's radio-sign
 * prompt) and waits for it. Unlike the brigade board, there's no optimistic
 * `statusOverrides` layer here: a card's column comes straight from
 * `missionsByEventId` via `getAerialMissionStatus`, and approving/denying
 * updates that slice the moment the dispatch resolves (no polling delay to
 * paper over), so the real data is already fast enough — a card simply
 * appears in its new column once the decision actually succeeds. A failed
 * decision just leaves the modal open with its own inline state; there is
 * nothing to revert since nothing ever moved.
 *
 * @param {{ events: Array<object>, casualtiesByEventId: Record<string, Array<object>>, missionsByEventId: Record<string, Array<object>> }} props
 * @returns {JSX.Element} The kanban board.
 */
const AerialEvacKanbanBoard = ({ events, casualtiesByEventId, missionsByEventId }) => {
  const [pendingDrop, setPendingDrop] = useState(null); // { event, mission, target } | null
  const [activeRow, setActiveRow] = useState(null);
  const [sortModeByColumn, setSortModeByColumn] = useState(() =>
    Object.fromEntries(COLUMNS.map((column) => [column.key, DEFAULT_SORT])),
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const rowsData = useMemo(
    () =>
      events.map((event) => {
        const mission = missionsByEventId[event.id]?.[0];
        const aerialStatus = getAerialMissionStatus(mission);
        const casualties = (casualtiesByEventId[event.id] || []).filter((casualty) => casualty.helivac);
        return {
          event,
          mission,
          casualties,
          aerialStatus,
          isPending: aerialStatus === "needed",
          topPriority: getMostUrgentEvacPriority(casualties),
        };
      }),
    [events, casualtiesByEventId, missionsByEventId],
  );

  const columns = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        rows: rowsData
          .filter((row) => row.aerialStatus === column.key)
          .sort(SORT_COMPARATORS[sortModeByColumn[column.key]]),
      })),
    [rowsData, sortModeByColumn],
  );

  const handleSortChange = (columnKey, mode) => {
    setSortModeByColumn((prev) => ({ ...prev, [columnKey]: mode }));
  };

  const handleDragStart = ({ active }) => {
    setActiveRow(rowsData.find((row) => row.event.id === active.id) ?? null);
  };

  const clearActiveDrag = () => setActiveRow(null);

  const handleDragEnd = ({ active, over }) => {
    clearActiveDrag();
    if (!over) return;

    const row = rowsData.find((r) => r.event.id === active.id);
    if (!row || !row.isPending || over.id === row.aerialStatus) return;

    setPendingDrop({ event: row.event, mission: row.mission, target: over.id });
  };

  return (
    <Box style={{ minHeight: "60vh", display: "flex", flexDirection: "column" }}>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
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
          {columns.map((column) => (
            <AerialEvacKanbanColumn
              key={column.key}
              columnKey={column.key}
              label={column.label}
              color={AERIAL_EVAC_COLOR_VARS[column.key] || "var(--app-color-text-muted)"}
              rows={column.rows}
              droppable={column.droppable}
              emptyMessage={column.emptyMessage}
              sortMode={sortModeByColumn[column.key]}
              onSortChange={(mode) => handleSortChange(column.key, mode)}
            />
          ))}

          {/* Portal-rendered, so a column's own overflow-y:auto never clips it mid-drag — see AerialEvacKanbanCard's docstring. */}
          <DragOverlay>
            {activeRow && (
              <Box style={{ cursor: "grabbing", boxShadow: "0 12px 28px rgba(0, 0, 0, 0.4)" }}>
                <AerialEvacKanbanCardContent
                  event={activeRow.event}
                  casualties={activeRow.casualties}
                  aerialStatus={activeRow.aerialStatus}
                />
              </Box>
            )}
          </DragOverlay>
        </DndContext>
      </Box>

      {pendingDrop && (
        <AerialEvacKanbanDecisionModal
          event={pendingDrop.event}
          mission={pendingDrop.mission}
          target={pendingDrop.target}
          onClose={() => setPendingDrop(null)}
        />
      )}
    </Box>
  );
};

export default AerialEvacKanbanBoard;
