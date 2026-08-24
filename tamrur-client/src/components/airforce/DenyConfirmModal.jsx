// React

// External libraries
import { Button, Group, Modal, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

// Internal application modules

// Styles

/**
 * The app's one "irreversible action" confirm-modal template (already used
 * twice for closing a brigade event — `EventQueueBoard.jsx`,
 * `EventDashboardView.jsx`), reused here for denying an aerial-evac request:
 * warning-triangle title, muted body ending "הפעולה סופית ולא ניתנת לביטול",
 * ביטול/דחה buttons. Purely presentational — the caller supplies `onConfirm`
 * already bound to its own decision-dispatch logic, so this same component
 * works whether it's opened from an inline "דחה" click (`AerialEvacDecisionFooter`)
 * or from dragging a card onto the kanban board's denied column.
 *
 * @param {{
 *   opened: boolean,
 *   eventName: string,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 *   isSubmitting: boolean,
 * }} props
 * @returns {JSX.Element} The confirmation modal.
 */
const DenyConfirmModal = ({ opened, eventName, onCancel, onConfirm, isSubmitting }) => (
  <Modal
    opened={opened}
    onClose={onCancel}
    centered
    radius="sm"
    title={
      <Group gap="xs" wrap="nowrap">
        <IconAlertTriangle size={22} stroke={1.8} color="var(--app-color-warning)" />
        <Text fw={700} fz="lg" c="var(--app-color-text)">
          דחיית פינוי אווירי
        </Text>
      </Group>
    }
    styles={{
      content: {
        border: "1px solid color-mix(in srgb, var(--app-color-warning) 40%, transparent)",
        backgroundColor: "var(--app-color-surface)",
      },
      header: { backgroundColor: "var(--app-color-surface)" },
    }}
  >
    <Text fz="sm" c="var(--app-color-text-muted)" mb="lg">
      {`האם אתה בטוח שברצונך לדחות את פינוי האוויר של "${eventName}"? הפעולה סופית ולא ניתנת לביטול.`}
    </Text>
    <Group justify="flex-end" gap="sm">
      <Button variant="default" disabled={isSubmitting} onClick={onCancel}>
        ביטול
      </Button>
      <Button
        loading={isSubmitting}
        styles={{ root: { backgroundColor: "var(--app-color-warning)", color: "#FFFFFF" } }}
        onClick={onConfirm}
      >
        דחה פינוי
      </Button>
    </Group>
  </Modal>
);

export default DenyConfirmModal;
