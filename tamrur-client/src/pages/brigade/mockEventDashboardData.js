// React

// External libraries

// Internal application modules

// Styles

/**
 * Hardcoded casualties data, still used until that piece is connected to
 * Redux/the API — owned by a teammate's in-progress work elsewhere.
 * Timestamps are generated relative to "now". Everything else on the
 * brigade dashboard (event, locations, aerial missions, evacuations) is
 * already API-backed.
 */

const now = Date.now();
const minutesAgo = (minutes) => new Date(now - minutes * 60 * 1000).toISOString();

export const mockCasualties = [
  {
    id: "cas-1",
    urgency: "urgent",
    "evac-ability": "lie",
    "evac-priority": 1,
    escort: true,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(40),
  },
  {
    id: "cas-2",
    urgency: "urgent",
    "evac-ability": "lie",
    "evac-priority": 2,
    escort: true,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(39),
  },
  {
    id: "cas-3",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 4,
    escort: false,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(38),
  },
  {
    id: "cas-4",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 5,
    escort: false,
    "recommended-evac-dest": "בי״ח סורוקה",
    "evac-ready": true,
    created_at: minutesAgo(37),
  },
  {
    id: "cas-5",
    urgency: "expectant",
    "evac-ability": "lie",
    "evac-priority": 1,
    escort: true,
    "recommended-evac-dest": "בי״ח שיבא",
    "evac-ready": true,
    created_at: minutesAgo(36),
  },
  {
    id: "cas-6",
    urgency: "non-urgent",
    "evac-ability": "walk",
    "evac-priority": 6,
    escort: false,
    "recommended-evac-dest": "בי״ח שיבא",
    "evac-ready": true,
    created_at: minutesAgo(30),
  },
  {
    id: "cas-7",
    urgency: "non-urgent",
    "evac-ability": "sit",
    "evac-priority": 5,
    escort: false,
    "recommended-evac-dest": null,
    "evac-ready": false,
    created_at: minutesAgo(12),
  },
];
