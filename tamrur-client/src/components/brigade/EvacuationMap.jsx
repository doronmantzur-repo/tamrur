// React
import { useState } from "react";

// External libraries
import { Box, Chip, Group, Stack, Text, Tooltip, useMantineColorScheme } from "@mantine/core";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

// Internal application modules
import { colorTokens } from "../../theme";
import {
  EVAC_METHOD_LABELS,
  LANDING_PAD_STATUS_COLOR_VARS,
  LANDING_PAD_STATUS_LABELS,
} from "../../constants/evacuationMethod";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";

// Styles
import "leaflet/dist/leaflet.css";

const DEFAULT_ZOOM = 14;

/** Maps semantic status keys to theme color-token keys, since Leaflet's SVG renderer needs real hex values, not CSS vars. */
const EVAC_STATUS_TOKEN_KEY = {
  no_neede: "textMuted",
  needed: "warning",
  in_progress: "primary",
  approved: "success",
  denied: "error",
};

/** Route status keys shown in the legend / used for route coloring. */
const ROUTE_STATUS_ORDER = ["needed", "in_progress", "approved", "denied"];

/**
 * Builds a small circular div-icon marker. Colors are CSS vars, safe here
 * since Leaflet renders div-icons as real DOM elements (unlike its SVG path
 * renderer, which needs resolved hex — see EVAC_STATUS_TOKEN_KEY above).
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

const EVENT_ICON = buildDivIcon({ label: "!", background: "var(--app-color-error)", size: 28, glow: true });

/**
 * Small legend explaining the map's symbols: the event marker, landing pad
 * status colors, and evacuation route status colors.
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

      {ROUTE_STATUS_ORDER.map((key) => (
        <Group key={key} gap={6} wrap="nowrap">
          <Box
            style={{
              width: 16,
              height: 3,
              borderRadius: "2px",
              backgroundColor: AERIAL_EVAC_COLOR_VARS[key],
            }}
          />
          <Text fz="xs" c="var(--app-color-text-muted)">
            מסלול פינוי {AERIAL_EVAC_LABELS[key]}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

/**
 * Renders the event map: the event location (exclamation marker), landing
 * pads (an "H" marker colored by pad status), and evacuation routes
 * (departure → destination), each toggleable via a layer chip row, plus a
 * legend explaining the symbols.
 *
 * @param {{ event: object, landingPads: Array<object>, evacuations: Array<object> }} props
 * @returns {JSX.Element} The evacuation map.
 */
const EvacuationMap = ({ event, landingPads, evacuations }) => {
  const { colorScheme } = useMantineColorScheme();
  const tokens = colorScheme === "dark" ? colorTokens.dark : colorTokens.light;
  const [visibleLayers, setVisibleLayers] = useState(["location", "pads", "routes"]);

  const isLayerOn = (key) => visibleLayers.includes(key);

  return (
    <Stack gap={0}>
      <Group gap="xs" mb="xs" wrap="wrap">
        <Chip.Group multiple value={visibleLayers} onChange={setVisibleLayers}>
          <Chip value="location" size="xs">
            מיקום אירוע
          </Chip>
          <Chip value="pads" size="xs">
            משטחי נחיתה
          </Chip>
          <Chip value="routes" size="xs">
            מסלולי פינוי
          </Chip>
        </Chip.Group>
        <Tooltip label="בקרוב, מעקב כוחות טרם נתמך">
          <Chip value="forces" size="xs" disabled checked={false}>
            כוחות
          </Chip>
        </Tooltip>
      </Group>

      <Box
        style={{
          height: "26rem",
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--app-color-border)",
        }}
      >
        <MapContainer
          center={event.location}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {isLayerOn("location") && (
            <Marker position={event.location} icon={EVENT_ICON}>
              <Popup>{event.name}</Popup>
            </Marker>
          )}

          {isLayerOn("pads") &&
            landingPads.map((pad) => (
              <Marker
                key={pad.id}
                position={pad.location}
                icon={buildDivIcon({
                  label: "H",
                  background: LANDING_PAD_STATUS_COLOR_VARS[pad.status] || "var(--app-color-text-muted)",
                })}
              >
                <Popup>{LANDING_PAD_STATUS_LABELS[pad.status] || pad.status}</Popup>
              </Marker>
            ))}

          {isLayerOn("routes") &&
            evacuations.map((evac) => {
              const color = tokens[EVAC_STATUS_TOKEN_KEY[evac.status]] || tokens.textMuted;

              return (
                <Polyline
                  key={evac.id}
                  positions={[
                    [evac.departure.lat, evac.departure.lng],
                    [evac.destination.lat, evac.destination.lng],
                  ]}
                  pathOptions={{ color, weight: 3 }}
                >
                  <Popup>{EVAC_METHOD_LABELS[evac.method] || evac.method}</Popup>
                </Polyline>
              );
            })}
        </MapContainer>
      </Box>

      <MapLegend />
    </Stack>
  );
};

export default EvacuationMap;
