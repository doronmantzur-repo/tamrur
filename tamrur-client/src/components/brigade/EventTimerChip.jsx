// React
import { useState } from "react";

// External libraries
import { Box, Group, Stack, Text } from "@mantine/core";
import { IconClockPause, IconStopwatch } from "@tabler/icons-react";

// Internal application modules
import { COMPLETED_STATUS } from "../../constants/eventStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

const timerChipStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "13rem",
  borderRadius: "var(--mantine-radius-sm)",
  border: "1px solid color-mix(in srgb, var(--app-color-primary) 30%, transparent)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--app-color-primary) 20%, transparent), color-mix(in srgb, var(--app-color-primary) 5%, transparent))",
  padding: "0.65rem 1.5rem",
};

/** Tinted circular badge the timer icon sits in, instead of floating bare next to the text. */
const timerIconWrapperStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.75rem",
  height: "2.75rem",
  flexShrink: 0,
  borderRadius: "9999px",
  backgroundColor: "color-mix(in srgb, var(--app-color-primary) 18%, transparent)",
  color: "var(--app-color-primary)",
};

const statNumberStyles = {
  fz: "1.85rem",
  fw: 800,
  lh: 1.1,
  c: "var(--app-color-primary)",
  ff: 'ui-monospace, "SF Mono", "Consolas", monospace',
};

const statLabelStyles = {
  fz: "0.72rem",
  fw: 700,
  tt: "uppercase",
  lts: "0.04em",
  c: "var(--app-color-text-muted)",
};

/**
 * Renders the event's elapsed-time chip for the dashboard's top bar, at the
 * same row as the open/close-event actions rather than inside the header
 * card. Freezes once the event is completed, using whichever closure
 * timestamp is available first: the brigade's own just-closed moment
 * (`localClosureAt`), then the server's `closure_at`, then — only if neither
 * exists yet on first render of an already-completed event — the moment
 * this component first mounted, captured once so the timer doesn't tick
 * forever or show 0.
 *
 * @param {{ event: object, localClosureAt: string | null }} props
 * @returns {JSX.Element} The timer chip.
 */
const EventTimerChip = ({ event, localClosureAt }) => {
  const isCompleted = event.status === COMPLETED_STATUS;

  const [fallbackClosureAt] = useState(() =>
    event.status === COMPLETED_STATUS && !localClosureAt && !event.closure_at ? new Date().toISOString() : null,
  );

  const elapsedSeconds = useElapsedSeconds(
    event.created_at,
    isCompleted ? localClosureAt || event.closure_at || fallbackClosureAt : null,
  );

  return (
    <Box style={timerChipStyles}>
      <Group gap="sm" wrap="nowrap">
        <Box style={timerIconWrapperStyles}>
          {isCompleted ? <IconClockPause size={24} stroke={2} /> : <IconStopwatch size={24} stroke={2} />}
        </Box>
        <Stack gap={0}>
          <Text {...statLabelStyles}>{isCompleted ? "אירוע הסתיים" : "מתחילת האירוע"}</Text>
          <Text {...statNumberStyles}>{formatDuration(elapsedSeconds, { showDays: false })}</Text>
        </Stack>
      </Group>
    </Box>
  );
};

export default EventTimerChip;
