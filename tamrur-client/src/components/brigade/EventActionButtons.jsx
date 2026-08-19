// React

// External libraries
import { Button, Group } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

// Internal application modules

// Styles

/** Subtle hover/tap feedback for the button. */
const interactiveScaleStyles = {
  transition: "transform 0.15s ease",
  "&:hover:not(:disabled)": { transform: "scale(1.03)" },
  "&:active:not(:disabled)": { transform: "scale(0.97)" },
};

/**
 * Renders the event's close-event action button for the dashboard's top
 * bar, swapping its label once the event is already closed. This is now the
 * only way to change `status` from this page — it's otherwise derived
 * server-side from gathering_status/evac_status (see EventBadgesRow, whose
 * status badge is read-only) — and the server only accepts the close action
 * while the event is at full_evacuation, so the button is disabled until
 * then too. The aerial-evac request lives in the evacuations table, since
 * requesting one results in a row there.
 *
 * @param {{
 *   isCompleted: boolean,
 *   canClose: boolean,
 *   onCloseEvent: () => void,
 * }} props
 * @returns {JSX.Element} The action button group.
 */
const EventActionButtons = ({ isCompleted, canClose, onCloseEvent }) => {
  return (
    <Group gap="sm" wrap="wrap">
      <Button
        leftSection={<IconCheck size={18} stroke={1.8} />}
        size="sm"
        mih="2.5rem"
        disabled={isCompleted || !canClose}
        onClick={onCloseEvent}
        styles={{
          root: {
            backgroundColor: "var(--app-color-success)",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "var(--app-color-success)",
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
