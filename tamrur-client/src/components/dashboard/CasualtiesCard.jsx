// React

// External libraries
import { Badge, Box, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { IconBandage, IconCheck, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "./DashboardCard";
import {
  EVAC_ABILITY_COLOR_VARS,
  EVAC_ABILITY_LABELS,
  EVAC_ABILITY_ORDER,
  EVAC_DEST_LABELS,
  URGENCY_COLOR_VARS,
  URGENCY_LABELS,
  URGENCY_ORDER,
  urgencyBadgeColors,
  urgencyLabel,
} from "../../constants/casualtyStatus";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

function YesNo({ value }) {
  return value ? (
    <IconCheck size={16} color="var(--app-color-success)" />
  ) : (
    <IconX size={16} color="var(--app-color-text-muted)" />
  );
}

/**
 * One casualty row. Hover is opt-in (`rowHover`) — the triage queue asked
 * for it, but this table is also reused, unmodified, on the airforce table/
 * kanban expanded rows, the brigade single-event dashboard and the medic
 * page, none of which asked for it. When on, it's real state
 * (`useHoverState`) rather than a `styles` "&:hover" key, since Mantine's
 * `styles` prop merges into an inline `style` attribute where pseudo-
 * selectors are never compiled into real CSS — isolated in its own
 * component so each row's hover state doesn't leak into its siblings, since
 * hooks can't run inside the parent's `.map()` either way.
 *
 * The background lives on every `<Table.Td>`, not the `<Table.Tr>` — this
 * table has `border-collapse: collapse` (the app's own table reset), and
 * under that a `<tr>` isn't a real paintable box, so a radius set there
 * squares off instead of clipping the row's background (see
 * `EventQueueTable.jsx`'s own row for the same fix). Rounding just the
 * outer two cells' outer corners (logical `border-*-*-radius`, so it's
 * correct in this RTL layout without hardcoding a side) reads as one
 * rounded row instead.
 *
 * @param {{ casualty: object, rowHover: boolean }} props
 * @returns {JSX.Element} The casualty row.
 */
function CasualtyRow({ casualty, rowHover }) {
  const [isHovered, hoverHandlers] = useHoverState();

  const backgroundColor = rowHover && isHovered ? "var(--app-effect-hover-background)" : "transparent";
  const cellStyle = { backgroundColor, transition: "background-color 0.15s ease" };
  const firstCellStyle = {
    ...cellStyle,
    borderStartStartRadius: "var(--mantine-radius-sm)",
    borderEndStartRadius: "var(--mantine-radius-sm)",
  };
  const lastCellStyle = {
    ...cellStyle,
    borderStartEndRadius: "var(--mantine-radius-sm)",
    borderEndEndRadius: "var(--mantine-radius-sm)",
  };

  return (
    <Table.Tr {...(rowHover ? hoverHandlers : undefined)}>
      <Table.Td style={firstCellStyle}>
        <Badge
          styles={{
            root: {
              ...urgencyBadgeColors(casualty.urgency),
            },
          }}
        >
          {urgencyLabel(casualty.urgency)}
        </Badge>
      </Table.Td>
      <Table.Td style={cellStyle}>{EVAC_ABILITY_LABELS[casualty["evac-ability"]] || "—"}</Table.Td>
      <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace' style={cellStyle}>
        {casualty["evac-priority"] ?? "—"}
      </Table.Td>
      <Table.Td style={cellStyle}>
        <YesNo value={casualty.escort} />
      </Table.Td>
      <Table.Td c="var(--app-color-text-muted)" style={cellStyle}>
        {EVAC_DEST_LABELS[casualty["recommended-evac-dest"]] || casualty["recommended-evac-dest"] || "—"}
      </Table.Td>
      <Table.Td style={cellStyle}>
        <YesNo value={casualty["evac-ready"]} />
      </Table.Td>
      <Table.Td
        c="var(--app-color-text-muted)"
        ff='ui-monospace, "SF Mono", "Consolas", monospace'
        style={lastCellStyle}
      >
        {casualty.created_at ? timeFormatter.format(new Date(casualty.created_at)) : "—"}
      </Table.Td>
    </Table.Tr>
  );
}

/**
 * Renders the selected event's casualties: a stat row plus a per-casualty
 * table. The stat row breaks down by urgency (default — every other page)
 * or by evacuation ability, i.e. lie/sit counts (`statBreakdown="ability"` —
 * the airforce page, which cares about physical evacuation posture more
 * than triage urgency).
 *
 * `bare` skips this card's own Paper/accent-bar shell (but keeps the "נפגעים"
 * title row), for nesting inside another card that already provides one —
 * see the triage queue's unified event card. `rowHover` turns on the
 * per-row hover background — opt-in, since this card is shared across
 * several pages and only the triage queue asked for it.
 *
 * @param {{ casualties: Array<object>, statBreakdown?: "urgency" | "ability", bare?: boolean, rowHover?: boolean }} props
 * @returns {JSX.Element} The casualties card.
 */
const CasualtiesCard = ({ casualties, statBreakdown = "urgency", bare = false, rowHover = false }) => {
  const isAbilityBreakdown = statBreakdown === "ability";
  const statKeys = isAbilityBreakdown ? EVAC_ABILITY_ORDER : URGENCY_ORDER;
  const statLabels = isAbilityBreakdown ? EVAC_ABILITY_LABELS : URGENCY_LABELS;
  const statColors = isAbilityBreakdown ? EVAC_ABILITY_COLOR_VARS : URGENCY_COLOR_VARS;
  const statAccessor = isAbilityBreakdown
    ? (casualty) => casualty["evac-ability"]
    : (casualty) => casualty.urgency;

  const statCounts = statKeys.reduce((acc, key) => {
    acc[key] = casualties.filter((casualty) => statAccessor(casualty) === key).length;
    return acc;
  }, {});

  return (
    <DashboardCard
      title="נפגעים"
      bare={bare}
      headerExtra={
        <Badge
          leftSection={<IconBandage size={12} />}
          variant="outline"
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
            },
          }}
        >
          {casualties.length} סה״כ
        </Badge>
      }
    >
      <SimpleGrid cols={statKeys.length} spacing="sm">
        {statKeys.map((key) => (
          <Stack
            key={key}
            gap={4}
            p="sm"
            style={{
              backgroundColor: "var(--app-color-surface-high)",
              border: "1px solid var(--app-color-border)",
              borderInlineStart: `3px solid ${statColors[key]}`,
              borderRadius: "var(--mantine-radius-sm)",
            }}
          >
            <Text fz="1.35rem" fw={700} lh={1} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
              {statCounts[key]}
            </Text>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {statLabels[key]}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Box style={{ overflowX: "auto" }}>
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th miw={92} style={{ whiteSpace: "nowrap" }}>
                דחיפות
              </Table.Th>
              <Table.Th>יכולת פינוי</Table.Th>
              <Table.Th>עדיפות</Table.Th>
              <Table.Th>ליווי</Table.Th>
              <Table.Th>יעד מומלץ</Table.Th>
              <Table.Th>מוכן לפינוי</Table.Th>
              <Table.Th>קליטה</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {casualties.map((casualty) => (
              <CasualtyRow key={casualty.id} casualty={casualty} rowHover={rowHover} />
            ))}
            {casualties.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} c="var(--app-color-text-muted)" ta="center">
                  לא נרשמו נפגעים באירוע זה
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default CasualtiesCard;
