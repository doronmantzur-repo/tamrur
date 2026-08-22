// React

// External libraries

// Internal application modules

// Styles

/**
 * Converts a GeoJSON Point to a Leaflet-friendly {lat, lng} pair. GeoJSON
 * orders coordinates as [longitude, latitude] — the opposite of Leaflet's
 * [lat, lng] — so this exists to keep that flip from being reimplemented
 * (or gotten backwards) at every call site.
 *
 * @param {{ type: string, coordinates: [number, number] } | null | undefined} geoPoint
 * @returns {{ lat: number, lng: number } | null}
 */
export function toLatLng(geoPoint) {
  if (!geoPoint?.coordinates) return null;
  const [lng, lat] = geoPoint.coordinates;
  return { lat, lng };
}

/** Degrees of slack allowed when matching a stored point back to a known location (~11m). */
const COORD_MATCH_TOLERANCE = 0.0001;

/**
 * Finds the location whose coordinates match a raw GeoJSON point (e.g. an
 * evacuation's departure/destination point, which the server stores as bare
 * geometry with no reference back to the locations table). Matching allows a
 * small tolerance rather than exact equality, since a point can lose a
 * sliver of precision on its round trip through the DB's geography type.
 *
 * @param {{ type: string, coordinates: [number, number] } | null | undefined} point
 * @param {Array<{ location?: { coordinates: [number, number] } }>} locations
 * @returns {object | null} The matching location, or null if none is close enough.
 */
export function findLocationByPoint(point, locations) {
  if (!point?.coordinates) return null;
  const [lng, lat] = point.coordinates;

  return (
    locations.find((location) => {
      const coords = location.location?.coordinates;
      if (!coords) return false;
      return Math.abs(coords[0] - lng) < COORD_MATCH_TOLERANCE && Math.abs(coords[1] - lat) < COORD_MATCH_TOLERANCE;
    }) || null
  );
}

/**
 * Splits a `locations` list into its three marker groups, dropping any
 * location with no coordinates yet. Shared so every map that renders
 * locations groups them the same way instead of re-implementing the filter.
 *
 * @param {Array<object>} locations
 * @returns {{ landingPads: Array<object>, hospitals: Array<object>, otherLocations: Array<object> }}
 */
export function splitLocationsByType(locations) {
  const withCoords = locations.filter((location) => location.location);
  return {
    landingPads: withCoords.filter((location) => location.type === "landing_pad"),
    hospitals: withCoords.filter((location) => location.type === "hospital"),
    otherLocations: withCoords.filter((location) => location.type === "exchange_point"),
  };
}
