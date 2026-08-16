// React

// External libraries
import { Badge, Box, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { IconBandage, IconCheck, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "./DashboardCard";
import {
  EVAC_ABILITY_LABELS,
  EVAC_DEST_LABELS,
  URGENCY_COLOR_VARS,
  URGENCY_LABELS,
  URGENCY_ORDER,
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
 * Renders the selected event's casualties: an urgency-breakdown stat row plus a per-casualty table.
 *
 * @param {{ casualties: Array<object> }} props
 * @returns {JSX.Element} The casualties card.
 */
const CasualtiesCard = ({ casualties }) => {
  const countsByUrgency = URGENCY_ORDER.reduce((acc, key) => {
    acc[key] = casualties.filter((casualty) => casualty.urgency === key).length;
    return acc;
  }, {});

  return (
    <DashboardCard
      title="נפגעים"
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
      <SimpleGrid cols={4} spacing="sm">
        {URGENCY_ORDER.map((key) => (
          <Stack
            key={key}
            gap={4}
            p="sm"
            style={{
              backgroundColor: "var(--app-color-surface-high)",
              border: "1px solid var(--app-color-border)",
              borderInlineStart: `3px solid ${URGENCY_COLOR_VARS[key]}`,
              borderRadius: "var(--mantine-radius-sm)",
            }}
          >
            <Text fz="1.35rem" fw={700} lh={1} ff='ui-monospace, "SF Mono", "Consolas", monospace'>
              {countsByUrgency[key]}
            </Text>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {URGENCY_LABELS[key]}
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
              <Table.Th>נפתח</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {casualties.map((casualty) => (
              <Table.Tr key={casualty.id}>
                <Table.Td>
                  <Badge
                    styles={{
                      root: {
                        backgroundColor: `color-mix(in srgb, ${URGENCY_COLOR_VARS[casualty.urgency]} 16%, transparent)`,
                        color: URGENCY_COLOR_VARS[casualty.urgency],
                      },
                    }}
                  >
                    {URGENCY_LABELS[casualty.urgency] || casualty.urgency || "—"}
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
