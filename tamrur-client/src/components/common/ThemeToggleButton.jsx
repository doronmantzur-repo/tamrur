// React

// External libraries
import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

// Internal application modules
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/** The "glass" recipe's resting look — translucent + blurred, shared by every glass-styled control on the event dashboard's action bar. */
const GLASS_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--app-color-surface) 32%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-border) 22%, transparent)",
  color: "var(--app-color-text)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)",
  transition: "background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
};

/** Its primary-tinted hover look — merged over GLASS_STYLE while hovered (see useHoverState; Mantine's `styles` prop doesn't compile `"&:hover"` into real CSS). */
const GLASS_HOVER_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--app-color-primary) 16%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-primary) 40%, transparent)",
  transform: "translateY(-1px)",
};

/**
 * Dark/light theme toggle: a plain icon button that swaps between a sun and
 * moon glyph. Theme state and switching are Mantine's own
 * `useMantineColorScheme`.
 *
 * `variant="glass"` is an opt-in visual-only alternative (translucent,
 * blurred, primary-tinted hover) for the event dashboard's action bar —
 * every other call site keeps the default `"solid"` look by not passing it.
 *
 * @param {{ variant?: "solid" | "glass" }} props
 * @returns {JSX.Element} The theme toggle button.
 */
const ThemeToggleButton = ({ variant = "solid" }) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [isHovered, hoverHandlers] = useHoverState();

  const iconProps = {
    "aria-label": "החלף מצב תצוגה",
    title: "החלף מצב תצוגה",
    variant: "default",
    size: 40,
    radius: "xl",
    onClick: () => toggleColorScheme(),
  };

  const icon = isDark ? (
    <IconSun aria-hidden="true" size={20} stroke={1.8} />
  ) : (
    <IconMoon aria-hidden="true" size={20} stroke={1.8} />
  );

  if (variant === "glass") {
    return (
      <ActionIcon
        {...iconProps}
        {...hoverHandlers}
        style={isHovered ? { ...GLASS_STYLE, ...GLASS_HOVER_STYLE } : GLASS_STYLE}
      >
        {icon}
      </ActionIcon>
    );
  }

  return (
    <ActionIcon
      {...iconProps}
      style={{
        backgroundColor: "var(--app-color-surface)",
        borderColor: "var(--app-color-border)",
        color: "var(--app-color-text)",
      }}
    >
      {icon}
    </ActionIcon>
  );
};

export default ThemeToggleButton;
