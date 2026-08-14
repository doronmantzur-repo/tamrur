// React
import { useState } from "react";

// External libraries
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
} from "@mantine/core";
import { IconAlertTriangle, IconDeviceFloppy, IconUserPlus } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import { inputStyles, primaryButtonStyles } from "./formStyles";
import {
  EVAC_ABILITY_OPTIONS,
  EVAC_DEST_OPTIONS,
  URGENCY_OPTIONS,
} from "../../constants/casualtyStatus";
import { createCasualty, updateCasualty } from "../../features/casualties/casualtiesSlice";

// Styles

/**
 * Seeds the form from an existing casualty, or blank for a new one.
 *
 * @param {Object | null} casualty - The casualty row being edited, or null.
 * @returns {Object} The form's field values.
 */
function toFormValues(casualty) {
  return {
    urgency: casualty?.urgency ?? null,
    evacAbility: casualty?.["evac-ability"] ?? null,
    evacPriority: casualty?.["evac-priority"] ?? "",
    evacDest: casualty?.["recommended-evac-dest"] ?? null,
    escort: casualty?.escort ?? false,
    evacReady: casualty?.["evac-ready"] ?? false,
  };
}

/**
 * Renders the casualty's own details — the `casualties` row.
 *
 * @param {{
 *   eventId: string,
 *   casualty: Object | null,
 *   onSaved: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The casualty details form.
 */
const CasualtyDetailsForm = ({ eventId, casualty, onSaved }) => {
  const dispatch = useDispatch();
  const [values, setValues] = useState(() => toFormValues(casualty));
  const [errors, setErrors] = useState({});

  const { saveStatus, saveError } = useSelector((state) => state.casualties);

  const isSaving = saveStatus === "loading";
  const isEditing = Boolean(casualty);

  /**
   * Updates one field and drops its validation error.
   *
   * @param {string} field - Field name.
   * @param {unknown} value - New value.
   * @returns {void}
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  /**
   * Validates the casualty's details.
   *
   * @returns {Record<string, string>} Field name -> Hebrew error message.
   */
  function validate() {
    const nextErrors = {};

    if (!values.urgency) {
      nextErrors.urgency = "יש לבחור דחיפות";
    }

    if (values.evacPriority !== "" && values.evacPriority !== null) {
      if (typeof values.evacPriority !== "number" || !Number.isInteger(values.evacPriority)) {
        nextErrors.evacPriority = "עדיפות חייבת להיות מספר שלם";
      } else if (values.evacPriority < 1) {
        nextErrors.evacPriority = "עדיפות מתחילה מ-1";
      }
    }

    return nextErrors;
  }

  /**
   * Builds the request body.
   *
   * The casualties controller destructures kebab-case keys, unlike the treatment
   * and vitals controllers which take camelCase — so the mapping happens here
   * rather than in the slice.
   *
   * @returns {Object} The fields to send.
   */
  function buildFields() {
    const fields = {
      urgency: values.urgency,
      escort: values.escort,
      "evac-ready": values.evacReady,
    };

    // Left out rather than sent as null: the server COALESCEs every column, so
    // null and "absent" mean the same thing to it.
    if (values.evacPriority !== "" && values.evacPriority !== null) {
      fields["evac-priority"] = values.evacPriority;
    }

    if (values.evacAbility) {
      fields["evac-ability"] = values.evacAbility;
    }

    if (values.evacDest) {
      fields["recommended-evac-dest"] = values.evacDest;
    }

    return fields;
  }

  /**
   * Saves the casualty, then hands the saved row back so the parent can unlock
   * the treatment and vitals tabs for a freshly created casualty.
   *
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const fields = buildFields();
    const action = isEditing
      ? updateCasualty({ id: casualty.id, fields })
      : createCasualty({ eventId, fields });

    dispatch(action)
      .unwrap()
      .then((saved) => onSaved(saved))
      // The rejection is already in state.casualties.saveError and rendered
      // above — swallow it here so it doesn't surface as an unhandled rejection.
      .catch(() => {});
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {saveError && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title="שמירת פרטי הנפגע נכשלה"
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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Select
            label="דחיפות"
            placeholder="בחר דחיפות"
            data={URGENCY_OPTIONS}
            value={values.urgency}
            onChange={(value) => setField("urgency", value)}
            error={errors.urgency}
            checkIconPosition="right"
            required
            dir="rtl"
            comboboxProps={{ shadow: "md" }}
            styles={inputStyles}
          />

          <Select
            label="יכולת פינוי"
            placeholder="בחר יכולת פינוי"
            data={EVAC_ABILITY_OPTIONS}
            value={values.evacAbility}
            onChange={(value) => setField("evacAbility", value)}
            checkIconPosition="right"
            clearable
            dir="rtl"
            comboboxProps={{ shadow: "md" }}
            styles={inputStyles}
          />

          <NumberInput
            label="עדיפות פינוי"
            placeholder="1 = ראשון לפינוי"
            value={values.evacPriority}
            onChange={(value) => setField("evacPriority", value)}
            error={errors.evacPriority}
            min={1}
            decimalScale={0}
            clampBehavior="strict"
            styles={inputStyles}
          />

          <Select
            label="יעד פינוי מומלץ"
            placeholder="בחר יעד"
            data={EVAC_DEST_OPTIONS}
            value={values.evacDest}
            onChange={(value) => setField("evacDest", value)}
            checkIconPosition="right"
            clearable
            dir="rtl"
            comboboxProps={{ shadow: "md" }}
            styles={inputStyles}
          />
        </SimpleGrid>

        <Group gap="xl" wrap="wrap">
          <Switch
            label="נדרש ליווי"
            checked={values.escort}
            onChange={(event) => setField("escort", event.currentTarget.checked)}
            color="var(--app-color-primary)"
            styles={{ label: { color: "var(--app-color-text)" } }}
          />

          <Switch
            label="מוכן לפינוי"
            checked={values.evacReady}
            onChange={(event) => setField("evacReady", event.currentTarget.checked)}
            color="var(--app-color-primary)"
            styles={{ label: { color: "var(--app-color-text)" } }}
          />
        </Group>

        <Group justify="flex-end">
          <Button
            type="submit"
            leftSection={
              isEditing ? <IconDeviceFloppy size={18} /> : <IconUserPlus size={18} stroke={1.8} />
            }
            loading={isSaving}
            styles={primaryButtonStyles}
          >
            {isEditing ? "שמור פרטי נפגע" : "צור נפגע"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default CasualtyDetailsForm;
