// React
import { useState } from "react";

// External libraries
import { Select, Stack, Text } from "@mantine/core";
import { IconArrowsRightLeft, IconHelicopterLanding } from "@tabler/icons-react";

// Internal application modules
import { splitLocationsByType } from "../../utils/geo";
import { hospitalLabel } from "../../constants/locationMarkers";
import { StarOfDavidIcon } from "./MapLegendPrimitives";

// Styles

const inputStyles = {
  input: {
    minHeight: "2.5rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
  },
};

/**
 * Same Hebrew wording and icon language used for these types in the map
 * legends (EvacuationMap.jsx / EventQueueMap.jsx) — landing pad's icon here
 * is the closest stock Tabler glyph rather than the map's plain "H" badge
 * (that one's a Leaflet div-icon string, not reusable as a DOM icon), and
 * hospital reuses the real StarOfDavidIcon component so it can't drift out
 * of sync with the marker.
 */
const TYPE_META = {
  landing_pad: { label: "משטח נחיתה", Icon: IconHelicopterLanding },
  hospital: { label: "בית חולים", Icon: StarOfDavidIcon },
  exchange_point: { label: "נקודת חילוף / מיקום אחר", Icon: IconArrowsRightLeft },
};

function groupsByType(locations) {
  const { landingPads, hospitals, otherLocations } = splitLocationsByType(locations);
  return {
    landing_pad: landingPads,
    hospital: hospitals,
    exchange_point: otherLocations,
  };
}

function locationLabel(location) {
  return location.type === "hospital" ? hospitalLabel(location.name) : location.name;
}

/**
 * The type-picking half of LocationPicker: a segmented control (icon +
 * label per type) instead of a second dropdown, so the two-step "type, then
 * location" flow reads as one composite field instead of two unrelated
 * ones. Clicking the already-selected segment clears it, mirroring a
 * clearable select — the only way back to "no type chosen" otherwise.
 */
function TypeSegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        gap: "0.4rem",
        padding: "0.35rem",
        backgroundColor: "var(--app-color-surface-high)",
        border: "1px solid var(--app-color-border)",
        borderRadius: "0.6rem",
      }}
    >
      {options.map(({ type, label, Icon }) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : type)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.6rem 0.3rem",
              border: `1px solid ${active ? "var(--app-color-primary)" : "var(--app-color-border)"}`,
              borderRadius: "0.45rem",
              backgroundColor: active ? "var(--app-color-primary)" : "var(--app-color-background)",
              color: active ? "var(--app-color-primary-text)" : "var(--app-color-text-muted)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.72rem",
              fontWeight: 600,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            <Icon size={20} stroke={1.8} color="currentColor" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Two-step location picker: choose a location type via a segmented control,
 * then a location of that type from a dropdown limited to it — instead of
 * one flat list mixing landing pads, hospitals, and exchange points
 * together. Hospital names are shown in Hebrew via `hospitalLabel`, matching
 * how they already render on the maps. Generic over departure vs.
 * destination — `label` (e.g. "יציאה" / "יעד") is what tells two instances
 * of this stacked in the same form apart.
 *
 * @param {{
 *   locations: Array<object>,
 *   value: string | null,
 *   onChange: (locationId: string | null) => void,
 *   label: string,
 * }} props
 * @returns {JSX.Element} The type-then-location picker.
 */
const LocationPicker = ({ locations, value, onChange, label }) => {
  const byType = groupsByType(locations);
  const currentLocation = locations.find((location) => location.id === value) || null;

  const [type, setType] = useState(currentLocation?.type || null);

  // Every type is always shown, even with zero locations of that type today
  // — hiding it would look like the app doesn't know that location type
  // exists at all. Picking an empty type just disables the select below with
  // a message explaining why, instead of offering an empty dropdown.
  const typeOptions = Object.entries(TYPE_META).map(([key, meta]) => ({ type: key, ...meta }));

  const locationOptions = (byType[type] || []).map((location) => ({
    value: location.id,
    label: locationLabel(location),
  }));
  const typeHasNoLocations = Boolean(type) && locationOptions.length === 0;

  const handleTypeChange = (nextType) => {
    setType(nextType);
    onChange(null);
  };

  const locationPlaceholder = !type
    ? "בחר קודם סוג מיקום"
    : typeHasNoLocations
      ? "אין מיקומים מסוג זה כרגע"
      : `בחר ${TYPE_META[type].label}`;

  return (
    <Stack gap="xs">
      <Text fz="sm" fw={500} c="var(--app-color-text)">
        {label}
      </Text>
      <TypeSegmentedControl
        options={typeOptions}
        value={type}
        onChange={handleTypeChange}
        ariaLabel={`סוג ${label}`}
      />
      <Select
        label="מיקום"
        styles={inputStyles}
        placeholder={locationPlaceholder}
        data={locationOptions}
        value={value}
        onChange={onChange}
        disabled={!type || typeHasNoLocations}
        searchable
        required
      />
    </Stack>
  );
};

export default LocationPicker;
