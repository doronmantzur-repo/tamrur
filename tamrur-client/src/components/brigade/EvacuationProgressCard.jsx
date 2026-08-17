// React
import { useState } from "react";

// External libraries
import { Box, SimpleGrid, Text, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconAmbulance,
  IconCircleCheck,
  IconHelpCircle,
  IconHourglass,
  IconSkull,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import StatTile from "./StatTile";
import { URGENCY_LABELS, URGENCY_NONE_LABEL } from "../../constants/casualtyStatus";

// Styles

/**
 * Segment order, left to right (the bar's fill direction stays LTR — see
 * the bar's own `direction: "ltr"` below). "Evacuated" anchors the right
 * edge now; the rest keep their relative order, most urgent nearest the
 * evacuated edge.
 */
const SEGMENT_ORDER = ["unassessed", "deceased", "non-urgent", "expectant", "urgent", "evacuated"];

/**
 * Hebrew grammatical number agreement for "evacuated": singular "פונה" for
 * exactly one casualty, plural "פונו" otherwise (including zero, which
 * takes the plural form same as in standard Hebrew usage).
 *
 * @param {number} count
 * @returns {string} "פונה" or "פונו".
 */
function evacuatedLabel(count) {
  return count === 1 ? "פונה" : "פונו";
}

const SEGMENT_LABELS = {
  evacuated: "פונו",
  urgent: URGENCY_LABELS.urgent,
  expectant: URGENCY_LABELS.expectant,
  "non-urgent": URGENCY_LABELS["non-urgent"],
  unassessed: URGENCY_NONE_LABEL,
  deceased: URGENCY_LABELS.deceased,
};

/**
 * Segment colors. The urgency segments reuse the exact colors every urgency
 * badge elsewhere in the app already uses (matching the casualties table) —
 * these also happen to match real-world START triage convention (red =
 * immediate, yellow/amber = delayed, green = minor, black = deceased), so
 * they're left untouched. Two deliberate exceptions: "evacuated" gets a
 * fixed blue found nowhere else in the palette — not the app's primary gold
 * (which read as an arbitrary brand color rather than "done") and not green
 * (already claimed by "non-urgent" both here and everywhere else in the
 * app, so reusing it for evacuated would mean the same color meaning two
 * different things within one bar). "Deceased" gets its own distinct
 * near-black instead of reusing the shared muted-gray token, since that
 * token is also "unassessed"'s color here and the two need to read as
 * different segments within the same bar.
 */
const SEGMENT_COLORS = {
  evacuated: "#3B82F6",
  urgent: "var(--app-color-error)",
  expectant: "var(--app-color-warning)",
  "non-urgent": "var(--app-color-success)",
  unassessed: "var(--app-color-text-muted)",
  deceased: "#0f172a",
};

/**
 * Buckets casualties into the bar's six segments: evacuated first (regardless
 * of urgency), then the rest split by urgency, including "unassessed" for a
 * casualty logged before triage.
 *
 * @param {Array<object>} casualties
 * @returns {Record<string, number>} Count per segment key.
 */
function countBySegment(casualties) {
  const counts = { evacuated: 0, urgent: 0, expectant: 0, "non-urgent": 0, unassessed: 0, deceased: 0 };

  for (const casualty of casualties) {
    if (casualty.is_evacuated) {
      counts.evacuated += 1;
      continue;
    }

    const urgency = casualty.urgency;
    if (urgency === "urgent" || urgency === "expectant" || urgency === "non-urgent" || urgency === "deceased") {
      counts[urgency] += 1;
    } else {
      counts.unassessed += 1;
    }
  }

  return counts;
}

/**
 * For each urgency status (independent of the bar's evacuated-first
 * bucketing), how many of that status are evacuated vs. the status's own
 * total — e.g. "2/4 urgent casualties evacuated". This is a different cut
 * of the same data than `countBySegment`: that function puts every
 * evacuated casualty in one exclusive "evacuated" bucket regardless of
 * urgency (for the bar's mutually-exclusive segments); this one keeps every
 * urgency status intact and shows evacuation progress *within* it (for the
 * tiles, which no longer have their own "evacuated" tile).
 *
 * @param {Array<object>} casualties
 * @returns {Record<string, {evacuated: number, total: number}>} Per-status evacuated/total.
 */
function countStatusEvacuation(casualties) {
  const buckets = {
    urgent: { evacuated: 0, total: 0 },
    expectant: { evacuated: 0, total: 0 },
    "non-urgent": { evacuated: 0, total: 0 },
    unassessed: { evacuated: 0, total: 0 },
    deceased: { evacuated: 0, total: 0 },
  };

  for (const casualty of casualties) {
    const urgency = casualty.urgency;
    const key =
      urgency === "urgent" || urgency === "expectant" || urgency === "non-urgent" || urgency === "deceased"
        ? urgency
        : "unassessed";

    buckets[key].total += 1;
    if (casualty.is_evacuated) buckets[key].evacuated += 1;
  }

  return buckets;
}

/**
 * Renders the event's evacuation progress: a segmented bar (evacuated vs.
 * each urgency bucket among the rest), a "טרם פונו" bracket over the portion
 * not yet evacuated, a prominent evacuated/total count in the header, and a
 * row of compact stat tiles standing in for a legend — one tile per urgency
 * status showing that status's own evacuated/total (e.g. "2/4" urgent
 * casualties evacuated), rather than a separate legend row. No total-
 * casualties tile here — that count lives under the timer in the top bar
 * instead (see `EventDashboardPage`). Reads straight from the same
 * `casualties` list `CasualtiesTableCard` already uses — no separate fetch.
 * Occupies the slot the badges-only header card used to (see
 * `EventBadgesRow`, now rendered in the top bar instead), and replaces the
 * page's old standalone 4-tile stat row entirely. The bar's fill stays
 * left-to-right even though the rest of the app is RTL, matching the common
 * progress-bar convention — only the surrounding labels follow the page's
 * RTL flow.
 *
 * Bar segments and tiles are linked: hovering a segment shows its label and
 * count in a tooltip and brightens it, independent of anything else.
 * Clicking a segment (or a tile) toggles it as the "selected" category —
 * every other segment and tile dims, and the selected category's
 * counterpart (segment if a tile was clicked, tile if a segment was
 * clicked) gets a highlighted ring — so it's easy to spot exactly where a
 * thin segment sits once you know which tile it corresponds to, or vice
 * versa. Clicking the same one again clears the selection. Every segment,
 * including "evacuated," has a matching tile.
 *
 * @param {{ casualties: Array<object> }} props
 * @returns {JSX.Element} The evacuation progress card.
 */
const EvacuationProgressCard = ({ casualties }) => {
  const total = casualties.length;
  const counts = countBySegment(casualties);
  const statusEvacuation = countStatusEvacuation(casualties);
  const pct = (count) => (total > 0 ? (count / total) * 100 : 0);
  const evacuatedPct = pct(counts.evacuated);
  const pendingCount = total - counts.evacuated;

  const [selectedKey, setSelectedKey] = useState(null);
  const toggleKey = (key) => setSelectedKey((prev) => (prev === key ? null : key));

  // Every pulsing tile toggles together — on only while nothing is
  // selected, off (all of them, selected tile included) the moment
  // anything is. That's what keeps them in phase: they always restart in
  // the same paint frame instead of one tile running continuously while
  // the rest stop and start around it.
  const pulseEligible = selectedKey === null;

  return (
    <DashboardCard
      title="התקדמות פינוי"
      padding="sm"
      gap="xs"
      // Replaces the old small count badge: the evacuated/total count is
      // now the prominent element in the header, in the same x/y form as
      // every tile below (rather than a separate "61%" line further down —
      // one number, once, instead of the same progress said two ways).
      headerExtra={
        <Text fz="1.5rem" fw={800} c="var(--app-color-text)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
          {counts.evacuated}/{total}
        </Text>
      }
    >
      <Box style={{ position: "relative", paddingTop: pendingCount > 0 ? "1.75rem" : 0 }}>
        {pendingCount > 0 && (
          <Box
            style={{
              position: "absolute",
              left: 0,
              width: `${100 - evacuatedPct}%`,
              top: 0,
              height: "1.25rem",
              borderTop: "2px solid var(--app-color-text-muted)",
              borderLeft: "2px solid var(--app-color-text-muted)",
              borderRight: "2px solid var(--app-color-text-muted)",
              borderRadius: "4px 4px 0 0",
            }}
          >
            <Text
              fz="0.62rem"
              fw={700}
              tt="uppercase"
              lts="0.03em"
              c="var(--app-color-text)"
              style={{
                position: "absolute",
                top: "-0.5rem",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "0 0.5rem",
                backgroundColor: "var(--app-color-surface)",
                whiteSpace: "nowrap",
              }}
            >
              טרם פונו · {pendingCount}
            </Text>
          </Box>
        )}

        <Box
          style={{
            display: "flex",
            direction: "ltr",
            width: "100%",
            height: "1.5rem",
            overflow: "hidden",
            borderRadius: "4px",
            backgroundColor: "var(--app-color-background)",
          }}
        >
          {SEGMENT_ORDER.map((key) => (
            <Tooltip
              key={key}
              label={
                key === "evacuated"
                  ? `${evacuatedLabel(counts.evacuated)} · ${counts.evacuated}`
                  : `${SEGMENT_LABELS[key]} · ${counts[key]} טרם ${evacuatedLabel(counts[key])}`
              }
              withArrow
            >
              <Box
                className="app-bar-segment"
                onClick={() => toggleKey(key)}
                style={{
                  width: `${pct(counts[key])}%`,
                  backgroundColor: SEGMENT_COLORS[key],
                  opacity: selectedKey && selectedKey !== key ? 0.35 : 1,
                  boxShadow: selectedKey === key ? "inset 0 0 0 2px #FFFFFF" : "none",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Tiles stand in for a legend: one tile per urgency status showing
          that status's own evacuated/total (not the bar's exclusive-
          evacuated-bucket counts) — e.g. "2/4" means 2 of that status's 4
          casualties have been evacuated — plus one "evacuated" tile with
          the plain total (that dimension isn't an urgency status, so x/y
          doesn't apply the same way). No "total casualties" tile here —
          that lives under the timer in the top bar instead (see
          EventDashboardPage). */}
      <SimpleGrid cols={6} spacing="xs" style={{ borderTop: "1px solid var(--app-color-border)", paddingTop: "0.75rem" }}>
        <StatTile
          compact
          label={SEGMENT_LABELS.evacuated}
          value={counts.evacuated}
          icon={IconAmbulance}
          accentColor={SEGMENT_COLORS.evacuated}
          onClick={() => toggleKey("evacuated")}
          dimmed={selectedKey !== null && selectedKey !== "evacuated"}
          highlighted={selectedKey === "evacuated"}
        />
        <StatTile
          compact
          label={SEGMENT_LABELS.urgent}
          value={`${statusEvacuation.urgent.evacuated}/${statusEvacuation.urgent.total}`}
          icon={IconAlertTriangle}
          accentColor={SEGMENT_COLORS.urgent}
          onClick={() => toggleKey("urgent")}
          dimmed={selectedKey !== null && selectedKey !== "urgent"}
          highlighted={selectedKey === "urgent"}
          pulsing={pulseEligible && statusEvacuation.urgent.evacuated !== statusEvacuation.urgent.total}
        />
        <StatTile
          compact
          label={SEGMENT_LABELS.expectant}
          value={`${statusEvacuation.expectant.evacuated}/${statusEvacuation.expectant.total}`}
          icon={IconHourglass}
          accentColor={SEGMENT_COLORS.expectant}
          onClick={() => toggleKey("expectant")}
          dimmed={selectedKey !== null && selectedKey !== "expectant"}
          highlighted={selectedKey === "expectant"}
          pulsing={pulseEligible && statusEvacuation.expectant.evacuated !== statusEvacuation.expectant.total}
        />
        <StatTile
          compact
          label={SEGMENT_LABELS["non-urgent"]}
          value={`${statusEvacuation["non-urgent"].evacuated}/${statusEvacuation["non-urgent"].total}`}
          icon={IconCircleCheck}
          accentColor={SEGMENT_COLORS["non-urgent"]}
          onClick={() => toggleKey("non-urgent")}
          dimmed={selectedKey !== null && selectedKey !== "non-urgent"}
          highlighted={selectedKey === "non-urgent"}
          pulsing={pulseEligible && statusEvacuation["non-urgent"].evacuated !== statusEvacuation["non-urgent"].total}
        />
        <StatTile
          compact
          label={SEGMENT_LABELS.unassessed}
          value={`${statusEvacuation.unassessed.evacuated}/${statusEvacuation.unassessed.total}`}
          icon={IconHelpCircle}
          accentColor={SEGMENT_COLORS.unassessed}
          onClick={() => toggleKey("unassessed")}
          dimmed={selectedKey !== null && selectedKey !== "unassessed"}
          highlighted={selectedKey === "unassessed"}
          pulsing={pulseEligible && statusEvacuation.unassessed.evacuated !== statusEvacuation.unassessed.total}
        />
        <StatTile
          compact
          label={SEGMENT_LABELS.deceased}
          value={`${statusEvacuation.deceased.evacuated}/${statusEvacuation.deceased.total}`}
          icon={IconSkull}
          accentColor={SEGMENT_COLORS.deceased}
          onClick={() => toggleKey("deceased")}
          dimmed={selectedKey !== null && selectedKey !== "deceased"}
          highlighted={selectedKey === "deceased"}
          pulsing={pulseEligible && statusEvacuation.deceased.evacuated !== statusEvacuation.deceased.total}
        />
      </SimpleGrid>
    </DashboardCard>
  );
};

export default EvacuationProgressCard;
