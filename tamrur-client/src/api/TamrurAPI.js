// External
import axios from "axios";

// Internal
import { loadSession } from "../features/auth/authStorage";

/**
 * Base URL for the API server, read from the client's .env file.
 * @type {string}
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Shared axios instance for all API calls.
 * Attaches the auth token (once available) to every outgoing request.
 */
const TamrurAPI = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Reads the current auth token. Replaced with a real Redux-backed getter via
 * `setTokenGetter` once the store exists — kept as a no-op here so this
 * module never has to import the store directly (that would create a
 * TamrurAPI -> store -> authSlice -> TamrurAPI circular import).
 * @type {() => string | null}
 */
let getToken = () => null;

/**
 * Wires this instance's token lookup to the Redux store.
 * Called once from store/store.js, after the store is created.
 *
 * @param {() => string | null} tokenGetter - Reads the current token, e.g. `() => store.getState().auth.token`.
 * @returns {void}
 */
export function setTokenGetter(tokenGetter) {
  getToken = tokenGetter;
}

/**
 * Runs when any non-auth request comes back 401 (invalid/expired token).
 * Replaced with a real handler via `setUnauthorizedHandler` once the store
 * exists — kept as a no-op here for the same circular-import reason as
 * `getToken` above.
 * @type {() => void}
 */
let onUnauthorized = () => {};

/**
 * Wires this instance's 401 handling to the Redux store.
 * Called once from store/store.js, after the store is created.
 *
 * @param {() => void} handler - e.g. `() => { store.dispatch(logout()); window.location.href = "/"; }`.
 * @returns {void}
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Reads the JWT from the Redux auth state, falling back to whichever storage
 * (localStorage or sessionStorage, depending on "remember me") holds the
 * session for the brief window before `setTokenGetter` has been wired up.
 * Shared by the axios interceptor below and by `streamPost`, which can't go
 * through axios (browsers don't expose a streaming response body for it).
 *
 * @returns {string | null} The auth token, or null if there's no session.
 */
function resolveAuthToken() {
  return getToken() ?? loadSession()?.token;
}

/**
 * Request interceptor: attaches the JWT from the Redux auth state. Falls
 * back to whichever storage (localStorage or sessionStorage, depending on
 * "remember me") holds the session, for the brief window before
 * `setTokenGetter` has been wired up.
 */
TamrurAPI.interceptors.request.use((config) => {
  const token = resolveAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor: a 401 from any endpoint other than /auth/* means the
 * stored token is invalid or expired, so the session is force-cleared. Auth
 * endpoints are excluded because a failed login attempt also returns 401,
 * and that should surface as an inline form error, not a forced logout.
 */
TamrurAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/**
 * POSTs to a Server-Sent-Events endpoint and calls `onEvent` for each event
 * as it arrives, instead of waiting for the whole response like a normal
 * request. Bypasses axios — browsers don't expose a readable streaming body
 * through XHR, which is what axios uses in the browser. Used for
 * `/medic-query/ask`, which streams its RAG pipeline's progress and the
 * answer's own tokens live.
 *
 * @param {string} path - Endpoint path, relative to the API base URL.
 * @param {object} body - JSON request body.
 * @param {{ onEvent?: (event: string, data: unknown) => void, signal?: AbortSignal }} handlers
 * @returns {Promise<void>} Resolves once the stream ends.
 */
export async function streamPost(path, body, { onEvent, signal } = {}) {
  const token = resolveAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 401) {
    onUnauthorized();
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => null);
    let message = text;
    try {
      message = JSON.parse(text)?.message ?? text;
    } catch {
      // Not JSON — fall back to the raw text.
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const rawEvents = buffer.split("\n\n");
    buffer = rawEvents.pop() ?? "";

    for (const rawEvent of rawEvents) {
      let eventName = "message";
      const dataLines = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice("event:".length).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim());
      }
      if (dataLines.length === 0) continue;
      onEvent?.(eventName, JSON.parse(dataLines.join("\n")));
    }
  }
}

export default TamrurAPI;
