// React
import { useEffect, useState } from "react";

// External libraries
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

// Internal application modules
import LocationPicker from "./LocationPicker";
import { findLocationByPoint } from "../../utils/geo";

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
 * Edits an evacuation's three timing fields (start time, ETA, concluded
 * time), plus departure and destination for ride and aerial evacuations —
 * method, radio sign, aerial mission, and status are all set through other
 * flows (the aerial mission approval, the start-now/finish-evacuation quick
 * actions) and aren't meant to be hand-edited here, per team decision.
 * Departure/destination are the exception: per later team agreement, the
 * brigade should have full control over an evacuation's locations after
 * creation too, not just at request time — so both are editable here via
 * the same type-then-location picker used at ride-creation time
 * (LocationPicker), for aerial evacuations too even though those are
 * created with raw lat/lng instead (AerialEvacuationForm) — walk
 * evacuations don't get this, having no location flow of their own to begin
 * with. An aerial evacuation's stored point is often not a `locations`
 * match at all (arbitrary GPS, not list-based like ride almost always is),
 * so opening this modal on one will often show the picker as unset even
 * though a real coordinate is already stored — left untouched, that
 * coordinate is preserved on save rather than overwritten (see the
 * touched-check in handleSave). Clearing departure back to "no location
 * chosen" falls back to `eventLocation` rather than `null` for both
 * methods, mirroring how a ride's departure defaults to the event's own
 * location at creation time (see RequestRideEvacuationModal) — leaving it
 * empty isn't a real state for departure the way it is for destination.
 * Explicitly clearing a timing field (deleting its value) and saving sends
 * that field as `null` rather than omitting it, so the server can tell
 * "clear this" apart from "leave it alone" — see `update_evacuation` in
 * `evacuationsModel.js`, which used to COALESCE every field against its old
 * value regardless, making a clear indistinguishable from a no-op.
 * ETA/concluded time can't be set earlier than start time (see
 * `validateOrdering`) — enforced here, not for the start-now/finish-
 * evacuation quick actions, since those stamp the actual current moment
 * rather than a hand-picked time and shouldn't be rejected for an earlier
 * ETA estimate turning out wrong.
 *
 * @param {{
 *   evacuation: object | null,
 *   locations: Array<object>,
 *   eventLocation: object | null | undefined,
 *   opened: boolean,
 *   onClose: () => void,
 *   onSave: (evacId: string, changes: object) => Promise<unknown>,
 * }} props
 * @returns {JSX.Element} The evacuation edit modal.
 */
const EditEvacuationModal = ({ evacuation, locations, eventLocation, opened, onClose, onSave }) => {
  // Lazy initializer, not a reset-on-open effect: the parent remounts this
  // component (via a `key` that changes every time the modal opens — see
  // EvacuationsTable.jsx) whenever a row's edit is opened, so a fresh
  // instance — and fresh state — is the natural result.
  const [draft, setDraft] = useState(() =>
    evacuation
      ? {
          startTime: evacuation.startTime,
          eta: evacuation.eta,
          concludedAt: evacuation.concludedAt,
          departureId: findLocationByPoint(evacuation.departurePoint, locations)?.id || null,
          destinationId: findLocationByPoint(evacuation.destinationPoint, locations)?.id || null,
        }
      : null,
  );
  // Its own lazy-initialized state, never updated after mount — a frozen
  // snapshot of the draft as it was when the modal opened, for `isDirty` to
  // compare against. (A ref would work too, but reading `.current` during
  // render is disallowed; state that's simply never re-set serves the same
  // purpose safely.)
  const [initialDraft] = useState(draft);
  const [status, setStatus] = useState("idle"); // 'idle' | 'saving' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (status !== "success") return undefined;
    const timeoutId = setTimeout(onClose, 1000);
    return () => clearTimeout(timeoutId);
  }, [status, onClose]);

  if (!draft) return null;

  // Walk evacuations don't get location editing — they have no location
  // flow of their own to seed a picker from, unlike ride (list-based) and
  // aerial (raw lat/lng, but still often resolvable to a known location).
  const editsLocations = evacuation?.method === "ride" || evacuation?.method === "aerial";

  const isDirty =
    draft.startTime !== initialDraft.startTime ||
    draft.eta !== initialDraft.eta ||
    draft.concludedAt !== initialDraft.concludedAt ||
    draft.departureId !== initialDraft.departureId ||
    draft.destinationId !== initialDraft.destinationId;

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
      // deliberate partial update of exactly these fields, so a cleared
      // field must reach the server as `null`, not be silently dropped the
      // way spreading a draft that omits it would.
      const changes = {
        startTime: draft.startTime ?? null,
        eta: draft.eta ?? null,
        concludedAt: draft.concludedAt ?? null,
      };
      if (editsLocations) {
        // Only sent when actually touched, unlike the timing fields above —
        // a ride or aerial evacuation's departure is often not a matched
        // `locations` entry unless someone has already re-picked it here
        // (ride starts as the event's own raw coordinates, aerial as the
        // responding force's — see LocationPicker/describeDeparturePoint),
        // so unconditionally resolving draft.departureId would send
        // `departurePoint: null` and wipe out real, untouched coordinates on
        // every save that didn't touch this field.
        if (draft.departureId !== initialDraft.departureId) {
          // No location chosen isn't a real "cleared" state for departure —
          // it falls back to the event's own location, matching how a ride
          // evacuation's departure defaults at creation time.
          const departure = locations.find((location) => location.id === draft.departureId);
          changes.departurePoint = departure?.location || eventLocation || null;
        }
        if (draft.destinationId !== initialDraft.destinationId) {
          const destination = locations.find((location) => location.id === draft.destinationId);
          changes.destinationPoint = destination?.location || null;
        }
      }
      await onSave(evacuation.id, changes);
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
            {editsLocations ? "עריכת פינוי" : "עריכת זמנים"}
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
        {editsLocations && (
          <>
            <LocationPicker
              locations={locations}
              value={draft.departureId}
              onChange={(departureId) => updateDraft("departureId", departureId)}
              label="יציאה"
            />
            <LocationPicker
              locations={locations}
              value={draft.destinationId}
              onChange={(destinationId) => updateDraft("destinationId", destinationId)}
              label="יעד"
            />
          </>
        )}
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
          disabled={!isDirty}
          onClick={handleSave}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
              "&:disabled": {
                backgroundColor: "var(--app-color-surface-high)",
                color: "var(--app-color-text-muted)",
              },
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
