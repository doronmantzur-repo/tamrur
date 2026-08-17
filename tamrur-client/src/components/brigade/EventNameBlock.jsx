// React
import { useState } from "react";

// External libraries
import { ActionIcon, Group, Text, Title, Tooltip } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";

// Internal application modules

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
 * Renders the selected event's name and a client-only note beneath it,
 * edited via the pencil icon — the DB has no description column, so this
 * never persists past the browser session. Sits directly under "לוח בקרה:
 * חטיבה" in the top bar, so the event name matches that title's font size
 * (fz="1.5rem") rather than a smaller card-header size.
 *
 * @param {{ event: object }} props
 * @returns {JSX.Element} The event name and description block.
 */
const EventNameBlock = ({ event }) => {
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
      <Title order={2} fz="1.5rem" fw={700} c="var(--app-color-text)">
        {event.name || "אירוע ללא שם"}
      </Title>

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
          <Tooltip label={description ? "ערוך תיאור אירוע" : "הוסף תיאור אירוע"} withArrow>
            <ActionIcon
              variant="subtle"
              aria-label={description ? "ערוך תיאור" : "הוסף תיאור"}
              onClick={startEditingDescription}
              styles={{
                root: {
                  color: "var(--app-color-text-muted)",
                  height: DESCRIPTION_ROW_HEIGHT,
                  width: DESCRIPTION_ROW_HEIGHT,
                },
              }}
            >
              <IconPencil size={14} stroke={1.8} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </>
  );
};

export default EventNameBlock;
