// React
import { useMemo, useState } from "react";

// External libraries
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
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
import { DOSE_UNIT_OPTIONS, formatDose, ROUTE_OPTIONS } from "../../constants/drugs";
import { deleteDrug, insertDrug, updateDrug } from "../../features/drugs/drugsSlice";
import { nowIso } from "../../utils/datetime";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

/** A blank entry, stamped with the current time so the medic rarely has to touch it. */
function emptyDraft() {
  return { id: null, drugName: "", doseAmount: "", doseUnit: "mg", route: "IV", administeredAt: nowIso() };
}

/**
 * Renders one casualty's medication log and the form for recording a new dose.
 *
 * `view` splits the two halves apart: "form" renders only the entry form (the
 * record modal), "history" renders only the log plus, while an existing entry is
 * being edited, the form to edit it (the table's expanded sub-row). Omitting it
 * renders both.
 *
 * @param {{ eventId: string, casualtyId: string, view?: "form" | "history" }} props
 * @returns {JSX.Element} The drugs section.
 */
const DrugsSection = ({ eventId, casualtyId, view }) => {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const eventDrugs = useSelector((state) => state.drugs.byEventId[eventId]);
  const { saveStatus, saveError } = useSelector((state) => state.drugs);

  const drugs = useMemo(
    () => (eventDrugs || []).filter((record) => record.casualty_id === casualtyId),
    [eventDrugs, casualtyId],
  );

  const isSaving = saveStatus === "loading";
  const isEditing = draft.id !== null;

  /**
   * Validates the draft entry.
   *
   * @returns {Record<string, string>} Field name -> Hebrew error message.
   */
  function validate() {
    const nextErrors = {};

    if (!draft.drugName.trim()) nextErrors.drugName = "יש להזין שם תרופה";

    if (draft.doseAmount === "" || draft.doseAmount === null) {
      nextErrors.doseAmount = "יש להזין מינון";
    } else if (typeof draft.doseAmount !== "number" || draft.doseAmount <= 0) {
      nextErrors.doseAmount = "מינון חייב להיות מספר גדול מאפס";
    }

    if (!draft.doseUnit) nextErrors.doseUnit = "יש לבחור יחידה";
    if (!draft.route) nextErrors.route = "יש לבחור דרך מתן";
    if (!draft.administeredAt) nextErrors.administeredAt = "יש להזין זמן מתן";

    return nextErrors;
  }

  /**
   * Saves the draft — recording a dose, or updating the one being edited.
   *
   * @returns {void}
   */
  function handleSave() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const fields = {
      drugName: draft.drugName.trim(),
      doseAmount: draft.doseAmount,
      doseUnit: draft.doseUnit,
      route: draft.route,
      administeredAt: draft.administeredAt,
    };

    const action = isEditing
      ? updateDrug({ id: draft.id, ...fields })
      : insertDrug({ eventId, casualtyId, ...fields });

    dispatch(action)
      .unwrap()
      .then(() => {
        setDraft(emptyDraft());
        setErrors({});
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 3000);
      })
      // The rejection is already in state.drugs.saveError and rendered above —
      // swallow it here so it doesn't surface as an unhandled rejection.
      .catch(() => {});
  }

  /**
   * Loads an existing entry into the form for editing.
   *
   * @param {Object} record - The drug row to edit.
   * @returns {void}
   */
  function handleEdit(record) {
    setDraft({
      id: record.id,
      drugName: record.drug_name ?? "",
      // `numeric` arrives from Postgres as a string.
      doseAmount: record.dose_amount === null ? "" : Number(record.dose_amount),
      doseUnit: record.dose_unit ?? "mg",
      route: record.route ?? "IV",
      administeredAt: record.administered_at ?? nowIso(),
    });
    setErrors({});
    setPendingDeleteId(null);
  }

  /**
   * Deletes an entry, clearing the form first if that entry was being edited.
   *
   * @param {string} recordId
   * @returns {void}
   */
  function handleDelete(recordId) {
    dispatch(deleteDrug({ id: recordId }))
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
          title="שמירת התרופה נכשלה"
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

      {justSaved && (
        <Alert
          icon={<IconCheck size={18} />}
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-success) 12%, transparent)",
              borderInlineStart: "3px solid var(--app-color-success)",
            },
            body: { color: "var(--app-color-text)" },
          }}
        >
          התרופה נרשמה
        </Alert>
      )}

      {view !== "form" && (
        <Box style={{ overflowX: "auto" }}>
          <Table verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={150}>זמן מתן</Table.Th>
                <Table.Th>שם תרופה</Table.Th>
                <Table.Th w={110}>מינון</Table.Th>
                <Table.Th w={90}>דרך מתן</Table.Th>
                <Table.Th w={110}>פעולות</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {drugs.map((record) => (
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
                    {record.administered_at
                      ? timeFormatter.format(new Date(record.administered_at))
                      : "—"}
                  </Table.Td>
                  <Table.Td>{record.drug_name || "—"}</Table.Td>
                  <Table.Td ff={MONO_FONT}>
                    {formatDose(record.dose_amount, record.dose_unit)}
                  </Table.Td>
                  <Table.Td ff={MONO_FONT}>{record.route || "—"}</Table.Td>
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
                          aria-label="עריכת תרופה"
                          title="עריכת תרופה"
                          variant="subtle"
                          onClick={() => handleEdit(record)}
                        >
                          <IconPencil size={16} color="var(--app-color-primary)" />
                        </ActionIcon>
                        <ActionIcon
                          aria-label="מחיקת תרופה"
                          title="מחיקת תרופה"
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
              {drugs.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} c="var(--app-color-text-muted)" ta="center">
                    לא נרשמו תרופות לנפגע זה
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
              {isEditing ? "עריכת תרופה" : "מתן תרופה"}
            </Text>

            <TextInput
              label="שם תרופה"
              placeholder="לדוגמה: מורפין"
              value={draft.drugName}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setDraft((current) => ({ ...current, drugName: value }));
              }}
              error={errors.drugName}
              required
              dir="rtl"
              styles={inputStyles}
            />

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <NumberInput
                label="מינון"
                placeholder="0"
                value={draft.doseAmount}
                onChange={(value) => setDraft((current) => ({ ...current, doseAmount: value }))}
                error={errors.doseAmount}
                min={0}
                step={0.5}
                decimalScale={3}
                required
                styles={inputStyles}
              />

              <Select
                label="יחידה"
                data={DOSE_UNIT_OPTIONS}
                value={draft.doseUnit}
                onChange={(value) => setDraft((current) => ({ ...current, doseUnit: value }))}
                error={errors.doseUnit}
                checkIconPosition="right"
                required
                dir="rtl"
                comboboxProps={{ shadow: "md", withinPortal: true }}
                styles={inputStyles}
              />

              <Select
                label="דרך מתן"
                data={ROUTE_OPTIONS}
                value={draft.route}
                onChange={(value) => setDraft((current) => ({ ...current, route: value }))}
                error={errors.route}
                checkIconPosition="right"
                required
                dir="rtl"
                comboboxProps={{ shadow: "md", withinPortal: true }}
                styles={inputStyles}
              />
            </SimpleGrid>

            <DateTimeInput
              label="זמן מתן"
              value={draft.administeredAt}
              onChange={(administeredAt) =>
                setDraft((current) => ({ ...current, administeredAt }))
              }
              error={errors.administeredAt}
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
                {isEditing ? "שמור שינויים" : "רשום תרופה"}
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default DrugsSection;
