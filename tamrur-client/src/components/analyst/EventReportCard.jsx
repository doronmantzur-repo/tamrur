// React
import { useState } from "react";

// External libraries
import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconFileText } from "@tabler/icons-react";
import { useSelector } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import TamrurAPI from "../../api/TamrurAPI";
import { buildEventReportDocx } from "../../utils/reportDocx";
import { buildReportFilename, downloadBlob, writeReportFile } from "../../utils/reportsFolder";

// Styles

/**
 * Lets the analyst generate a .docx event-summary report for the selected
 * event, filled from the event's own logged data (injuries, treatments,
 * vitals, evacuations, aerial missions) into the fixed template layout in
 * utils/reportDocx.js — no AI involved, since every field in that template
 * is a literal DB value, not free text.
 *
 * tamrur-server (/event-report/:eventId) only gathers and returns that raw
 * data; the .docx itself is built entirely client-side.
 *
 * When a reports folder is selected (see ReportsFolderCard), the file is
 * written straight into it; otherwise it's offered as a normal browser
 * download (typically landing in Downloads).
 *
 * The parent should remount this (e.g. `key={eventId}`) when the selected
 * event changes, so state from a previous event doesn't linger.
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [saveNote, setSaveNote] = useState(null);

  function handleClick() {
    if (!eventId || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSaveNote(null);

    TamrurAPI.get(`/event-report/${eventId}`)
      .then(async (response) => {
        const blob = await buildEventReportDocx(response.data);
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
      .catch((err) => {
        setError(err.response?.data?.message ?? "יצירת הדוח נכשלה, נסה שוב");
      })
      .finally(() => setIsGenerating(false));
  }

  return (
    <DashboardCard title="דוח אירוע">
      <Stack gap="sm">
        <Button
          leftSection={<IconFileText size={18} stroke={1.8} />}
          loading={isGenerating}
          disabled={!eventId}
          onClick={handleClick}
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

        {saveNote && !isGenerating && (
          <Text fz="sm" c="var(--app-color-text-muted)">
            {saveNote}
          </Text>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default EventReportCard;
