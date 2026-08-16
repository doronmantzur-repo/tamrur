// React
import { useState } from "react";

// External libraries
import { ActionIcon, Badge, Box, Group, Menu, Stack, Text, Textarea } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconClockPause,
  IconHelicopter,
  IconPencil,
  IconStopwatch,
  IconTarget,
  IconX,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS, PULSING_AERIAL_EVAC_STATUSES } from "../../constants/aerialEvacStatus";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";

// Styles

/**
 * Chrome for the elapsed-time chip: gold-tinted gradient + ring border,
 * matching the stat tiles' treatment. Stretched to fill the header's full
 * height by `DashboardCard`'s `aside` slot, so its own content centers
 * vertically inside whatever height that ends up being.
 */
const timerChipStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minWidth: "11rem",
  borderRadius: "var(--mantine-radius-sm)",
  border: "1px solid color-mix(in srgb, var(--app-color-primary) 30%, transparent)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--app-color-primary) 20%, transparent), color-mix(in srgb, var(--app-color-primary) 5%, transparent))",
  padding: "0.75rem 1.25rem",
};

/** Tinted circular badge the timer icon sits in, instead of floating bare next to the text. */
const timerIconWrapperStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.5rem",
  height: "2.5rem",
  flexShrink: 0,
  borderRadius: "9999px",
  backgroundColor: "color-mix(in srgb, var(--app-color-primary) 18%, transparent)",
  color: "var(--app-color-primary)",
};

const statNumberStyles = {
  fz: "2.25rem",
  fw: 800,
  lh: 1.1,
  c: "var(--app-color-primary)",
  ff: 'ui-monospace, "SF Mono", "Consolas", monospace',
};

const statLabelStyles = {
  fz: "0.72rem",
  fw: 600,
  tt: "uppercase",
  lts: "0.04em",
  c: "var(--app-color-text-muted)",
};

/** All statuses the brigade can manually set the event to, in their natural progression order. */
const STATUS_OPTIONS = Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Renders the brigade event dashboard's header: name, a client-only note
 * (edited via the pencil icon — the DB has no description column, so this
 * never persists past the browser session), type/status/aerial-evac badges,
 * and the elapsed-time chip. The status badge is itself the control: click
 * it to open a menu of every status and set the event to any of them
 * directly, since progress here isn't strictly linear (including moving
 * back off "completed" if the event needs reopening). The chip sits to the
 * left (per the app's RTL layout) of the title/description column,
 * stretched to exactly match that column's height, whether the description
 * is showing or not, rather than a fixed size. Casualty/evacuation counts
 * and the event's close-event action live elsewhere on the dashboard (the
 * stat-tile row and the top bar) instead of here.
 *
 * @param {{
 *   event: object,
 *   aerialEvacStatus: string | null | undefined,
 *   localClosureAt: string | null,
 *   onStatusChange: (nextStatus: string) => void,
 * }} props
 * @returns {JSX.Element} The event header card.
 */
const EventHeaderCard = ({ event, aerialEvacStatus, localClosureAt, onStatusChange }) => {
  // Client-only note for the brigade's own reference — the DB has no
  // description column, so this never leaves the browser.
  const [description, setDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const startEditingDescription = () => {
    setDescriptionDraft(description);
    setIsEditingDescription(true);
  };

  const saveDescription = () => {
    setDescription(descriptionDraft.trim());
    setIsEditingDescription(false);
  };

  const cancelEditingDescription = () => {
    setIsEditingDescription(false);
  };

  const isCompleted = event.status === COMPLETED_STATUS;

  // Last-resort fallback for a completed event with no closure_at from
  // either the parent's locally-tracked close time or the server: only
  // reachable on a page load where the event was already completed in both
  // of those. Captured once (lazy initializer, evaluated only at first
  // render) so the timer freezes at that moment instead of showing 0 or
  // ticking forever.
  const [fallbackClosureAt] = useState(() =>
    event.status === COMPLETED_STATUS && !localClosureAt && !event.closure_at ? new Date().toISOString() : null,
  );

  // localClosureAt (set the instant the brigade closes the event, in this
  // session) takes priority over event.closure_at (which depends on the API
  // actually persisting and returning that field, unverified from this repo
  // alone) so the timer freezes correctly regardless of that round-trip.
  const elapsedSeconds = useElapsedSeconds(
    event.created_at,
    isCompleted ? localClosureAt || event.closure_at || fallbackClosureAt : null,
  );

  const showAerialEvacBadge = aerialEvacStatus && aerialEvacStatus !== "no_needed";
  const aerialEvacColor = AERIAL_EVAC_COLOR_VARS[aerialEvacStatus] || "var(--app-color-text-muted)";

  const timer = (
    <Box style={timerChipStyles}>
      <Group gap="sm" wrap="nowrap">
        <Box style={timerIconWrapperStyles} className={isCompleted ? undefined : "app-pulse-glow"}>
          {isCompleted ? <IconClockPause size={22} stroke={1.8} /> : <IconStopwatch size={22} stroke={1.8} />}
        </Box>
        <Stack gap={0}>
          <Text {...statLabelStyles}>{isCompleted ? "אירוע הסתיים" : "זמן שחלף"}</Text>
          <Text {...statNumberStyles}>{formatDuration(elapsedSeconds)}</Text>
        </Stack>
      </Group>
    </Box>
  );

  return (
    <DashboardCard
      title={event.name || "אירוע ללא שם"}
      padding="md"
      gap="sm"
      aside={timer}
      headerExtra={
        <Group gap="xs">
          <Menu shadow="md" position="bottom-start" withinPortal>
            <Menu.Target>
              <Badge
                size="lg"
                rightSection={<IconChevronDown size={14} stroke={2} />}
                style={{ cursor: "pointer" }}
                styles={{
                  root: {
                    backgroundColor: `color-mix(in srgb, ${EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)"} 16%, transparent)`,
                    color: EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)",
                  },
                }}
              >
                {EVENT_STATUS_LABELS[event.status] || event.status}
              </Badge>
            </Menu.Target>
            <Menu.Dropdown>
              {STATUS_OPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  onClick={() => onStatusChange(option.value)}
                  disabled={option.value === event.status}
                  styles={{
                    itemLabel: { color: EVENT_STATUS_COLOR_VARS[option.value] || "var(--app-color-text)" },
                  }}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          <Badge
            size="lg"
            leftSection={<IconTarget size={14} />}
            variant="outline"
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text-muted)",
              },
            }}
          >
            {EVENT_TYPE_LABELS[event.type] || event.type}
          </Badge>
          {showAerialEvacBadge && (
            <Badge
              size="lg"
              leftSection={<IconHelicopter size={14} />}
              className={PULSING_AERIAL_EVAC_STATUSES.includes(aerialEvacStatus) ? "app-pulse-glow" : undefined}
              styles={{
                root: {
                  backgroundColor: `color-mix(in srgb, ${aerialEvacColor} 16%, transparent)`,
                  color: aerialEvacColor,
                },
              }}
            >
              {AERIAL_EVAC_LABELS[aerialEvacStatus] || aerialEvacStatus}
            </Badge>
          )}
        </Group>
      }
    >
      {isEditingDescription ? (
        <Group align="flex-start" gap="xs" wrap="nowrap">
          <Textarea
            autosize
            minRows={1}
            maxRows={4}
            autoFocus
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.currentTarget.value)}
            placeholder="הערה פנימית לצוות (לא נשמרת במערכת)"
            style={{ flex: 1 }}
            styles={{
              input: {
                backgroundColor: "var(--app-color-background)",
                color: "var(--app-color-text)",
                borderColor: "var(--app-color-border)",
              },
            }}
          />
          <ActionIcon
            variant="subtle"
            aria-label="שמור תיאור"
            onClick={saveDescription}
            styles={{ root: { color: "var(--app-color-success)" } }}
          >
            <IconCheck size={18} stroke={1.8} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            aria-label="בטל"
            onClick={cancelEditingDescription}
            styles={{ root: { color: "var(--app-color-text-muted)" } }}
          >
            <IconX size={18} stroke={1.8} />
          </ActionIcon>
        </Group>
      ) : (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          {description && (
            <Text fz="sm" c="var(--app-color-text-muted)" style={{ flex: 1 }}>
              {description}
            </Text>
          )}
          <ActionIcon
            variant="subtle"
            aria-label={description ? "ערוך תיאור" : "הוסף תיאור"}
            onClick={startEditingDescription}
            styles={{ root: { color: "var(--app-color-text-muted)" } }}
          >
            <IconPencil size={14} stroke={1.8} />
          </ActionIcon>
        </Group>
      )}
    </DashboardCard>
  );
};

export default EventHeaderCard;
