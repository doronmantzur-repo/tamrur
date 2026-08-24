// React
import { useState } from "react";

// External libraries
import { Button, Group } from "@mantine/core";
import { IconCheck, IconRadio, IconX } from "@tabler/icons-react";

// Internal application modules
import { AERIAL_EVAC_COLOR_VARS } from "../../constants/aerialEvacStatus";
import { useAerialEvacDecision } from "../../hooks/useAerialEvacDecision";

// Styles

const approveButtonStyles = {
  root: {
    backgroundColor: "color-mix(in srgb, var(--app-color-success) 16%, transparent)",
    color: "var(--app-color-success)",
    border: "1px solid color-mix(in srgb, var(--app-color-success) 45%, transparent)",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--app-color-success) 28%, transparent)",
    },
  },
};

const denyButtonStyles = {
  root: {
    backgroundColor: "color-mix(in srgb, var(--app-color-error) 16%, transparent)",
    color: "var(--app-color-error)",
    border: "1px solid color-mix(in srgb, var(--app-color-error) 45%, transparent)",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--app-color-error) 28%, transparent)",
    },
  },
};

const DECISION_CONTROL_HEIGHT = "3rem";

/**
 * The radio call-sign field, as plain HTML rather than Mantine's `TextInput`:
 * the icon inside `TextInput` wasn't vertically centered against the
 * placeholder text, and chasing that through Mantine's internal styles was
 * less reliable than just controlling the box directly. Sized to
 * `DECISION_CONTROL_HEIGHT` so it lines up exactly with the deny/approve
 * buttons beside it.
 *
 * @param {{ id: string, value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }} props
 * @returns {JSX.Element} The radio sign field.
 */
function RadioSignInput({ id, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label htmlFor={id} style={{ fontSize: "0.8rem", color: "var(--app-color-text-muted)" }}>
        או&quot;ק מסוק
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: "0.75rem",
            display: "flex",
            color: "var(--app-color-text-muted)",
            pointerEvents: "none",
          }}
        >
          <IconRadio size={18} stroke={1.8} />
        </span>
        <input
          id={id}
          type="text"
          dir="rtl"
          placeholder="לדוגמה: דרדר 2"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: "100%",
            height: DECISION_CONTROL_HEIGHT,
            boxSizing: "border-box",
            paddingInlineStart: "2.5rem",
            paddingInlineEnd: "0.75rem",
            borderRadius: "var(--mantine-radius-sm)",
            border: `1px solid ${isFocused ? "var(--app-color-primary)" : "var(--app-color-border)"}`,
            outline: "none",
            backgroundColor: "var(--app-color-background)",
            color: "var(--app-color-text)",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </div>
    </div>
  );
}

/**
 * The aerial-evac approve/deny footer, shared by every Airforce view that
 * shows an event's full decision UI (triage queue, table — kanban and any
 * future view need it too, since every view offers the same full
 * functionality, just laid out differently).
 *
 * Unlike `AerialEvacCard`'s two-step approve flow, the radio call-sign input
 * and both buttons are always shown together; approving is just disabled
 * until the call sign is filled in. Once decided, a colored pill states the
 * outcome (and, if approved, the radio sign that was used) — read from the
 * mission itself rather than a session-local decision timestamp, so it still
 * shows correctly after a reload or for a decision made by someone else.
 *
 * @param {{ event: object, mission: object | undefined }} props
 * @returns {JSX.Element} The decision footer.
 */
const AerialEvacDecisionFooter = ({ event, mission }) => {
  const { status, isActionable, radioSign, setRadioSign, pendingAction, handleDecision } = useAerialEvacDecision(
    event,
    mission,
  );
  const color = AERIAL_EVAC_COLOR_VARS[status] || "var(--app-color-text-muted)";

  if (isActionable) {
    const isDenyPending = pendingAction === "denied";
    const isApprovePending = pendingAction === "approved";
    // While one action is submitting, the other is disabled too — not just
    // non-spinning — so a second click can't race the first.
    const otherPending = pendingAction !== null;

    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", flexWrap: "wrap" }}>
        <RadioSignInput
          id={`radio-sign-${event.id}`}
          value={radioSign}
          onChange={(evt) => setRadioSign(evt.target.value)}
        />

        <Button
          leftSection={<IconX size={18} stroke={1.8} />}
          loading={isDenyPending}
          disabled={otherPending && !isDenyPending}
          onClick={() => handleDecision("denied")}
          styles={denyButtonStyles}
          style={{ height: DECISION_CONTROL_HEIGHT }}
        >
          דחה
        </Button>

        <Button
          leftSection={<IconCheck size={18} stroke={1.8} />}
          disabled={!radioSign.trim() || (otherPending && !isApprovePending)}
          loading={isApprovePending}
          onClick={() => handleDecision("approved")}
          styles={approveButtonStyles}
          style={{ height: DECISION_CONTROL_HEIGHT }}
        >
          אשר פינוי
        </Button>
      </div>
    );
  }

  return (
    <Group
      gap="xs"
      style={{
        display: "inline-flex",
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        color,
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      {status === "approved" ? <IconCheck size={16} stroke={2.2} /> : <IconX size={16} stroke={2.2} />}
      {status === "approved"
        ? `פינוי אושר${mission?.radio_sign ? ` · או"ק: ${mission.radio_sign}` : ""}`
        : "פינוי נדחה"}
    </Group>
  );
};

export default AerialEvacDecisionFooter;
