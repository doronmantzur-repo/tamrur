// React
import { useState } from "react";

// External libraries
import { Button, Group } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

// Internal application modules
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const REST_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--app-color-surface) 32%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-border) 22%, transparent)",
  color: "var(--app-color-text)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)",
  transition: "transform 0.15s ease, background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease",
};

const HOVER_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--app-color-error) 14%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-error) 40%, transparent)",
  color: "var(--app-color-error)",
  transform: "scale(1.03)",
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
 * Hover/press feedback is driven by local state (useHoverState +
 * onMouseDown/Up) rather than a `styles` "&:hover"/"&:active" key — Mantine's
 * `styles` prop merges straight into an inline `style` attribute, so nested
 * pseudo-selectors there are never compiled into real CSS.
 *
 * @param {{
 *   isCompleted: boolean,
 *   canClose: boolean,
 *   onCloseEvent: () => void,
 * }} props
 * @returns {JSX.Element} The action button group.
 */
const EventActionButtons = ({ isCompleted, canClose, onCloseEvent }) => {
  const disabled = isCompleted || !canClose;
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  const style = { ...REST_STYLE };
  if (!disabled && isHovered) Object.assign(style, HOVER_STYLE);
  if (!disabled && isPressed) style.transform = "scale(0.97)";

  return (
    <Group gap="sm" wrap="wrap">
      <Button
        leftSection={<IconCheck size={18} stroke={1.8} />}
        size="sm"
        mih="2.5rem"
        disabled={disabled}
        onClick={onCloseEvent}
        {...hoverHandlers}
        onMouseLeave={() => {
          hoverHandlers.onMouseLeave();
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        styles={{ root: style }}
      >
        {isCompleted ? "האירוע נסגר" : "סגור אירוע"}
      </Button>
    </Group>
  );
};

export default EventActionButtons;
