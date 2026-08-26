// React
import { useState } from "react";

// External libraries
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";

// Internal application modules
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/**
 * Shared fixed height for every element in the description row — the
 * "תיאור:" label, the pencil icon, the textarea, and its save/cancel icons
 * — in both the view and edit states. Without this, the row's height is
 * whatever each state's content happens to need, and switching between them
 * (e.g. clicking the pencil) changes that height, pushing the rest of the
 * top bar down. Same value in both states keeps the row's height constant.
 */
const DESCRIPTION_ROW_HEIGHT = "1.75rem";

/**
 * The pencil that opens the description editor — real `useHoverState` for
 * the hover feedback, not Mantine's default `variant="subtle"` hover fill:
 * with no `color` prop set (only `styles.root.color`), that default fill
 * falls back to the theme's primary color regardless of the icon's own
 * styled color, producing an unwanted gold background. Muted at rest (no
 * inherent identity color, unlike e.g. a delete action), so the hover
 * shift itself — muted to primary, with a light primary tint instead of a
 * solid fill — is what signals "editable."
 *
 * @param {{ label: string, ariaLabel: string, onClick: () => void }} props
 * @returns {JSX.Element} The edit-description button.
 */
function EditDescriptionButton({ label, ariaLabel, onClick }) {
  const [isHovered, hoverHandlers] = useHoverState();

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="subtle"
        aria-label={ariaLabel}
        onClick={onClick}
        {...hoverHandlers}
        styles={{
          root: {
            height: DESCRIPTION_ROW_HEIGHT,
            width: DESCRIPTION_ROW_HEIGHT,
            color: isHovered ? "var(--app-color-primary)" : "var(--app-color-text-muted)",
            backgroundColor: isHovered ? "color-mix(in srgb, var(--app-color-primary) 14%, transparent)" : "transparent",
            transition: "background-color 0.15s ease, color 0.15s ease",
          },
        }}
      >
        <IconPencil size={14} stroke={1.8} />
      </ActionIcon>
    </Tooltip>
  );
}

/**
 * Renders a client-only note about the selected event, edited via the
 * pencil icon — the DB has no description column, so this never persists
 * past the browser session. Sits under the event name (rendered inline
 * with the shield icon by the caller) in the top bar.
 *
 * @returns {JSX.Element} The event description block.
 */
const EventDescriptionBlock = () => {
  const [description, setDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const startEditingDescription = () => {
    setDescriptionDraft(description);
    setIsEditingDescription(true);
  };

  const saveDescription = () => {
    setDescription(descriptionDraft.trim());
    setIsEditingDescription(false);
  };

  const cancelEditingDescription = () => {
    setIsEditingDescription(false);
  };

  return (
    <>
      {isEditingDescription ? (
        // A plain HTML textarea, not Mantine's <Textarea> — Mantine
        // auto-wraps it in an Input.Wrapper div that the theme forces to
        // mih="3rem" for touch targets, and there's no reliable way to
        // override that from here. A native element has no such wrapper, so
        // it's just styled directly below to match the rest of the app's
        // inputs (background/text/border/radius/font), minus that min-height.
        <Group align="center" gap="xs" wrap="nowrap">
          <textarea
            rows={1}
            autoFocus
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.currentTarget.value)}
            placeholder="תיאור אירוע"
            style={{
              flex: 1,
              minWidth: "22rem",
              height: DESCRIPTION_ROW_HEIGHT,
              boxSizing: "border-box",
              backgroundColor: "var(--app-color-background)",
              color: "var(--app-color-text)",
              border: "1px solid var(--app-color-border)",
              borderRadius: "0.25rem",
              padding: "0.125rem 0.5rem",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              lineHeight: 1.4,
              resize: "none",
            }}
          />
          <ActionIcon
            variant="subtle"
            aria-label="שמור תיאור"
            onClick={saveDescription}
            styles={{ root: { color: "var(--app-color-success)", height: DESCRIPTION_ROW_HEIGHT, width: DESCRIPTION_ROW_HEIGHT } }}
          >
            <IconCheck size={14} stroke={1.8} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            aria-label="בטל"
            onClick={cancelEditingDescription}
            styles={{
              root: { color: "var(--app-color-text-muted)", height: DESCRIPTION_ROW_HEIGHT, width: DESCRIPTION_ROW_HEIGHT },
            }}
          >
            <IconX size={14} stroke={1.8} />
          </ActionIcon>
        </Group>
      ) : (
        // One row, all center-aligned together: the "תיאור:" caption sits
        // rightmost (first in RTL reading order), immediately followed by
        // the description text, with the pencil trailing on the left —
        // rather than the caption and pencil being grouped apart from the
        // description they're both describing.
        <Group gap="xs" wrap="nowrap" align="center">
          <Text
            fz="xs"
            fw={600}
            c="var(--app-color-text-muted)"
            style={{ height: DESCRIPTION_ROW_HEIGHT, display: "flex", alignItems: "center" }}
          >
            תיאור:
          </Text>
          {description && (
            <Text fz="sm" c="var(--app-color-text-muted)" style={{ flex: 1 }}>
              {description}
            </Text>
          )}
          <EditDescriptionButton
            label={description ? "ערוך תיאור אירוע" : "הוסף תיאור אירוע"}
            ariaLabel={description ? "ערוך תיאור" : "הוסף תיאור"}
            onClick={startEditingDescription}
          />
        </Group>
      )}
    </>
  );
};

export default EventDescriptionBlock;
