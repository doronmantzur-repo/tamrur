// React
import { useState } from "react";

// External libraries
import { Alert, Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

// Internal application modules
import LocationPicker from "./LocationPicker";

// Styles

const inputStyles = {
  input: {
    minHeight: "2.5rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
  },
};

/**
 * Creates a new ride ("רכב") evacuation for the event. Unlike an aerial
 * request — which just flags the event as needing one and waits for the
 * airforce to create a mission — a ride evacuation has no separate approval
 * step: requesting one directly creates the `evacuations` row. Only
 * destination and radio sign are collected here; departure defaults to the
 * event's own location (baked in by the caller, see EventDashboardPage's
 * handleCreateRideEvacuation), mirroring how aerial evacuations default
 * departure to the responding force's location. Start/ETA/concluded times
 * are deliberately left unset at creation — same starting shape as an
 * auto-created aerial evacuation — and get filled in later via
 * EditEvacuationModal once the ride is actually underway.
 *
 * Content only renders while `opened`, matching CreateEventModal's pattern,
 * so the modal shell still animates closed smoothly while the form itself
 * unmounts. Local state is reset explicitly on success and on cancel — a
 * plain remount-on-open isn't needed here the way EditEvacuationModal needs
 * it, since there's no specific existing record to seed from, just a blank
 * create form every time.
 *
 * @param {{
 *   locations: Array<object>,
 *   opened: boolean,
 *   onClose: () => void,
 *   onCreate: (fields: { destinationPoint: object, forceRadioSign: string }) => Promise<unknown>,
 * }} props
 * @returns {JSX.Element} The request-ride-evacuation modal.
 */
const RequestRideEvacuationModal = ({ locations, opened, onClose, onCreate }) => {
  const [destinationId, setDestinationId] = useState(null);
  const [forceRadioSign, setForceRadioSign] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'saving' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  const resetForm = () => {
    setDestinationId(null);
    setForceRadioSign("");
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!destinationId) {
      setStatus("error");
      setErrorMessage("יש לבחור יעד");
      return;
    }

    const destination = locations.find((location) => location.id === destinationId);

    setStatus("saving");
    setErrorMessage(null);

    try {
      await onCreate({ destinationPoint: destination?.location || null, forceRadioSign: forceRadioSign || null });
      setStatus("success");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(typeof err === "string" ? err : "יצירת הפינוי נכשלה");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="28rem"
      centered
      radius="sm"
      title="בקשת פינוי רכב"
      styles={{
        content: { backgroundColor: "var(--app-color-surface)" },
        header: { backgroundColor: "var(--app-color-surface)" },
      }}
    >
      {opened && (
        <>
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
              הפינוי נוצר בהצלחה
            </Alert>
          )}

          {status === "error" && (
            <Alert
              icon={<IconAlertTriangle size={18} />}
              title="יצירת הפינוי נכשלה"
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
            <LocationPicker locations={locations} value={destinationId} onChange={setDestinationId} label="יעד" />
            <TextInput
              label='או"ק'
              styles={inputStyles}
              value={forceRadioSign}
              onChange={(e) => setForceRadioSign(e.currentTarget.value)}
            />
          </Stack>

          <Group justify="flex-end" gap="sm" mt="lg">
            <Button variant="default" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              loading={status === "saving"}
              onClick={handleCreate}
              styles={{
                root: {
                  backgroundColor: "var(--app-color-primary)",
                  color: "var(--app-color-primary-text)",
                  "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
                },
              }}
            >
              בקש פינוי
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
};

export default RequestRideEvacuationModal;
