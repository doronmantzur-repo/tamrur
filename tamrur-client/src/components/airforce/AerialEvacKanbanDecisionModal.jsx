// React

// External libraries
import { Button, Group, Modal, Text } from "@mantine/core";
import { IconCheck, IconHelicopter } from "@tabler/icons-react";

// Internal application modules
import DenyConfirmModal from "./DenyConfirmModal";
import { RadioSignInput } from "./AerialEvacDecisionFooter";
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

/**
 * The modal opened by dropping a pending kanban card onto the approved or
 * denied column — mounted only while a drop is pending (see the board),
 * so this is the only place `useAerialEvacDecision` runs for whichever
 * event is actually being decided. Nothing about the card moves until the
 * decision here actually succeeds; canceling leaves it exactly where it was.
 *
 * @param {{ event: object, mission: object | undefined, target: "approved" | "denied", onClose: () => void }} props
 * @returns {JSX.Element} The decision modal.
 */
const AerialEvacKanbanDecisionModal = ({ event, mission, target, onClose }) => {
  const { radioSign, setRadioSign, pendingAction, handleDecision } = useAerialEvacDecision(event, mission);
  const isSubmitting = pendingAction !== null;

  if (target === "denied") {
    return (
      <DenyConfirmModal
        opened
        eventName={event.name || "אירוע ללא שם"}
        onCancel={onClose}
        onConfirm={() => handleDecision("denied").then(onClose)}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      radius="sm"
      title={
        <Group gap="xs" wrap="nowrap">
          <IconHelicopter size={22} stroke={1.8} color="var(--app-color-success)" />
          <Text fw={700} fz="lg" c="var(--app-color-text)">
            {`אישור פינוי אווירי — ${event.name || "אירוע ללא שם"}`}
          </Text>
        </Group>
      }
      styles={{
        content: { backgroundColor: "var(--app-color-surface)" },
        header: { backgroundColor: "var(--app-color-surface)" },
      }}
    >
      <RadioSignInput id={`kanban-radio-sign-${event.id}`} value={radioSign} onChange={(evt) => setRadioSign(evt.target.value)} />

      <Text fz="xs" c="var(--app-color-text-muted)" mt="sm">
        לאחר האישור לא ניתן לשנות את ההחלטה.
      </Text>

      <Group justify="flex-end" gap="sm" mt="lg">
        <Button variant="default" disabled={isSubmitting} onClick={onClose}>
          ביטול
        </Button>
        <Button
          leftSection={<IconCheck size={18} stroke={1.8} />}
          disabled={!radioSign.trim()}
          loading={isSubmitting}
          styles={approveButtonStyles}
          onClick={() => handleDecision("approved").then(onClose)}
        >
          אשר פינוי
        </Button>
      </Group>
    </Modal>
  );
};

export default AerialEvacKanbanDecisionModal;
