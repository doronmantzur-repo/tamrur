// React
import { useEffect, useRef } from "react";

// External libraries
import { Badge, Box, Stack, Text } from "@mantine/core";
import { IconCar, IconHelicopter } from "@tabler/icons-react";

// Internal application modules
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { EVAC_ABILITY_LABELS } from "../../constants/injuryStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

const METHOD_ICONS = {
  chopper: IconHelicopter,
  vehicle: IconCar,
};

const DOT_SIZE = 30;
const NODE_WIDTH = "13rem";

/** Counts assigned injuries by evacuation ability (walk / sit / lie). */
function countByAbility(injuries) {
  return injuries.reduce((acc, injury) => {
    const key = injury["evac-ability"];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Renders the event's evacuations as a horizontal timeline, in the style of
 * Mantine's `Timeline` turned on its side: a connecting line with a bullet
 * per evacuation, ordered earliest to most recent, each bullet's content
 * showing its injuries and their sitting/lying breakdown. The evacuation
 * matching `focusEvacId` is highlighted and scrolled into view.
 *
 * @param {{
 *   evacuations: Array<object>,
 *   injuries: Array<object>,
 *   selectedEvacId: string | null,
 *   onSelectEvac: (evacId: string | null) => void,
 *   focusEvacId: string | null,
 * }} props
 * @returns {JSX.Element} The evacuation timeline.
 */
const EvacuationTimeline = ({ evacuations, injuries, selectedEvacId, onSelectEvac, focusEvacId }) => {
  const nodeRefs = useRef({});

  const sortedEvacuations = [...evacuations].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  useEffect(() => {
    if (!focusEvacId) return;
    nodeRefs.current[focusEvacId]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [focusEvacId]);

  return (
    <Box dir="ltr" style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
      <Box
        style={{
          position: "relative",
          display: "flex",
          gap: "2rem",
          paddingInline: "1rem",
          width: "max-content",
        }}
      >
        <Box
          aria-hidden="true"
          style={{
            position: "absolute",
            top: DOT_SIZE / 2,
            insetInline: "1rem",
            height: "2px",
            backgroundColor: "var(--app-color-border)",
          }}
        />

        {sortedEvacuations.map((evac) => {
          const assignedInjuries = injuries.filter((injury) => evac.injuryIds.includes(injury.id));
          const abilityCounts = countByAbility(assignedInjuries);
          const MethodIcon = METHOD_ICONS[evac.method] || IconHelicopter;
          const statusColor = AERIAL_EVAC_COLOR_VARS[evac.status] || "var(--app-color-text-muted)";
          const isSelected = evac.id === selectedEvacId;

          return (
            <Box
              key={evac.id}
              ref={(el) => {
                nodeRefs.current[evac.id] = el;
              }}
              style={{ position: "relative", width: NODE_WIDTH, flexShrink: 0 }}
            >
              <Box
                role="button"
                tabIndex={0}
                aria-label={`${EVAC_METHOD_LABELS[evac.method] || evac.method}, ${timeFormatter.format(new Date(evac.createdAt))}`}
                onClick={() => onSelectEvac(isSelected ? null : evac.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelectEvac(isSelected ? null : evac.id);
                  }
                }}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  border: "3px solid var(--app-color-surface)",
                  boxShadow: isSelected ? "var(--app-effect-live-glow)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginInlineStart: `calc(${NODE_WIDTH} / 2 - ${DOT_SIZE / 2}px)`,
                }}
              >
                <MethodIcon size={16} stroke={2} color="#fff" />
              </Box>

              <Box
                dir="rtl"
                style={{
                  marginTop: "0.75rem",
                  backgroundColor: "var(--app-color-surface-high)",
                  border: `1px solid ${isSelected ? statusColor : "var(--app-color-border)"}`,
                  borderRadius: "var(--mantine-radius-sm)",
                  padding: "0.75rem",
                }}
              >
                <Stack gap="xs">
                  <Text fz="sm" fw={600} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {timeFormatter.format(new Date(evac.createdAt))}
                  </Text>

                  <Text fz="1.1rem" fw={700} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {assignedInjuries.length} נפגעים
                  </Text>

                  <Text fz="xs" c="var(--app-color-text-muted)" truncate dir="ltr" ta="right">
                    {assignedInjuries
                      .map((injury) => `#${injury.id.replace("inj-", "")}`)
                      .join(" ") || "—"}
                  </Text>

                  <Text fz="xs" c="var(--app-color-text-muted)">
                    {Object.entries(abilityCounts)
                      .map(([key, count]) => `${EVAC_ABILITY_LABELS[key] || key} ${count}`)
                      .join(" · ") || "—"}
                  </Text>

                  <Badge
                    size="sm"
                    styles={{
                      root: {
                        backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
                        color: statusColor,
                        alignSelf: "flex-start",
                      },
                    }}
                  >
                    {AERIAL_EVAC_LABELS[evac.status] || evac.status}
                  </Badge>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default EvacuationTimeline;
