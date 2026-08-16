// React
import { useEffect, useRef, useState } from "react";

// External libraries
import {
  ActionIcon,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

// Internal application modules
import { cellInputStyles, cellTextStyles, MONO_FONT } from "./formStyles";
import { labelFor, normalizeTreatments } from "../../constants/casualtyStatus";

// Styles

const EM_DASH = "—";

/**
 * Commits an in-progress edit if the cell is unmounted while still open.
 *
 * The text and number cells normally save on blur — but blur never fires when
 * React tears the subtree down, which is exactly what happens when the layout
 * switches tier (a tablet rotating, a window being dragged across a
 * breakpoint). Without this, typed findings disappear silently. `useCellSave`
 * already skips writes whose value is unchanged, so committing here as well as
 * on blur cannot double-write.
 *
 * @param {boolean} isEditing - Whether the cell currently has an open editor.
 * @param {() => void} commit - The cell's commit function.
 * @returns {void}
 */
function useCommitOnUnmount(isEditing, commit) {
  const latest = useRef({ isEditing, commit });

  // Kept fresh after every render, so the unmount cleanup below always sees the
  // current draft without having to re-run — and so the ref is never written
  // during render.
  useEffect(() => {
    latest.current = { isEditing, commit };
  });

  useEffect(
    () => () => {
      if (latest.current.isEditing) latest.current.commit();
    },
    [],
  );
}

/**
 * Renders a cell's resting state: the value, clickable to start editing.
 *
 * @param {{ onOpen: () => void, label: string, pick?: boolean, children: React.ReactNode }} props
 * @returns {JSX.Element} The clickable cell body.
 */
export const CellButton = ({ onOpen, label, pick = false, children }) => (
  <UnstyledButton
    onClick={onOpen}
    aria-label={label}
    title={label}
    className={pick ? "medic-cell medic-cell--pick" : "medic-cell"}
  >
    {children}
  </UnstyledButton>
);

/**
 * A free-text cell. Commits on Enter or when focus leaves, discards on Escape.
 * Shift+Enter inserts a line break instead of committing.
 *
 * @param {{ value: string | null, column: string, label: string, placeholder?: string, save: Function }} props
 * @returns {JSX.Element} The text cell.
 */
export const TextCell = ({ value, column, label, placeholder, save }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    setIsEditing(false);
    const trimmed = draft.trim();
    save(column, trimmed === "" ? null : trimmed, value ?? null);
  }

  useCommitOnUnmount(isEditing, commit);

  if (!isEditing) {
    return (
      <CellButton
        label={label}
        onOpen={() => {
          setDraft(value ?? "");
          setIsEditing(true);
        }}
      >
        {value ? (
          // A long unbroken token (a drug name, a phone number) has to wrap
          // rather than push past the fixed column width.
          <Text fz="sm" lineClamp={2} style={{ overflowWrap: "anywhere" }}>
            {value}
          </Text>
        ) : (
          <Text fz="sm" c="var(--app-color-text-muted)">
            {EM_DASH}
          </Text>
        )}
      </CellButton>
    );
  }

  return (
    <Textarea
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          setIsEditing(false);
        }
      }}
      autoFocus
      autosize
      minRows={1}
      maxRows={4}
      dir="rtl"
      styles={cellTextStyles}
    />
  );
};

/**
 * A whole-number cell. Commits on Enter or blur, discards on Escape.
 *
 * @param {{ value: number | null, column: string, label: string, save: Function }} props
 * @returns {JSX.Element} The number cell.
 */
export const NumberCell = ({ value, column, label, save }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    setIsEditing(false);
    save(column, draft === "" ? null : draft, value ?? null);
  }

  useCommitOnUnmount(isEditing, commit);

  if (!isEditing) {
    return (
      <CellButton
        label={label}
        onOpen={() => {
          setDraft(value ?? "");
          setIsEditing(true);
        }}
      >
        <Text fz="sm" ff={MONO_FONT}>
          {value ?? EM_DASH}
        </Text>
      </CellButton>
    );
  }

  return (
    <NumberInput
      aria-label={label}
      value={draft}
      onChange={setDraft}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          setIsEditing(false);
        }
      }}
      autoFocus
      min={1}
      decimalScale={0}
      clampBehavior="strict"
      hideControls
      styles={cellInputStyles}
    />
  );
};

/**
 * A single-choice cell. Clicking it drops the menu open; picking a value writes
 * it straight away, so there is nothing to confirm.
 *
 * The dropdown is portalled and given its own width, so a cell only wide enough
 * for "שכיבה" still shows a readable option list.
 *
 * @param {{
 *   value: string | null, column: string, label: string, placeholder?: string, options: Array<Object>,
 *   labels: Record<string, string>, clearable?: boolean, save: Function,
 *   renderValue?: (value: string | null) => React.ReactNode,
 * }} props
 * @returns {JSX.Element} The select cell.
 */
export const SelectCell = ({
  value,
  column,
  label,
  placeholder,
  options,
  labels,
  clearable = true,
  save,
  renderValue,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <CellButton label={label} pick onOpen={() => setIsEditing(true)}>
        {renderValue ? renderValue(value) : <Text fz="sm">{labelFor(labels, value)}</Text>}
      </CellButton>
    );
  }

  return (
    <Select
      aria-label={label}
      placeholder={placeholder ?? label}
      data={options}
      value={value ?? null}
      onChange={(next) => {
        setIsEditing(false);
        save(column, next, value ?? null);
      }}
      onBlur={() => setIsEditing(false)}
      autoFocus
      defaultDropdownOpened
      checkIconPosition="right"
      clearable={clearable}
      dir="rtl"
      comboboxProps={{ shadow: "md", withinPortal: true, width: 190, position: "bottom-end" }}
      styles={cellTextStyles}
    />
  );
};

/**
 * The treatments checklist: free-text entries, each with a checkbox.
 *
 * A medic writes down whatever was needed and ticks it off once it has actually
 * been given, mirroring the paper form. New entries start unticked. Every
 * change — adding, renaming, removing or ticking — writes the whole list
 * straight away, because a treatment is a discrete fact worth not losing if the
 * medic moves on to the next casualty mid-edit.
 *
 * Controlled, so the same editor serves a saved casualty's cell and the
 * new-casualty form, which has no id to save against yet.
 *
 * @param {{
 *   value: Array<{text: string, done: boolean}>,
 *   onChange: (items: Array<{text: string, done: boolean}>) => void,
 * }} props
 * @returns {JSX.Element} The treatments editor.
 */
export const TreatmentsEditor = ({ value, onChange }) => {
  const items = Array.isArray(value) ? value : [];
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  /**
   * Appends the typed entry, unticked, and stays open for the next one.
   *
   * @returns {void}
   */
  function addItem() {
    const text = newText.trim();
    setNewText("");

    if (text === "") {
      setIsAdding(false);
      return;
    }

    onChange([...items, { text, done: false }]);
  }

  /**
   * Replaces an entry's text, dropping it entirely when cleared.
   *
   * @param {number} index
   * @param {string} text
   * @returns {void}
   */
  function setItemText(index, text) {
    const trimmed = text.trim();
    onChange(
      trimmed === ""
        ? items.filter((_, at) => at !== index)
        : items.map((item, at) => (at === index ? { ...item, text: trimmed } : item)),
    );
  }

  return (
    <Stack gap={2}>
      {items.map((item, index) => (
        <Group key={`${item.text}-${index}`} gap={4} wrap="nowrap" align="center">
          <Checkbox
            size="xs"
            aria-label={`${item.text} — בוצע`}
            title="סמן כבוצע"
            checked={item.done}
            onChange={(event) =>
              onChange(
                items.map((current, at) =>
                  at === index ? { ...current, done: event.currentTarget.checked } : current,
                ),
              )
            }
            color="var(--app-color-primary)"
            styles={{ input: { cursor: "pointer" } }}
          />

          <TreatmentText value={item.text} onCommit={(text) => setItemText(index, text)} />

          <ActionIcon
            size="xs"
            variant="subtle"
            aria-label={`הסר ${item.text}`}
            title="הסר"
            onClick={() => onChange(items.filter((_, at) => at !== index))}
          >
            <IconX size={12} color="var(--app-color-text-muted)" />
          </ActionIcon>
        </Group>
      ))}

      {isAdding ? (
        <TextInput
          aria-label="טיפול חדש"
          placeholder="הקלד טיפול"
          value={newText}
          onChange={(event) => setNewText(event.currentTarget.value)}
          onBlur={addItem}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            } else if (event.key === "Escape") {
              setNewText("");
              setIsAdding(false);
            }
          }}
          autoFocus
          size="xs"
          dir="rtl"
          styles={cellTextStyles}
        />
      ) : (
        <UnstyledButton
          onClick={() => setIsAdding(true)}
          aria-label="הוסף טיפול"
          className="medic-cell medic-cell--pick"
        >
          <Group gap={2} wrap="nowrap">
            <IconPlus size={12} color="var(--app-color-primary)" />
            <Text fz="xs" c="var(--app-color-primary)">
              {items.length === 0 ? "הוסף טיפול" : "הוסף"}
            </Text>
          </Group>
        </UnstyledButton>
      )}
    </Stack>
  );
};

/**
 * One treatment's text, editable in place. Commits on Enter or blur; clearing
 * it removes the entry.
 *
 * @param {{ value: string, onCommit: (text: string) => void }} props
 * @returns {JSX.Element} The entry's label or its editor.
 */
const TreatmentText = ({ value, onCommit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setIsEditing(false);
    if (draft.trim() !== value) onCommit(draft);
  }

  useCommitOnUnmount(isEditing, commit);

  if (!isEditing) {
    return (
      <UnstyledButton
        onClick={() => {
          setDraft(value);
          setIsEditing(true);
        }}
        aria-label={`ערוך ${value}`}
        style={{ flex: 1, minWidth: 0, textAlign: "start" }}
      >
        <Text
          fz="xs"
          style={{ overflowWrap: "anywhere" }}
          td={undefined}
          c="var(--app-color-text)"
        >
          {value}
        </Text>
      </UnstyledButton>
    );
  }

  return (
    <TextInput
      aria-label="טיפול"
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          setIsEditing(false);
        }
      }}
      autoFocus
      size="xs"
      dir="rtl"
      style={{ flex: 1, minWidth: 0 }}
      styles={cellTextStyles}
    />
  );
};

/**
 * The treatments checklist bound to a saved casualty's column.
 *
 * @param {{ value: unknown, save: Function }} props
 * @returns {JSX.Element} The treatments cell.
 */
export const TreatmentsCell = ({ value, save }) => (
  <TreatmentsEditor
    value={normalizeTreatments(value)}
    // `value` rather than the normalised copy is passed as the current value, so
    // a legacy row is rewritten in the new shape the first time it is touched.
    onChange={(next) => save("treatments", next, value)}
  />
);

/**
 * A yes/no cell. There is no edit mode — clicking flips it and writes.
 *
 * @param {{ value: boolean, column: string, label: string, save: Function }} props
 * @returns {JSX.Element} The toggle cell.
 */
export const ToggleCell = ({ value, column, label, save }) => (
  <Checkbox
    aria-label={label}
    title={label}
    checked={Boolean(value)}
    onChange={(event) => save(column, event.currentTarget.checked, Boolean(value))}
    color="var(--app-color-primary)"
    styles={{ input: { cursor: "pointer" } }}
  />
);
