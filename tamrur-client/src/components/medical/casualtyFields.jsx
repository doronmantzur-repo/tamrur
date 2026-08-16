// React

// External libraries
import { Badge, Checkbox, NumberInput, Select, Textarea } from "@mantine/core";

// Internal application modules
import {
  NumberCell,
  SelectCell,
  TextCell,
  ToggleCell,
  TreatmentsCell,
  TreatmentsEditor,
} from "./casualtyCells";
import { cellInputStyles, cellTextStyles } from "./formStyles";
import {
  ESCORT_TYPE_LABELS,
  ESCORT_TYPE_OPTIONS,
  EVAC_ABILITY_LABELS,
  EVAC_ABILITY_OPTIONS,
  URGENCY_LABELS,
  URGENCY_NONE_PLACEHOLDER,
  URGENCY_OPTIONS,
  urgencyBadgeColors,
  urgencyLabel,
  VENTILATION_LABELS,
  VENTILATION_OPTIONS,
} from "../../constants/casualtyStatus";

// Styles

/**
 * The paper form's four column groups, in right-to-left reading order.
 * @type {Array<{key: string, label: string}>}
 */
export const FIELD_GROUPS = [
  { key: "collect", label: "איסוף פצועים" },
  { key: "triage", label: "טריאז'" },
  { key: "summary", label: "סיכום טריאז'" },
  { key: "evac", label: "דגשים לפינוי" },
];

/**
 * Renders the urgency value as the app's colored triage badge.
 *
 * @param {string | null} value
 * @returns {JSX.Element} The badge.
 */
function renderUrgencyBadge(value) {
  return (
    <Badge
      styles={{
        root: {
          ...urgencyBadgeColors(value),
          // Mantine caps a Badge at 100% of its container and ellipsises the
          // overflow, which inside a fixed-layout table cell clipped "לא דחוף"
          // to "לא ...". The column is sized for the longest label, so let the
          // badge size to its own content instead.
          maxWidth: "none",
          whiteSpace: "nowrap",
        },
        label: {
          overflow: "visible",
          textOverflow: "clip",
          whiteSpace: "nowrap",
        },
      }}
    >
      {urgencyLabel(value)}
    </Badge>
  );
}

/**
 * Every editable casualty column, defined once.
 *
 * The table header, the group `colSpan`s, the `<colgroup>` widths, the table
 * rows, the tablet expansion panel, the phone card and the new-casualty form
 * are all generated from this list — so a column is added or reordered here and
 * nowhere else.
 *
 * `key` is the database column, passed straight through to the update route.
 * `core` marks the columns that survive on the narrow tablet layout; the rest
 * move into the expandable detail row.
 * `width` is the fixed pixel width used by `<colgroup>`; the one field with a
 * null width absorbs whatever space is left over.
 *
 * @type {Array<Object>}
 */
export const CASUALTY_FIELDS = [
  {
    key: "casualty-number",
    header: "מס' פצוע",
    short: "מס'",
    group: "collect",
    width: 48,
    core: true,
    cell: "number",
  },
  {
    key: "description",
    header: "פציעות",
    short: "פציעות",
    group: "triage",
    width: null, // absorbs the remaining width
    core: true,
    cell: "text",
    placeholder: "ממצאים ומדדים",
  },
  {
    key: "treatments",
    header: "טיפולים",
    group: "triage",
    width: 120,
    core: false,
    cell: "treatments",
  },
  {
    key: "urgency",
    header: "דחיפות",
    short: "דחיפות",
    group: "summary",
    width: 96,
    core: true,
    cell: "select",
    options: URGENCY_OPTIONS,
    labels: URGENCY_LABELS,
    // Optional: a casualty can be recorded before anyone has triaged them, so
    // this clears back to "not yet triaged" like any other select.
    placeholder: URGENCY_NONE_PLACEHOLDER,
    renderValue: renderUrgencyBadge,
  },
  {
    key: "evac-priority",
    header: "קדימות לפינוי",
    short: "קד' פינוי",
    group: "summary",
    width: 52,
    core: true,
    cell: "number",
  },
  {
    key: "treatment-priority",
    header: "קדימות לטיפול",
    group: "summary",
    width: 52,
    core: false,
    cell: "number",
  },
  {
    key: "evac-ability",
    header: "יכולת פינוי",
    group: "evac",
    width: 70,
    core: false,
    cell: "select",
    options: EVAC_ABILITY_OPTIONS,
    labels: EVAC_ABILITY_LABELS,
  },
  {
    key: "ventilation",
    header: "מונשם",
    group: "evac",
    width: 84,
    core: false,
    cell: "select",
    options: VENTILATION_OPTIONS,
    labels: VENTILATION_LABELS,
  },
  {
    key: "escort-type",
    header: "ליווי",
    group: "evac",
    width: 56,
    core: false,
    cell: "select",
    options: ESCORT_TYPE_OPTIONS,
    labels: ESCORT_TYPE_LABELS,
  },
  { key: "helivac", header: "מוסק", group: "evac", width: 48, core: false, cell: "toggle" },
  {
    key: "evac-ready",
    header: "מוכן לפינוי",
    short: "מוכן",
    group: "evac",
    width: 52,
    core: true,
    cell: "toggle",
  },
];

/** Width of the trailing actions column, which has no field descriptor. */
export const ACTIONS_WIDTH = 60;

/** Width of the tablet tier's disclosure-chevron column. */
export const EXPANDER_WIDTH = 44;

/**
 * Width of the evacuation checkbox column.
 *
 * `is_evacuated` deliberately has no field descriptor: it isn't one of the paper
 * form's four groups, it splits the table into two rather than being edited in
 * place, and it must stay outside the grouped header's colSpan arithmetic.
 */
export const EVACUATED_WIDTH = 56;

/**
 * The fields shown for a tier: everything on the full table, the `core` subset
 * on the narrow one.
 *
 * @param {"full" | "compact"} tier
 * @returns {Array<Object>} The visible field descriptors.
 */
export function visibleFields(tier) {
  return tier === "full" ? CASUALTY_FIELDS : CASUALTY_FIELDS.filter((field) => field.core);
}

/**
 * The fields hidden on a tier, which the expandable detail row has to show.
 *
 * @param {"full" | "compact"} tier
 * @returns {Array<Object>} The overflow field descriptors.
 */
export function hiddenFields(tier) {
  return tier === "full" ? [] : CASUALTY_FIELDS.filter((field) => !field.core);
}

/**
 * Builds the grouped header cells for a tier, counting only the columns that
 * are actually rendered — a group whose fields are all hidden disappears rather
 * than leaving a stray `colSpan`.
 *
 * @param {Array<Object>} fields - The visible field descriptors.
 * @returns {Array<{key: string, label: string, span: number}>} Group header cells.
 */
export function groupHeaders(fields) {
  return FIELD_GROUPS.map((group) => ({
    ...group,
    span: fields.filter((field) => field.group === group.key).length,
  })).filter((group) => group.span > 0);
}

/**
 * Renders a saved casualty's cell — the click-to-edit control for that column.
 *
 * @param {Object} field - The field descriptor.
 * @param {Object} casualty - The casualty row.
 * @param {Function} save - The per-column writer from `useCellSave`.
 * @returns {JSX.Element | null} The cell control.
 */
export function renderCell(field, casualty, save) {
  const value = casualty[field.key];

  switch (field.cell) {
    case "text":
      return (
        <TextCell
          value={value}
          column={field.key}
          label={field.header}
          placeholder={field.placeholder}
          save={save}
        />
      );
    case "number":
      return <NumberCell value={value} column={field.key} label={field.header} save={save} />;
    case "treatments":
      return <TreatmentsCell value={value} save={save} />;
    case "toggle":
      return <ToggleCell value={value} column={field.key} label={field.header} save={save} />;
    case "select":
      return (
        <SelectCell
          value={value}
          column={field.key}
          label={field.header}
          placeholder={field.placeholder}
          options={field.options}
          labels={field.labels}
          clearable={field.clearable !== false}
          renderValue={field.renderValue}
          save={save}
        />
      );
    default:
      return null;
  }
}

/**
 * A blank draft for the new-casualty form, keyed by database column so it can
 * be sent as the request body with almost no translation.
 *
 * @returns {Object} The empty draft.
 */
export function emptyDraft() {
  return CASUALTY_FIELDS.reduce((draft, field) => {
    if (field.cell === "toggle") return { ...draft, [field.key]: false };
    if (field.cell === "treatments") return { ...draft, [field.key]: [] };
    if (field.cell === "select") return { ...draft, [field.key]: null };
    return { ...draft, [field.key]: "" };
  }, {});
}

/**
 * Turns the draft into the create request body, blanks becoming explicit nulls.
 *
 * @param {Object} draft
 * @returns {Object} The request body fields.
 */
export function draftToFields(draft) {
  return CASUALTY_FIELDS.reduce((fields, field) => {
    const value = draft[field.key];

    if (field.cell === "toggle") return { ...fields, [field.key]: Boolean(value) };
    if (field.cell === "treatments") return { ...fields, [field.key]: value ?? [] };
    if (field.cell === "text") {
      const trimmed = (value ?? "").trim();
      return { ...fields, [field.key]: trimmed === "" ? null : trimmed };
    }

    return { ...fields, [field.key]: value === "" || value === undefined ? null : value };
  }, {});
}

/**
 * Renders an always-on input for the new-casualty form.
 *
 * The new casualty has no id yet, so its fields can't save themselves the way a
 * saved row's cells do — they bind to a draft and are written together.
 *
 * @param {Object} field - The field descriptor.
 * @param {unknown} value - The draft's current value for this field.
 * @param {(value: unknown) => void} onChange
 * @param {boolean} [hasError] - Whether to mark the input invalid.
 * @returns {JSX.Element | null} The input.
 */
export function renderDraftInput(field, value, onChange, hasError = false) {
  switch (field.cell) {
    case "text":
      return (
        <Textarea
          aria-label={field.header}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          dir="rtl"
          styles={cellTextStyles}
        />
      );
    case "number":
      return (
        <NumberInput
          aria-label={field.header}
          value={value}
          onChange={onChange}
          min={1}
          decimalScale={0}
          clampBehavior="strict"
          hideControls
          styles={cellInputStyles}
        />
      );
    case "treatments":
      return <TreatmentsEditor value={value} onChange={onChange} />;
    case "toggle":
      return (
        <Checkbox
          aria-label={field.header}
          checked={Boolean(value)}
          onChange={(event) => onChange(event.currentTarget.checked)}
          color="var(--app-color-primary)"
        />
      );
    case "select":
      return (
        <Select
          aria-label={field.header}
          placeholder={field.placeholder ?? field.header}
          data={field.options}
          value={value}
          onChange={onChange}
          error={hasError}
          checkIconPosition="right"
          clearable={field.clearable !== false}
          dir="rtl"
          comboboxProps={{ shadow: "md", withinPortal: true }}
          styles={cellTextStyles}
        />
      );
    default:
      return null;
  }
}
