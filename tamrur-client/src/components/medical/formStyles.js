// React

// External libraries

// Internal application modules

// Styles

export const MONO_FONT = 'ui-monospace, "SF Mono", "Consolas", monospace';

/**
 * Input styling shared across the medic forms, matching the auth and aerial
 * evacuation forms.
 * @type {Record<string, React.CSSProperties>}
 */
export const inputStyles = {
  label: {
    color: "var(--app-color-text-muted)",
    marginBottom: "0.25rem",
  },
  input: {
    minHeight: "3rem",
    backgroundColor: "var(--app-color-background)",
    color: "var(--app-color-text)",
    borderColor: "var(--app-color-border)",
    fontFamily: MONO_FONT,
    "&:focus": {
      borderWidth: "2px",
      borderColor: "var(--app-color-primary)",
    },
  },
};

/**
 * The app's gold primary action button.
 * @type {Record<string, React.CSSProperties>}
 */
export const primaryButtonStyles = {
  root: {
    backgroundColor: "var(--app-color-primary)",
    color: "var(--app-color-primary-text)",
    boxShadow: "0 4px 14px rgba(197, 160, 89, 0.39)",
    "&:hover": {
      backgroundColor: "var(--app-color-primary-hover)",
    },
  },
};

/**
 * A quieter surface-colored button, for secondary actions sitting next to the
 * gold primary one.
 * @type {Record<string, React.CSSProperties>}
 */
export const secondaryButtonStyles = {
  root: {
    backgroundColor: "var(--app-color-surface-high)",
    color: "var(--app-color-text)",
    border: "1px solid var(--app-color-border)",
    "&:hover": {
      backgroundColor: "var(--app-effect-hover-background)",
      borderColor: "var(--app-effect-hover-border)",
    },
  },
};