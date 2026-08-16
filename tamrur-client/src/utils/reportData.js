// Internal application modules
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../constants/eventStatus";
import { AERIAL_EVAC_LABELS } from "../constants/aerialEvacStatus";
import { URGENCY_LABELS, EVAC_ABILITY_LABELS } from "../constants/casualtyStatus";

/**
 * Pure data transforms shared by the on-screen report preview and the .docx
 * builder, so both stay in sync with a single source of truth for what the
 * event report contains and how each field is formatted.
 */

export function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

export function formatTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return "האירוע טרם הסתיים";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} דקות`;
  if (minutes === 0) return `${hours} שעות`;
  return `${hours} שעות ו-${minutes} דקות`;
}

function formatLocation(location) {
  const coordinates = location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return "-";
  const [lng, lat] = coordinates;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

const EVAC_METHOD_LABELS = { walk: "הליכה", ride: "רכב", aerial: "אווירי" };
const EVAC_STATUS_LABELS = { not_started: "טרם החל", started: "בעיצומו", completed: "הושלם" };

function formatEvacuationTeam(evacuation, index) {
  const parts = [
    evacuation.force_radio_sign ? `כינוי קשר: ${evacuation.force_radio_sign}` : null,
    evacuation.method ? `שיטה: ${EVAC_METHOD_LABELS[evacuation.method] || evacuation.method}` : null,
    evacuation.status ? `סטטוס: ${EVAC_STATUS_LABELS[evacuation.status] || evacuation.status}` : null,
  ].filter(Boolean);
  return `${index + 1}. ${parts.join(", ") || "לא צוינו פרטים"}`;
}

function casualtyDescription(casualty) {
  if (casualty.description) return casualty.description;
  const urgency = URGENCY_LABELS[casualty.urgency] || casualty.urgency;
  const ability = EVAC_ABILITY_LABELS[casualty["evac-ability"]] || casualty["evac-ability"];
  const parts = [urgency && `דחיפות: ${urgency}`, ability && `יכולת פינוי: ${ability}`].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "לא צוין";
}

function formatBloodPressure(bp) {
  if (!bp) return null;
  if (typeof bp === "object") {
    const systolic = bp.systolic ?? bp.sys;
    const diastolic = bp.diastolic ?? bp.dia;
    if (systolic != null && diastolic != null) return `${systolic}/${diastolic}`;
    return Object.values(bp).join("/");
  }
  return String(bp);
}

function formatVitalsReading(reading) {
  const bloodPressure = formatBloodPressure(reading["blood-pressure"]);
  const parts = [
    reading.pulse != null && `דופק ${reading.pulse}`,
    bloodPressure && `ל"ד ${bloodPressure}`,
    reading.spo2 != null && `סטורציה ${reading.spo2}%`,
  ].filter(Boolean);
  return `${formatTime(reading["recorded-at"])} - ${parts.join(", ") || "אין נתונים"}`;
}

/**
 * Builds a plain-data view model for the event report — title, labeled
 * overview fields, an evacuation-team list, and a per-casualty block — from
 * the raw bundle returned by GET /event-report/:eventId. Shared by the
 * on-screen preview (JSX) and the .docx builder so both render exactly the
 * same content from a single source of truth.
 *
 * @param {{
 *   event: object,
 *   casualties: object[],
 *   treatments: object[],
 *   vitalsRecords: object[],
 *   evacuations: object[],
 * }} data
 */
export function buildReportViewModel({ event, casualties, treatments, vitalsRecords, evacuations }) {
  const overview = [
    { label: "סוג:", value: EVENT_TYPE_LABELS[event.type] || event.type },
    { label: "סטטוס:", value: EVENT_STATUS_LABELS[event.status] || event.status },
    { label: "מיקום:", value: formatLocation(event.location) },
    { label: "זמן פתיחה:", value: formatDateTime(event.created_at) },
    { label: "זמן סגירה:", value: formatDateTime(event.closure_at) },
    { label: "משך האירוע:", value: formatDuration(event.created_at, event.closure_at) },
  ];

  const evacuationTeams =
    evacuations.length === 0
      ? ["לא דווחו צוותי חילוץ"]
      : evacuations.map((evacuation, index) => formatEvacuationTeam(evacuation, index));

  const casualtyBlocks = casualties.map((casualty, index) => {
    const treatmentsForCasualty = treatments.filter((t) => t["injury-id"] === casualty.id);
    const treatmentText =
      treatmentsForCasualty.length > 0
        ? treatmentsForCasualty.map((t) => `${formatTime(t["recorded-at"])} - ${t.treatment}`).join("; ")
        : "לא תועד טיפול";

    const vitalsForCasualty = vitalsRecords.filter((v) => v["injury-id"] === casualty.id);
    const vitalsText =
      vitalsForCasualty.length > 0 ? vitalsForCasualty.map(formatVitalsReading).join("; ") : "לא תועדו מדדים";

    return {
      title: `נפגע ${index + 1}`,
      fields: [
        { label: "תיאור פציעה:", value: casualtyDescription(casualty) },
        { label: "טיפול:", value: treatmentText },
        { label: "מדדים:", value: vitalsText },
      ],
    };
  });

  return {
    title: 'דו"ח סיכום אירוע',
    createdAt: formatDateTime(new Date().toISOString()),
    eventName: event.name || event.id,
    overview,
    aerialEvac: {
      label: "נדרש חילוץ אווירי:",
      value: AERIAL_EVAC_LABELS[event["aerial-evac"]] || event["aerial-evac"] || "-",
    },
    evacuationTeams,
    hasCasualties: casualties.length > 0,
    casualties: casualtyBlocks,
  };
}
