// React
import { useState } from "react";

// External libraries
import { Button, Group, NumberInput, Text, TextInput } from "@mantine/core";
import {
  IconClock,
  IconHelicopterLanding,
  IconId,
  IconMapPin,
  IconRadio,
  IconSend,
} from "@tabler/icons-react";

// Internal application modules
import AuthFormCard from "../auth/AuthFormCard";
import EventSelector from "../dashboard/EventSelector";

// Styles

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
 * Renders the aerial evacuation request form.
 *
 * @returns {JSX.Element} The aerial evacuation request form.
 */
const AerialEvacuationForm = () => {
  const [eventId, setEventId] = useState(null);
  const [forceRadioSign, setForceRadioSign] = useState("");
  const [departureLat, setDepartureLat] = useState("");
  const [departureLng, setDepartureLng] = useState("");
  const [destinationLat, setDestinationLat] = useState("");
  const [destinationLng, setDestinationLng] = useState("");
  const [eta, setEta] = useState("");
  const [aerialMissionId, setAerialMissionId] = useState("");

  /**
   * Handles the form submission.
   *
   * Submitting to POST /evacuations will be connected once the flow is confirmed.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <AuthFormCard handleSubmit={handleSubmit}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "4px",
          backgroundColor: "var(--app-color-primary)",
        }}
      />

      <EventSelector value={eventId} onChange={setEventId} />

      <TextInput
        id="force-radio-sign"
        name="force-radio-sign"
        label="קריאת קשר של הכוח"
        placeholder="לדוגמה: מטיף 21"
        value={forceRadioSign}
        onChange={(event) => setForceRadioSign(event.currentTarget.value)}
        leftSection={<IconRadio size={20} stroke={1.8} />}
        leftSectionPointerEvents="none"
        required
        dir="rtl"
        styles={inputStyles}
      />

      <div>
        <Text fz="sm" c="var(--app-color-text-muted)" mb={4}>
          נקודת איסוף
        </Text>
        <Group gap="sm" grow>
          <NumberInput
            id="departure-lat"
            placeholder="קו רוחב"
            value={departureLat}
            onChange={setDepartureLat}
            leftSection={<IconMapPin size={20} stroke={1.8} />}
            leftSectionPointerEvents="none"
            decimalScale={6}
            required
            styles={inputStyles}
          />
          <NumberInput
            id="departure-lng"
            placeholder="קו אורך"
            value={departureLng}
            onChange={setDepartureLng}
            decimalScale={6}
            required
            styles={inputStyles}
          />
        </Group>
      </div>

      <div>
        <Text fz="sm" c="var(--app-color-text-muted)" mb={4}>
          יעד פינוי
        </Text>
        <Group gap="sm" grow>
          <NumberInput
            id="destination-lat"
            placeholder="קו רוחב"
            value={destinationLat}
            onChange={setDestinationLat}
            leftSection={<IconHelicopterLanding size={20} stroke={1.8} />}
            leftSectionPointerEvents="none"
            decimalScale={6}
            required
            styles={inputStyles}
          />
          <NumberInput
            id="destination-lng"
            placeholder="קו אורך"
            value={destinationLng}
            onChange={setDestinationLng}
            decimalScale={6}
            required
            styles={inputStyles}
          />
        </Group>
      </div>

      <TextInput
        id="eta"
        name="eta"
        type="datetime-local"
        label="זמן הגעה משוער (ETA)"
        value={eta}
        onChange={(event) => setEta(event.currentTarget.value)}
        leftSection={<IconClock size={20} stroke={1.8} />}
        leftSectionPointerEvents="none"
        required
        dir="rtl"
        styles={inputStyles}
      />

      <TextInput
        id="aerial-mission-id"
        name="aerial-mission-id"
        label="מספר משימה אווירית"
        placeholder="אופציונלי"
        value={aerialMissionId}
        onChange={(event) => setAerialMissionId(event.currentTarget.value)}
        leftSection={<IconId size={20} stroke={1.8} />}
        leftSectionPointerEvents="none"
        dir="rtl"
        styles={inputStyles}
      />

      <Button
        type="submit"
        fullWidth
        leftSection={<IconSend size={20} stroke={1.8} />}
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
        שלח בקשת פינוי
      </Button>
    </AuthFormCard>
  );
};

export default AerialEvacuationForm;
