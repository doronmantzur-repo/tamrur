import { createTheme } from "@mantine/core";

// Keep all Google Stitch color values here.
// Replace these values later when you export/refine your Stitch design tokens.
export const colorTokens = {
  dark: {
    background: "#0D1520",
    surface: "#1B2B41",
    surfaceHigh: "#243750",
    text: "#FFFFFF",
    textMuted: "#94A3B8",
    border: "rgba(255, 255, 255, 0.1)",
    primary: "#C5A059",
    primaryHover: "#D6B56F",
    primaryText: "#0D1520",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
  },

  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceHigh: "#F1F5F9",
    text: "#0F172A",
    textMuted: "#64748B",
    border: "#CBD5E1",
    primary: "#8A6B28",
    primaryHover: "#6F541E",
    primaryText: "#FFFFFF",
    error: "#DC2626",
    warning: "#D97706",
    success: "#16A34A",
  },
};

export const appTheme = createTheme({
  primaryColor: "brand",

  colors: {
    brand: [
      "#FFF8E5",
      "#FFEDBD",
      "#F9DD96",
      "#F1CD7B",
      "#E9C176",
      "#D6B06A",
      "#C5A059",
      "#A48142",
      "#775A19",
      "#4E3700",
    ],
  },

  fontFamily: "Assistant, Arial, sans-serif",

  fontFamilyMonospace: 'ui-monospace, "SF Mono", "Consolas", monospace',

  headings: {
    fontFamily: "Assistant, Arial, sans-serif",
    fontWeight: "700",
  },

  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.5rem",
  },

  fontWeights: {
    regular: "400",
    medium: "500",
    bold: "700",
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "2rem", // 32px
    xl: "3rem", // 48px
  },

  radius: {
    xs: "0.125rem",
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem",
  },

  defaultRadius: "sm",

  shadows: {
    xs: "none",
    sm: "none",
    md: "none",
    lg: "none",
    xl: "none",
  },

  components: {
    Button: {
      defaultProps: {
        radius: "sm",
        mih: "3rem",
      },
    },

    Input: {
      defaultProps: {
        radius: "sm",
        mih: "3rem",
      },
    },

    Badge: {
      defaultProps: {
        radius: "lg",
      },
    },

    Card: {
      defaultProps: {
        radius: "sm",
        shadow: "none",
      },
    },

    Modal: {
      defaultProps: {
        radius: "sm",
        shadow: "none",
      },
    },
  },

  other: {
    colorTokens,

    status: {
      urgent: "error",
      warning: "warning",
      ready: "success",
    },

    typography: {
      dataMono: {
        fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
      },

      labelCaps: {
        fontSize: "0.75rem",
        fontWeight: "500",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      },

      displayLg: {
        fontSize: "2rem",
        fontWeight: "700",
        lineHeight: "1.1",
      },
    },

    layout: {
      pagePadding: "1.5rem", // 24px
      pagePaddingMobile: "1.5rem", // 24px
      gridGutter: "1rem", // 16px
      minTouchTarget: "3rem", // 48px
    },

    effects: {
      dark: {
        hoverBackground: "#243750",
        hoverBorder: "#C5A059",
        activeOutline: "1px solid #C5A059",
        focusOutline: "2px solid #C5A059",
        liveGlow: "0 0 8px rgba(197, 160, 89, 0.45)",
      },

      light: {
        hoverBackground: "#F1F5F9",
        hoverBorder: "#8A6B28",
        activeOutline: "1px solid #8A6B28",
        focusOutline: "2px solid #8A6B28",
        liveGlow: "0 0 8px rgba(138, 107, 40, 0.32)",
      },
    },
  },
});

/**
 * Maps one mode's semantic design tokens to app and Mantine CSS variables.
 *
 * @param {Record<string, string>} colors - Semantic color tokens for one mode.
 * @param {Record<string, string>} effects - Interaction-effect tokens for one mode.
 * @returns {Record<string, string>} CSS variable name/value pairs.
 */
function createColorSchemeVariables(colors, effects) {
  return {
    "--app-color-background": colors.background,
    "--app-color-surface": colors.surface,
    "--app-color-surface-high": colors.surfaceHigh,
    "--app-color-text": colors.text,
    "--app-color-text-muted": colors.textMuted,
    "--app-color-border": colors.border,
    "--app-color-primary": colors.primary,
    "--app-color-primary-hover": colors.primaryHover,
    "--app-color-primary-text": colors.primaryText,
    "--app-color-error": colors.error,
    "--app-color-warning": colors.warning,
    "--app-color-success": colors.success,

    "--app-effect-hover-background": effects.hoverBackground,
    "--app-effect-hover-border": effects.hoverBorder,
    "--app-effect-active-outline": effects.activeOutline,
    "--app-effect-focus-outline": effects.focusOutline,
    "--app-effect-live-glow": effects.liveGlow,

    "--mantine-color-body": colors.background,
    "--mantine-color-text": colors.text,
    "--mantine-color-bright": colors.text,
    "--mantine-color-dimmed": colors.textMuted,
    "--mantine-color-placeholder": colors.textMuted,
    "--mantine-color-anchor": colors.primary,
    "--mantine-color-default": colors.surface,
    "--mantine-color-default-hover": effects.hoverBackground,
    "--mantine-color-default-color": colors.text,
    "--mantine-color-default-border": colors.border,
    "--mantine-color-disabled": colors.surfaceHigh,
    "--mantine-color-disabled-color": colors.textMuted,
    "--mantine-color-disabled-border": colors.border,
    "--mantine-color-error": colors.error,
    "--mantine-color-success": colors.success,
    "--mantine-primary-color-filled": colors.primary,
    "--mantine-primary-color-filled-hover": colors.primaryHover,
    "--mantine-primary-color-contrast": colors.primaryText,
  };
}

/**
 * Exposes central design tokens as CSS variables.
 * Mantine selects either `light` or `dark` automatically when the color scheme changes.
 *
 * @type {import("@mantine/core").CSSVariablesResolver}
 */
export const cssVariablesResolver = (theme) => {
  const { colorTokens, effects, layout } = theme.other;

  return {
    variables: {
      "--app-page-padding": layout.pagePadding,
      "--app-page-padding-mobile": layout.pagePaddingMobile,
      "--app-grid-gutter": layout.gridGutter,
      "--app-min-touch-target": layout.minTouchTarget,
    },

    light: createColorSchemeVariables(colorTokens.light, effects.light),
    dark: createColorSchemeVariables(colorTokens.dark, effects.dark),
  };
};
