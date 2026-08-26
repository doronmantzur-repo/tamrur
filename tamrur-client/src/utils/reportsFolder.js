const DB_NAME = "tamrur-reports";
const STORE_NAME = "handles";
const HANDLE_KEY = "reportsFolder";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * The File System Access API (showDirectoryPicker, directory handle
 * enumeration) is Chromium-only — not available in Firefox or Safari.
 */
export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

/** The directory handle chosen in a previous session, if any. */
export async function getSavedFolderHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function saveFolderHandle(handle) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Forgets the persisted folder handle — without this, clearing the in-memory
 * selection alone would still get silently re-adopted on the next page load
 * (see `ReportsFolderCard`'s mount effect, which calls `getSavedFolderHandle`).
 */
export async function clearSavedFolderHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Opens the browser's directory picker (defaulting to Downloads) and
 * persists the chosen handle to IndexedDB for next time.
 */
export async function pickReportsFolder() {
  const handle = await window.showDirectoryPicker({
    id: "tamrur-reports",
    mode: "readwrite",
    startIn: "downloads",
  });
  await saveFolderHandle(handle);
  return handle;
}

/**
 * Checks (and if necessary, prompts for) readwrite permission on a
 * directory handle. `requestPermission` needs a user gesture, so this
 * should only be called from inside a click handler, not on mount.
 */
export async function ensurePermission(handle, mode = "readwrite") {
  const options = { mode };
  if ((await handle.queryPermission(options)) === "granted") return true;
  if ((await handle.requestPermission(options)) === "granted") return true;
  return false;
}

/** Every .docx report already saved in the folder, newest first. */
export async function listReportFiles(handle) {
  const files = [];
  for await (const [name, entryHandle] of handle.entries()) {
    if (entryHandle.kind === "file" && name.toLowerCase().endsWith(".docx")) {
      const file = await entryHandle.getFile();
      files.push({ name, lastModified: file.lastModified });
    }
  }
  return files.sort((a, b) => b.lastModified - a.lastModified);
}

export async function writeReportFile(handle, filename, blob) {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function sanitizeFilenamePart(text) {
  return text.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60);
}

/** `<event name or id>_<timestamp>.docx`, safe for the filesystem. */
export function buildReportFilename(eventName, eventId) {
  const base = sanitizeFilenamePart(eventName || eventId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${base}_${stamp}.docx`;
}

/**
 * Standard browser download, for when no folder has been picked (or the
 * File System Access API isn't available at all — e.g. Firefox/Safari).
 * Lands wherever the browser's own download setting points, typically
 * Downloads.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
