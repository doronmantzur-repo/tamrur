// React
import { useEffect, useState } from "react";

// External libraries
import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconX } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import Folder3DButton from "./Folder3DButton";
import {
  clearSavedFolderHandle,
  ensurePermission,
  getSavedFolderHandle,
  isFileSystemAccessSupported,
  listReportFiles,
  pickReportsFolder,
} from "../../utils/reportsFolder";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const buttonStyles = {
  root: {
    backgroundColor: "var(--app-color-surface-high)",
    color: "var(--app-color-text)",
    border: "1px solid var(--app-color-border)",
    "&:hover": { backgroundColor: "var(--app-color-surface)" },
  },
};

/**
 * Clears the chosen folder — before this, once a folder was picked there was
 * no way back to "no folder chosen," only re-picking a different one.
 * Real `useHoverState` for the hover feedback, not a `styles` `&:hover` key:
 * that prop flattens straight into a plain inline `style` attribute in this
 * app, so pseudo-selectors inside it are silently dropped.
 *
 * @param {{ onClick: () => void }} props
 * @returns {JSX.Element} The reset-folder button.
 */
function ResetFolderButton({ onClick }) {
  const [isHovered, hoverHandlers] = useHoverState();

  return (
    <Button
      size="xs"
      variant="subtle"
      leftSection={<IconX size={16} stroke={1.8} />}
      onClick={onClick}
      {...hoverHandlers}
      styles={{
        root: {
          color: "var(--app-color-error)",
          backgroundColor: isHovered ? "color-mix(in srgb, var(--app-color-error) 14%, transparent)" : "transparent",
          transition: "background-color 0.15s ease",
        },
      }}
    >
      נקה בחירה
    </Button>
  );
}

/**
 * Lets the analyst pick (and persist, across sessions, via IndexedDB) a
 * local folder that generated event reports get saved into as .docx files,
 * and lists the reports already sitting in that folder.
 *
 * A folder handle saved from a previous session can't be reused without a
 * fresh user gesture (browser security requirement), so on mount this only
 * silently re-adopts the handle if permission is still granted; otherwise it
 * shows a one-click "reconnect" button instead of failing silently.
 *
 * @param {{
 *   folderHandle: FileSystemDirectoryHandle | null,
 *   onFolderChange: (handle: FileSystemDirectoryHandle) => void,
 *   refreshSignal: number,
 * }} props
 * @returns {JSX.Element} The reports-folder card.
 */
const ReportsFolderCard = ({ folderHandle, onFolderChange, refreshSignal }) => {
  const supported = isFileSystemAccessSupported();
  const [pendingHandle, setPendingHandle] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supported || folderHandle) return;

    getSavedFolderHandle().then(async (handle) => {
      if (!handle) return;
      const granted = (await handle.queryPermission({ mode: "readwrite" })) === "granted";
      if (granted) {
        onFolderChange(handle);
      } else {
        setPendingHandle(handle);
      }
    });
    // Runs once on mount to adopt a previously-saved handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => {
    async function loadFiles() {
      if (!folderHandle) {
        setFiles([]);
        return;
      }

      setIsLoadingFiles(true);
      try {
        setFiles(await listReportFiles(folderHandle));
      } catch {
        setFiles([]);
      } finally {
        setIsLoadingFiles(false);
      }
    }

    loadFiles();
  }, [folderHandle, refreshSignal]);

  async function handlePick() {
    setError(null);
    try {
      const handle = await pickReportsFolder();
      setPendingHandle(null);
      onFolderChange(handle);
    } catch (err) {
      if (err.name !== "AbortError") setError("בחירת התיקייה נכשלה");
    }
  }

  async function handleReconnect() {
    if (!pendingHandle) return;
    setError(null);
    const granted = await ensurePermission(pendingHandle, "readwrite");
    if (granted) {
      onFolderChange(pendingHandle);
      setPendingHandle(null);
    } else {
      setError("הגישה לתיקייה נדחתה");
    }
  }

  async function handleReset() {
    setError(null);
    setPendingHandle(null);
    await clearSavedFolderHandle();
    onFolderChange(null);
  }

  if (!supported) {
    return (
      <DashboardCard title="תיקיית שמירת דוחות">
        <Text fz="sm" c="var(--app-color-text-muted)">
          שמירת דוחות לתיקייה נתמכת רק בדפדפני Chrome או Edge.
        </Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="תיקיית שמירת דוחות">
      <Stack gap="sm">
        <Group gap="sm" wrap="wrap" align="center">
          <Folder3DButton
            size={48}
            label={folderHandle ? "שנה תיקייה" : "בחר תיקייה"}
            onClick={handlePick}
          />

          {folderHandle && <ResetFolderButton onClick={handleReset} />}

          {pendingHandle && !folderHandle && (
            <Button size="xs" onClick={handleReconnect} styles={buttonStyles}>
              {`אשר גישה לתיקייה שנבחרה בעבר (${pendingHandle.name})`}
            </Button>
          )}
        </Group>

        <Text fz="sm" c="var(--app-color-text)">
          {folderHandle ? `תיקייה נבחרת: ${folderHandle.name}` : "לא נבחרה תיקייה"}
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            styles={{ root: { backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)" } }}
          >
            {error}
          </Alert>
        )}

        {folderHandle && (
          <Stack gap={4}>
            <Text fz="sm" fw={600} c="var(--app-color-text-muted)">
              דוחות קיימים בתיקייה
            </Text>

            {isLoadingFiles && <Loader size="xs" color="var(--app-color-primary)" />}

            {!isLoadingFiles && files.length === 0 && (
              <Text fz="sm" c="var(--app-color-text-muted)">
                אין עדיין דוחות בתיקייה
              </Text>
            )}

            {!isLoadingFiles &&
              files.map((file) => (
                <Text key={file.name} fz="sm" c="var(--app-color-text)" truncate>
                  {file.name}
                </Text>
              ))}
          </Stack>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default ReportsFolderCard;
