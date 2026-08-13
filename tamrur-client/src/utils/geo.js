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
