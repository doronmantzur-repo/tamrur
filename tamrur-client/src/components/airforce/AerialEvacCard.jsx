// React
import { useEffect, useState } from "react";

// External libraries
import { Badge, Button, Group, TextInput } from "@mantine/core";
import { IconCheck, IconHelicopter, IconRadio, IconX } from "@tabler/icons-react";
import { useDispatch } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";
import { createAerialMission, updateAerialMission } from "../../features/aerialMission/aerialMissionSlice";
import { updateEventAerialEvac } from "../../features/events/eventsSlice";

// Styles

/**
 * Renders a single event's aerial-evacuation request status. The event's own
 * aerial-evac field is the single trigger for whether this is actionable —
 * whenever it's "needed", this renders approve/deny controls (approving
 * requires setting the chopper's radio call sign), regardless of what any
 * past aerial_mission row says (a fresh "needed" always means a live request).
 * Deciding creates the mission row if this event doesn't have one yet, or
 * updates it if it does, and then writes the same decision back onto the
 * event's aerial-evac field so it correctly stops being "needed".
 *
 * @param {{ event: object, mission?: object }} props
 * @returns {JSX.Element} The aerial evacuation status card.
 */
const AerialEvacCard = ({ event, mission }) => {
  const dispatch = useDispatch();
  const [radioSign, setRadioSign] = useState(mission?.radio_sign || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // `mission` arrives asynchronously (after the aerial missions fetch
  // resolves), so seed the field once its radio sign actually shows up.
  useEffect(() => {
    if (mission?.radio_sign) {
      setRadioSign(mission.radio_sign);
    }
  }, [mission?.radio_sign]);

  const status = event["aerial-evac"];
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
      .then(() => dispatch(updateEventAerialEvac({ id: event.id, aerialEvac: requestStatus })))
      .finally(() => setIsSubmitting(false));
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
      {isActionable && (
        <Group gap="sm" align="flex-end" wrap="wrap">
          <TextInput
            label="כינוי קריאה למסוק"
            placeholder="לדוגמה: דרדר 2"
            value={radioSign}
            onChange={(evt) => setRadioSign(evt.currentTarget.value)}
            leftSection={<IconRadio size={18} stroke={1.8} />}
            leftSectionPointerEvents="none"
            dir="rtl"
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
            leftSection={<IconCheck size={18} stroke={1.8} />}
            disabled={!radioSign.trim()}
            loading={isSubmitting}
            onClick={() => handleDecision("approved")}
            styles={{
              root: {
                backgroundColor: "var(--app-color-success)",
                color: "var(--app-color-primary-text)",
                "&:hover": { backgroundColor: "var(--app-color-success)", filter: "brightness(1.1)" },
              },
            }}
          >
            אשר
          </Button>

          <Button
            leftSection={<IconX size={18} stroke={1.8} />}
            loading={isSubmitting}
            onClick={() => handleDecision("denied")}
            styles={{
              root: {
                backgroundColor: "var(--app-color-error)",
                color: "var(--app-color-primary-text)",
                "&:hover": { backgroundColor: "var(--app-color-error)", filter: "brightness(1.1)" },
              },
            }}
          >
            דחה
          </Button>
        </Group>
      )}
    </DashboardCard>
  );
};

export default AerialEvacCard;
