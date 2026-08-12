// React
import { useState } from "react";

// External libraries
import { Button, Modal, Select, Stack } from "@mantine/core";
import { IconHelicopterLanding, IconSend } from "@tabler/icons-react";

// Internal application modules

// Styles

const inputStyles = {
  label: {
    color: "var(--app-color-text-muted)",
    marginBottom: "0.25rem",
  },
  input: {
    minHeight: "3rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
    fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
    "&:focus": {
      borderWidth: "2px",
      borderColor: "var(--app-color-primary)",
    },
  },
};

/**
 * Renders the "request aerial evacuation" modal for the current event: pick
 * a landing pad as the destination and send. Everything else is implicit —
 * the method is always aerial (this button is specifically for aerial evac),
 * and the departure point is the event's own location.
 *
 * @param {{
 *   opened: boolean,
 *   onClose: () => void,
 *   onCreate: (evac: object) => void,
 *   event: object,
 *   landingPads: Array<object>,
 * }} props
 * @returns {JSX.Element} The request evacuation modal.
 */
const RequestEvacuationModal = ({ opened, onClose, onCreate, event, landingPads }) => {
  const [landingPadId, setLandingPadId] = useState(null);

  const padOptions = landingPads.map((pad) => ({ value: pad.id, label: pad.id }));

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();

    const pad = landingPads.find((candidate) => candidate.id === landingPadId);
    if (!pad) return;

    onCreate({
      id: `evac-${Date.now()}`,
      method: "chopper",
      departure: event.location,
      destination: pad.location,
      eta: null,
      missionId: null,
      radioSign: null,
      status: "needed",
      createdAt: new Date().toISOString(),
      injuryIds: [],
    });

    setLandingPadId(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="בקשת פינוי אווירי" size="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="משטח נחיתה"
            placeholder="בחר משטח נחיתה"
            data={padOptions}
            value={landingPadId}
            onChange={setLandingPadId}
            leftSection={<IconHelicopterLanding size={20} stroke={1.8} />}
            leftSectionPointerEvents="none"
            required
            dir="rtl"
            styles={inputStyles}
          />

          <Button
            type="submit"
            fullWidth
            leftSection={<IconSend size={20} stroke={1.8} />}
            mih="3rem"
            radius="sm"
            mt="xs"
            disabled={!landingPadId}
            styles={{
              root: {
                backgroundColor: "var(--app-color-primary)",
                color: "var(--app-color-primary-text)",
                "&:hover": {
                  backgroundColor: "var(--app-color-primary-hover)",
                },
              },
            }}
          >
            שלח בקשת פינוי
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default RequestEvacuationModal;
