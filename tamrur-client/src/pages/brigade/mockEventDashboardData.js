// React

// External libraries

// Internal application modules

// Styles

/**
 * Hardcoded data for the brigade event dashboard, used until it's connected
 * to Redux/the API. Timestamps are generated relative to "now" so the timer
 * and evacuation times feel live when the page loads.
 */

const now = Date.now();
const minutesAgo = (minutes) => new Date(now - minutes * 60 * 1000).toISOString();
const minutesFromNow = (minutes) => new Date(now + minutes * 60 * 1000).toISOString();

export const mockEvent = {
  id: "evt-1",
  name: "פיצוץ מטען בציר הראשי",
  description: "פגיעה ממטען חבלה בסיור רגלי בציר הראשי, שלושה כלי רכב מעורבים.",
  type: "explosive",
  status: "ready_for_evacuation",
  created_at: minutesAgo(42),
  closure_at: null,
  location: { lat: 31.7715, lng: 35.2172 },
  "aerial-evac": "in_progress",
};

/**
 * Stand-in for the future locations table: landing pads, hospitals, and
 * other named points (e.g. an Ambulance Exchange Point) that departure/
 * destination fields can reference. `status` only applies to landing pads.
 */
export const mockLocations = [
  { id: "pad-1", name: "משטח נחיתה 1", type: "landing_pad", location: { lat: 31.774, lng: 35.221 }, status: "available" },
  { id: "pad-2", name: "משטח נחיתה 2", type: "landing_pad", location: { lat: 31.768, lng: 35.209 }, status: "occupied" },
  { id: "hosp-1", name: "בי״ח סורוקה", type: "hospital", location: { lat: 31.2589, lng: 34.8009 } },
  { id: "hosp-2", name: "בי״ח שיבא", type: "hospital", location: { lat: 32.0392, lng: 34.8443 } },
  { id: "aep-1", name: "נקודת חילוף אריה", type: "other", location: { lat: 31.7736, lng: 35.2145 } },
];

export const mockInjuries = [
  {
    id: "inj-1",
    urgency: "urgent",
    "evac-ability": "lie",
    "evac-priority": 1,
    escort: true,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(40),
  },
  {
    id: "inj-2",
    urgency: "urgent",
    "evac-ability": "lie",
    "evac-priority": 2,
    escort: true,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(39),
  },
  {
    id: "inj-3",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 4,
    escort: false,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(38),
  },
  {
    id: "inj-4",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 5,
    escort: false,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(37),
  },
  {
    id: "inj-5",
    urgency: "expectant",
    "evac-ability": "lie",
    "evac-priority": 1,
    escort: true,
    "recommended-evac-dest": "בי״ח שיבא",
    "evac-ready": true,
    created_at: minutesAgo(36),
  },
  {
    id: "inj-6",
    urgency: "non-urgent",
    "evac-ability": "walk",
    "evac-priority": 6,
    escort: false,
    "recommended-evac-dest": "בי״ח שיבא",
    "evac-ready": true,
    created_at: minutesAgo(30),
  },
  {
    id: "inj-7",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 5,
    escort: false,
    "recommended-evac-dest": null,
    "evac-ready": false,
    created_at: minutesAgo(12),
  },
];

/**
 * Fields mirror the real `evacuations` table (method, departure/destination
 * point, radio callsign, start time, ETA, aerial mission id, status) — no
 * link back to injuries, since the DB doesn't support that relationship.
 * `evac-2` simulates a row freshly auto-created off an airforce approval:
 * still missing the fields the brigade has to fill in by hand.
 */
export const mockEvacuations = [
  {
    id: "evac-1",
    method: "chopper",
    departurePoint: "aep-1",
    destinationPoint: "hosp-2",
    forceRadioSign: "מטיף 21",
    startTime: minutesAgo(18),
    eta: minutesFromNow(4),
    aerialMissionId: "עיט 4",
    status: "in_progress",
  },
  {
    id: "evac-2",
    method: "chopper",
    departurePoint: null,
    destinationPoint: null,
    forceRadioSign: "אריה 3",
    startTime: null,
    eta: null,
    aerialMissionId: null,
    status: "not_started",
  },
];
