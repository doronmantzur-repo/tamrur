// React
import { useState } from "react";

// External libraries
import {
  Box,
  Chip,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconAmbulance,
  IconBuildingHospital,
  IconUsers,
} from "@tabler/icons-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Internal application modules
import {
  LANDING_PAD_STATUS_COLOR_VARS,
  LANDING_PAD_STATUS_LABELS,
} from "../../constants/evacuationMethod";
import { FORCE_ICON_COLOR, FORCE_TYPE_META, FORCE_TYPE_ICONS, forceLabel } from "../../constants/forces";
import { buildDivIcon, tablerSvg } from "../../utils/leafletIcons";
import { toLatLng } from "../../utils/geo";
import { LegendEntry, LegendBadge } from "./MapLegendPrimitives";

// Styles
import "leaflet/dist/leaflet.css";

/** CARTO basemap tiles, matching whichever mode the app is in. Same tile family (and attribution) in both modes, just the dark/light variant. */
const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

/**
 * The map's fixed reference frame: the border-area AO these training
 * scenarios are set in. Bint Jbeil anchors the view; Dovev sits south of it,
 * so mirroring Bint Jbeil's latitude across Dovev's for the north edge (i.e.
 * the box spans exactly as far north of Bint Jbeil as Dovev sits south of
 * it) puts Bint Jbeil at the vertical center and Dovev right on the bottom
 * edge, however tall the map card actually renders — fitBounds computes
 * zoom from the real container size, so this holds regardless of viewport,
 * unlike a hardcoded center+zoom pair.
 */
const BINT_JBEIL = { lat: 33.1214, lng: 35.4247 };
const DOVEV = { lat: 33.0522, lng: 35.3859 };
const LNG_HALF_SPAN = 0.05;
const MAP_BOUNDS = [
  [DOVEV.lat, BINT_JBEIL.lng - LNG_HALF_SPAN],
  [2 * BINT_JBEIL.lat - DOVEV.lat, BINT_JBEIL.lng + LNG_HALF_SPAN],
];

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

const EVENT_ICON = buildDivIcon({
  label: "!",
  background: "var(--app-color-error)",
  size: 28,
  glow: true,
});
const HOSPITAL_ICON = buildDivIcon({
  label: tablerSvg(HOSPITAL_ICON_PATHS),
  background: "var(--app-color-success)",
  size: 26,
  glow: true,
});
const OTHER_LOCATION_ICON = buildDivIcon({
  label: tablerSvg(AMBULANCE_ICON_PATHS),
  background: "var(--app-color-text-muted)",
  size: 26,
  glow: true,
});

/** Opens a marker's popup on hover (not just click) and closes it when the pointer leaves, so the same popup content shows on both interactions instead of a separate tooltip. */
const OPEN_POPUP_ON_HOVER = {
  mouseover: (e) => e.target.openPopup(),
  mouseout: (e) => e.target.closePopup(),
};

/**
 * Legend explaining the map's symbols, grouped into a "מיקומים" section
 * (event/landing pads/hospitals/other locations) and a "כוחות" section
 * (forces), each shown only while its layer(s) are actually toggled on --
 * so the legend always matches what's currently drawn on the map instead of
 * listing every possible symbol regardless of relevance.
 *
 * @param {{ isLayerOn: (key: string) => boolean }} props
 */
function MapLegend({ isLayerOn }) {
  const showLocations =
    isLayerOn("location") ||
    isLayerOn("pads") ||
    isLayerOn("hospitals") ||
    isLayerOn("other");
  const showForces = isLayerOn("forces");

  if (!showLocations && !showForces) return null;

  return (
    <Stack gap="xs" mt="xs">
      {showLocations && (
        <Stack gap={6}>
          <Text fz="xs" fw={700} c="var(--app-color-text-muted)">
            מיקומים
          </Text>
          <SimpleGrid cols={3} spacing="sm" verticalSpacing={6}>
            {isLayerOn("location") && (
              <LegendEntry label="מיקום אירוע">
                <LegendBadge background="var(--app-color-error)">!</LegendBadge>
              </LegendEntry>
            )}

            {isLayerOn("pads") &&
              Object.entries(LANDING_PAD_STATUS_LABELS).map(([key, label]) => (
                <LegendEntry key={key} label={`משטח נחיתה ${label}`}>
                  <LegendBadge background={LANDING_PAD_STATUS_COLOR_VARS[key]}>
                    H
                  </LegendBadge>
                </LegendEntry>
              ))}

            {isLayerOn("hospitals") && (
              <LegendEntry label="בית חולים">
                <IconBuildingHospital
                  size={16}
                  stroke={1.8}
                  color="var(--app-color-success)"
                />
              </LegendEntry>
            )}

            {isLayerOn("other") && (
              <LegendEntry label="נקודת חילוף / מיקום אחר">
                <IconAmbulance
                  size={16}
                  stroke={1.8}
                  color="var(--app-color-text-muted)"
                />
              </LegendEntry>
            )}
          </SimpleGrid>
        </Stack>
      )}

      {showForces && (
        <Stack gap={6}>
          <Text fz="xs" fw={700} c="var(--app-color-text-muted)">
            כוחות
          </Text>
          <SimpleGrid cols={3} spacing="sm" verticalSpacing={6}>
            {Object.entries(FORCE_TYPE_META).map(([type, meta]) => (
              <LegendEntry key={type} label={meta.label}>
                <LegendBadge background={FORCE_ICON_COLOR}>
                  {meta.image ? (
                    <img
                      src={meta.image}
                      alt=""
                      style={{
                        width: "60%",
                        height: "60%",
                        objectFit: "contain",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                  ) : (
                    <IconUsers size={10} stroke={2} color="#fff" />
                  )}
                </LegendBadge>
              </LegendEntry>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Renders the event map: the event location (exclamation marker), landing
 * pads (an "H" marker colored by pad status), hospitals, other named
 * locations (e.g. an ambulance exchange point), and forces (the static
 * reference table of units, one icon per `force_type`), each toggleable via
 * a layer chip row, plus a legend explaining the symbols. Tiles switch
 * between CARTO's dark and light basemap to match the app's own theme
 * toggle. Evacuation routes aren't supported yet, so that chip stays a
 * disabled placeholder until routing is available; forces, unlike that
 * placeholder, are static reference data, not live tracking.
 *
 * The initial view is a fixed frame (see MAP_BOUNDS) rather than centering
 * on the event: Bint Jbeil sits at vertical center, Dovev right at the
 * bottom edge — neither is marked, this only shapes the initial viewport.
 * The event marker still renders wherever the event actually is, but if
 * that's outside this frame it won't be visible without panning/zooming out.
 *
 * @param {{ event: object, locations: Array<object>, forces: Array<object> }} props
 * @returns {JSX.Element} The evacuation map.
 */
const EvacuationMap = ({ event, locations, forces }) => {
  const { colorScheme } = useMantineColorScheme();
  const [visibleLayers, setVisibleLayers] = useState([
    "location",
    "pads",
    "hospitals",
    "other",
    "forces",
  ]);

  const isLayerOn = (key) => visibleLayers.includes(key);

  const withCoords = locations.filter((location) => location.location);
  const landingPads = withCoords.filter(
    (location) => location.type === "landing_pad",
  );
  const hospitals = withCoords.filter(
    (location) => location.type === "hospital",
  );
  const otherLocations = withCoords.filter(
    (location) => location.type === "exchange_point",
  );
  const forcesWithCoords = forces.filter((force) => force.location);
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
          <Chip value="forces" size="xs">
            כוחות
          </Chip>
        </Chip.Group>
        <Tooltip label="בקרוב, מסלולי פינוי טרם נתמכים">
          <Chip value="routes" size="xs" disabled checked={false}>
            מסלולי פינוי
          </Chip>
        </Tooltip>
      </Group>

      <Box
        style={{
          flex: "1 1 auto",
          minHeight: "10rem",
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--app-color-border)",
        }}
      >
        <MapContainer
          bounds={MAP_BOUNDS}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            // Keyed on colorScheme so switching modes fully remounts this layer
            // instead of updating one in place — Leaflet only sets a GridLayer's
            // container className once, in _initContainer, so an in-place prop
            // change left the dark-mode brightness class stuck on in light mode.
            key={colorScheme}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={colorScheme === "dark" ? TILE_URLS.dark : TILE_URLS.light}
            className={
              colorScheme === "dark" ? "app-map-tiles-dark" : undefined
            }
          />

          {isLayerOn("location") && eventLatLng && (
            <Marker
              position={eventLatLng}
              icon={EVENT_ICON}
              eventHandlers={OPEN_POPUP_ON_HOVER}
            >
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
                    glow: true,
                  })}
                  eventHandlers={OPEN_POPUP_ON_HOVER}
                >
                  <Popup>
                    {pad.name}, {LANDING_PAD_STATUS_LABELS[padStatus]}
                  </Popup>
                </Marker>
              );
            })}

          {isLayerOn("hospitals") &&
            hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                position={toLatLng(hospital.location)}
                icon={HOSPITAL_ICON}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{hospital.name}</Popup>
              </Marker>
            ))}

          {isLayerOn("other") &&
            otherLocations.map((location) => (
              <Marker
                key={location.id}
                position={toLatLng(location.location)}
                icon={OTHER_LOCATION_ICON}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{location.name}</Popup>
              </Marker>
            ))}

          {isLayerOn("forces") &&
            forcesWithCoords.map((force) => (
              <Marker
                key={force.id}
                position={toLatLng(force.location)}
                icon={FORCE_TYPE_ICONS[force.type]}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{forceLabel(force)}</Popup>
              </Marker>
            ))}
        </MapContainer>
      </Box>

      <Box style={{ flexShrink: 0, height: "12rem", overflow: "hidden" }}>
        <MapLegend isLayerOn={isLayerOn} />
      </Box>
    </Stack>
  );
};

export default EvacuationMap;
