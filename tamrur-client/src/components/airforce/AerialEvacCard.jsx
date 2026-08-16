// React
import { useState } from "react";

// External libraries
import { Badge, Button, Group, Text, TextInput } from "@mantine/core";
import { IconCheck, IconHelicopter, IconRadio, IconX } from "@tabler/icons-react";
import { useDispatch } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { createAerialMission, updateAerialMission } from "../../features/aerialMission/aerialMissionSlice";

// Styles

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

/**
 * Renders a single event's aerial-evacuation request status. The parent page
 * only renders this once the event's own aerial-evac field is "needed" — at
 * that point there usually isn't an aerial_mission row yet, so the status
 * defaults to "needed" when none exists. Whenever the effective status is
 * "needed", this renders approve/deny controls. Denying is a single click.
 * Approving is two steps: pressing "אשר" first reveals the chopper's radio
 * call-sign field, and only confirming that actually sends the approval.
 * Either decision creates the mission row if this event doesn't have one yet,
 * or updates it if it does.
 *
 * The decision timestamp shown below the buttons is tracked in local state
 * only, not persisted server-side — it reflects decisions made in this
 * browser tab this session and is lost on refresh.
 *
 * @param {{ event: object, mission?: object }} props
 * @returns {JSX.Element} The aerial evacuation status card.
 */
const AerialEvacCard = ({ event, mission }) => {
  const dispatch = useDispatch();
  const [radioSign, setRadioSign] = useState(mission?.radio_sign || "");
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decidedAt, setDecidedAt] = useState(null);

  const status = mission?.["request-status"] || "needed";
  const color = AERIAL_EVAC_COLOR_VARS[status] || "var(--app-color-text-muted)";
  const isActionable = status === "needed";

  function handleDecision(requestStatus) {
    setIsSubmitting(true);
    const missionAction = mission
      ? updateAerialMission({
          id: mission.id,
          requestStatus,
          radioSign: requestStatus === "approved" ? radioSign : undefined,
        })
      : createAerialMission({
          eventId: event.id,
          requestStatus,
          radioSign: requestStatus === "approved" ? radioSign : undefined,
        });

    dispatch(missionAction)
      .unwrap()
      .then(() => setDecidedAt(new Date()))
      .catch(() => {})
      .finally(() => {
        setIsSubmitting(false);
        setIsApproving(false);
      });
  }

  return (
    <DashboardCard
      title={event.name || "אירוע ללא שם"}
      headerExtra={
        <Badge
          leftSection={<IconHelicopter size={12} />}
          styles={{
            root: {
              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              color,
            },
          }}
        >
          {AERIAL_EVAC_LABELS[status] || status}
        </Badge>
      }
    >
      {!isActionable && decidedAt && (
        <Text fz="sm" c="var(--app-color-text-muted)">
          {`הוחלט ב-${decidedAt.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}`}
        </Text>
      )}

      {isActionable && !isApproving && (
        <Group gap="sm">
          <Button
            leftSection={<IconX size={18} stroke={1.8} />}
            loading={isSubmitting}
            onClick={() => handleDecision("denied")}
            styles={denyButtonStyles}
          >
            דחה
          </Button>

          <Button
            leftSection={<IconCheck size={18} stroke={1.8} />}
            onClick={() => setIsApproving(true)}
            styles={approveButtonStyles}
          >
            אשר
          </Button>
        </Group>
      )}

      {isActionable && isApproving && (
        <Group gap="sm" align="flex-end" wrap="wrap">
          <TextInput
            label="כינוי קריאה למסוק"
            placeholder="לדוגמה: דרדר 2"
            value={radioSign}
            onChange={(evt) => setRadioSign(evt.currentTarget.value)}
            leftSection={<IconRadio size={18} stroke={1.8} />}
            leftSectionPointerEvents="none"
            dir="rtl"
            autoFocus
            style={{ flex: 1, minWidth: 180 }}
            styles={{
              label: { color: "var(--app-color-text-muted)", marginBottom: "0.25rem" },
              input: {
                backgroundColor: "var(--app-color-background)",
                color: "var(--app-color-text)",
                borderColor: "var(--app-color-border)",
              },
            }}
          />

          <Button
            variant="subtle"
            color="gray"
            disabled={isSubmitting}
            onClick={() => setIsApproving(false)}
            styles={{ root: { color: "var(--app-color-text-muted)" } }}
          >
            ביטול
          </Button>

          <Button
            leftSection={<IconCheck size={18} stroke={1.8} />}
            disabled={!radioSign.trim()}
            loading={isSubmitting}
            onClick={() => handleDecision("approved")}
            styles={approveButtonStyles}
          >
            אשר פינוי
          </Button>
        </Group>
      )}
    </DashboardCard>
  );
};

export default AerialEvacCard;
