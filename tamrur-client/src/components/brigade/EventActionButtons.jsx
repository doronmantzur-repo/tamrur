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
 * bar, swapping its label once the event is already closed. Status is
 * changed via the dropdown in the event header instead of a button here
 * (the brigade can set it to any status, not just step forward), and the
 * aerial-evac request lives in the evacuations table, since requesting one
 * results in a row there.
 *
 * @param {{
 *   isCompleted: boolean,
 *   onCloseEvent: () => void,
 * }} props
 * @returns {JSX.Element} The action button group.
 */
const EventActionButtons = ({ isCompleted, onCloseEvent }) => {
  return (
    <Group gap="sm" wrap="wrap">
      <Button
        leftSection={<IconCheck size={16} stroke={1.8} />}
        size="sm"
        mih="2.25rem"
        disabled={isCompleted}
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
