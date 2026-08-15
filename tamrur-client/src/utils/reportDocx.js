// External
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";

// Internal application modules
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "../constants/eventStatus";
import { AERIAL_EVAC_LABELS } from "../constants/aerialEvacStatus";
import { URGENCY_LABELS, EVAC_ABILITY_LABELS } from "../constants/casualtyStatus";

/**
 * Mirrors "event report template.docx": a fixed Hebrew RTL form — title,
 * creation date, event name, a general-overview block (type/status/location/
 * times/duration), aerial-evac need, an evacuation-teams list, and a
 * per-casualty block (injury description / treatment / vitals). Every field
 * here is a literal DB value, so this builds the document directly rather
 * than going through a template-filling library.
 */

const FONT = "Segoe UI";

function textRun(text, { bold = false, size } = {}) {
  return new TextRun({
    text: text ?? "",
    bold,
    rightToLeft: true,
    font: FONT,
    ...(size ? { size } : {}),
  });
}

function labeledParagraph(label, value) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { after: 120 },
    children: [textRun(`${label} `, { bold: true }), textRun(value || "-")],
  });
}

function sectionHeader(text) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { before: 240, after: 120 },
    children: [textRun(text, { bold: true })],
  });
}

function plainParagraph(text) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { after: 80 },
    children: [textRun(text)],
  });
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

function formatTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startIso, endIso) {
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
 * Builds the event-report .docx as a Blob from the raw bundle returned by
 * GET /event-report/:eventId.
 *
 * @param {{
 *   event: object,
 *   casualties: object[],
 *   treatments: object[],
 *   vitalsRecords: object[],
 *   evacuations: object[],
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildEventReportDocx({ event, casualties, treatments, vitalsRecords, evacuations }) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 240 },
      children: [textRun('דו"ח סיכום אירוע', { bold: true, size: 36 })],
    }),
  );

  children.push(labeledParagraph('תאריך יצירת הדו"ח:', formatDateTime(new Date().toISOString())));
  children.push(labeledParagraph("שם האירוע:", event.name || event.id));

  children.push(sectionHeader("סקירה כללית:"));
  children.push(labeledParagraph("סוג:", EVENT_TYPE_LABELS[event.type] || event.type));
  children.push(labeledParagraph("סטטוס:", EVENT_STATUS_LABELS[event.status] || event.status));
  children.push(labeledParagraph("מיקום:", formatLocation(event.location)));
  children.push(labeledParagraph("זמן פתיחה:", formatDateTime(event.created_at)));
  children.push(labeledParagraph("זמן סגירה:", formatDateTime(event.closure_at)));
  children.push(labeledParagraph("משך האירוע:", formatDuration(event.created_at, event.closure_at)));

  children.push(
    labeledParagraph("נדרש חילוץ אווירי:", AERIAL_EVAC_LABELS[event["aerial-evac"]] || event["aerial-evac"] || "-"),
  );

  children.push(sectionHeader("צוותי חילוץ:"));
  if (evacuations.length === 0) {
    children.push(plainParagraph("לא דווחו צוותי חילוץ"));
  } else {
    evacuations.forEach((evacuation, index) => {
      children.push(plainParagraph(formatEvacuationTeam(evacuation, index)));
    });
  }

  children.push(sectionHeader("נפגעים:"));
  if (casualties.length === 0) {
    children.push(plainParagraph("לא דווחו נפגעים"));
  } else {
    casualties.forEach((casualty, index) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 160, after: 80 },
          children: [textRun(`נפגע ${index + 1}`, { bold: true })],
        }),
      );

      children.push(labeledParagraph("תיאור פציעה:", casualtyDescription(casualty)));

      const treatmentsForCasualty = treatments.filter((t) => t["injury-id"] === casualty.id);
      const treatmentText =
        treatmentsForCasualty.length > 0
          ? treatmentsForCasualty.map((t) => `${formatTime(t["recorded-at"])} - ${t.treatment}`).join("; ")
          : "לא תועד טיפול";
      children.push(labeledParagraph("טיפול:", treatmentText));

      const vitalsForCasualty = vitalsRecords.filter((v) => v["injury-id"] === casualty.id);
      const vitalsText =
        vitalsForCasualty.length > 0 ? vitalsForCasualty.map(formatVitalsReading).join("; ") : "לא תועדו מדדים";
      children.push(labeledParagraph("מדדים:", vitalsText));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
