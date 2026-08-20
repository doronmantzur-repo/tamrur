// React
import { useState } from "react";

// External libraries
import { Box, Button, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconPlus, IconTag } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import AuthFormCard from "../auth/AuthFormCard";
import LocationPickerMap from "./LocationPickerMap";
import { createEvent } from "../../features/events/eventsSlice";
import { EVENT_TYPE_LABELS } from "../../constants/eventStatus";

// Styles

const typeOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const inputStyles = {
  label: {
    color: "var(--app-color-text-muted)",
    marginBottom: "0.25rem",
  },
  input: {
    minHeight: "3rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
    fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
    "&:focus": {
      borderWidth: "2px",
      borderColor: "var(--app-color-primary)",
    },
  },
};

/**
 * Renders the "open new event" form: event name (optional), type (required),
 * and a location picked by dropping a pin on a map (required). On submit,
 * dispatches the createEvent thunk with the exact fields the server reads
 * (name, type, location as a GeoJSON Point) — status and timestamps are
 * always server-generated and are never sent from this form. On success,
 * navigates straight into the new event's brigade dashboard.
 *
 * `bare` drops the `AuthFormCard` wrapper (surface, border, gold accent bar)
 * in favor of a plain form Stack, for callers that already provide their own
 * framing — e.g. `CreateEventModal`, where the modal's own surface is the
 * card, and a nested one just doubled up the border/accent bar.
 *
 * @param {{ onCreated?: (event: Object) => void, bare?: boolean }} props
 * @returns {JSX.Element} The create event form.
 */
const CreateEventForm = ({ onCreated, bare = false }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [position, setPosition] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createStatus, createError } = useSelector((state) => state.events);

  /**
   * Validates the location was picked, then dispatches event creation.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!position) {
      setLocationError("יש לבחור מיקום על המפה");
      return;
    }
    setLocationError(null);

    dispatch(
      createEvent({
        name: name.trim() || undefined,
        type,
        location: {
          type: "Point",
          coordinates: [position.lng, position.lat],
        },
      }),
    ).then((action) => {
      if (createEvent.fulfilled.match(action)) {
        setName("");
        setType("");
        setPosition(null);
        onCreated?.(action.payload);
        navigate(`/brigade/${action.payload.id}`);
      }
    });
  };

  const fields = (
    <>
      <TextInput
        id="name"
        name="name"
        label="שם האירוע (אופציונלי)"
        placeholder="הזן שם לאירוע"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
        leftSection={<IconTag size={20} stroke={1.8} />}
        leftSectionPointerEvents="none"
        dir="rtl"
        styles={inputStyles}
      />
      <Select
        label="סוג האירוע"
        placeholder="בחר סוג אירוע"
        data={typeOptions}
        value={type}
        onChange={(value) => setType(value ?? "")}
        leftSection={<IconAlertTriangle size={20} stroke={1.8} />}
        checkIconPosition="right"
        required
        dir="rtl"
        styles={inputStyles}
        comboboxProps={{ shadow: "md", zIndex: 1001 }}
      />
      <LocationPickerMap value={position} onChange={setPosition} />
      {locationError && (
        <Text fz="sm" c="var(--app-color-error)">
          {locationError}
        </Text>
      )}
      {createStatus === "failed" && createError && (
        <Text fz="sm" c="var(--app-color-error)">
          {createError}
        </Text>
      )}
      <Button
        type="submit"
        fullWidth
        loading={createStatus === "loading"}
        leftSection={<IconPlus size={20} stroke={1.8} />}
        mih="3rem"
        radius="sm"
        mt="xs"
        styles={{
          root: {
            backgroundColor: "var(--app-color-primary)",
            color: "var(--app-color-primary-text)",
            boxShadow: "0 4px 14px rgba(197, 160, 89, 0.39)",
            "&:hover": {
              backgroundColor: "var(--app-color-primary-hover)",
            },
          },
        }}
      >
        פתח אירוע
      </Button>
    </>
  );

  if (bare) {
    return (
      <Stack component="form" onSubmit={handleSubmit} gap="md">
        {fields}
      </Stack>
    );
  }

  return (
    <AuthFormCard handleSubmit={handleSubmit}>
      <Box
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "4px",
          backgroundColor: "var(--app-color-primary)",
        }}
      />
      {fields}
    </AuthFormCard>
  );
};

export default CreateEventForm;
