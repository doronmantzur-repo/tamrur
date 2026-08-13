// React
import { useState } from "react";

// External libraries
import { Box, Chip, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconAmbulance, IconBuildingHospital } from "@tabler/icons-react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Internal application modules
import { LANDING_PAD_STATUS_COLOR_VARS, LANDING_PAD_STATUS_LABELS } from "../../constants/evacuationMethod";
import { toLatLng } from "../../utils/geo";

// Styles
import "leaflet/dist/leaflet.css";

const DEFAULT_ZOOM = 14;

/** Used only if an event somehow has no location, so the map still has somewhere to center on. */
const FALLBACK_CENTER = { lat: 31.7683, lng: 35.2137 };

/**
 * Builds a small circular div-icon marker. Colors are CSS vars, safe here
 * since Leaflet renders div-icons as real DOM elements (unlike its SVG path
 * renderer, which needs resolved hex values).
 *
 * @param {{ label: string, background: string, size?: number, glow?: boolean }} options
 * @returns {L.DivIcon}
 */
function buildDivIcon({ label, background, size = 26, glow = false }) {
  const boxShadow = glow
    ? "0 0 0 2px var(--app-color-surface), var(--app-effect-live-glow)"
    : "0 0 0 2px var(--app-color-surface)";

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${background};box-shadow:${boxShadow};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${Math.round(size * 0.5)}px;
      font-family:ui-monospace, 'SF Mono', 'Consolas', monospace;
    ">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Inline-renders a Tabler icon's path data as raw SVG markup, for use inside a Leaflet div-icon. */
function tablerSvg(paths, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}" />`).join("")}</svg>`;
}

const HOSPITAL_ICON_PATHS = [
  "M3 21l18 0",
  "M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16",
  "M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4",
  "M10 9l4 0",
  "M12 7l0 4",
];

const AMBULANCE_ICON_PATHS = [
  "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  "M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5",
  "M6 10h4m-2 -2v4",
];

const EVENT_ICON = buildDivIcon({ label: "!", background: "var(--app-color-error)", size: 28, glow: true });
const HOSPITAL_ICON = buildDivIcon({
  label: tablerSvg(HOSPITAL_ICON_PATHS),
  background: "var(--app-color-success)",
  size: 26,
});
const OTHER_LOCATION_ICON = buildDivIcon({
  label: tablerSvg(AMBULANCE_ICON_PATHS),
  background: "var(--app-color-text-muted)",
  size: 26,
});

/**
 * Small legend explaining the map's symbols: the event marker, landing pad
 * status colors, and the other location marker types.
 */
function MapLegend() {
  return (
    <Group gap="lg" wrap="wrap" mt="xs">
      <Group gap={6} wrap="nowrap">
        <Box
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "var(--app-color-error)",
            color: "#fff",
            fontSize: "0.6rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          !
        </Box>
        <Text fz="xs" c="var(--app-color-text-muted)">
          מיקום אירוע
        </Text>
      </Group>

      {Object.entries(LANDING_PAD_STATUS_LABELS).map(([key, label]) => (
        <Group key={key} gap={6} wrap="nowrap">
          <Box
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: LANDING_PAD_STATUS_COLOR_VARS[key],
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            H
          </Box>
          <Text fz="xs" c="var(--app-color-text-muted)">
            משטח נחיתה {label}
          </Text>
        </Group>
      ))}

      <Group gap={6} wrap="nowrap">
        <IconBuildingHospital size={16} stroke={1.8} color="var(--app-color-success)" />
        <Text fz="xs" c="var(--app-color-text-muted)">
          בית חולים
        </Text>
      </Group>

      <Group gap={6} wrap="nowrap">
        <IconAmbulance size={16} stroke={1.8} color="var(--app-color-text-muted)" />
        <Text fz="xs" c="var(--app-color-text-muted)">
          נקודת חילוף / מיקום אחר
        </Text>
      </Group>
    </Group>
  );
}

/**
 * Renders the event map: the event location (exclamation marker), landing
 * pads (an "H" marker colored by pad status), hospitals, and other named
 * locations (e.g. an ambulance exchange point), each toggleable via a layer
 * chip row, plus a legend explaining the symbols. Evacuation routes and live
 * force tracking aren't supported yet, so both stay as disabled placeholder
 * chips until routing is available.
 *
 * @param {{ event: object, locations: Array<object> }} props
 * @returns {JSX.Element} The evacuation map.
 */
const EvacuationMap = ({ event, locations }) => {
  const [visibleLayers, setVisibleLayers] = useState(["location", "pads", "hospitals", "other"]);

  const isLayerOn = (key) => visibleLayers.includes(key);

  const withCoords = locations.filter((location) => location.location);
  const landingPads = withCoords.filter((location) => location.type === "landing_pad");
  const hospitals = withCoords.filter((location) => location.type === "hospital");
  const otherLocations = withCoords.filter((location) => location.type === "exchange_point");
  const eventLatLng = toLatLng(event.location);

  return (
    <Stack gap={0} style={{ height: "100%", overflow: "auto" }}>
      <Group gap="xs" mb="xs" wrap="wrap" style={{ flexShrink: 0 }}>
        <Chip.Group multiple value={visibleLayers} onChange={setVisibleLayers}>
          <Chip value="location" size="xs">
            מיקום אירוע
          </Chip>
          <Chip value="pads" size="xs">
            משטחי נחיתה
          </Chip>
          <Chip value="hospitals" size="xs">
            בתי חולים
          </Chip>
          <Chip value="other" size="xs">
            מיקומים נוספים
          </Chip>
        </Chip.Group>
        <Tooltip label="בקרוב, מסלולי פינוי טרם נתמכים">
          <Chip value="routes" size="xs" disabled checked={false}>
            מסלולי פינוי
          </Chip>
        </Tooltip>
        <Tooltip label="בקרוב, מעקב כוחות טרם נתמך">
          <Chip value="forces" size="xs" disabled checked={false}>
            כוחות
          </Chip>
        </Tooltip>
      </Group>

      <Box
        style={{
          flex: "1 0 14rem",
          minHeight: "14rem",
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--app-color-border)",
        }}
      >
        <MapContainer
          center={eventLatLng || FALLBACK_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {isLayerOn("location") && eventLatLng && (
            <Marker position={eventLatLng} icon={EVENT_ICON}>
              <Popup>{event.name}</Popup>
            </Marker>
          )}

          {isLayerOn("pads") &&
            landingPads.map((pad) => {
              const padStatus = pad.is_ok ? "available" : "occupied";
              return (
                <Marker
                  key={pad.id}
                  position={toLatLng(pad.location)}
                  icon={buildDivIcon({
                    label: "H",
                    background: LANDING_PAD_STATUS_COLOR_VARS[padStatus],
                  })}
                >
                  <Popup>
                    {pad.name}, {LANDING_PAD_STATUS_LABELS[padStatus]}
                  </Popup>
                </Marker>
              );
            })}

          {isLayerOn("hospitals") &&
            hospitals.map((hospital) => (
              <Marker key={hospital.id} position={toLatLng(hospital.location)} icon={HOSPITAL_ICON}>
                <Popup>{hospital.name}</Popup>
              </Marker>
            ))}

          {isLayerOn("other") &&
            otherLocations.map((location) => (
              <Marker key={location.id} position={toLatLng(location.location)} icon={OTHER_LOCATION_ICON}>
                <Popup>{location.name}</Popup>
              </Marker>
            ))}
        </MapContainer>
      </Box>

      <MapLegend />
    </Stack>
  );
};

export default EvacuationMap;
