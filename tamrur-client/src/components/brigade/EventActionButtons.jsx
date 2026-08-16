// React

// External libraries
import { Button, Group } from "@mantine/core";
import { IconCheck, IconPlayerTrackNext, IconSend } from "@tabler/icons-react";

// Internal application modules
import { EVENT_STATUS_LABELS } from "../../constants/eventStatus";

// Styles

/** Order events progress through; "advance status" moves one step forward. */
const STATUS_ORDER = [
  "evaluated",
  "controlled",
  "ready_for_evacuation",
  "evacuation_started",
  "completed",
];

/** Subtle hover/tap feedback for the buttons. */
const interactiveScaleStyles = {
  transition: "transform 0.15s ease",
  "&:hover:not(:disabled)": { transform: "scale(1.03)" },
  "&:active:not(:disabled)": { transform: "scale(0.97)" },
};

/**
 * Renders the event's 3 action buttons (advance status, request aerial evac,
 * close event) for the dashboard's top bar. Each swaps its label once the
 * action's already been taken (or the event is closed), on top of the usual
 * disabled state.
 *
 * @param {{
 *   event: object,
 *   isCompleted: boolean,
 *   aerialEvacStatus: string | null | undefined,
 *   onAdvanceStatus: () => void,
 *   onCloseEvent: () => void,
 *   onRequestAerialEvac: () => void,
 * }} props
 * @returns {JSX.Element} The action button group.
 */
const EventActionButtons = ({
  event,
  isCompleted,
  aerialEvacStatus,
  onAdvanceStatus,
  onCloseEvent,
  onRequestAerialEvac,
}) => {
  const currentIndex = STATUS_ORDER.indexOf(event.status);
  const nextStatus = currentIndex >= 0 ? STATUS_ORDER[currentIndex + 1] : null;

  return (
    <Group gap="sm" wrap="wrap">
      <Button
        leftSection={<IconPlayerTrackNext size={16} stroke={1.8} />}
        variant="outline"
        size="sm"
        mih="2.25rem"
        disabled={isCompleted || !nextStatus}
        onClick={onAdvanceStatus}
        styles={{
          root: {
            borderColor: "var(--app-color-border)",
            color: "var(--app-color-text)",
            ...interactiveScaleStyles,
          },
        }}
      >
        {isCompleted
          ? "האירוע הושלם"
          : nextStatus
            ? `קדם סטטוס ל${EVENT_STATUS_LABELS[nextStatus]}`
            : "קדם סטטוס"}
      </Button>

      <Button
        leftSection={
          aerialEvacStatus === "needed" ? (
            <IconCheck size={16} stroke={1.8} />
          ) : (
            <IconSend size={16} stroke={1.8} />
          )
        }
        size="sm"
        mih="2.25rem"
        disabled={isCompleted || aerialEvacStatus === "needed"}
        onClick={onRequestAerialEvac}
        styles={{
          root: {
            backgroundColor: "var(--app-color-primary)",
            color: "var(--app-color-primary-text)",
            "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            ...interactiveScaleStyles,
          },
        }}
      >
        {aerialEvacStatus === "needed" ? "פינוי אווירי התבקש" : "בקש פינוי אווירי"}
      </Button>

      <Button
        leftSection={<IconCheck size={16} stroke={1.8} />}
        size="sm"
        mih="2.25rem"
        disabled={isCompleted}
        onClick={onCloseEvent}
        styles={{
          root: {
            backgroundColor: "var(--app-color-error)",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "var(--app-color-error)",
              opacity: 0.9,
            },
            ...interactiveScaleStyles,
          },
        }}
      >
        {isCompleted ? "האירוע נסגר" : "סגור אירוע"}
      </Button>
    </Group>
  );
};

export default EventActionButtons;
