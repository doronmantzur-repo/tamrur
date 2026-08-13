// React
import { useState } from "react";

// External libraries
import { ActionIcon, Group, Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { CASUALTY_FIELDS, draftToFields, emptyDraft, renderDraftInput } from "./casualtyFields";
import { createCasualty } from "../../features/casualties/casualtiesSlice";

// Styles

/**
 * Renders the form for adding a casualty.
 *
 * A new casualty has no id yet, so its fields can't save themselves the way a
 * saved row's cells do — they bind to one draft and are written together by the
 * save button. Every field is offered regardless of layout tier, so nothing is
 * silently left unset at creation.
 *
 * The table embeds this inside a full-width row and the phone layout embeds it
 * in a card, so the two can't drift apart.
 *
 * @param {{ eventId: string, onDone: () => void }} props
 * @returns {JSX.Element} The new-casualty form.
 */
const NewCasualtyForm = ({ eventId, onDone }) => {
  const dispatch = useDispatch();
  const isSaving = useSelector((state) => state.casualties.saveStatus === "loading");

  // מס' פצוע counts on from the highest number already on this event, so the
  // first casualty logged is 1. Shown up front rather than only appearing after
  // the save, and still editable. Clearing it hands the decision back to the
  // server, which runs the same count inside the insert.
  const nextCasualtyNumber = useSelector((state) =>
    (state.casualties.byEventId[eventId] || []).reduce(
      (highest, casualty) => Math.max(highest, Number(casualty["casualty-number"]) || 0),
      0,
    ) + 1,
  );

  const [draft, setDraft] = useState(() => ({
    ...emptyDraft(),
    "casualty-number": nextCasualtyNumber,
  }));
  const [error, setError] = useState(null);

  /**
   * Updates one draft field.
   *
   * @param {string} key
   * @param {unknown} value
   * @returns {void}
   */
  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  /**
   * Creates the casualty from the draft.
   *
   * @returns {void}
   */
  function save() {
    const missing = CASUALTY_FIELDS.find((field) => field.required && !draft[field.key]);
    if (missing) {
      setError(`יש לבחור ${missing.header}`);
      return;
    }

    dispatch(createCasualty({ eventId, fields: draftToFields(draft) }))
      .unwrap()
      .then(() => onDone())
      .catch((reason) => setError(reason ?? "יצירת הנפגע נכשלה"));
  }

  return (
    <Stack gap="sm">
      <Text fz="sm" fw={700} c="var(--app-color-text)">
        נפגע חדש
      </Text>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
        {CASUALTY_FIELDS.map((field) => (
          <Stack key={field.key} gap={2}>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {field.header}
            </Text>
            {renderDraftInput(
              field,
              draft[field.key],
              (value) => setField(field.key, value),
              Boolean(error) && field.required && !draft[field.key],
            )}
          </Stack>
        ))}
      </SimpleGrid>

      <Group gap="sm" justify="flex-end">
        {error && (
          <Text fz="sm" c="var(--app-color-error)">
            {error}
          </Text>
        )}
        {isSaving ? (
          <Loader size={20} color="var(--app-color-primary)" />
        ) : (
          <ActionIcon aria-label="שמור נפגע" title="שמור נפגע" variant="subtle" onClick={save}>
            <IconDeviceFloppy size={20} color="var(--app-color-primary)" />
          </ActionIcon>
        )}
        <ActionIcon aria-label="ביטול" title="ביטול" variant="subtle" onClick={onDone}>
          <IconX size={20} color="var(--app-color-text-muted)" />
        </ActionIcon>
      </Group>
    </Stack>
  );
};

export default NewCasualtyForm;
