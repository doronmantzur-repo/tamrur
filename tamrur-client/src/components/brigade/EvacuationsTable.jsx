// React

// External libraries
import { Badge, Box, Group, Table, Text } from "@mantine/core";
import { IconCar, IconHelicopter } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { EVAC_METHOD_LABELS } from "../../constants/evacuationMethod";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", { timeStyle: "short" });

const METHOD_ICONS = {
  chopper: IconHelicopter,
  vehicle: IconCar,
};

/**
 * Renders the event's evacuations as a full table (time, method, injury
 * count, radio sign, ETA, mission id, status). Clicking a row opens it in the
 * evacuation timeline, same as clicking an injury's "view evacuation" icon.
 *
 * @param {{
 *   evacuations: Array<object>,
 *   onSelectEvacuation: (evacId: string) => void,
 * }} props
 * @returns {JSX.Element} The evacuations table.
 */
const EvacuationsTable = ({ evacuations, onSelectEvacuation }) => {
  const sortedEvacuations = [...evacuations].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  return (
    <DashboardCard
      title="פינויים"
      headerExtra={
        <Badge
          variant="outline"
          styles={{
            root: {
              backgroundColor: "var(--app-color-surface-high)",
              borderColor: "var(--app-color-border)",
              color: "var(--app-color-text-muted)",
            },
          }}
        >
          {evacuations.length} סה״כ
        </Badge>
      }
    >
      <Box style={{ overflowX: "auto" }}>
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>שעה</Table.Th>
              <Table.Th>אמצעי</Table.Th>
              <Table.Th>נפגעים</Table.Th>
              <Table.Th>קריאת קשר</Table.Th>
              <Table.Th>ETA</Table.Th>
              <Table.Th>מספר משימה</Table.Th>
              <Table.Th>סטטוס</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedEvacuations.map((evac) => {
              const MethodIcon = METHOD_ICONS[evac.method] || IconHelicopter;
              const statusColor = AERIAL_EVAC_COLOR_VARS[evac.status] || "var(--app-color-text-muted)";

              return (
                <Table.Tr
                  key={evac.id}
                  onClick={() => onSelectEvacuation?.(evac.id)}
                  style={{ cursor: onSelectEvacuation ? "pointer" : "default" }}
                >
                  <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {timeFormatter.format(new Date(evac.createdAt))}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      <MethodIcon size={16} stroke={1.8} />
                      <Text fz="sm">{EVAC_METHOD_LABELS[evac.method] || evac.method}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                    {evac.injuryIds.length}
                  </Table.Td>
                  <Table.Td>{evac.radioSign || "—"}</Table.Td>
                  <Table.Td
                    c="var(--app-color-text-muted)"
                    ff='ui-monospace, "SF Mono", "Consolas", monospace'
                  >
                    {evac.eta ? timeFormatter.format(new Date(evac.eta)) : "—"}
                  </Table.Td>
                  <Table.Td c="var(--app-color-text-muted)">{evac.missionId || "—"}</Table.Td>
                  <Table.Td>
                    <Badge
                      styles={{
                        root: {
                          backgroundColor: `color-mix(in srgb, ${statusColor} 16%, transparent)`,
                          color: statusColor,
                        },
                      }}
                    >
                      {AERIAL_EVAC_LABELS[evac.status] || evac.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {evacuations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} c="var(--app-color-text-muted)" ta="center">
                  טרם נפתחו פינויים באירוע זה
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default EvacuationsTable;
