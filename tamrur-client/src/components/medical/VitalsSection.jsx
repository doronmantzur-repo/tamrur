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
  SimpleGrid,
  Stack,
  Table,
  Text,
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
  BLOOD_PRESSURE_COLUMN,
  BLOOD_PRESSURE_LABELS,
  BLOOD_PRESSURE_RANGE,
  formatBloodPressure,
  VITALS_FIELDS,
} from "../../constants/vitals";
import { createVitals, deleteVitals, updateVitals } from "../../features/vitals/vitalsSlice";
import { nowIso } from "../../utils/datetime";

// Styles

const timeFormatter = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

/** A blank reading, stamped with the current time so the medic rarely has to touch it. */
function emptyDraft() {
  const values = VITALS_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {});
  return { id: null, recordedAt: nowIso(), values, systolic: "", diastolic: "" };
}

/**
 * Reads a numeric column off a vitals row.
 *
 * Postgres returns `numeric` columns as strings through the pg driver, so the
 * temperature fields arrive as text while the integer ones arrive as numbers.
 *
 * @param {unknown} value
 * @returns {number | ""} The number, or "" when the column is unset.
 */
function toNumberOrBlank(value) {
  if (value === null || value === undefined || value === "") return "";

  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

/**
 * Reads the blood-pressure JSON off a vitals row, tolerating a row that comes
 * back as a JSON string rather than a parsed object.
 *
 * @param {Object} record - A vitals row.
 * @returns {{systolic?: number, diastolic?: number} | null}
 */
function readBloodPressure(record) {
  const raw = record?.[BLOOD_PRESSURE_COLUMN];
  if (!raw) return null;

  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Renders one casualty's vitals log: the readings already saved, plus the form
 * for adding a new one or editing an existing one.
 *
 *
 * `view` splits the two halves apart: "form" renders only the new-reading form (the
 * record modal), "history" renders only the vitals log plus, while an existing
 * record is being edited, the form to edit it (the table's expanded sub-row).
 * Omitting it renders both, as before.
 *
 * @param {{ eventId: string, injuryId: string, view?: "form" | "history" }} props
 * @returns {JSX.Element} The vitals section.
 */
const VitalsSection = ({ eventId, injuryId, view }) => {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const eventVitals = useSelector((state) => state.vitals.byEventId[eventId]);
  const { saveStatus, saveError } = useSelector((state) => state.vitals);

  const vitals = useMemo(
    () => (eventVitals || []).filter((record) => record["injury-id"] === injuryId),
    [eventVitals, injuryId],
  );

  const isSaving = saveStatus === "loading";
  const isEditing = draft.id !== null;

  /**
   * Validates the draft reading: a timestamp, at least one measurement, and
   * every entered measurement inside its plausible range.
   *
   * @returns {Record<string, string>} Field name -> Hebrew error message.
   */
  function validate() {
    const nextErrors = {};

    if (!draft.recordedAt) {
      nextErrors.recordedAt = "יש להזין זמן רישום";
    }

    VITALS_FIELDS.forEach((field) => {
      const value = draft.values[field.key];
      if (value === "" || value === null) return;

      if (typeof value !== "number" || Number.isNaN(value)) {
        nextErrors[field.key] = "ערך לא תקין";
      } else if (value < field.min || value > field.max) {
        nextErrors[field.key] = `טווח תקין: ${field.min}–${field.max}`;
      }
    });

    ["systolic", "diastolic"].forEach((key) => {
      const value = draft[key];
      if (value === "" || value === null) return;

      if (typeof value !== "number" || Number.isNaN(value)) {
        nextErrors[key] = "ערך לא תקין";
      } else if (value < BLOOD_PRESSURE_RANGE.min || value > BLOOD_PRESSURE_RANGE.max) {
        nextErrors[key] = `טווח תקין: ${BLOOD_PRESSURE_RANGE.min}–${BLOOD_PRESSURE_RANGE.max}`;
      }
    });

    const hasMeasurement =
      VITALS_FIELDS.some((field) => draft.values[field.key] !== "") ||
      draft.systolic !== "" ||
      draft.diastolic !== "";

    if (!hasMeasurement) {
      nextErrors.form = "יש להזין לפחות מדד אחד";
    }

    return nextErrors;
  }

  /**
   * Collects the entered measurements into the server's request body shape.
   *
   * Blank fields are left out entirely rather than sent as null, because the
   * server COALESCEs every column — sending null would be indistinguishable
   * from "leave as-is" anyway.
   *
   * @returns {Object} The measurement fields to send.
   */
  function buildMeasurements() {
    const measurements = VITALS_FIELDS.reduce((acc, field) => {
      const value = draft.values[field.key];
      return value === "" ? acc : { ...acc, [field.key]: value };
    }, {});

    if (draft.systolic !== "" || draft.diastolic !== "") {
      measurements.bloodPressure = {
        systolic: draft.systolic === "" ? null : draft.systolic,
        diastolic: draft.diastolic === "" ? null : draft.diastolic,
      };
    }

    return measurements;
  }

  /**
   * Saves the draft — creating a reading, or updating the one being edited.
   *
   * @returns {void}
   */
  function handleSave() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const measurements = buildMeasurements();
    const action = isEditing
      ? updateVitals({ id: draft.id, recordedAt: draft.recordedAt, measurements })
      : createVitals({ eventId, injuryId, recordedAt: draft.recordedAt, measurements });

    dispatch(action)
      .unwrap()
      .then(() => {
        setDraft(emptyDraft());
        setErrors({});
      })
      // The rejection is already in state.vitals.saveError and rendered below —
      // swallow it here so it doesn't surface as an unhandled rejection.
      .catch(() => {});
  }

  /**
   * Loads an existing reading into the form for editing.
   *
   * @param {Object} record - The vitals row to edit.
   * @returns {void}
   */
  function handleEdit(record) {
    const bloodPressure = readBloodPressure(record);

    setDraft({
      id: record.id,
      recordedAt: record["recorded-at"] ?? nowIso(),
      values: VITALS_FIELDS.reduce(
        (acc, field) => ({ ...acc, [field.key]: toNumberOrBlank(record[field.column]) }),
        {},
      ),
      systolic: toNumberOrBlank(bloodPressure?.systolic),
      diastolic: toNumberOrBlank(bloodPressure?.diastolic),
    });
    setErrors({});
    setPendingDeleteId(null);
  }

  /**
   * Deletes a reading, clearing the form first if that reading was being edited.
   *
   * @param {string} recordId - Id of the vitals row to delete.
   * @returns {void}
   */
  function handleDelete(recordId) {
    dispatch(deleteVitals({ id: recordId }))
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
          title="שמירת המדדים נכשלה"
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
              <Table.Th>לחץ דם</Table.Th>
              {VITALS_FIELDS.map((field) => (
                <Table.Th key={field.key}>{field.label}</Table.Th>
              ))}
              <Table.Th w={110}>פעולות</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {vitals.map((record) => (
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
                <Table.Td ff={MONO_FONT}>{formatBloodPressure(readBloodPressure(record))}</Table.Td>
                {VITALS_FIELDS.map((field) => (
                  <Table.Td key={field.key} ff={MONO_FONT}>
                    {record[field.column] ?? "—"}
                  </Table.Td>
                ))}
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
                        aria-label="עריכת מדדים"
                        title="עריכת מדדים"
                        variant="subtle"
                        onClick={() => handleEdit(record)}
                      >
                        <IconPencil size={16} color="var(--app-color-primary)" />
                      </ActionIcon>
                      <ActionIcon
                        aria-label="מחיקת מדדים"
                        title="מחיקת מדדים"
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
            {vitals.length === 0 && (
              <Table.Tr>
                <Table.Td
                  colSpan={VITALS_FIELDS.length + 3}
                  c="var(--app-color-text-muted)"
                  ta="center"
                >
                  לא נרשמו מדדים לנפגע זה
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
            {isEditing ? "עריכת מדדים" : "מדידה חדשה"}
          </Text>

          <DateTimeInput
            value={draft.recordedAt}
            onChange={(recordedAt) => setDraft((current) => ({ ...current, recordedAt }))}
            error={errors.recordedAt}
          />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {["systolic", "diastolic"].map((key) => (
              <NumberInput
                key={key}
                label={`לחץ דם ${BLOOD_PRESSURE_LABELS[key]}`}
                placeholder="mmHg"
                value={draft[key]}
                onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))}
                error={errors[key]}
                min={BLOOD_PRESSURE_RANGE.min}
                max={BLOOD_PRESSURE_RANGE.max}
                decimalScale={0}
                clampBehavior="strict"
                styles={inputStyles}
              />
            ))}

            {VITALS_FIELDS.map((field) => (
              <NumberInput
                key={field.key}
                label={field.label}
                placeholder={field.unit}
                value={draft.values[field.key]}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    values: { ...current.values, [field.key]: value },
                  }))
                }
                error={errors[field.key]}
                min={field.min}
                max={field.max}
                decimalScale={field.decimalScale}
                clampBehavior="strict"
                styles={inputStyles}
              />
            ))}
          </SimpleGrid>

          {errors.form && (
            <Text fz="sm" c="var(--app-color-error)">
              {errors.form}
            </Text>
          )}

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
              {isEditing ? "שמור שינויים" : "הוסף מדידה"}
            </Button>
          </Group>
        </Stack>
      </Paper>
      )}
    </Stack>
  );
};

export default VitalsSection;