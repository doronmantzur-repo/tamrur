// React
import { useMemo } from "react";

// External libraries
import { ActionIcon, Badge, Box, Button, Group, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { IconCheck, IconPencil, IconUserPlus, IconX } from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { MONO_FONT, primaryButtonStyles } from "./formStyles";
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
 * Counts an event's records per casualty, and notes when each casualty was
 * last touched — so the medic can see at a glance who hasn't been reassessed.
 *
 * @param {Array<Object>} records - Treatment or vitals rows for the event.
 * @returns {Record<string, {count: number, lastRecordedAt: string | null}>} Keyed by casualty id.
 */
function summarizeByCasualty(records) {
  return (records || []).reduce((acc, record) => {
    const casualtyId = record["injury-id"];
    if (!casualtyId) return acc;

    const current = acc[casualtyId] ?? { count: 0, lastRecordedAt: null };
    const recordedAt = record["recorded-at"] ?? null;

    acc[casualtyId] = {
      count: current.count + 1,
      lastRecordedAt:
        recordedAt && (!current.lastRecordedAt || recordedAt > current.lastRecordedAt)
          ? recordedAt
          : current.lastRecordedAt,
    };
    return acc;
  }, {});
}

/**
 * Renders the medic interface's casualty table: the same urgency breakdown and
 * columns as the dashboard's `CasualtiesCard`, plus per-casualty record counts
 * and the controls for adding and editing casualties.
 *
 * @param {{
 *   eventId: string,
 *   casualties: Array<Object>,
 *   onAddCasualty: () => void,
 *   onEditCasualty: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The medic casualties card.
 */
const MedicCasualtiesCard = ({ eventId, casualties, onAddCasualty, onEditCasualty }) => {
  const eventTreatments = useSelector((state) => state.treatments.byEventId[eventId]);
  const eventVitals = useSelector((state) => state.vitals.byEventId[eventId]);

  const treatmentsByCasualty = useMemo(
    () => summarizeByCasualty(eventTreatments),
    [eventTreatments],
  );
  const vitalsByCasualty = useMemo(() => summarizeByCasualty(eventVitals), [eventVitals]);

  const countsByUrgency = URGENCY_ORDER.reduce((acc, key) => {
    acc[key] = casualties.filter((casualty) => casualty.urgency === key).length;
    return acc;
  }, {});

  /**
   * The most recent moment anything was logged for a casualty.
   *
   * @param {string} casualtyId
   * @returns {string} A short local time, or an em dash when nothing is logged.
   */
  function lastUpdatedLabel(casualtyId) {
    const candidates = [
      treatmentsByCasualty[casualtyId]?.lastRecordedAt,
      vitalsByCasualty[casualtyId]?.lastRecordedAt,
    ].filter(Boolean);

    if (candidates.length === 0) return "—";

    return timeFormatter.format(new Date(candidates.sort().at(-1)));
  }

  return (
    <DashboardCard
      title="נפגעים"
      headerExtra={
        <Group gap="sm">
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
            {casualties.length} סה״כ
          </Badge>
          <Button
            size="xs"
            h="2.25rem"
            mih="2.25rem"
            leftSection={<IconUserPlus size={16} stroke={1.8} />}
            onClick={onAddCasualty}
            styles={primaryButtonStyles}
          >
            נפגע חדש
          </Button>
        </Group>
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
            <Text fz="1.35rem" fw={700} lh={1} ff={MONO_FONT}>
              {countsByUrgency[key]}
            </Text>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {URGENCY_LABELS[key]}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Box style={{ overflowX: "auto" }}>
        <Table verticalSpacing="sm" fz="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>דחיפות</Table.Th>
              <Table.Th>יכולת פינוי</Table.Th>
              <Table.Th>עדיפות</Table.Th>
              <Table.Th>ליווי</Table.Th>
              <Table.Th>יעד מומלץ</Table.Th>
              <Table.Th>מוכן לפינוי</Table.Th>
              <Table.Th>טיפולים</Table.Th>
              <Table.Th>מדדים</Table.Th>
              <Table.Th>עדכון אחרון</Table.Th>
              <Table.Th w={60} />
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
                <Table.Td ff={MONO_FONT}>{casualty["evac-priority"] ?? "—"}</Table.Td>
                <Table.Td>
                  <YesNo value={casualty.escort} />
                </Table.Td>
                <Table.Td c="var(--app-color-text-muted)">
                  {EVAC_DEST_LABELS[casualty["recommended-evac-dest"]] ||
                    casualty["recommended-evac-dest"] ||
                    "—"}
                </Table.Td>
                <Table.Td>
                  <YesNo value={casualty["evac-ready"]} />
                </Table.Td>
                <Table.Td ff={MONO_FONT}>{treatmentsByCasualty[casualty.id]?.count ?? 0}</Table.Td>
                <Table.Td ff={MONO_FONT}>{vitalsByCasualty[casualty.id]?.count ?? 0}</Table.Td>
                <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT}>
                  {lastUpdatedLabel(casualty.id)}
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    aria-label="עריכת נפגע"
                    title="עריכת נפגע"
                    variant="subtle"
                    onClick={() => onEditCasualty(casualty)}
                  >
                    <IconPencil size={18} color="var(--app-color-primary)" />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {casualties.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={10} c="var(--app-color-text-muted)" ta="center">
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

export default MedicCasualtiesCard;
