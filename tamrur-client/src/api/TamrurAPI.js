// External
import axios from "axios";

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
 * Request interceptor: attaches the JWT from the Redux auth state, if present.
 */
TamrurAPI.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default TamrurAPI;
