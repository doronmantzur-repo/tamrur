// External
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";

/**
 * Renders a report view model (see reportData.js's buildReportViewModel) as
 * a .docx Blob, mirroring "event report template.docx": a fixed Hebrew RTL
 * form — title, creation date, event name, a general-overview block, aerial-
 * evac need, an evacuation-teams list, and a per-casualty block. Takes an
 * already-built view model rather than the raw bundle so the saved file is
 * guaranteed to match whatever the analyst reviewed on screen before saving.
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

/**
 * Builds the event-report .docx as a Blob from a view model already built by
 * buildReportViewModel.
 *
 * @param {object} viewModel - See reportData.js's buildReportViewModel.
 * @returns {Promise<Blob>}
 */
export async function buildEventReportDocx(viewModel) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 240 },
      children: [textRun(viewModel.title, { bold: true, size: 36 })],
    }),
  );

  children.push(labeledParagraph('תאריך יצירת הדו"ח:', viewModel.createdAt));
  children.push(labeledParagraph("שם האירוע:", viewModel.eventName));

  children.push(sectionHeader("סקירה כללית:"));
  viewModel.overview.forEach(({ label, value }) => children.push(labeledParagraph(label, value)));

  children.push(labeledParagraph(viewModel.aerialEvac.label, viewModel.aerialEvac.value));

  children.push(sectionHeader("צוותי חילוץ:"));
  viewModel.evacuationTeams.forEach((team) => children.push(plainParagraph(team)));

  children.push(sectionHeader("נפגעים:"));
  if (!viewModel.hasCasualties) {
    children.push(plainParagraph("לא דווחו נפגעים"));
  } else {
    viewModel.casualties.forEach((casualty) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 160, after: 80 },
          children: [textRun(casualty.title, { bold: true })],
        }),
      );

      casualty.fields.forEach(({ label, value }) => children.push(labeledParagraph(label, value)));
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { rightToLeft: true, font: FONT },
          paragraph: { alignment: AlignmentType.RIGHT, bidirectional: true },
        },
      },
    },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}
