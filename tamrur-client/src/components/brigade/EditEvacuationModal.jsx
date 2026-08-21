// React
import { useEffect, useState } from "react";

// External libraries
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

// Styles

const inputStyles = {
  input: {
    minHeight: "2.5rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
  },
};

/** Converts an ISO timestamp to the `datetime-local` input value format. */
function toLocalInputValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a `datetime-local` input value back to an ISO timestamp, or null if empty. */
function fromLocalInputValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

/**
 * Neither ETA nor the concluded time can sensibly land before the start
 * time — arriving or finishing before you left isn't a real evacuation.
 * Only checked against start time, not against each other: finishing sooner
 * than the original ETA estimate is completely normal (team moved faster
 * than expected), so there's no ordering constraint between eta and
 * concludedAt themselves. Returns an error message, or null if the draft is
 * fine to save.
 */
function validateOrdering(draft) {
  if (draft.startTime && draft.eta && draft.eta < draft.startTime) {
    return "זמן ה-ETA לא יכול להיות מוקדם משעת היציאה";
  }
  if (draft.startTime && draft.concludedAt && draft.concludedAt < draft.startTime) {
    return "זמן הסיום לא יכול להיות מוקדם משעת היציאה";
  }
  return null;
}

/**
 * Edits only an evacuation's three timing fields (start time, ETA, concluded
 * time) — method, departure/destination, radio sign, aerial mission, and
 * status are all set through other flows (the aerial mission approval, the
 * start-now/finish-evacuation quick actions) and aren't meant to be hand-
 * edited here, per team decision. Explicitly clearing a field (deleting its
 * value) and saving sends that field as `null` rather than omitting it, so
 * the server can tell "clear this" apart from "leave it alone" — see
 * `update_evacuation` in `evacuationsModel.js`, which used to COALESCE every
 * field against its old value regardless, making a clear indistinguishable
 * from a no-op. ETA/concluded time can't be set earlier than start time
 * (see `validateOrdering`) — enforced here, not for the start-now/finish-
 * evacuation quick actions, since those stamp the actual current moment
 * rather than a hand-picked time and shouldn't be rejected for an earlier
 * ETA estimate turning out wrong.
 *
 * @param {{
 *   evacuation: object | null,
 *   opened: boolean,
 *   onClose: () => void,
 *   onSave: (evacId: string, changes: object) => Promise<unknown>,
 * }} props
 * @returns {JSX.Element} The evacuation timing edit modal.
 */
const EditEvacuationModal = ({ evacuation, opened, onClose, onSave }) => {
  // Lazy initializer, not a reset-on-open effect: the parent remounts this
  // component (via a `key` that changes every time the modal opens — see
  // EvacuationsTable.jsx) whenever a row's edit is opened, so a fresh
  // instance — and fresh state — is the natural result.
  const [draft, setDraft] = useState(() =>
    evacuation
      ? { startTime: evacuation.startTime, eta: evacuation.eta, concludedAt: evacuation.concludedAt }
      : null,
  );
  const [status, setStatus] = useState("idle"); // 'idle' | 'saving' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (status !== "success") return undefined;
    const timeoutId = setTimeout(onClose, 1000);
    return () => clearTimeout(timeoutId);
  }, [status, onClose]);

  if (!draft) return null;

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const validationError = validateOrdering(draft);
    if (validationError) {
      setStatus("error");
      setErrorMessage(validationError);
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    try {
      // Every field explicitly included, even where null — this is a
      // deliberate partial update of exactly these three fields, so a
      // cleared field must reach the server as `null`, not be silently
      // dropped the way spreading a draft that omits it would.
      await onSave(evacuation.id, {
        startTime: draft.startTime ?? null,
        eta: draft.eta ?? null,
        concludedAt: draft.concludedAt ?? null,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(typeof err === "string" ? err : "שמירת השינויים נכשלה");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="28rem"
      centered
      radius="sm"
      title={
        <Group gap="sm">
          <Text fz="lg" fw={700} c="var(--app-color-text)">
            עריכת זמנים
          </Text>
          {evacuation?.forceRadioSign && (
            <Text fz="sm" c="var(--app-color-text-muted)" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
              {evacuation.forceRadioSign}
            </Text>
          )}
        </Group>
      }
      styles={{
        content: { backgroundColor: "var(--app-color-surface)" },
        header: { backgroundColor: "var(--app-color-surface)" },
      }}
    >
      {status === "success" && (
        <Alert
          icon={<IconCheck size={18} />}
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-success) 14%, transparent)",
              borderInlineStart: "3px solid var(--app-color-success)",
              marginBottom: "var(--mantine-spacing-md)",
            },
            body: { color: "var(--app-color-success)" },
          }}
        >
          נשמר בהצלחה
        </Alert>
      )}

      {status === "error" && (
        <Alert
          icon={<IconAlertTriangle size={18} />}
          title="שמירת השינויים נכשלה"
          withCloseButton
          onClose={() => setStatus("idle")}
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
              borderInlineStart: "3px solid var(--app-color-error)",
              marginBottom: "var(--mantine-spacing-md)",
            },
            title: { color: "var(--app-color-error)" },
            body: { color: "var(--app-color-text)" },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Stack gap="md">
        <TextInput
          label="שעת יציאה"
          type="datetime-local"
          styles={inputStyles}
          value={toLocalInputValue(draft.startTime)}
          onChange={(e) => updateDraft("startTime", fromLocalInputValue(e.currentTarget.value))}
        />
        <TextInput
          label="ETA"
          type="datetime-local"
          styles={inputStyles}
          min={toLocalInputValue(draft.startTime) || undefined}
          value={toLocalInputValue(draft.eta)}
          onChange={(e) => updateDraft("eta", fromLocalInputValue(e.currentTarget.value))}
        />
        <TextInput
          label="זמן סיום"
          type="datetime-local"
          styles={inputStyles}
          min={toLocalInputValue(draft.startTime) || undefined}
          value={toLocalInputValue(draft.concludedAt)}
          onChange={(e) => updateDraft("concludedAt", fromLocalInputValue(e.currentTarget.value))}
        />
      </Stack>

      <Group justify="flex-end" gap="sm" mt="lg">
        <Button variant="default" onClick={onClose}>
          ביטול
        </Button>
        <Button
          loading={status === "saving"}
          onClick={handleSave}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            },
          }}
        >
          שמור
        </Button>
      </Group>
    </Modal>
  );
};

export default EditEvacuationModal;
