// React

// External libraries

// Internal application modules

// Styles

/** Builds an ISO timestamp `daysAgo` days before now, at the given local hour:minute. */
function offsetTimestamp(daysAgo, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/** A GeoJSON Point, same shape the real API returns for `event.location`. */
function point(lng, lat) {
  return { type: "Point", coordinates: [lng, lat] };
}

/**
 * Standalone mock events for the brigade's event queue board, until it's
 * wired to the real /events endpoint. Field names mirror the real event
 * shape from eventsSlice.js (id, name, type, status, created_at,
 * closure_at, location) so swapping this for real Redux-backed data later
 * is a drop-in change, not a reshape. Spans several days and every status
 * so the date nav and each view have something to show at every step back.
 * `location` coordinates are made up (scattered around Jerusalem) — a
 * stand-in for a real event location until that's wired up too.
 */
export const mockQueueEvents = [
  { id: 1, name: "פיצוץ ליד מחסום 7", type: "explosive", status: "evaluated", created_at: offsetTimestamp(0, 8, 14), closure_at: null, location: point(35.20, 31.79) },
  { id: 2, name: "ירי צלפים בציר הראשי", type: "gunfire", status: "evaluated", created_at: offsetTimestamp(0, 9, 40), closure_at: null, location: point(35.235, 31.805) },
  { id: 3, name: "פגז מרגמה ליד המוצב", type: "mortar", status: "controlled", created_at: offsetTimestamp(0, 7, 2), closure_at: null, location: point(35.19, 31.775) },
  { id: 4, name: "רכב חשוד ברכס המזרחי", type: "explosive", status: "ready_for_evacuation", created_at: offsetTimestamp(0, 6, 15), closure_at: null, location: point(35.26, 31.76) },
  { id: 5, name: "זרחן לבן באזור התעשייה", type: "phosphorus", status: "evacuation_started", created_at: offsetTimestamp(0, 5, 30), closure_at: null, location: point(35.21, 31.72) },

  { id: 6, name: "ירי נ״ט על שיירה", type: "anti-tank", status: "controlled", created_at: offsetTimestamp(1, 14, 20), closure_at: null, location: point(35.25, 31.75) },
  { id: 7, name: "פיצוץ מטען בציר הגישה", type: "explosive", status: "ready_for_evacuation", created_at: offsetTimestamp(2, 11, 5), closure_at: null, location: point(35.15, 31.765) },
  { id: 8, name: "ירי בשכונה המזרחית", type: "gunfire", status: "evacuation_started", created_at: offsetTimestamp(1, 16, 48), closure_at: null, location: point(35.27, 31.81) },
  { id: 9, name: "מרגמות על עמדת תצפית", type: "mortar", status: "evaluated", created_at: offsetTimestamp(1, 10, 12), closure_at: null, location: point(35.22, 31.70) },

  { id: 10, name: "פיצוץ במחצבה", type: "explosive", status: "completed", created_at: offsetTimestamp(3, 9, 0), closure_at: offsetTimestamp(2, 18, 40), location: point(35.18, 31.83) },
  { id: 11, name: "ירי בודד ליד הגדר", type: "gunfire", status: "completed", created_at: offsetTimestamp(4, 12, 30), closure_at: offsetTimestamp(4, 13, 10), location: point(35.10, 31.78) },
  { id: 12, name: "זרחן באזור החקלאי", type: "phosphorus", status: "completed", created_at: offsetTimestamp(2, 8, 45), closure_at: offsetTimestamp(0, 7, 30), location: point(35.23, 31.77) },
  { id: 13, name: "נ״ט על נקודת ציון 12", type: "anti-tank", status: "completed", created_at: offsetTimestamp(5, 15, 0), closure_at: offsetTimestamp(3, 9, 20), location: point(35.30, 31.68) },
  { id: 14, name: "מרגמה בודדת ליד השכם", type: "mortar", status: "completed", created_at: offsetTimestamp(0, 6, 50), closure_at: offsetTimestamp(0, 11, 15), location: point(35.24, 31.73) },
  { id: 15, name: "פיצוץ קטן בשוק", type: "explosive", status: "completed", created_at: offsetTimestamp(1, 19, 0), closure_at: offsetTimestamp(0, 8, 5), location: point(35.14, 31.71) },
];
