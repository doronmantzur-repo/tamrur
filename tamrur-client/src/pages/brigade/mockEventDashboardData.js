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

export const mockLandingPads = [
  { id: "pad-1", location: { lat: 31.774, lng: 35.221 }, status: "available" },
  { id: "pad-2", location: { lat: 31.768, lng: 35.209 }, status: "occupied" },
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

export const mockEvacuations = [
  {
    id: "evac-1",
    method: "vehicle",
    departure: { lat: 31.7715, lng: 35.2172 },
    destination: { lat: 31.768, lng: 35.209 },
    eta: minutesAgo(22),
    missionId: null,
    radioSign: "אריה 3",
    status: "approved",
    createdAt: minutesAgo(35),
    injuryIds: ["inj-5", "inj-6", "inj-3"],
  },
  {
    id: "evac-2",
    method: "chopper",
    departure: { lat: 31.7715, lng: 35.2172 },
    destination: { lat: 31.774, lng: 35.221 },
    eta: minutesAgo(5),
    missionId: "עיט 4",
    radioSign: "מטיף 21",
    status: "in_progress",
    createdAt: minutesAgo(18),
    injuryIds: ["inj-1", "inj-2", "inj-4"],
  },
];
