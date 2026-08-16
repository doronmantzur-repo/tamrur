// React
import { useState } from "react";

// External libraries
import { Alert, Button, Divider, Loader, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconDeviceFloppy, IconFileText } from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import ReportPreview from "./ReportPreview";
import TamrurAPI from "../../api/TamrurAPI";
import { buildReportViewModel } from "../../utils/reportData";
import { buildEventReportDocx } from "../../utils/reportDocx";
import { buildReportFilename, downloadBlob, writeReportFile } from "../../utils/reportsFolder";

// Styles

const saveButtonStyles = {
  root: {
    backgroundColor: "var(--app-color-surface-high)",
    color: "var(--app-color-text)",
    border: "1px solid var(--app-color-border)",
    "&:hover": { backgroundColor: "var(--app-color-surface)" },
  },
};

/**
 * Lets the analyst generate a preview of the event-summary report for the
 * selected event (filled from the event's own logged data — casualties,
 * treatments, vitals, evacuations — via tamrur-server's
 * /event-report/:eventId; no AI involved, since every field is a literal DB
 * value) and review it on screen before deciding whether to save it.
 *
 * Generating no longer writes a file by itself — it only fetches the data
 * and renders the preview. Saving as .docx is a separate, explicit step: if
 * a reports folder is selected (see ReportsFolderCard) it's written straight
 * into it, otherwise it's offered as a normal browser download.
 *
 * The parent should remount this (e.g. `key={eventId}`) when the selected
 * event changes, so a preview from a previous event doesn't linger.
 *
 * @param {{
 *   eventId: string | null,
 *   folderHandle: FileSystemDirectoryHandle | null,
 *   onReportSaved?: () => void,
 * }} props
 * @returns {JSX.Element} The event report card.
 */
const EventReportCard = ({ eventId, folderHandle, onReportSaved }) => {
  const event = useSelector((state) => state.events.events.find((item) => item.id === eventId));
  const [viewModel, setViewModel] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveNote, setSaveNote] = useState(null);

  function handleGenerate() {
    if (!eventId || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSaveNote(null);
    setViewModel(null);

    TamrurAPI.get(`/event-report/${eventId}`)
      .then((response) => setViewModel(buildReportViewModel(response.data)))
      .catch((err) => {
        setError(err.response?.data?.message ?? "יצירת הדוח נכשלה, נסה שוב");
      })
      .finally(() => setIsGenerating(false));
  }

  function handleSave() {
    if (!viewModel || isSaving) return;

    setIsSaving(true);
    setError(null);

    buildEventReportDocx(viewModel)
      .then(async (blob) => {
        const filename = buildReportFilename(event?.name, eventId);

        if (folderHandle) {
          await writeReportFile(folderHandle, filename, blob);
          setSaveNote(`הדוח נשמר בתור ${filename}`);
          onReportSaved?.();
        } else {
          downloadBlob(blob, filename);
          setSaveNote(`הדוח הורד כ-${filename}`);
        }
      })
      .catch(() => setError("שמירת הדוח נכשלה, נסה שוב"))
      .finally(() => setIsSaving(false));
  }

  return (
    <DashboardCard title="דוח אירוע">
      <Stack gap="sm">
        <Button
          leftSection={<IconFileText size={18} stroke={1.8} />}
          loading={isGenerating}
          disabled={!eventId}
          onClick={handleGenerate}
          style={{ alignSelf: "flex-start" }}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            },
          }}
        >
          צור דוח אירוע
        </Button>

        {!eventId && (
          <Text fz="sm" c="var(--app-color-text-muted)">
            בחר אירוע כדי ליצור דוח
          </Text>
        )}

        {isGenerating && (
          <Stack align="center" gap="xs" py="md">
            <Loader color="var(--app-color-primary)" size="sm" />
            <Text fz="sm" c="var(--app-color-text-muted)">
              מפיק דוח...
            </Text>
          </Stack>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            styles={{ root: { backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)" } }}
          >
            {error}
          </Alert>
        )}

        {viewModel && !isGenerating && (
          <>
            <Divider color="var(--app-color-border)" />

            <ReportPreview viewModel={viewModel} />

            <Button
              leftSection={<IconDeviceFloppy size={18} stroke={1.8} />}
              loading={isSaving}
              onClick={handleSave}
              style={{ alignSelf: "flex-start" }}
              styles={saveButtonStyles}
            >
              שמור כקובץ Word
            </Button>

            {saveNote && !isSaving && (
              <Text fz="sm" c="var(--app-color-text-muted)">
                {saveNote}
              </Text>
            )}
          </>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default EventReportCard;
