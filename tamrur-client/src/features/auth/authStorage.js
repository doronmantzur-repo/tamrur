// React

// External libraries

// Internal application modules

// Styles

const STORAGE_KEY = "tamrur_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Persists the session as one JSON blob, in localStorage if the user asked
 * to be remembered, sessionStorage otherwise. Clears any stale copy left in
 * the other storage from a previous choice.
 *
 * @param {Object} params
 * @param {string} params.token
 * @param {Object} params.user
 * @param {boolean} params.rememberMe
 */
export function saveSession({ token, user, rememberMe }) {
  const blob = JSON.stringify({ token, user, expiresAt: Date.now() + SESSION_DURATION_MS });
  const target = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  target.setItem(STORAGE_KEY, blob);
  other.removeItem(STORAGE_KEY);
}

/**
 * Reads a still-valid session from either storage. Clears it (and returns
 * null) if it's missing, malformed, or expired.
 *
 * @returns {{token: string, user: Object}|null}
 */
export function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const { token, user, expiresAt } = JSON.parse(raw);
    if (!token || !user || Date.now() >= expiresAt) {
      clearSession();
      return null;
    }
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

/** Removes the session from both storages. */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
