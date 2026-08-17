// React
import { useEffect, useMemo } from "react";

// External libraries
import { Box, Group, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Tooltip, TileLayer, useMap } from "react-leaflet";

// Internal application modules
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../../constants/eventStatus";
import { toLatLng } from "../../utils/geo";

// Styles
import "leaflet/dist/leaflet.css";

/** CARTO basemap tiles, matching whichever mode the app is in — same family EvacuationMap uses. */
const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

/** Used only when there's nothing to show yet, so the map still has somewhere to sit. */
const FALLBACK_CENTER = { lat: 31.7683, lng: 35.2137 };
const FALLBACK_ZOOM = 11;

/**
 * Builds a small circular div-icon marker colored by status, same recipe
 * EvacuationMap uses for its own markers (a real DOM element, so CSS vars
 * resolve fine — unlike Leaflet's SVG path renderer, which needs hex).
 *
 * @param {{ color: string, dimmed?: boolean }} options
 * @returns {L.DivIcon}
 */
function buildEventIcon({ color, dimmed = false }) {
  const size = 18;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};opacity:${dimmed ? 0.6 : 1};
      border:2px solid var(--app-color-background);
      box-shadow:0 0 0 3px color-mix(in srgb, ${color} 30%, transparent);
    "></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Recenters/fits the map whenever the set of visible markers changes (the
 * date nav or search can both change it) — `MapContainer`'s own `bounds`
 * prop only applies once, on mount, so a plain prop change wouldn't move
 * the view on its own.
 *
 * @param {{ positions: Array<{ lat: number, lng: number }> }} props
 * @returns {null}
 */
function FitToMarkers({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15 });
    }
  }, [positions, map]);

  return null;
}

/** Legend row explaining the marker colors, same pattern as EvacuationMap's own legend. */
function MapLegend() {
  return (
    <Group gap="lg" wrap="wrap" mt="xs">
      {Object.entries(EVENT_STATUS_LABELS).map(([key, label]) => (
        <Group key={key} gap={6} wrap="nowrap">
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: EVENT_STATUS_COLOR_VARS[key],
            }}
          />
          <Text fz="xs" c="var(--app-color-text-muted)">
            {label}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

/**
 * A real Leaflet map of every event visible on the queue board's currently
 * selected date, alongside the table and (upcoming) kanban views — same
 * map primitive as the single-event dashboard's EvacuationMap (CARTO tiles
 * switching with the app's theme, div-icon markers), just plotting every
 * event at once instead of one event's location. Markers are colored by
 * status, matching the table's badges; clicking one opens that event's
 * single-event dashboard. `location` on the mock events is a made-up
 * GeoJSON point standing in for a real one until this is wired to the API.
 *
 * @param {{ events: Array<object> }} props
 * @returns {JSX.Element} The event queue map.
 */
const EventQueueMap = ({ events }) => {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const positioned = useMemo(
    () => events.map((event) => ({ event, latLng: toLatLng(event.location) })).filter((e) => e.latLng),
    [events],
  );
  const positions = useMemo(() => positioned.map((e) => e.latLng), [positioned]);

  return (
    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--mantine-radius-sm)",
          border: "1px solid var(--app-color-border)",
          overflow: "hidden",
        }}
      >
        <MapContainer center={FALLBACK_CENTER} zoom={FALLBACK_ZOOM} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={colorScheme === "dark" ? TILE_URLS.dark : TILE_URLS.light}
          />

          <FitToMarkers positions={positions} />

          {positioned.map(({ event, latLng }) => {
            const color = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";
            const isCompleted = event.status === COMPLETED_STATUS;

            return (
              <Marker
                key={event.id}
                position={latLng}
                icon={buildEventIcon({ color, dimmed: isCompleted })}
                eventHandlers={{ click: () => navigate(`/brigade/${event.id}`) }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <Text fz="xs" fw={700}>
                    {event.name}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {EVENT_TYPE_LABELS[event.type] || event.type} &middot; {EVENT_STATUS_LABELS[event.status] || event.status}
                  </Text>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </Box>

      <MapLegend />
    </Stack>
  );
};

export default EventQueueMap;
