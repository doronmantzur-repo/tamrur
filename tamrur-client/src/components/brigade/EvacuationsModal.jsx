// React

// External libraries
import { Modal } from "@mantine/core";

// Internal application modules
import EvacuationsTable from "./EvacuationsTable";

// Styles

/**
 * Renders the full evacuations table in a modal.
 *
 * @param {{ opened: boolean, onClose: () => void, evacuations: Array<object> }} props
 * @returns {JSX.Element} The evacuations modal.
 */
const EvacuationsModal = ({ opened, onClose, evacuations }) => {
  return (
    <Modal opened={opened} onClose={onClose} size="xl" padding="lg">
      <EvacuationsTable evacuations={evacuations} />
    </Modal>
  );
};

export default EvacuationsModal;
