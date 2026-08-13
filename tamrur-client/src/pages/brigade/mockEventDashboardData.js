// React

// External libraries

// Internal application modules

// Styles

/**
 * Hardcoded injuries data, still used until that piece is connected to
 * Redux/the API — owned by a teammate's in-progress work elsewhere.
 * Timestamps are generated relative to "now". Everything else on the
 * brigade dashboard (event, locations, aerial missions, evacuations) is
 * already API-backed.
 */

const now = Date.now();
const minutesAgo = (minutes) => new Date(now - minutes * 60 * 1000).toISOString();

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
