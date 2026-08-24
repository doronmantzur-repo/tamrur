// React
import { useState } from "react";

// External libraries
import { Badge, Box, Button, Divider, Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconClock, IconHelicopter, IconRadio, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import CasualtiesCard from "../dashboard/CasualtiesCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, getAerialMissionStatus } from "../../constants/aerialEvacStatus";
import { getMostUrgentEvacPriority } from "../../constants/casualtyStatus";
import { useAerialEvacDecision } from "../../hooks/useAerialEvacDecision";
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

const approveButtonStyles = {
  root: {
    backgroundColor: "color-mix(in srgb, var(--app-color-success) 16%, transparent)",
    color: "var(--app-color-success)",
    border: "1px solid color-mix(in srgb, var(--app-color-success) 45%, transparent)",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--app-color-success) 28%, transparent)",
    },
  },
};

const denyButtonStyles = {
  root: {
    backgroundColor: "color-mix(in srgb, var(--app-color-error) 16%, transparent)",
    color: "var(--app-color-error)",
    border: "1px solid color-mix(in srgb, var(--app-color-error) 45%, transparent)",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--app-color-error) 28%, transparent)",
    },
  },
};

const DECISION_CONTROL_HEIGHT = "3rem";

/**
 * The radio call-sign field, as plain HTML rather than Mantine's `TextInput`:
 * the icon inside `TextInput` wasn't vertically centered against the
 * placeholder text, and chasing that through Mantine's internal styles was
 * less reliable than just controlling the box directly. Sized to
 * `DECISION_CONTROL_HEIGHT` so it lines up exactly with the deny/approve
 * buttons beside it.
 *
 * @param {{ id: string, value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }} props
 * @returns {JSX.Element} The radio sign field.
 */
function RadioSignInput({ id, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label htmlFor={id} style={{ fontSize: "0.8rem", color: "var(--app-color-text-muted)" }}>
        או&quot;ק מסוק
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: "0.75rem",
            display: "flex",
            color: "var(--app-color-text-muted)",
            pointerEvents: "none",
          }}
        >
          <IconRadio size={18} stroke={1.8} />
        </span>
        <input
          id={id}
          type="text"
          dir="rtl"
          placeholder="לדוגמה: דרדר 2"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            height: DECISION_CONTROL_HEIGHT,
            boxSizing: "border-box",
            paddingInlineStart: "2.5rem",
            paddingInlineEnd: "0.75rem",
            borderRadius: "var(--mantine-radius-sm)",
            border: `1px solid ${isFocused ? "var(--app-color-primary)" : "var(--app-color-border)"}`,
            outline: "none",
            backgroundColor: "var(--app-color-background)",
            color: "var(--app-color-text)",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </div>
    </div>
  );
}

/**
 * One event's card in the triage queue: name, status and elapsed time in the
 * header, the event's real casualty table in the body, and — separated
 * below it by a divider, never inside the table itself — the decision
 * footer. The separation is deliberate: the airforce should read the whole
 * casualty table before deciding, not have the decision controls compete
 * for attention alongside it.
 *
 * Unlike `AerialEvacCard`'s two-step approve flow, the radio call-sign input
 * and both buttons are always shown together here; approving is just
 * disabled until the call sign is filled in. Once decided, a label states
 * the outcome (and, if approved, the radio sign that was used) — read from
 * the mission itself rather than the session-local decision timestamp, so it
 * still shows correctly after a reload or for a decision made by someone
 * else.
 *
 * @param {{ event: object, mission: object | undefined, casualties: Array<object>, rank: number | null, isPending: boolean }} props
 * @returns {JSX.Element} The queue row.
 */
const TriageQueueRow = ({ event, mission, casualties, rank, isPending }) => {
  const waitSeconds = useElapsedSeconds(event.created_at, null);
  const { status, isActionable, radioSign, setRadioSign, isSubmitting, handleDecision } = useAerialEvacDecision(
    event,
    mission,
  );
  const color = AERIAL_EVAC_COLOR_VARS[status] || "var(--app-color-text-muted)";

  return (
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
        <CasualtiesCard casualties={casualties} statBreakdown="ability" bare />

        <Divider color="var(--app-color-border)" />

        {isActionable ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", flexWrap: "wrap" }}>
            <RadioSignInput
              id={`radio-sign-${event.id}`}
              value={radioSign}
              onChange={(evt) => setRadioSign(evt.target.value)}
            />

            <Button
              leftSection={<IconX size={18} stroke={1.8} />}
              loading={isSubmitting}
              onClick={() => handleDecision("denied")}
              styles={denyButtonStyles}
              style={{ height: DECISION_CONTROL_HEIGHT }}
            >
              דחה
            </Button>

            <Button
              leftSection={<IconCheck size={18} stroke={1.8} />}
              disabled={!radioSign.trim()}
              loading={isSubmitting}
              onClick={() => handleDecision("approved")}
              styles={approveButtonStyles}
              style={{ height: DECISION_CONTROL_HEIGHT }}
            >
              אשר פינוי
            </Button>
          </div>
        ) : (
          <Group
            gap="xs"
            style={{
              display: "inline-flex",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--mantine-radius-sm)",
              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              color,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {status === "approved" ? <IconCheck size={16} stroke={2.2} /> : <IconX size={16} stroke={2.2} />}
            {status === "approved"
              ? `פינוי אושר${mission?.radio_sign ? ` · או"ק: ${mission.radio_sign}` : ""}`
              : "פינוי נדחה"}
          </Group>
        )}
      </Stack>
    </DashboardCard>
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
