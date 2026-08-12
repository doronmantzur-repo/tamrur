// React
import { Fragment } from "react";

// External libraries
import { ActionIcon, Badge, Box, Table, Text, Tooltip } from "@mantine/core";
import { IconBandage, IconCheck, IconEye, IconEyeOff, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import EvacuationTimeline from "./EvacuationTimeline";
import { EVAC_ABILITY_LABELS, URGENCY_COLOR_VARS, URGENCY_LABELS } from "../../constants/injuryStatus";

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
 * Renders the full injuries table as its own card, meant to sit beside the
 * event map. Each injury with an assigned evacuation gets an eye toggle:
 * opening it inserts a row directly beneath, showing the evacuation timeline
 * (highlighting that injury's evacuation). Only one row can be open at a
 * time, opening another closes the previous one automatically since
 * `openInjuryId` is a single value owned by the page.
 *
 * @param {{
 *   injuries: Array<object>,
 *   evacuations: Array<object>,
 *   evacuationByInjuryId: Record<string, object>,
 *   openInjuryId: string | null,
 *   onToggleInjuryEye: (injuryId: string) => void,
 * }} props
 * @returns {JSX.Element} The injuries table card.
 */
const InjuriesTableCard = ({
  injuries,
  evacuations,
  evacuationByInjuryId,
  openInjuryId,
  onToggleInjuryEye,
}) => {
  return (
    <DashboardCard
      title="נפגעים"
      padding="md"
      gap="sm"
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
          {injuries.length} סה״כ
        </Badge>
      }
    >
      <Box style={{ overflow: "auto", maxHeight: "26rem" }}>
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>דחיפות</Table.Th>
              <Table.Th>יכולת פינוי</Table.Th>
              <Table.Th>עדיפות</Table.Th>
              <Table.Th>ליווי</Table.Th>
              <Table.Th>יעד מומלץ</Table.Th>
              <Table.Th>מוכן לפינוי</Table.Th>
              <Table.Th>נפתח</Table.Th>
              <Table.Th>פינוי</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {injuries.map((injury) => {
              const evac = evacuationByInjuryId[injury.id];
              const isOpen = openInjuryId === injury.id;

              return (
                <Fragment key={injury.id}>
                  <Table.Tr>
                    <Table.Td>
                      <Badge
                        styles={{
                          root: {
                            backgroundColor: `color-mix(in srgb, ${URGENCY_COLOR_VARS[injury.urgency]} 16%, transparent)`,
                            color: URGENCY_COLOR_VARS[injury.urgency],
                          },
                        }}
                      >
                        {URGENCY_LABELS[injury.urgency] || injury.urgency || "—"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{EVAC_ABILITY_LABELS[injury["evac-ability"]] || "—"}</Table.Td>
                    <Table.Td ff='ui-monospace, "SF Mono", "Consolas", monospace'>
                      {injury["evac-priority"] ?? "—"}
                    </Table.Td>
                    <Table.Td>
                      <YesNo value={injury.escort} />
                    </Table.Td>
                    <Table.Td c="var(--app-color-text-muted)">
                      {injury["recommended-evac-dest"] || "—"}
                    </Table.Td>
                    <Table.Td>
                      <YesNo value={injury["evac-ready"]} />
                    </Table.Td>
                    <Table.Td
                      c="var(--app-color-text-muted)"
                      ff='ui-monospace, "SF Mono", "Consolas", monospace'
                    >
                      {injury.created_at ? timeFormatter.format(new Date(injury.created_at)) : "—"}
                    </Table.Td>
                    <Table.Td>
                      {evac ? (
                        <Tooltip label={isOpen ? "הסתר ציר זמן" : "הצג ציר זמן"}>
                          <ActionIcon
                            variant="subtle"
                            aria-label={isOpen ? "הסתר ציר זמן" : "הצג ציר זמן"}
                            onClick={() => onToggleInjuryEye(injury.id)}
                            styles={{ root: { color: "var(--app-color-primary)" } }}
                          >
                            {isOpen ? (
                              <IconEyeOff size={18} stroke={1.8} />
                            ) : (
                              <IconEye size={18} stroke={1.8} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Text fz="xs" c="var(--app-color-text-muted)">
                          טרם פונה
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>

                  {isOpen && evac && (
                    <Table.Tr>
                      <Table.Td colSpan={8} p="md">
                        <EvacuationTimeline
                          evacuations={evacuations}
                          injuries={injuries}
                          selectedEvacId={evac.id}
                          onSelectEvac={() => onToggleInjuryEye(injury.id)}
                          focusEvacId={evac.id}
                        />
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              );
            })}
            {injuries.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8} c="var(--app-color-text-muted)" ta="center">
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

export default InjuriesTableCard;
