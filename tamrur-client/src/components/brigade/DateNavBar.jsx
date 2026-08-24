// React
import { useState } from "react";

// External libraries
import { Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// Internal application modules
import { isSameDay, startOfDay } from "../../utils/eventQueueDate";
import { useHoverState } from "../../hooks/useHoverState";

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
 * One step button ("קדימה"/"אחורה"), as a plain `<button>` rather than
 * Mantine's `ActionIcon` — borderless at rest, with hover/press feedback
 * driven by local state (`useHoverState` + `onMouseDown`/`onMouseUp`, same
 * pattern `EventActionButtons`/`ClearSearchButton` already use elsewhere)
 * rather than a `styles` "&:hover" key, since pseudo-selectors inside an
 * inline `style` object are never compiled into real CSS.
 *
 * @param {{ label: string, icon: React.ComponentType, onClick: () => void, disabled: boolean }} props
 * @returns {JSX.Element} The step button.
 */
function DateStepButton({ label, icon: Icon, onClick, disabled }) {
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);
  const isActive = !disabled && (isHovered || isPressed);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        height: "2.25rem",
        padding: "0 0.65rem",
        border: 0,
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: isActive ? "color-mix(in srgb, var(--app-color-primary) 16%, transparent)" : "transparent",
        color: isActive ? "var(--app-color-primary)" : "var(--app-color-text-muted)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transform: isPressed && !disabled ? "scale(0.94)" : "scale(1)",
        transition: "background-color 0.15s ease, color 0.15s ease, transform 0.1s ease",
        fontFamily: "inherit",
        fontSize: "0.8rem",
        fontWeight: 600,
      }}
    >
      <Icon size={16} stroke={2.2} />
      {label}
    </button>
  );
}

/**
 * The "jump to date" native date input, borderless so it reads as part of
 * the pill around it (`DateNavBar`'s own bordered `Group`) rather than a
 * second nested box — hover/press/focus are all real state (`useHoverState`
 * + `onMouseDown`/`onMouseUp` + `onFocus`/`onBlur`) for the same reason
 * every other custom control on this page is: an inline `style` object
 * can't express `:hover`/`:active`/`:focus`. A `box-shadow` ring stands in
 * for the border on hover/focus instead of toggling a real border, so nothing
 * shifts size when the ring appears.
 *
 * A browser only opens the date picker popup on a click that lands on its
 * built-in calendar icon — clicking the rest of the input just places a
 * caret. `showPicker()` opens it from anywhere in the input instead, so the
 * whole borderless box is clickable, not just that one small icon; feature-
 * detected since it isn't universally supported (notably not in Firefox as
 * of this writing), in which case a click still falls back to normal caret
 * placement.
 *
 * @param {{ value: string, max: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }} props
 * @returns {JSX.Element} The date input.
 */
function DatePickerInput({ value, max, onChange }) {
  const [isHovered, hoverHandlers] = useHoverState();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const ringColor = isFocused
    ? "var(--app-color-primary)"
    : isHovered
      ? "color-mix(in srgb, var(--app-color-primary) 45%, transparent)"
      : "transparent";

  return (
    <input
      type="date"
      aria-label="קפוץ לתאריך"
      value={value}
      max={max}
      onChange={onChange}
      onClick={(event) => event.currentTarget.showPicker?.()}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        backgroundColor: isFocused
          ? "color-mix(in srgb, var(--app-color-primary) 10%, var(--app-color-surface-high))"
          : "var(--app-color-surface-high)",
        border: 0,
        outline: "none",
        boxShadow: `0 0 0 1px ${ringColor}`,
        borderRadius: "var(--mantine-radius-sm)",
        color: "var(--app-color-text)",
        colorScheme: "dark",
        padding: "0.25rem 0.35rem",
        fontSize: "0.8rem",
        fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
        cursor: "pointer",
        transform: isPressed ? "scale(0.97)" : "scale(1)",
        transition: "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
      }}
    />
  );
}

/**
 * Lets the brigade step the event queue board a day at a time, or jump to
 * an arbitrary past date. Capped at today — the board has nothing to show
 * for a future date, so the forward button disables and picking a future
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

  return (
    <Group justify="center" align="center" gap="sm" style={{ height: "2.5rem", boxSizing: "border-box" }}>
      <DateStepButton label="קדימה" icon={IconChevronRight} disabled={isToday} onClick={() => step(1)} />

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
        <DatePickerInput value={toInputValue(selectedDate)} max={toInputValue(today)} onChange={handlePick} />
      </Group>

      <DateStepButton label="אחורה" icon={IconChevronLeft} disabled={false} onClick={() => step(-1)} />
    </Group>
  );
};

export default DateNavBar;
