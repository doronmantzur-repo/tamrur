// React
import { useMemo, useState } from "react";

// External libraries
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconDeviceFloppy,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import DateTimeInput from "./DateTimeInput";
import { inputStyles, MONO_FONT, primaryButtonStyles, secondaryButtonStyles } from "./formStyles";
import {
  createTreatment,
  deleteTreatment,
  updateTreatment,
} from "../../features/treatments/treatmentsSlice";
import { nowIso } from "../../utils/datetime";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

/** A blank record, stamped with the current time so the medic rarely has to touch it. */
function emptyDraft() {
  return { id: null, treatment: "", recordedAt: nowIso() };
}

/**
 * Renders one casualty's treatment log: the records already saved, plus the
 * form for adding a new one or editing an existing one.
 *
 *
 * `view` splits the two halves apart: "form" renders only the new-treatment form (the
 * record modal), "history" renders only the treatment log plus, while an existing
 * record is being edited, the form to edit it (the table's expanded sub-row).
 * Omitting it renders both, as before.
 *
 * @param {{ eventId: string, injuryId: string, view?: "form" | "history" }} props
 * @returns {JSX.Element} The treatments section.
 */
const TreatmentsSection = ({ eventId, injuryId, view }) => {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const eventTreatments = useSelector((state) => state.treatments.byEventId[eventId]);
  const { saveStatus, saveError } = useSelector((state) => state.treatments);

  const treatments = useMemo(
    () => (eventTreatments || []).filter((record) => record["injury-id"] === injuryId),
    [eventTreatments, injuryId],
  );

  const isSaving = saveStatus === "loading";
  const isEditing = draft.id !== null;

  /**
   * Validates the draft record.
   *
   * @returns {Record<string, string>} Field name -> Hebrew error message.
   */
  function validate() {
    const nextErrors = {};

    if (!draft.treatment.trim()) {
      nextErrors.treatment = "יש להזין תיאור טיפול";
    }

    if (!draft.recordedAt) {
      nextErrors.recordedAt = "יש להזין זמן רישום";
    }

    return nextErrors;
  }

  /**
   * Saves the draft — creating a record, or updating the one being edited.
   *
   * @returns {void}
   */
  function handleSave() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const action = isEditing
      ? updateTreatment({
          id: draft.id,
          treatment: draft.treatment.trim(),
          recordedAt: draft.recordedAt,
        })
      : createTreatment({
          eventId,
          injuryId,
          treatment: draft.treatment.trim(),
          recordedAt: draft.recordedAt,
        });

    dispatch(action)
      .unwrap()
      .then(() => {
        setDraft(emptyDraft());
        setErrors({});
      })
      // The rejection is already in state.treatments.saveError and rendered
      // below — swallow it here so it doesn't surface as an unhandled rejection.
      .catch(() => {});
  }

  /**
   * Loads an existing record into the form for editing.
   *
   * @param {Object} record - The treatment row to edit.
   * @returns {void}
   */
  function handleEdit(record) {
    setDraft({
      id: record.id,
      treatment: record.treatment ?? "",
      recordedAt: record["recorded-at"] ?? nowIso(),
    });
    setErrors({});
    setPendingDeleteId(null);
  }

  /**
   * Deletes a record, clearing the form first if that record was being edited.
   *
   * @param {string} recordId - Id of the treatment row to delete.
   * @returns {void}
   */
  function handleDelete(recordId) {
    dispatch(deleteTreatment({ id: recordId }))
      .unwrap()
      .then(() => {
        setPendingDeleteId(null);
        if (draft.id === recordId) {
          setDraft(emptyDraft());
          setErrors({});
        }
      })
      .catch(() => setPendingDeleteId(null));
  }

  return (
    <Stack gap="md">
      {saveError && (
        <Alert
          icon={<IconAlertTriangle size={18} />}
          title="שמירת הטיפול נכשלה"
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
              borderInlineStart: "3px solid var(--app-color-error)",
            },
            title: { color: "var(--app-color-error)" },
            body: { color: "var(--app-color-text)" },
          }}
        >
          {saveError}
        </Alert>
      )}

      {view !== "form" && (
      <Box style={{ overflowX: "auto" }}>
        <Table verticalSpacing="sm" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={150}>זמן</Table.Th>
              <Table.Th>טיפול</Table.Th>
              <Table.Th w={110}>פעולות</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {treatments.map((record) => (
              <Table.Tr
                key={record.id}
                style={{
                  backgroundColor:
                    draft.id === record.id
                      ? "color-mix(in srgb, var(--app-color-primary) 12%, transparent)"
                      : undefined,
                }}
              >
                <Table.Td c="var(--app-color-text-muted)" ff={MONO_FONT}>
                  {record["recorded-at"]
                    ? timeFormatter.format(new Date(record["recorded-at"]))
                    : "—"}
                </Table.Td>
                <Table.Td style={{ whiteSpace: "pre-wrap" }}>{record.treatment || "—"}</Table.Td>
                <Table.Td>
                  {pendingDeleteId === record.id ? (
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        aria-label="אישור מחיקה"
                        title="אישור מחיקה"
                        variant="subtle"
                        color="red"
                        loading={isSaving}
                        onClick={() => handleDelete(record.id)}
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                      <ActionIcon
                        aria-label="ביטול מחיקה"
                        title="ביטול מחיקה"
                        variant="subtle"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        <IconX size={16} color="var(--app-color-text-muted)" />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        aria-label="עריכת טיפול"
                        title="עריכת טיפול"
                        variant="subtle"
                        onClick={() => handleEdit(record)}
                      >
                        <IconPencil size={16} color="var(--app-color-primary)" />
                      </ActionIcon>
                      <ActionIcon
                        aria-label="מחיקת טיפול"
                        title="מחיקת טיפול"
                        variant="subtle"
                        onClick={() => setPendingDeleteId(record.id)}
                      >
                        <IconTrash size={16} color="var(--app-color-error)" />
                      </ActionIcon>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {treatments.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} c="var(--app-color-text-muted)" ta="center">
                  לא נרשמו טיפולים לנפגע זה
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
      )}

      {(view !== "history" || isEditing) && (
      <Paper
        p="md"
        withBorder
        radius="sm"
        style={{
          backgroundColor: "var(--app-color-surface-high)",
          borderColor: "var(--app-color-border)",
        }}
      >
        <Stack gap="sm">
          <Text fz="sm" fw={700} c="var(--app-color-text)">
            {isEditing ? "עריכת טיפול" : "טיפול חדש"}
          </Text>

          <DateTimeInput
            value={draft.recordedAt}
            onChange={(recordedAt) => setDraft((current) => ({ ...current, recordedAt }))}
            error={errors.recordedAt}
          />

          <Textarea
            label="תיאור הטיפול"
            placeholder="לדוגמה: חסם עורקים לירך שמאל"
            value={draft.treatment}
            // Read the value before the updater runs: React invokes a functional
            // setState callback during the following render, by which point the
            // synthetic event's currentTarget has been nulled — reading it in
            // there threw and took the whole page down.
            onChange={(event) => {
              const { value } = event.currentTarget;
              setDraft((current) => ({ ...current, treatment: value }));
            }}
            error={errors.treatment}
            autosize
            minRows={2}
            required
            dir="rtl"
            styles={inputStyles}
          />

          <Group gap="sm" justify="flex-end">
            {isEditing && (
              <Button
                variant="default"
                onClick={() => {
                  setDraft(emptyDraft());
                  setErrors({});
                }}
                styles={secondaryButtonStyles}
              >
                ביטול
              </Button>
            )}
            <Button
              leftSection={
                isEditing ? <IconDeviceFloppy size={18} /> : <IconPlus size={18} stroke={2.2} />
              }
              loading={isSaving}
              onClick={handleSave}
              styles={primaryButtonStyles}
            >
              {isEditing ? "שמור שינויים" : "הוסף טיפול"}
            </Button>
          </Group>
        </Stack>
      </Paper>
      )}
    </Stack>
  );
};

export default TreatmentsSection;