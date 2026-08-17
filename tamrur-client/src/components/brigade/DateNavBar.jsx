// React

// External libraries
import { ActionIcon, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// Internal application modules
import { isSameDay, startOfDay } from "../../utils/eventQueueDate";

// Styles

const dateFormatter = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" });

/** `YYYY-MM-DD` for the native date input's value/max attributes. */
function toInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Lets the brigade step the event queue board a day at a time, or jump to
 * an arbitrary past date. Capped at today — the board has nothing to show
 * for a future date, so the forward arrow disables and picking a future
 * date clamps back to today.
 *
 * @param {{ selectedDate: Date, onChange: (date: Date) => void }} props
 * @returns {JSX.Element} The date nav bar.
 */
const DateNavBar = ({ selectedDate, onChange }) => {
  const today = startOfDay(new Date());
  const isToday = isSameDay(selectedDate, today);

  const step = (deltaDays) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + deltaDays);
    if (next.getTime() > today.getTime()) return;
    onChange(next);
  };

  const handlePick = (event) => {
    const value = event.currentTarget.value;
    if (!value) return;
    const [y, m, d] = value.split("-").map(Number);
    const picked = new Date(y, m - 1, d);
    onChange(picked.getTime() > today.getTime() ? today : picked);
  };

  const arrowStyles = {
    root: {
      backgroundColor: "var(--app-color-surface)",
      borderColor: "var(--app-color-border)",
      color: "var(--app-color-text)",
    },
  };

  return (
    <Group justify="center" gap="sm">
      <ActionIcon
        aria-label="יום הבא"
        title="יום הבא"
        variant="default"
        size={36}
        radius="sm"
        disabled={isToday}
        onClick={() => step(1)}
        styles={arrowStyles}
      >
        <IconChevronRight size={16} stroke={2.2} />
      </ActionIcon>

      <Group
        gap="xs"
        px="sm"
        py={4}
        style={{
          backgroundColor: "var(--app-color-surface)",
          border: "1px solid var(--app-color-border)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        <Text fw={700} c={isToday ? "var(--app-color-primary)" : "var(--app-color-text)"} miw="7rem" ta="center">
          {isToday ? "היום" : dateFormatter.format(selectedDate)}
        </Text>
        <input
          type="date"
          aria-label="קפוץ לתאריך"
          value={toInputValue(selectedDate)}
          max={toInputValue(today)}
          onChange={handlePick}
          style={{
            backgroundColor: "var(--app-color-surface-high)",
            border: "1px solid var(--app-color-border)",
            borderRadius: "var(--mantine-radius-sm)",
            color: "var(--app-color-text)",
            colorScheme: "dark",
            padding: "0.25rem 0.35rem",
            fontSize: "0.8rem",
            fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
          }}
        />
      </Group>

      <ActionIcon
        aria-label="יום קודם"
        title="יום קודם"
        variant="default"
        size={36}
        radius="sm"
        onClick={() => step(-1)}
        styles={arrowStyles}
      >
        <IconChevronLeft size={16} stroke={2.2} />
      </ActionIcon>
    </Group>
  );
};

export default DateNavBar;
