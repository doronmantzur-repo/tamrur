// React

// External libraries
import { Modal } from "@mantine/core";

// Internal application modules
import CreateEventForm from "./CreateEventForm";

// Styles

/**
 * Wraps `CreateEventForm` in a modal, so opening a new event doesn't leave
 * whichever page triggered it (the queue board's "+" or the dashboard's own
 * "פתח אירוע" button). The modal's own surface is the card, so the form
 * renders `bare` — no nested `AuthFormCard` border/gold accent bar doubling
 * up on the modal's own chrome, and no separator between the modal's
 * header and the form beneath it, keeping it one visual surface rather
 * than the stacked-card look the dashboard's tables use. Its existing
 * navigate-to-the-new-event-dashboard behavior on success is otherwise
 * untouched. Mounted only while open, so a cancelled form doesn't linger
 * with stale input the next time it's opened.
 *
 * @param {{
 *   opened: boolean,
 *   onClose: () => void,
 *   onCreated?: (event: Object) => void,
 * }} props
 * @returns {JSX.Element} The create-event modal.
 */
const CreateEventModal = ({ opened, onClose, onCreated }) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="42rem"
      centered
      radius="sm"
      title="פתיחת אירוע חדש"
      styles={{
        content: { backgroundColor: "var(--app-color-surface)" },
        header: { backgroundColor: "var(--app-color-surface)" },
      }}
    >
      {opened && <CreateEventForm bare onCreated={onCreated} />}
    </Modal>
  );
};

export default CreateEventModal;
