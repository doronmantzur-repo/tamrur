// React
import { useState } from "react";

// External libraries
import { useDispatch } from "react-redux";

// Internal application modules
import { getAerialMissionStatus } from "../constants/aerialEvacStatus";
import { createAerialMission, updateAerialMission } from "../features/aerialMission/aerialMissionSlice";

// Styles

/**
 * Shared approve/deny logic for an event's aerial-evacuation request, used
 * by every view's decision UI — `AerialEvacDecisionFooter` (triage, table)
 * and `AerialEvacKanbanDecisionModal` (kanban) — so they all dispatch
 * identically instead of duplicating this. Either decision creates the
 * event's `aerial_mission` row if it doesn't have one yet, or updates it if
 * it does.
 *
 * `decidedAt` is local state only, not persisted server-side — it reflects a
 * decision made in this browser tab this session and is lost on refresh.
 *
 * `pendingAction` (not just a single `isSubmitting` boolean) tracks *which*
 * decision is in flight — "approved", "denied", or null — so a UI showing
 * both buttons at once (the decision footer) can put the loading spinner on
 * only the one actually clicked, instead of both. `isSubmitting` is kept as
 * a derived convenience for callers that only ever show one action at a
 * time and don't need to distinguish which.
 *
 * @param {object} event
 * @param {object | undefined} mission
 * @returns {{
 *   status: string,
 *   isActionable: boolean,
 *   radioSign: string,
 *   setRadioSign: (value: string) => void,
 *   isSubmitting: boolean,
 *   pendingAction: "approved" | "denied" | null,
 *   decidedAt: Date | null,
 *   handleDecision: (requestStatus: "approved" | "denied") => Promise<void>,
 * }}
 */
export function useAerialEvacDecision(event, mission) {
  const dispatch = useDispatch();
  const [radioSign, setRadioSign] = useState(mission?.radio_sign || "");
  const [pendingAction, setPendingAction] = useState(null);
  const [decidedAt, setDecidedAt] = useState(null);

  const status = getAerialMissionStatus(mission);
  const isActionable = status === "needed";

  function handleDecision(requestStatus) {
    setPendingAction(requestStatus);
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
      .finally(() => setPendingAction(null));
  }

  return {
    status,
    isActionable,
    radioSign,
    setRadioSign,
    isSubmitting: pendingAction !== null,
    pendingAction,
    decidedAt,
    handleDecision,
  };
}
