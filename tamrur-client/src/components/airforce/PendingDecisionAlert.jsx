// React

// External libraries
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";

// Internal application modules

// Styles

const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

/**
 * The Hebrew label for how many events are awaiting a decision, singular-aware
 * the same way the rest of this app's counted labels already are.
 *
 * @param {number} count
 * @returns {string} The label.
 */
function pendingLabel(count) {
  return count === 1
    ? "אירוע אחד ממתין להחלטת פינוי אווירי"
    : `${count} אירועים ממתינים להחלטת פינוי אווירי`;
}

/**
 * The header's pending-decision bell — visible regardless of which of the
 * three views (triage/table/kanban) is active, since it lives in the page
 * header rather than inside any one of them. Purely informational: no
 * `onClick`, rendered `component="div"` rather than a real button, since
 * there's nothing for it to do beyond showing the count and explaining it on
 * hover.
 *
 * At `count === 0` it sits in the same neutral resting look
 * `ThemeToggleButton` (its row-mate in `AccountControlsStack`) uses by
 * default — no pulse, no badge — so the header doesn't jump as the count
 * changes. Above zero it turns gold (not red — red is already this app's
 * "denied"/error color, e.g. `AERIAL_EVAC_COLOR_VARS.denied`, and this bell
 * means "awaiting a decision," not "something's wrong") and pulses
 * continuously via the app's own `app-pulse-glow` keyframe (`src/index.css`,
 * already used elsewhere for pulsing aerial-evac badges) rather than a new
 * one — `color` is set inline so that class's `currentColor`-based glow
 * resolves to gold here.
 *
 * @param {{ count: number }} props
 * @returns {JSX.Element} The bell.
 */
export function PendingDecisionBell({ count }) {
  const isActive = count > 0;

  return (
    <Tooltip
      label={isActive ? pendingLabel(count) : "אין אירועים הממתינים להחלטה"}
      position="bottom"
      withArrow
    >
      {/* The count badge sits outside `ActionIcon`'s own box (a 40x40 circle
          with `overflow: hidden` built in, which crops anything positioned
          past its edge) — so it's a sibling of `ActionIcon` inside this
          plain positioning wrapper instead of a child inside it, absolutely
          placed against the wrapper rather than the icon itself. */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        <ActionIcon
          component="div"
          aria-label={isActive ? pendingLabel(count) : "אין אירועים הממתינים להחלטה"}
          size={40}
          radius="xl"
          variant="default"
          className={isActive ? "app-pulse-glow" : undefined}
          style={{
            backgroundColor: "var(--app-color-surface)",
            borderColor: isActive ? "var(--app-color-primary)" : "var(--app-color-border)",
            color: isActive ? "var(--app-color-primary)" : "var(--app-color-text)",
          }}
        >
          <IconBell aria-hidden="true" size={20} stroke={1.8} />
        </ActionIcon>

        {isActive && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-6px",
              insetInlineEnd: "-6px",
              minWidth: "19px",
              height: "19px",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              fontSize: "0.68rem",
              fontWeight: 700,
              fontFamily: MONO_FONT,
              borderRadius: "999px",
              border: "2px solid var(--app-color-background)",
            }}
          >
            {count}
          </span>
        )}
      </div>
    </Tooltip>
  );
}

/**
 * The yellow/warning banner shown above whichever view (triage/table/kanban)
 * is currently active, rendered once above the view switch itself rather
 * than duplicated inside each of the three view components — since only one
 * view is ever mounted at a time, that single render site already sits "on
 * top of" whichever one is showing.
 *
 * Renders nothing at `count === 0` — an empty state has nothing to alert
 * about.
 *
 * @param {{ count: number }} props
 * @returns {JSX.Element | null} The banner.
 */
export function PendingDecisionBanner({ count }) {
  if (count === 0) return null;

  return (
    <Group
      gap="sm"
      wrap="nowrap"
      p="sm"
      style={{
        backgroundColor: "color-mix(in srgb, var(--app-color-warning) 12%, transparent)",
        borderInlineStart: "3px solid var(--app-color-warning)",
        borderRadius: "var(--mantine-radius-sm)",
      }}
    >
      <IconBell aria-hidden="true" size={18} stroke={1.8} color="var(--app-color-warning)" style={{ flexShrink: 0 }} />
      <Text fz="sm" fw={700} c="var(--app-color-warning)">
        {pendingLabel(count)}
      </Text>
    </Group>
  );
}
