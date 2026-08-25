// React

// External libraries
import { Badge, Box, Divider, Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconClock, IconHelicopter, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import CasualtiesCard from "../dashboard/CasualtiesCard";
import AerialEvacDecisionFooter from "./AerialEvacDecisionFooter";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, getAerialMissionStatus } from "../../constants/aerialEvacStatus";
import { getMostUrgentEvacPriority } from "../../constants/casualtyStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

const rankBadgeStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.9rem",
  height: "1.9rem",
  flexShrink: 0,
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: 800,
  fontFamily: MONO_FONT,
};

/**
 * One event's card in the triage queue: name, status and elapsed time in the
 * header, the event's real casualty table in the body, and — separated
 * below it by a divider, never inside the table itself — the shared
 * `AerialEvacDecisionFooter`. The separation is deliberate: the airforce
 * should read the whole casualty table before deciding, not have the
 * decision controls compete for attention alongside it.
 *
 * @param {{ event: object, mission: object | undefined, casualties: Array<object>, rank: number | null, isPending: boolean }} props
 * @returns {JSX.Element} The queue row.
 */
const TriageQueueRow = ({ event, mission, casualties, rank, isPending }) => {
  const waitSeconds = useElapsedSeconds(event.created_at, null);
  const status = getAerialMissionStatus(mission);
  const color = AERIAL_EVAC_COLOR_VARS[status] || "var(--app-color-text-muted)";

  return (
    <Box style={{ opacity: isPending ? 1 : 0.7 }}>
      <DashboardCard
        accentColor={status === "approved" || status === "denied" ? color : undefined}
        titleContent={
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                ...rankBadgeStyles,
                backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                color,
              }}
            >
              {isPending ? rank : status === "approved" ? <IconCheck size={16} stroke={2.2} /> : <IconX size={16} stroke={2.2} />}
            </Box>
            <Text fz="lg" fw={700} c="var(--app-color-text)">
              {event.name || "אירוע ללא שם"}
            </Text>
          </Group>
        }
        headerExtra={
          <Group gap="sm" wrap="wrap">
            <Badge
              leftSection={<IconHelicopter size={12} />}
              styles={{ root: { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color } }}
            >
              {AERIAL_EVAC_LABELS[status] || status}
            </Badge>

            <Group gap={6} c="var(--app-color-text-muted)" fz="0.82rem" ff={MONO_FONT}>
              <IconClock size={15} stroke={1.8} />
              {formatDuration(waitSeconds, { showDays: false })}
            </Group>
          </Group>
        }
      >
        <Stack gap="lg">
          <CasualtiesCard casualties={casualties} statBreakdown="ability" bare rowHover />

          <Divider color="var(--app-color-border)" />

          <AerialEvacDecisionFooter event={event} mission={mission} />
        </Stack>
      </DashboardCard>
    </Box>
  );
};

/**
 * The airforce page's triage queue: every event still awaiting an
 * aerial-evac decision, ranked by how urgently it needs one.
 *
 * Pending events (mission status "needed") are ranked first, by the most
 * urgent (lowest) `evac-priority` among their helivac casualties, then by
 * longest wait among ties — an event with no relevant casualties yet, or
 * none with a priority set, sorts after events that have one, mirroring
 * `sortCasualties`'s "blanks aren't a value" convention. Decided events
 * (approved/denied) sink below all pending ones and render de-emphasized:
 * deciding only changes the mission row, never `event["aerial-evac"]`, so a
 * decided event never actually leaves this page's own data set on its own.
 *
 * @param {{ events: Array<object>, casualtiesByEventId: Record<string, Array<object>>, missionsByEventId: Record<string, Array<object>> }} props
 * @returns {JSX.Element} The triage queue.
 */
const TriageQueueList = ({ events, casualtiesByEventId, missionsByEventId }) => {
  const rows = events.map((event) => {
    const mission = missionsByEventId[event.id]?.[0];
    const casualties = (casualtiesByEventId[event.id] || []).filter((casualty) => casualty.helivac);

    return {
      event,
      mission,
      casualties,
      isPending: getAerialMissionStatus(mission) === "needed",
      topPriority: getMostUrgentEvacPriority(casualties),
    };
  });

  rows.sort((a, b) => {
    if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;

    if (a.topPriority !== b.topPriority) {
      if (a.topPriority === null) return 1;
      if (b.topPriority === null) return -1;
      return a.topPriority - b.topPriority;
    }

    return new Date(a.event.created_at) - new Date(b.event.created_at);
  });

  if (rows.length === 0) {
    return (
      <Text ta="center" c="var(--app-color-text-muted)" py="xl">
        אין אירועים הממתינים לפינוי אווירי
      </Text>
    );
  }

  let pendingRank = 0;

  return (
    <Stack gap="xl">
      {rows.map(({ event, mission, casualties, isPending }) => (
        <TriageQueueRow
          key={event.id}
          event={event}
          mission={mission}
          casualties={casualties}
          isPending={isPending}
          rank={isPending ? ++pendingRank : null}
        />
      ))}
    </Stack>
  );
};

export default TriageQueueList;
