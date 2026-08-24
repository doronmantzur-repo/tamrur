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
 * Renders the selected event's casualties: a stat row plus a per-casualty
 * table. The stat row breaks down by urgency (default — every other page)
 * or by evacuation ability, i.e. lie/sit counts (`statBreakdown="ability"` —
 * the airforce page, which cares about physical evacuation posture more
 * than triage urgency).
 *
 * `bare` skips this card's own Paper/accent-bar shell (but keeps the "נפגעים"
 * title row), for nesting inside another card that already provides one —
 * see the triage queue's unified event card.
 *
 * @param {{ casualties: Array<object>, statBreakdown?: "urgency" | "ability", bare?: boolean }} props
 * @returns {JSX.Element} The casualties card.
 */
const CasualtiesCard = ({ casualties, statBreakdown = "urgency", bare = false }) => {
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
              <Table.Tr key={casualty.id}>
                <Table.Td>
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
                <Table.Td>{EVAC_ABILITY_LABELS[casualty["evac-ability"]] || "—"}</Table.Td>
                <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                  {casualty["evac-priority"] ?? "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={casualty.escort} />
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)">
                  {EVAC_DEST_LABELS[casualty["recommended-evac-dest"]] || casualty["recommended-evac-dest"] || "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={casualty["evac-ready"]} />
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                  {casualty.created_at ? timeFormatter.format(new Date(casualty.created_at)) : "—"}
                </Table.Td>
              </Table.Tr>
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
