// React
import { useRef, useState } from "react";

// External libraries
import { Text, TextInput, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Internal application modules

// Styles
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon paths break under bundlers; point them at the bundled assets.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** Default map center: roughly the center of Israel. */
const DEFAULT_CENTER = [31.5, 34.75];
const DEFAULT_ZOOM = 8;

const COORDS_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

/**
 * Formats a position as the "lat, lng" text the manual input expects.
 *
 * @param {{lat: number, lng: number}} position
 * @returns {string}
 */
const formatCoords = (position) =>
  `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;

/**
 * Parses a "lat, lng" string into a position, or null if it isn't valid
 * (wrong shape, or out of the -90..90 / -180..180 range).
 *
 * @param {string} text
 * @returns {{lat: number, lng: number} | null}
 */
const parseCoords = (text) => {
  const match = COORDS_PATTERN.exec(text);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

/**
 * Listens for map clicks and reports the clicked coordinates.
 *
 * @param {{ onPick: (position: {lat: number, lng: number}) => void }} props
 * @returns {null}
 */
const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

/**
 * Renders a Leaflet map where the user can either click to drop a pin or
 * type coordinates directly, used to pick an event's location. Both inputs
 * stay in sync: clicking the map fills the text field, and typing valid
 * coordinates moves the pin and pans the map to it.
 *
 * @param {{ value: {lat: number, lng: number} | null, onChange: (position: {lat: number, lng: number}) => void }} props
 * @returns {JSX.Element} The location picker map.
 */
const LocationPickerMap = ({ value, onChange }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [lastEmitted, setLastEmitted] = useState(value);
  const [coordsText, setCoordsText] = useState(value ? formatCoords(value) : "");
  const [coordsError, setCoordsError] = useState(null);
  const mapRef = useRef(null);

  // Keep the text field in sync with external changes (e.g. a map click), but
  // don't fight the user while they're typing a value we already emitted.
  // Adjusting state during render (React's documented pattern for syncing
  // state to a changed prop) instead of an effect avoids an extra render pass.
  if (value !== prevValue) {
    const changedExternally =
      value &&
      (!lastEmitted || value.lat !== lastEmitted.lat || value.lng !== lastEmitted.lng);

    setPrevValue(value);
    if (changedExternally) {
      setCoordsText(formatCoords(value));
      setCoordsError(null);
      setLastEmitted(value);
    } else if (!value) {
      setCoordsText("");
    }
  }

  /**
   * Parses the typed coordinates; on success, updates the pin and pans the
   * map to the new position.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event
   * @returns {void}
   */
  const handleCoordsChange = (event) => {
    const text = event.currentTarget.value;
    setCoordsText(text);

    if (text.trim() === "") {
      setCoordsError(null);
      return;
    }

    const parsed = parseCoords(text);
    if (!parsed) {
      setCoordsError("פורמט לא תקין. יש להזין lat, lng לדוגמה: 31.50392, 34.73877");
      return;
    }

    setCoordsError(null);
    setLastEmitted(parsed);
    onChange(parsed);
    mapRef.current?.setView([parsed.lat, parsed.lng], mapRef.current.getZoom());
  };

  return (
    <div>
      <Text fz="sm" c="var(--app-color-text-muted)" mb="0.25rem">
        מיקום האירוע
      </Text>

      <TextInput
        value={coordsText}
        onChange={handleCoordsChange}
        placeholder="31.50392, 34.73877"
        error={coordsError}
        dir="ltr"
        mb="0.5rem"
        rightSection={
          <Tooltip
            multiline
            w={260}
            withArrow
            label="יש להזין קואורדינטות בפורמט lat, lng (קו רוחב, קו אורך) במעלות עשרוניות, מופרדות בפסיק. לדוגמה: 31.50392, 34.73877. ניתן גם לבחור מיקום בלחיצה על המפה."
          >
            <IconInfoCircle
              size={18}
              stroke={1.8}
              color="var(--app-color-text-muted)"
              style={{ cursor: "help" }}
            />
          </Tooltip>
        }
        styles={{
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
        }}
      />

      <div
        style={{
          height: "18rem",
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--app-color-border)",
        }}
      >
        <MapContainer
          ref={mapRef}
          center={value ?? DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={value} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPickerMap;
