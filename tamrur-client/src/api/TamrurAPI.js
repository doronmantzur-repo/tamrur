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
 * Request interceptor: attaches the JWT from the Redux auth state. Falls
 * back to whichever storage (localStorage or sessionStorage, depending on
 * "remember me") holds the session, for the brief window before
 * `setTokenGetter` has been wired up.
 */
TamrurAPI.interceptors.request.use((config) => {
  const token = getToken() ?? loadSession()?.token;
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

export default TamrurAPI;
