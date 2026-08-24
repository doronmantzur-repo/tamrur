// React
import { useState } from "react";

// External libraries
import { useDispatch } from "react-redux";

// Internal application modules
import { getAerialMissionStatus } from "../constants/aerialEvacStatus";
import { createAerialMission, updateAerialMission } from "../features/aerialMission/aerialMissionSlice";

// Styles

/**
 * Shared approve/deny logic for an event's aerial-evacuation request, used by
 * both `AerialEvacCard` and the triage queue's decision footer so the two
 * UIs dispatch identically instead of duplicating this. Either decision
 * creates the event's `aerial_mission` row if it doesn't have one yet, or
 * updates it if it does.
 *
 * `decidedAt` is local state only, not persisted server-side — it reflects a
 * decision made in this browser tab this session and is lost on refresh.
 *
 * @param {object} event
 * @param {object | undefined} mission
 * @returns {{
 *   status: string,
 *   isActionable: boolean,
 *   radioSign: string,
 *   setRadioSign: (value: string) => void,
 *   isSubmitting: boolean,
 *   decidedAt: Date | null,
 *   handleDecision: (requestStatus: "approved" | "denied") => Promise<void>,
 * }}
 */
export function useAerialEvacDecision(event, mission) {
  const dispatch = useDispatch();
  const [radioSign, setRadioSign] = useState(mission?.radio_sign || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decidedAt, setDecidedAt] = useState(null);

  const status = getAerialMissionStatus(mission);
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

    return dispatch(missionAction)
      .unwrap()
      .then(() => setDecidedAt(new Date()))
      .catch(() => {})
      .finally(() => setIsSubmitting(false));
  }

  return { status, isActionable, radioSign, setRadioSign, isSubmitting, decidedAt, handleDecision };
}
